// ============================================
// CHATBOT API - Functions để gọi từ frontend
// File: src/lib/api/chatbot.js
// ============================================

import { supabase } from '../supabase';

// ============================================
// FACEBOOK SETTINGS
// ============================================

/**
 * Lấy cấu hình Facebook
 */
export async function getFacebookSettings() {
  const { data, error } = await supabase
    .from('chatbot_facebook_settings')
    .select('*')
    .limit(1)
    .maybeSingle(); // Thay .single() bằng .maybeSingle()

  if (error) {
    throw error;
  }
  
  return data; // Trả về null nếu không có data
}

/**
 * Cập nhật hoặc tạo mới Facebook settings
 */
export async function saveFacebookSettings(settings) {
  // Check if exists
  const existing = await getFacebookSettings();

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from('chatbot_facebook_settings')
      .update({
        page_id: settings.page_id,
        page_name: settings.page_name,
        access_token: settings.access_token,
        app_id: settings.app_id,
        app_secret: settings.app_secret,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert
    const { data, error } = await supabase
      .from('chatbot_facebook_settings')
      .insert({
        page_id: settings.page_id,
        page_name: settings.page_name,
        access_token: settings.access_token,
        app_id: settings.app_id,
        app_secret: settings.app_secret
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Test kết nối Facebook
 */
export async function testFacebookConnection() {
  const settings = await getFacebookSettings();
  
  if (!settings?.access_token || !settings?.page_id) {
    throw new Error('Please configure access token and page ID first');
  }

  // Test bằng cách lấy thông tin page
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${settings.page_id}?fields=name,id&access_token=${settings.access_token}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Connection test failed');
  }

  const data = await response.json();
  
  // Update page_name và is_connected
  await supabase
    .from('chatbot_facebook_settings')
    .update({
      page_name: data.name,
      is_connected: true,
      last_sync_at: new Date().toISOString()
    })
    .eq('id', settings.id);

  return data;
}

/**
 * Ngắt kết nối Facebook
 */
export async function disconnectFacebook() {
  const settings = await getFacebookSettings();
  
  if (!settings) return;

  const { error } = await supabase
    .from('chatbot_facebook_settings')
    .update({
      is_connected: false,
      access_token: null
    })
    .eq('id', settings.id);

  if (error) throw error;
}

// ============================================
// CONVERSATIONS
// ============================================

/**
 * Lấy danh sách conversations
 */
export async function getConversations(filters = {}) {
  let query = supabase
    .from('chatbot_conversations')
    .select('*')
    .order('last_message_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.platform) {
    query = query.eq('platform', filters.platform);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Lấy conversation theo ID
 */
export async function getConversationById(id) {
  const { data, error } = await supabase
    .from('chatbot_conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cập nhật conversation (status, assigned, etc)
 */
export async function updateConversation(id, updates) {
  const { data, error } = await supabase
    .from('chatbot_conversations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// MESSAGES
// ============================================

/**
 * Lấy tin nhắn trong conversation
 */
export async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from('chatbot_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Gửi tin nhắn từ admin
 */
export async function sendAdminMessage(conversationId, messageText) {
  // Lưu tin nhắn vào DB
  const { data: message, error: msgError } = await supabase
    .from('chatbot_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'admin',
      message_type: 'text',
      content: { text: messageText }
    })
    .select()
    .single();

  if (msgError) throw msgError;

  // Lấy conversation info để gửi qua platform
  const conversation = await getConversationById(conversationId);
  const fbSettings = await getFacebookSettings();

  // Gửi qua Facebook nếu là Facebook conversation
  if (conversation.platform === 'facebook' && conversation.customer_fb_id) {
    if (!fbSettings?.access_token) {
      throw new Error('Facebook not connected');
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${fbSettings.access_token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: conversation.customer_fb_id },
          message: { text: messageText }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to send message');
    }
  }

  return message;
}

// ============================================
// SCENARIOS
// ============================================

/**
 * Lấy danh sách scenarios
 */
export async function getScenarios() {
  const { data, error } = await supabase
    .from('chatbot_scenarios')
    .select('*')
    .order('priority', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Cập nhật scenario
 */
export async function updateScenario(id, updates) {
  const { data, error } = await supabase
    .from('chatbot_scenarios')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
export async function insertScenario(newScenario) {
  const { data, error } = await supabase
    .from('chatbot_scenarios')
    .insert(newScenario)
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function deleteScenario(id) {
  const { error } = await supabase
    .from('chatbot_scenarios')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
export async function invokeChatbotProcess(input) {
  const { data, error } = await supabase.functions.invoke('chatbot-process', { body: input });
  return { data, error };
}
// ============================================
// USAGE & STATS
// ============================================

/**
 * Lấy tổng tokens đã dùng
 */
export async function getTotalTokensUsed() {
  const { data, error } = await supabase.rpc('get_total_tokens_used');

  if (error) throw error;
  return data || 0;
}

/**
 * Lấy tổng chi phí
 */
export async function getTotalCost() {
  const { data, error } = await supabase.rpc('get_total_cost');

  if (error) throw error;
  return data || 0;
}

/**
 * Lấy usage logs
 */
export async function getUsageLogs(limit = 50) {
  const { data, error } = await supabase
    .from('chatbot_usage_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Lấy stats tổng hợp
 */
export async function getChatbotStats() {
  // Total conversations
  const { count: totalConversations } = await supabase
    .from('chatbot_conversations')
    .select('*', { count: 'exact', head: true });

  // Active conversations
  const { count: activeConversations } = await supabase
    .from('chatbot_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Total messages
  const { count: totalMessages } = await supabase
    .from('chatbot_messages')
    .select('*', { count: 'exact', head: true });

  // Bot messages
  const { count: botMessages } = await supabase
    .from('chatbot_messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_type', 'bot');

  const tokensUsed = await getTotalTokensUsed();
  const totalCost = await getTotalCost();

  return {
    totalConversations: totalConversations || 0,
    activeConversations: activeConversations || 0,
    totalMessages: totalMessages || 0,
    botMessages: botMessages || 0,
    tokensUsed,
    totalCost
  };
}