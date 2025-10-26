// ============================================
// services/facebookService.ts - Facebook Messenger integration
// ============================================

import { formatPrice } from "../utils/formatters.ts";

export async function sendFacebookMessage(
  recipientId: string,
  text: string,
  accessToken: string,
  products: any[] = [],
) {
  const fbApiUrl =
    `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`;

  // Send Product Cards if showcase
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
          url:
            `https://68f0a8368a61bd13b77fdc25--sweet-croissant-b165fe.netlify.app/product/${p.slug}`,
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
    });

    // Wait 500ms before sending text
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Send text message
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
