// src/lib/api/chatbot.js
// API client for Supabase Edge Function: chatbot-process
// Gồm các hàm dùng chung cho widget + trang admin chatbot

import { supabase } from "../supabase";

const CHATBOT_FUNCTION_URL =
  process.env.REACT_APP_SUPABASE_CHATBOT_URL ||
  // Khi chạy trên Supabase Hosting hoặc qua reverse proxy Netlify/Vercel,
  // đường dẫn /functions/v1/chatbot-process sẽ được map đúng.
  "/functions/v1/chatbot-process";

async function callChatbotFunction(body) {
  // Ưu tiên dùng supabase.functions.invoke (dùng supabase.js bạn đã cấu hình),
  // để luôn gọi qua Supabase server đúng cách cả dev lẫn production.
  try {
    const { data, error } = await supabase.functions.invoke(
      "chatbot-process",
      { body }
    );

    if (error) {
      throw error;
    }
    return data;
  } catch (e) {
    // Fallback: nếu supabase.functions không dùng được trong môi trường hiện tại,
    // thử gọi trực tiếp HTTP tới CHATBOT_FUNCTION_URL (Netlify/Vercel/Supabase hosting).
    const res = await fetch(CHATBOT_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Chatbot API error: ${res.status}`);
    }

    return res.json();
  }
}

/**
 * Gửi message tới chatbot (frontend widget hoặc admin)
 */
export async function sendChatMessage(payload) {
  return callChatbotFunction(payload);
}

/**
 * Bật / tắt Agent cho 1 conversation
 * @param {string} conversationId
 * @param {boolean} enabled
 */
export async function setAgentStatus(conversationId, enabled) {
  return callChatbotFunction({
    action: "SET_AGENT_STATUS",
    payload: { conversationId, enabled },
  });
}

/**
 * Lấy trạng thái Agent cho 1 conversation
 * @param {string} conversationId
 */
export async function getAgentStatus(conversationId) {
  return callChatbotFunction({
    action: "GET_AGENT_STATUS",
    payload: { conversationId },
  });
}

/**
 * ===== Admin helpers giữ lại để không lỗi import =====
 * Các hàm này có thể map sang action cụ thể trong Edge Function
 * hoặc Supabase RPC/REST tuỳ bạn triển khai tiếp.
 */

export async function invokeChatbotProcess(body) {
  return callChatbotFunction(body);
}

/**
 * Lấy danh sách hội thoại từ bảng public.chatbot_conversations
 * Hỗ trợ lọc theo status & platform.
 */
export async function getConversations(params = {}) {
  const { status, platform } = params;

  let query = supabase
    .from("chatbot_conversations")
    .select("*")
    .order("last_message_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (platform) {
    query = query.eq("platform", platform);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getConversations error:", error);
    throw error;
  }

  return data || [];
}

/**
 * Lấy messages cho 1 conversation từ bảng public.chatbot_messages
 */
export async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from("chatbot_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getMessages error:", error);
    throw error;
  }

  return data || [];
}

/**
 * Gửi tin nhắn admin vào 1 conversation
 * - sender_type = 'admin'
 * - content: lưu dạng { text: "..." }
 */
export async function sendAdminMessage(conversationId, text) {
  const payload = {
    conversation_id: conversationId,
    sender_type: "admin",
    message_type: "text",
    content: { text },
  };

  const { data, error } = await supabase
    .from("chatbot_messages")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("sendAdminMessage error:", error);
    throw error;
  }

  // cập nhật last_message_at cho conversation
  await supabase
    .from("chatbot_conversations")
    .update({ last_message_at: data.created_at })
    .eq("id", conversationId);

  return data;
}

/**
 * Cập nhật 1 conversation (ví dụ đổi status -> resolved)
 */
export async function updateConversation(conversationId, updates) {
  const { data, error } = await supabase
    .from("chatbot_conversations")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .select()
    .single();

  if (error) {
    console.error("updateConversation error:", error);
    throw error;
  }

  return data;
}

export async function getFacebookSettings() {
  console.warn("getFacebookSettings() placeholder - implement with your backend.");
  return { success: false, message: "Not implemented" };
}

export async function saveFacebookSettings(settings) {
  console.warn("saveFacebookSettings() placeholder - implement with your backend.");
  return { success: false, message: "Not implemented" };
}

export async function testFacebookConnection() {
  console.warn("testFacebookConnection() placeholder - implement with your backend.");
  return { success: false, message: "Not implemented" };
}

export async function disconnectFacebook() {
  console.warn("disconnectFacebook() placeholder - implement with your backend.");
  return { success: false, message: "Not implemented" };
}

export async function getScenarios() {
  console.warn("getScenarios() placeholder - implement with your backend.");
  return { success: false, data: [], message: "Not implemented" };
}

export async function updateScenario(id, updates) {
  console.warn("updateScenario() placeholder - implement with your backend.");
  return { success: false, message: "Not implemented" };
}

export async function deleteScenario(id) {
  console.warn("deleteScenario() placeholder - implement with your backend.");
  return { success: false, message: "Not implemented" };
}

export async function insertScenario(data) {
  console.warn("insertScenario() placeholder - implement with your backend.");
  return { success: false, message: "Not implemented" };
}
