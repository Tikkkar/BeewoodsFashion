// ============================================
// routes/zaloWebhook.ts - Zalo OA Webhook Handler
// ============================================

import { Request, Response } from "express";
import { handleMessage } from "../handlers/messageHandler.js";
import { getZaloAccessToken } from "../services/zaloService.js";
import crypto from "crypto";

/**
 * Verify Zalo webhook signature
 */
function verifyZaloSignature(
  body: any,
  signature: string,
  secretKey: string,
): boolean {
  try {
    const data = JSON.stringify(body);
    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(data)
      .digest("hex");
    
    return signature === expectedSignature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Main Zalo webhook handler
 */
export async function zaloWebhookHandler(req: Request, res: Response) {
  try {
    const event = req.body;
    const signature = req.headers["x-zalo-signature"] as string;

    // Verify signature (nếu Zalo gửi kèm)
    if (signature && process.env.ZALO_SECRET_KEY) {
      const isValid = verifyZaloSignature(
        event,
        signature,
        process.env.ZALO_SECRET_KEY,
      );
      
      if (!isValid) {
        console.error("Invalid Zalo signature");
        return res.status(401).json({ 
          error: -1, 
          message: "Invalid signature" 
        });
      }
    }

    console.log("Zalo webhook received:", event.event_name);

    // Handle webhook verification
    if (event.event_name === "webhook_verify") {
      console.log("Zalo webhook verification success");
      return res.json({
        error: 0,
        message: "success",
      });
    }

    // Handle user sends text message
    if (event.event_name === "user_send_text") {
      await handleUserSendText(event);
      return res.json({ error: 0, message: "success" });
    }

    // Handle user sends image
    if (event.event_name === "user_send_image") {
      await handleUserSendImage(event);
      return res.json({ error: 0, message: "success" });
    }

    // Handle user sends link
    if (event.event_name === "user_send_link") {
      await handleUserSendLink(event);
      return res.json({ error: 0, message: "success" });
    }

    // Handle user sends sticker
    if (event.event_name === "user_send_sticker") {
      await handleUserSendSticker(event);
      return res.json({ error: 0, message: "success" });
    }

    // Handle follow OA
    if (event.event_name === "follow") {
      await handleFollow(event);
      return res.json({ error: 0, message: "success" });
    }

    // Handle unfollow OA
    if (event.event_name === "unfollow") {
      await handleUnfollow(event);
      return res.json({ error: 0, message: "success" });
    }

    // Unknown event
    console.log("Unknown Zalo event:", event.event_name);
    return res.json({ error: 0, message: "success" });

  } catch (error) {
    console.error("Zalo webhook error:", error);
    return res.status(500).json({ 
      error: -1, 
      message: "Internal server error" 
    });
  }
}

/**
 * Handle user send text message
 */
async function handleUserSendText(event: any) {
  const { sender, recipient, message, timestamp } = event;

  try {
    // Get or refresh access token
    const accessToken = await getZaloAccessToken(
      process.env.ZALO_APP_ID!,
      process.env.ZALO_REFRESH_TOKEN!,
      process.env.ZALO_SECRET_KEY!,
    );

    // Process message through your chatbot handler
    await handleMessage({
      platform: "zalo",
      customer_zalo_id: sender.id,
      customer_phone: null,
      user_id: null,
      session_id: null,
      message_text: message.text,
      page_id: recipient.id,
      access_token: accessToken,
    });

    console.log(`✅ Processed Zalo message from user: ${sender.id}`);
  } catch (error) {
    console.error("Error handling Zalo text message:", error);
    throw error;
  }
}

/**
 * Handle user send image
 */
async function handleUserSendImage(event: any) {
  const { sender, recipient, message } = event;

  try {
    const accessToken = await getZaloAccessToken(
      process.env.ZALO_APP_ID!,
      process.env.ZALO_REFRESH_TOKEN!,
      process.env.ZALO_SECRET_KEY!,
    );

    // You can process the image URL from message.attachments
    const imageUrl = message.attachments?.[0]?.payload?.url;
    
    // For now, we'll treat it as a text message saying user sent an image
    await handleMessage({
      platform: "zalo",
      customer_zalo_id: sender.id,
      customer_phone: null,
      user_id: null,
      session_id: null,
      message_text: `[Người dùng đã gửi một hình ảnh: ${imageUrl}]`,
      page_id: recipient.id,
      access_token: accessToken,
    });

    console.log(`✅ Processed Zalo image from user: ${sender.id}`);
  } catch (error) {
    console.error("Error handling Zalo image:", error);
    throw error;
  }
}

/**
 * Handle user send link
 */
async function handleUserSendLink(event: any) {
  const { sender, recipient, message } = event;

  try {
    const accessToken = await getZaloAccessToken(
      process.env.ZALO_APP_ID!,
      process.env.ZALO_REFRESH_TOKEN!,
      process.env.ZALO_SECRET_KEY!,
    );

    const link = message.attachments?.[0]?.payload?.url || message.text;

    await handleMessage({
      platform: "zalo",
      customer_zalo_id: sender.id,
      customer_phone: null,
      user_id: null,
      session_id: null,
      message_text: link,
      page_id: recipient.id,
      access_token: accessToken,
    });

    console.log(`✅ Processed Zalo link from user: ${sender.id}`);
  } catch (error) {
    console.error("Error handling Zalo link:", error);
    throw error;
  }
}

/**
 * Handle user send sticker
 */
async function handleUserSendSticker(event: any) {
  const { sender, recipient } = event;

  try {
    const accessToken = await getZaloAccessToken(
      process.env.ZALO_APP_ID!,
      process.env.ZALO_REFRESH_TOKEN!,
      process.env.ZALO_SECRET_KEY!,
    );

    // Treat sticker as a friendly message
    await handleMessage({
      platform: "zalo",
      customer_zalo_id: sender.id,
      customer_phone: null,
      user_id: null,
      session_id: null,
      message_text: "[Người dùng đã gửi sticker]",
      page_id: recipient.id,
      access_token: accessToken,
    });

    console.log(`✅ Processed Zalo sticker from user: ${sender.id}`);
  } catch (error) {
    console.error("Error handling Zalo sticker:", error);
    throw error;
  }
}

/**
 * Handle user follow OA
 */
async function handleFollow(event: any) {
  const { follower, oa_id, timestamp } = event;

  console.log(`👤 New follower: ${follower.id} followed OA: ${oa_id}`);

  try {
    const accessToken = await getZaloAccessToken(
      process.env.ZALO_APP_ID!,
      process.env.ZALO_REFRESH_TOKEN!,
      process.env.ZALO_SECRET_KEY!,
    );

    // Send welcome message
    await handleMessage({
      platform: "zalo",
      customer_zalo_id: follower.id,
      customer_phone: null,
      user_id: null,
      session_id: null,
      message_text: "Chào mừng bạn!",
      page_id: oa_id,
      access_token: accessToken,
    });

    console.log(`✅ Sent welcome message to new follower: ${follower.id}`);
  } catch (error) {
    console.error("Error handling Zalo follow:", error);
    throw error;
  }
}

/**
 * Handle user unfollow OA
 */
async function handleUnfollow(event: any) {
  const { follower, oa_id, timestamp } = event;

  console.log(`👋 User unfollowed: ${follower.id} unfollowed OA: ${oa_id}`);

  // You can update your database to mark this user as unfollowed
  // Or trigger any cleanup logic
}

/**
 * Health check endpoint
 */
export async function zaloHealthCheck(req: Request, res: Response) {
  try {
    // Test if we can get access token
    const accessToken = await getZaloAccessToken(
      process.env.ZALO_APP_ID!,
      process.env.ZALO_REFRESH_TOKEN!,
      process.env.ZALO_SECRET_KEY!,
    );

    res.json({
      status: "ok",
      service: "Zalo OA",
      hasAccessToken: !!accessToken,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}