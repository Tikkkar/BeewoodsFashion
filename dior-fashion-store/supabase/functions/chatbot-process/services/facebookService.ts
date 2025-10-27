import { formatPrice } from "../utils/formatters.ts";

/**
 * Send image to Facebook Messenger. Must be defined at the root level of the module.
 */
export async function sendFacebookImage(
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
  const fbApiUrl = `https://graph.facebook.com/v21.0/me/messages?access_token=${accessToken}`;
  try {
    // 1. Send image attachment
    await fetch(fbApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: "image",
            payload: {
              url: imageUrl,
              is_reusable: true,
            },
          },
        },
      }),
    }); // 2. Send product details as quick replies (optional)

    if (product) {
      await fetch(fbApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: {
            text: `${product.name}\nGiá: ${product.price.toLocaleString(
              "vi-VN"
            )}đ`,
            quick_replies: [
              {
                content_type: "text",
                title: "🛒 Thêm vào giỏ",
                payload: `ADD_TO_CART_${product.id}`,
              },
              {
                content_type: "text",
                title: "📱 Xem chi tiết",
                payload: `VIEW_PRODUCT_${product.id}`,
              },
            ],
          },
        }),
      });
    }

    console.log("✅ Facebook image sent successfully");
  } catch (error) {
    console.error("❌ Facebook image send error:", error);
    throw error;
  }
}

/**
 * Send text message or product cards to Facebook Messenger
 */
export async function sendFacebookMessage(
  recipientId: string,
  text: string,
  accessToken: string,
  products: any[] = []
) {
  const fbApiUrl = `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`; // 1. Send Product Cards if showcase

  if (products && products.length > 0) {
    const elements = products.map((p: any) => ({
      title: p.name,
      subtitle: `${formatPrice(p.price)} - ${
        p.stock > 0 ? "Con hang" : "Het hang"
      }`,
      image_url: p.images?.[0]?.image_url || "https://via.placeholder.com/300",
      buttons: [
        {
          type: "web_url",
          title: "Xem chi tiet",
          url: `https://68f0a8368a61bd13b77fdc25--sweet-croissant-b165fe.netlify.app/product/${p.slug}`,
        },
      ],
    }));

    await fetch(fbApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              image_aspect_ratio: "square",
              elements: elements,
            },
          },
        },
      }),
    }); // Wait 500ms before sending text

    await new Promise((resolve) => setTimeout(resolve, 500));
  } // 2. Send text message
  await fetch(fbApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: text },
    }),
  });

  console.log("Sent to Facebook Messenger");
}
