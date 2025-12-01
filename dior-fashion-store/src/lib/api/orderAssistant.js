// src/lib/api/orderAssistant.js
// Service để gọi Order Assistant Edge Function

import { supabase } from "../supabase";

/**
 * Gửi message chat đến AI Assistant
 */
export async function sendChatMessage(message) {
  try {
    // Lấy session token
    const { data: { session } } = await supabase.auth.getSession();

    const { data, error } = await supabase.functions.invoke("order-assistant", {
      body: { action: "chat", message },
      // headers: {
      //   Authorization: `Bearer ${session?.access_token || supabase.auth.session()?.access_token}`
      // }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    return data.data;
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

/**
 * Parse thông tin khách hàng từ text
 */
export async function parseCustomerInfo(text) {
  try {
    const { data, error } = await supabase.functions.invoke("order-assistant", {
      body: {
        action: "parse_customer",
        text,
      },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || "Parse customer info failed");

    return data.data;
  } catch (error) {
    console.error("❌ parseCustomerInfo error:", error);
    throw error;
  }
}

/**
 * Gợi ý sản phẩm dựa trên mô tả
 */
export async function suggestProducts(description, availableProducts) {
  try {
    const { data, error } = await supabase.functions.invoke("order-assistant", {
      body: {
        action: "suggest_products",
        description,
        products: availableProducts,
      },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || "Suggest products failed");

    return data.data;
  } catch (error) {
    console.error("❌ suggestProducts error:", error);
    throw error;
  }
}

/**
 * Trả lời câu hỏi về sản phẩm
 */
export async function answerQuestion(question, products) {
  try {
    const { data, error } = await supabase.functions.invoke("order-assistant", {
      body: {
        action: "answer_question",
        question,
        products,
      },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || "Answer question failed");

    return data.data;
  } catch (error) {
    console.error("❌ answerQuestion error:", error);
    throw error;
  }
}