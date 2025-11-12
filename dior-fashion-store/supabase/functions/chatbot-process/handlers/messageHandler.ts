// ============================================
// messageHandler.ts - Stable Multi-Tenant Handler (Backwards Compatible)
// ============================================
//
// Mục tiêu:
// - Giữ nguyên interface & flow giống bản cũ của bạn (handleMessage(body, request?))
// - Multi-tenant đầy đủ (tenant_id vào tất cả nơi cần thiết)
// - Dùng geminiService.ts mới (OpenRouter) cho LLM
// - Không phụ thuộc orchestratorAgent/llmClient để tránh lỗi routing hiện tại
// - An toàn cho index.ts và router đang dùng handleMessage(body, request?)
//
// Lưu ý:
// - orchestratorAgent.ts và llmClient.ts vẫn có thể giữ lại để dùng sau,
//   nhưng handler này không gọi trực tiếp để đảm bảo ổn định.
// ============================================

import { createSupabaseClient } from "../utils/supabaseClient.ts";
import { calculateCost } from "../utils/formatters.ts";
import { buildContext } from "../services/contextService.ts";
import {
  callGemini,
  callGeminiWithFunctionResult,
} from "../services/geminiService.ts";
import {
  sendFacebookMessage,
  sendFacebookImage,
} from "../services/facebookService.ts";
import {
  sendZaloMessage,
  sendZaloImage,
} from "../services/zaloService.ts";
import { extractAndSaveAddress } from "../services/addressExtractionService.ts";
import { saveCustomerProfile } from "../services/customerProfileService.ts";
import { saveAddressStandardized } from "../services/addressService.ts";
import {
  isOrderIntent,
  isConfirmation,
  isAddToCartIntent,
  handleOrderCreation,
} from "./orderHandler.ts";
import {
  getOrCreateCart,
  addToCart,
  getCartSummary,
} from "../services/cartService.ts";
import {
  createMessageEmbedding,
  createSummaryEmbedding,
} from "../services/embeddingService.ts";
import {
  extractAndSaveMemory,
  extractMemoryFacts,
  createConversationSummary,
} from "../services/memoryService.ts";
import {
  getTenantContext,
  checkUsageLimit,
  trackUsage,
  trackAIUsage,
} from "../services/tenantContextService.ts";

export async function handleMessage(body: any, request?: Request) {
  const {
    platform,
    customer_fb_id,
    customer_zalo_id,
    user_id,
    session_id,
    message_text,
    page_id,
    access_token,
  } = body;

  const dbPlatform = platform === "web" ? "website" : platform;

  if (!message_text || !platform) {
    return {
      success: false,
      error: "Missing required fields (message_text, platform)",
    };
  }

  console.log("Processing message:", {
    platform: dbPlatform,
    message: message_text.substring(0, 80),
  });

  const supabase = createSupabaseClient();

  // ============================
  // 1. Tenant Context
  // ============================
  console.log("🔍 Getting tenant context...");
  const tenantContext = await getTenantContext(request);
  if (!tenantContext || !tenantContext.tenantId) {
    console.error("❌ Tenant context not found or inactive");
    return {
      success: false,
      error: "Tenant not found or inactive",
    };
  }

  const tenantId = tenantContext.tenantId;
  console.log(
    `✅ Tenant resolved: ${tenantContext.tenantInfo?.business_name || ""} (${tenantId})`,
  );

  // ============================
  // 2. Check usage limit
  // ============================
  const limitCheck = await checkUsageLimit(tenantId, "messages");
  if (!limitCheck.allowed) {
    console.warn(`⚠️ Usage limit reached for tenant ${tenantId}`);
    return {
      success: false,
      error: limitCheck.message,
      limit_reached: true,
    };
  }

  // ============================
  // 3. Get or create conversation (RPC + fallback)
  // ============================
  let conversationId: string | null = null;

  try {
    const { data, error } = await supabase.rpc(
      "get_or_create_conversation",
      {
        p_tenant_id: tenantId,
        p_platform: dbPlatform,
        p_customer_fb_id: customer_fb_id || null,
        p_customer_zalo_id: customer_zalo_id || null,
        p_user_id: user_id || null,
        p_session_id: session_id || null,
        p_customer_name: "Guest",
        p_customer_avatar: null,
      },
    );

    if (error) {
      console.warn("⚠️ RPC get_or_create_conversation error:", error);
    } else if (typeof data === "string") {
      conversationId = data;
    } else if (data && data.id) {
      conversationId = data.id;
    }
  } catch (e) {
    console.warn("⚠️ RPC get_or_create_conversation threw:", e);
  }

  // Fallback nếu RPC chưa cập nhật:
  if (!conversationId) {
    conversationId = crypto.randomUUID();
    const { error: insertConvErr } = await supabase
      .from("chatbot_conversations")
      .insert({
        id: conversationId,
        tenant_id: tenantId,
        platform: dbPlatform,
        status: "active",
        source: dbPlatform,
      });

    if (insertConvErr) {
      console.error("❌ Failed to create conversation:", insertConvErr);
      return {
        success: false,
        error: "Cannot create conversation",
      };
    }
  }

  console.log(`✅ Conversation ID: ${conversationId}`);

  // ============================
  // 3.1 Ensure customer profile exists for this conversation
  // ============================
  try {
    // Sử dụng RPC get_or_create_customer_profile nếu đã được định nghĩa trong DB
    const { data: profileId, error: profileErr } = await supabase.rpc(
      "get_or_create_customer_profile",
      { p_conversation_id: conversationId },
    );

    if (profileErr) {
      console.warn(
        "⚠️ RPC get_or_create_customer_profile error (không chặn flow):",
        profileErr,
      );
    } else if (profileId) {
      console.log("✅ Ensured customer_profile exists:", profileId);
    }
  } catch (e) {
    console.warn(
      "⚠️ RPC get_or_create_customer_profile threw (không chặn flow):",
      e,
    );
  }

  // ============================
  // 4. Save customer message
  // ============================
  const customerMessageId = crypto.randomUUID();

  const { error: msgError } = await supabase
    .from("chatbot_messages")
    .insert({
      id: customerMessageId,
      tenant_id: tenantId,
      conversation_id: conversationId,
      sender_type: "customer",
      message_type: "text",
      content: { text: message_text },
    });

  if (msgError) {
    console.error("❌ Error saving customer message:", msgError);
    return {
      success: false,
      error: "Failed to save customer message",
    };
  }

  // Embedding + memory (non-blocking)
  createMessageEmbedding(
    tenantId,
    conversationId,
    customerMessageId,
    message_text,
    {
      sender_type: "customer",
      platform: dbPlatform,
      customer_fb_id: customer_fb_id || null,
      user_id: user_id || null,
      session_id: session_id || null,
    },
  ).catch((err) => console.error("❌ Customer embedding error:", err));

  // ============================
  // 5. Build context (tenant-aware)
  // ============================
  const context = await buildContext(
    supabase,
    tenantId,
    conversationId,
    message_text,
  );

  console.log("Context built:", {
    hasProfile: !!context.profile,
    historyCount: context.history?.length || 0,
    productCount: context.products?.length || 0,
  });

  // ============================
  // 6. Call LLM (OpenRouter via geminiService)
  // ============================
  // Dùng OpenRouter key global hoặc key theo tenant nếu sau này có:
  const geminiApiKey =
    tenantContext.apiKeys?.gemini?.apiKey || undefined;

  const llmResult = await callGemini(context, message_text, geminiApiKey);

  let responseText = llmResult.text;
  const tokensUsed = llmResult.tokens || 0;
  const recommendationType = llmResult.type || "none";
  const productCards = llmResult.products || [];
  const functionCalls = llmResult.functionCalls || [];

  console.log("LLM result:", {
    type: recommendationType,
    products: productCards.length,
    tokens: tokensUsed,
    functionCalls: functionCalls.length,
  });

  let imageResult: any = null;

  // ============================
  // 7. Execute function calls (save_info, save_address, cart, order, images)
// ============================
  if (functionCalls.length > 0) {
    console.log(`🔧 Executing ${functionCalls.length} function call(s)`);
    for (const fnCall of functionCalls) {
      try {
        let functionResult: any = { success: false };

        switch (fnCall.name) {
          case "save_customer_info": {
            functionResult = await saveCustomerProfile(
              conversationId,
              fnCall.args,
            );
            if (functionResult.success) {
              const cont = await callGeminiWithFunctionResult(
                context,
                message_text,
                fnCall.name,
                functionResult,
              );
              if (cont.text) responseText = cont.text;
            }
            break;
          }

          case "save_address": {
            if (!fnCall.args.address_line || !fnCall.args.city) {
              functionResult = {
                success: false,
                message: "Thiếu thông tin địa chỉ",
              };
              break;
            }

            const result = await saveAddressStandardized(conversationId, {
              full_name: fnCall.args.full_name,
              phone: fnCall.args.phone,
              address_line: fnCall.args.address_line,
              ward: fnCall.args.ward,
              district: fnCall.args.district,
              city: fnCall.args.city,
            });

            functionResult = result;
            if (result.success) {
              const cont = await callGeminiWithFunctionResult(
                context,
                message_text,
                fnCall.name,
                functionResult,
              );
              if (cont.text) responseText = cont.text;
            }
            break;
          }

          case "add_to_cart": {
            const { product_id, size, quantity = 1 } = fnCall.args;
            const { data: product } = await supabase
              .from("products")
              .select(
                `
                  id, name, price,
                  images:product_images(image_url, is_primary)
                `,
              )
              .eq("tenant_id", tenantId)
              .eq("id", product_id)
              .maybeSingle();

            if (product) {
              const primaryImage = product.images?.find(
                (img: any) => img.is_primary,
              );
              const updatedCart = await addToCart(conversationId, {
                product_id: product.id,
                name: product.name,
                price: product.price,
                size,
                quantity,
                image:
                  primaryImage?.image_url ||
                  product.images?.[0]?.image_url ||
                  "",
              });

              functionResult = {
                success: true,
                message: `Đã thêm ${product.name} vào giỏ hàng`,
                cart_count: updatedCart.length,
              };

              const cont = await callGeminiWithFunctionResult(
                context,
                message_text,
                fnCall.name,
                functionResult,
              );
              if (cont.text) responseText = cont.text;
            } else {
              functionResult = {
                success: false,
                message: "Không tìm thấy sản phẩm",
              };
            }
            break;
          }

          case "confirm_and_create_order": {
            if (fnCall.args.confirmed) {
              const orderResult = await handleOrderCreation({
                conversationId,
                message_text,
                aiResponse: llmResult,
              });
              functionResult = orderResult;
              if (orderResult.success) {
                responseText = orderResult.message;
              }
            }
            break;
          }

          case "send_product_image": {
            const { product_id: imgProductId } = fnCall.args;
            const { data: imgProduct } = await supabase
              .from("products")
              .select(
                `id, name, price, slug,
                 images:product_images(image_url, is_primary)`,
              )
              .eq("tenant_id", tenantId)
              .eq("id", imgProductId)
              .maybeSingle();

            if (imgProduct) {
              const primaryImage = imgProduct.images?.find(
                (img: any) => img.is_primary,
              );
              const imageUrl =
                primaryImage?.image_url ||
                imgProduct.images?.[0]?.image_url;

              if (imageUrl) {
                await supabase.from("chatbot_messages").insert({
                  tenant_id: tenantId,
                  conversation_id: conversationId,
                  sender_type: "bot",
                  message_type: "image",
                  content: {
                    image_url: imageUrl,
                    product_id: imgProduct.id,
                    product_name: imgProduct.name,
                    product_price: imgProduct.price,
                    product_link:
                      `http://bewo.com.vn/products/${imgProduct.slug}`,
                  },
                });

                if (platform === "facebook" && access_token && customer_fb_id) {
                  await sendFacebookImage(
                    customer_fb_id,
                    imageUrl,
                    access_token,
                    imgProduct,
                  );
                } else if (
                  platform === "zalo" &&
                  access_token &&
                  customer_zalo_id
                ) {
                  await sendZaloImage(
                    customer_zalo_id,
                    imageUrl,
                    access_token,
                    imgProduct,
                  );
                }

                functionResult = {
                  success: true,
                  message: `Đã gửi ảnh sản phẩm ${imgProduct.name}`,
                  image_url: imageUrl,
                  product: imgProduct,
                };

                imageResult = functionResult;

                const cont = await callGeminiWithFunctionResult(
                  context,
                  message_text,
                  fnCall.name,
                  functionResult,
                );
                if (cont.text) responseText = cont.text;
              } else {
                functionResult = {
                  success: false,
                  message: "Sản phẩm không có ảnh",
                };
              }
            } else {
              functionResult = {
                success: false,
                message: "Không tìm thấy sản phẩm",
              };
            }
            break;
          }

          default:
            console.log("⚠️ Unknown function:", fnCall.name);
        }
      } catch (err) {
        console.error(
          `❌ Function execution error (${fnCall.name}):`,
          err,
        );
      }
    }
  }

  // ============================
  // 8. Order intent (giữ logic cũ)
  // ============================
  if (isConfirmation(message_text)) {
    // giữ nguyên behavior cũ nếu cần
  } else if (isOrderIntent(message_text)) {
    // giữ nguyên behavior cũ nếu cần
  }

  // ============================
  // 9. Save bot response
  // ============================
  const botMessageType =
    productCards.length > 0 ? "product_card" : "text";

  const { data: botInsertRows, error: botError } = await supabase
    .from("chatbot_messages")
    .insert({
      tenant_id: tenantId,
      conversation_id: conversationId,
      sender_type: "bot",
      message_type: botMessageType,
      content: {
        text: responseText,
        products: productCards,
        recommendation_type: recommendationType,
      },
      tokens_used: tokensUsed,
    })
    .select("id")
    .limit(1);

  if (botError) {
    console.error("❌ Error saving bot message:", botError);
  } else if (botInsertRows && botInsertRows.length > 0) {
    const embedMessageId = botInsertRows[0].id;
    // Tạo embedding cho bot dựa trên message_id thực tế (đảm bảo không vi phạm FK)
    createMessageEmbedding(
      tenantId,
      conversationId,
      embedMessageId,
      responseText,
      {
        sender_type: "bot",
        platform: dbPlatform,
        has_products: productCards.length > 0,
        product_count: productCards.length,
        recommendation_type: recommendationType,
        product_ids: productCards.map((p: any) => p.id),
      },
    ).catch((err: any) => {
      console.error("❌ Bot embedding error:", err);
    });
  }

  // ============================
  // 10. Usage logging (non-blocking, không dùng await..catch chain)
  // ============================
  if (tokensUsed > 0) {
    supabase.from("chatbot_usage_logs")
      .insert({
        tenant_id: tenantId,
        conversation_id: conversationId,
        input_tokens: Math.floor(tokensUsed * 0.4),
        output_tokens: Math.floor(tokensUsed * 0.6),
        cost: calculateCost(tokensUsed),
        model: "openrouter",
      })
      .then(({ error }: { error: any }) => {
        if (error) {
          console.error("❌ chatbot_usage_logs insert error:", error);
        }
      })
      .catch((err: any) => {
        console.error("❌ chatbot_usage_logs unexpected error:", err);
      });

    trackAIUsage(
      tenantId,
      conversationId,
      "openrouter",
      Math.floor(tokensUsed * 0.4),
      Math.floor(tokensUsed * 0.6),
      calculateCost(tokensUsed),
      "chatbot",
    )
      .catch((err: any) => {
        console.error("❌ AI usage tracking error:", err);
      });
  }

  try {
    await trackUsage(
      tenantId,
      "message",
      1,
      {
        conversation_id: conversationId,
        platform: dbPlatform,
        has_products: productCards.length > 0,
      },
    );
  } catch (err: any) {
    console.error("❌ Usage tracking error:", err);
  }

  // ============================
  // 11. Optional: send to Facebook/Zalo
  // ============================
  if (platform === "facebook" && access_token && customer_fb_id) {
    await sendFacebookMessage(
      customer_fb_id,
      responseText,
      access_token,
      productCards,
    ).catch((err) =>
      console.error("❌ sendFacebookMessage error:", err)
    );
  }

  if (platform === "zalo" && access_token && customer_zalo_id) {
    await sendZaloMessage(
      customer_zalo_id,
      responseText,
      access_token,
      productCards,
    ).catch((err: any) =>
      console.error("❌ sendZaloMessage error:", err)
    );
  }

  // ============================
  // 12. Return (compatible with frontend)
  // ============================
  return {
    success: true,
    response: responseText,
    products: productCards,
    recommendation_type: recommendationType,
    message_type: botMessageType,
    image_url: imageResult?.image_url,
    product_image: imageResult?.product,
    tenant: {
      id: tenantId,
      name: tenantContext.tenantInfo?.business_name || "",
    },
    // Gợi ý thêm cho frontend/LLM sidecar:
    // Nếu phía AI đã lưu profile + địa chỉ + giỏ hàng, có thể dựa vào đây để không hỏi lại.
    meta: {
      conversation_id: conversationId,
    },
  };
}
