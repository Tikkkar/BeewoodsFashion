// ============================================
// services/memoryService.ts - UPDATED VERSION
// CHỈ lưu insights vào memory_facts
// Structured data → tables riêng (customer_profiles, addresses)
// ============================================

import { createSupabaseClient } from "../utils/supabaseClient.ts";

// --- TYPE DEFINITIONS ---

type AIResponse = {
  text: string;
  tokens: number;
  type: string;
  products: { id: string }[];
};

type Message = {
  content: {
    text: string;
  };
  sender_type: string;
  created_at: string;
};

// --- CORE FUNCTIONS ---

/**
 * Get or create customer profile
 */
export async function getOrCreateProfile(conversationId: string) {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.rpc("get_or_create_customer_profile", {
    p_conversation_id: conversationId,
  });

  if (error) {
    console.error("Error getting profile:", error);
    return null;
  }

  return Array.isArray(data) && data.length > 0 ? data[0] : data;
}

/**
 * Extract and save memory from message
 * ⚠️ CHỈ lưu insights, KHÔNG lưu structured data (name, phone, address)
 */
export async function extractAndSaveMemory(
  conversationId: string,
  messageText: string,
  aiResponse: AIResponse,
) {
  const supabase = createSupabaseClient();

  // Get profile ID
  const profileIdData = await getOrCreateProfile(conversationId);
  if (!profileIdData) return;

  const profileId = profileIdData as string;

  // ⚠️ CHỈ extract preferences và interests
  // KHÔNG extract name, phone, address (đã có function calling xử lý)
  await Promise.all([
    extractPreferences(supabase, profileId, messageText),
    extractInterests(supabase, profileId, aiResponse.products),
  ]);

  // Update engagement
  await supabase.rpc("update_customer_engagement", {
    p_profile_id: profileId,
  });
}

/**
 * ❌ REMOVED: extractPersonalInfo
 * Không còn extract name/phone/address ở đây nữa
 * Đã có AI function calling xử lý (save_customer_info, save_address)
 */

/**
 * Extract preferences (style, color, price)
 * CHỈ lưu vào customer_profiles.style_preference, color_preference (jsonb)
 */
async function extractPreferences(
  supabase: any,
  profileId: string,
  text: string,
) {
  const textLower = text.toLowerCase();
  const updates: any = {};

  // Get current profile
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("style_preference, color_preference, material_preference")
    .eq("id", profileId)
    .single();

  if (!profile) return;

  // Extract colors
  const colors = [
    "đen",
    "trắng",
    "be",
    "xanh",
    "đỏ",
    "vàng",
    "hồng",
    "nâu",
    "xám",
    "navy",
    "kem",
    "pastel",
  ];
  const mentionedColors = colors.filter((color) => textLower.includes(color));

  if (mentionedColors.length > 0) {
    const existingColors: string[] = profile.color_preference || [];
    updates.color_preference = [
      ...new Set([...existingColors, ...mentionedColors]),
    ];
  }

  // Extract style
  const styles = [
    "thanh lịch",
    "công sở",
    "casual",
    "thể thao",
    "sang trọng",
    "trẻ trung",
    "cổ điển",
    "hiện đại",
  ];
  const mentionedStyles = styles.filter((style) => textLower.includes(style));

  if (mentionedStyles.length > 0) {
    const existingStyles: string[] = profile.style_preference || [];
    updates.style_preference = [
      ...new Set([...existingStyles, ...mentionedStyles]),
    ];
  }

  // Extract material preference
  const materials = ["linen", "cotton", "silk", "kaki", "jean", "polyester"];
  const mentionedMaterials = materials.filter((mat) => textLower.includes(mat));

  if (mentionedMaterials.length > 0) {
    const existingMaterials: string[] = profile.material_preference || [];
    updates.material_preference = [
      ...new Set([...existingMaterials, ...mentionedMaterials]),
    ];
  }

  // Extract price range
  const priceMatches = text.match(/(\d{1,3})[.,]?(\d{3})/g);
  if (priceMatches && priceMatches.length >= 2) {
    const prices = priceMatches.map((p) => parseInt(p.replace(/[.,]/g, "")));
    updates.price_range = {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  // Update if found anything
  if (Object.keys(updates).length > 0) {
    console.log("✅ Extracted preferences:", updates);
    await supabase
      .from("customer_profiles")
      .update(updates)
      .eq("id", profileId);
  }
}

/**
 * Save product interests
 */
async function extractInterests(
  supabase: any,
  profileId: string,
  products: any[],
) {
  if (!products || products.length === 0) return;

  console.log(`💡 Saving ${products.length} product interests`);

  for (const product of products) {
    // Check if interest exists
    const { data: existing } = await supabase
      .from("customer_interests")
      .select("*")
      .eq("customer_profile_id", profileId)
      .eq("product_id", product.id)
      .eq("interest_type", "viewed")
      .maybeSingle();

    if (existing) {
      // Increment view count
      await supabase
        .from("customer_interests")
        .update({
          view_count: existing.view_count + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Create new interest
      await supabase
        .from("customer_interests")
        .insert({
          customer_profile_id: profileId,
          product_id: product.id,
          interest_type: "viewed",
          sentiment: "positive",
        });
    }
  }
}

/**
 * Extract and save memory facts
 * ⚠️ CHỈ LƯU INSIGHTS - KHÔNG lưu structured data
 */
export async function extractMemoryFacts(
  profileId: string,
  messageText: string,
  conversationId: string,
) {
  const supabase = createSupabaseClient();
  const textLower = messageText.toLowerCase();
  const facts: any[] = [];

  // ========================================
  // 1. PREFERENCES (Sở thích)
  // ========================================

  // Negative preferences (không thích)
  const negativePatterns = [
    /không\s+thích\s+([^.,!?\n]+)/gi,
    /không\s+ưng\s+([^.,!?\n]+)/gi,
    /ghét\s+([^.,!?\n]+)/gi,
  ];

  for (const pattern of negativePatterns) {
    const matches = messageText.matchAll(pattern);
    for (const match of matches) {
      const preference = match[1].trim();
      // Skip if it's structured data
      if (
        !preference.includes("địa chỉ") && !preference.includes("sđt") &&
        preference.length < 50
      ) {
        facts.push({
          customer_profile_id: profileId,
          fact_type: "preference",
          fact_text: `Không thích ${preference}`,
          importance_score: 8,
          source_conversation_id: conversationId,
        });
      }
    }
  }

  // Positive preferences (thích)
  const positivePatterns = [
    /thích\s+([^.,!?\n]+)/gi,
    /ưng\s+([^.,!?\n]+)/gi,
    /yêu thích\s+([^.,!?\n]+)/gi,
  ];

  for (const pattern of positivePatterns) {
    const matches = messageText.matchAll(pattern);
    for (const match of matches) {
      const preference = match[1].trim();
      if (
        !preference.includes("địa chỉ") && !preference.includes("sđt") &&
        preference.length < 50
      ) {
        facts.push({
          customer_profile_id: profileId,
          fact_type: "preference",
          fact_text: `Thích ${preference}`,
          importance_score: 8,
          source_conversation_id: conversationId,
        });
      }
    }
  }

  // Fit preferences
  if (textLower.includes("rộng") || textLower.includes("thoải mái")) {
    facts.push({
      customer_profile_id: profileId,
      fact_type: "preference",
      fact_text: "Thích đồ rộng, thoải mái",
      importance_score: 7,
      source_conversation_id: conversationId,
    });
  }

  if (textLower.includes("ôm") && textLower.includes("không")) {
    facts.push({
      customer_profile_id: profileId,
      fact_type: "preference",
      fact_text: "Không thích đồ ôm",
      importance_score: 7,
      source_conversation_id: conversationId,
    });
  }

  // ========================================
  // 2. CONSTRAINTS (Hạn chế)
  // ========================================

  // Budget constraints
  const budgetPatterns = [
    /(?:dưới|không quá|tối đa|budget|ngân sách)\s+(\d+[kK]?)/gi,
    /khoảng\s+(\d+)\s*[-–]\s*(\d+)\s*[kK]?/gi,
  ];

  for (const pattern of budgetPatterns) {
    const matches = messageText.matchAll(pattern);
    for (const match of matches) {
      facts.push({
        customer_profile_id: profileId,
        fact_type: "constraint",
        fact_text: `Budget: ${match[0]}`,
        importance_score: 9,
        source_conversation_id: conversationId,
      });
    }
  }

  // Time constraints
  if (textLower.includes("gấp") || textLower.includes("nhanh")) {
    facts.push({
      customer_profile_id: profileId,
      fact_type: "constraint",
      fact_text: "Cần gấp, thời gian hạn chế",
      importance_score: 8,
      source_conversation_id: conversationId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // ========================================
  // 3. LIFE EVENTS (Sự kiện)
  // ========================================

  const eventPatterns = {
    "đi làm": 6,
    "dự tiệc": 8,
    "du lịch": 7,
    "đám cưới": 9,
    "phỏng vấn": 9,
    "sự kiện quan trọng": 9,
    "họp": 7,
    "gặp khách": 8,
  };

  for (const [keyword, importance] of Object.entries(eventPatterns)) {
    if (textLower.includes(keyword)) {
      facts.push({
        customer_profile_id: profileId,
        fact_type: "life_event",
        fact_text: `Sắp ${keyword}`,
        importance_score: importance,
        source_conversation_id: conversationId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString(),
      });
    }
  }

  // ========================================
  // 4. SPECIAL REQUESTS (Yêu cầu đặc biệt)
  // ========================================

  if (
    textLower.includes("giao") &&
    (textLower.includes("sáng") || textLower.includes("chiều"))
  ) {
    const timeOfDay = textLower.includes("sáng") ? "buổi sáng" : "buổi chiều";
    facts.push({
      customer_profile_id: profileId,
      fact_type: "special_request",
      fact_text: `Yêu cầu giao hàng ${timeOfDay}`,
      importance_score: 8,
      source_conversation_id: conversationId,
    });
  }

  if (textLower.includes("đóng gói") && textLower.includes("quà")) {
    facts.push({
      customer_profile_id: profileId,
      fact_type: "special_request",
      fact_text: "Yêu cầu đóng gói quà tặng",
      importance_score: 7,
      source_conversation_id: conversationId,
    });
  }

  // ========================================
  // 5. COMPLAINTS/COMPLIMENTS
  // ========================================

  // Complaints
  const complaintKeywords = [
    "chậm",
    "lâu",
    "tệ",
    "kém",
    "không tốt",
    "thất vọng",
  ];
  const hasComplaint = complaintKeywords.some((k) => textLower.includes(k));

  if (
    hasComplaint &&
    (textLower.includes("lần trước") || textLower.includes("trước đây"))
  ) {
    facts.push({
      customer_profile_id: profileId,
      fact_type: "complaint",
      fact_text: "Có phản hồi tiêu cực về trải nghiệm trước",
      importance_score: 9,
      source_conversation_id: conversationId,
    });
  }

  // Compliments
  const complimentKeywords = [
    "tuyệt",
    "tốt",
    "đẹp",
    "hài lòng",
    "thích",
    "ưng",
  ];
  const hasCompliment =
    complimentKeywords.filter((k) => textLower.includes(k)).length >= 2;

  if (hasCompliment) {
    facts.push({
      customer_profile_id: profileId,
      fact_type: "compliment",
      fact_text: "Hài lòng với sản phẩm/dịch vụ",
      importance_score: 7,
      source_conversation_id: conversationId,
    });
  }

  // ========================================
  // SAVE ALL FACTS
  // ========================================

  if (facts.length > 0) {
    console.log(`✅ Saving ${facts.length} memory facts (insights only)`);

    // Deactivate duplicate facts
    for (const fact of facts) {
      await supabase
        .from("customer_memory_facts")
        .update({ is_active: false })
        .eq("customer_profile_id", profileId)
        .eq("fact_type", fact.fact_type)
        .eq("fact_text", fact.fact_text);
    }

    // Insert new facts
    await supabase.from("customer_memory_facts").insert(facts);
  }
}

/**
 * Create conversation summary
 */
export async function createConversationSummary(conversationId: string) {
  const supabase = createSupabaseClient();

  // Get all messages
  const { data: messages } = await supabase
    .from("chatbot_messages")
    .select("content, sender_type, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (!messages || messages.length < 5) return;

  const customerMessages = messages
    .filter((m: Message) => m.sender_type === "customer")
    .map((m: Message) => m.content.text);

  const allText = customerMessages.join(" ").toLowerCase();

  // Extract key points
  const keyPoints: string[] = [];

  if (allText.includes("áo")) keyPoints.push("Quan tâm áo");
  if (allText.includes("quần")) keyPoints.push("Quan tâm quần");
  if (allText.includes("váy")) keyPoints.push("Quan tâm váy");
  if (allText.includes("vest")) keyPoints.push("Quan tâm vest");
  if (allText.includes("size")) keyPoints.push("Đã hỏi size");
  if (allText.includes("giá")) keyPoints.push("Hỏi giá");
  if (allText.includes("màu")) keyPoints.push("Hỏi về màu sắc");
  if (allText.includes("đặt") || allText.includes("mua")) {
    keyPoints.push("Có ý định mua");
  }
  if (allText.includes("địa chỉ")) keyPoints.push("Đã cung cấp địa chỉ");

  // Determine intent
  let intent = "browsing";
  if (
    allText.includes("đặt hàng") || allText.includes("mua") ||
    allText.includes("chốt")
  ) {
    intent = "buying";
  } else if (allText.includes("so sánh") || allText.includes("chất liệu")) {
    intent = "researching";
  } else if (allText.includes("giao hàng") || allText.includes("ship")) {
    intent = "asking_support";
  }

  // Calculate sentiment
  const positiveWords = [
    "tuyệt",
    "đẹp",
    "thích",
    "ok",
    "được",
    "hay",
    "ưng",
    "tốt",
  ];
  const negativeWords = ["không", "chưa", "tệ", "xấu", "kém", "chậm"];

  const positiveCount = positiveWords.filter((w) => allText.includes(w)).length;
  const negativeCount = negativeWords.filter((w) => allText.includes(w)).length;

  let sentiment = "neutral";
  let sentimentScore = 0;

  if (positiveCount > negativeCount + 2) {
    sentiment = "positive";
    sentimentScore = 0.7;
  } else if (negativeCount > positiveCount + 2) {
    sentiment = "negative";
    sentimentScore = -0.7;
  }

  // Determine outcome
  let outcome = "pending";
  if (allText.includes("đặt hàng") || allText.includes("chốt đơn")) {
    outcome = "purchased";
  } else if (allText.includes("cảm ơn") && sentiment === "positive") {
    outcome = "resolved";
  } else if (keyPoints.length > 3) {
    outcome = "needs_followup";
  }

  // Create summary text
  const summary = `Khách đã trao đổi ${messages.length} tin nhắn. ${
    keyPoints.join(", ")
  }.`;

  // Save summary
  await supabase.from("conversation_summaries").insert({
    conversation_id: conversationId,
    summary_text: summary,
    key_points: keyPoints,
    customer_intent: intent,
    sentiment: sentiment,
    sentiment_score: sentimentScore,
    message_count: messages.length,
    customer_messages: customerMessages.length,
    bot_messages: messages.length - customerMessages.length,
    outcome: outcome,
  });

  console.log("✅ Conversation summary created");
}

/**
 * Load customer memory for context
 */
export async function loadCustomerMemory(conversationId: string) {
  const supabase = createSupabaseClient();

  // Get profile
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (!profile) return null;

  // Get interests
  const { data: interests } = await supabase
    .from("customer_interests")
    .select(`
            product_id,
            interest_type,
            view_count,
            last_viewed_at,
            products (id, name, price, slug)
        `)
    .eq("customer_profile_id", profile.id)
    .order("last_viewed_at", { ascending: false })
    .limit(5);

  // Get memory facts (CHỈ insights, không có structured data)
  const { data: facts } = await supabase
    .from("customer_memory_facts")
    .select("fact_text, fact_type, importance_score")
    .eq("customer_profile_id", profile.id)
    .eq("is_active", true)
    .order("importance_score", { ascending: false })
    .limit(10);

  // Get summary
  const { data: summary } = await supabase
    .from("conversation_summaries")
    .select("summary_text, key_points, customer_intent, sentiment")
    .eq("conversation_id", conversationId)
    .order("summary_created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    profile,
    interests: interests || [],
    facts: facts || [],
    summary: summary || null,
  };
}
