// ============================================
// services/zaloService.ts - Zalo OA integration
// ============================================

import { formatPrice } from "../utils/formatters.ts";

/**
 * Send message to Zalo Official Account user
 * @param recipientId - Zalo user_id
 * @param text - Message text
 * @param accessToken - Zalo OA access token
 * @param products - Optional array of products to display
 */
export async function sendZaloMessage(
  recipientId: string,
  text: string,
  accessToken: string,
  products: any[] = [],
) {
  const zaloApiUrl = "https://openapi.zalo.me/v3.0/oa/message/cs";

  try {
    // Send Product List if available
    if (products && products.length > 0) {
      const elements = products.slice(0, 10).map((p: any) => ({
        title: p.name,
        subtitle: `${formatPrice(p.price)} - ${
          p.stock > 0 ? "Còn hàng" : "Hết hàng"
        }`,
        image_url: p.images?.[0]?.image_url || "https://via.placeholder.com/300",
        default_action: {
          type: "oa.open.url",
          url: `https://68f0a8368a61bd13b77fdc25--sweet-croissant-b165fe.netlify.app/product/${p.slug}`,
        },
      }));

      // Send as list message
      const listMessagePayload = {
        recipient: {
          user_id: recipientId,
        },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "list",
              elements: elements,
            },
          },
        },
      };

      const listResponse = await fetch(zaloApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": accessToken,
        },
        body: JSON.stringify(listMessagePayload),
      });

      if (!listResponse.ok) {
        const errorData = await listResponse.json();
        console.error("Zalo list message error:", errorData);
      } else {
        console.log("Sent product list to Zalo OA");
      }

      // Wait 500ms before sending text
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Send text message
    const textMessagePayload = {
      recipient: {
        user_id: recipientId,
      },
      message: {
        text: text,
      },
    };

    const textResponse = await fetch(zaloApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": accessToken,
      },
      body: JSON.stringify(textMessagePayload),
    });

    if (!textResponse.ok) {
      const errorData = await textResponse.json();
      console.error("Zalo text message error:", errorData);
      throw new Error(`Zalo API error: ${JSON.stringify(errorData)}`);
    }

    console.log("Sent text message to Zalo OA");
  } catch (error) {
    console.error("Error sending Zalo message:", error);
    throw error;
  }
}
/**
 * Send image to Zalo
 */
export async function sendZaloImage(
  recipientId: string,
  imageUrl: string,
  accessToken: string,
  product?: {
    id: string;
    name: string;
    price: number;
    slug: string;
  }
) {
  try {
    // Upload image to Zalo first (Zalo requires upload)
    const uploadResponse = await fetch('https://openapi.zalo.me/v3.0/oa/upload/image', {
      method: 'POST',
      headers: {
        'access_token': accessToken,
        'Content-Type': 'multipart/form-data'
      },
      body: JSON.stringify({
        file: imageUrl
      })
    });

    const uploadData = await uploadResponse.json();
    const attachment_id = uploadData.data?.attachment_id;

    if (!attachment_id) {
      throw new Error('Failed to upload image to Zalo');
    }

    // Send image message
    await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', {
      method: 'POST',
      headers: {
        'access_token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: {
          user_id: recipientId
        },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'media',
              elements: [
                {
                  media_type: 'image',
                  attachment_id: attachment_id
                }
              ]
            }
          }
        }
      })
    });

    // Send product info (optional)
    if (product) {
      await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', {
        method: 'POST',
        headers: {
          'access_token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: {
            user_id: recipientId
          },
          message: {
            text: `${product.name}\nGiá: ${product.price.toLocaleString('vi-VN')}đ\n\n🛒 Thêm vào giỏ | 📱 Xem chi tiết`
          }
        })
      });
    }

    console.log('✅ Zalo image sent successfully');
  } catch (error) {
    console.error('❌ Zalo image send error:', error);
    throw error;
  }
}
/**
 * Send action-based message (buttons, quick replies)
 * @param recipientId - Zalo user_id
 * @param text - Message text
 * @param accessToken - Zalo OA access token
 * @param buttons - Array of action buttons
 */
export async function sendZaloActionMessage(
  recipientId: string,
  text: string,
  accessToken: string,
  buttons: Array<{
    type: "oa.open.url" | "oa.query.show" | "oa.query.hide";
    title: string;
    payload?: string;
    url?: string;
  }>,
) {
  const zaloApiUrl = "https://openapi.zalo.me/v3.0/oa/message/cs";

  const payload = {
    recipient: {
      user_id: recipientId,
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "request_user_info",
          elements: [
            {
              title: text,
              subtitle: "Vui lòng chọn",
              image_url: "https://via.placeholder.com/300",
            },
          ],
          buttons: buttons.map((btn) => ({
            title: btn.title,
            type: btn.type,
            payload: btn.payload || "",
            url: btn.url || "",
          })),
        },
      },
    },
  };

  try {
    const response = await fetch(zaloApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": accessToken,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Zalo action message error:", errorData);
      throw new Error(`Zalo API error: ${JSON.stringify(errorData)}`);
    }

    console.log("Sent action message to Zalo OA");
  } catch (error) {
    console.error("Error sending Zalo action message:", error);
    throw error;
  }
}

/**
 * Get Zalo OA access token using refresh token
 * @param appId - Zalo App ID
 * @param refreshToken - Zalo Refresh Token
 * @param secretKey - Zalo App Secret Key
 */
export async function getZaloAccessToken(
  appId: string,
  refreshToken: string,
  secretKey: string,
): Promise<string> {
  const tokenUrl = "https://oauth.zaloapp.com/v4/oa/access_token";

  const payload = {
    app_id: appId,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  };

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "secret_key": secretKey,
      },
      body: new URLSearchParams(payload).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Zalo token refresh error:", errorData);
      throw new Error(`Failed to refresh Zalo token: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting Zalo access token:", error);
    throw error;
  }
}