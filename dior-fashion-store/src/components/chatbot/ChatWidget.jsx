// ============================================
// CHAT WIDGET - Floating chatbot cho website
// File: src/components/chatbot/ChatWidget.jsx
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Khởi tạo session ID cho guest
  useEffect(() => {
    let sid = localStorage.getItem('chatbot_session_id');
    if (!sid) {
      sid = 'guest_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chatbot_session_id', sid);
    }
    setSessionId(sid);

    // Load conversation history nếu có
    loadConversationHistory(sid);
  }, [user]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto load messages mỗi 5s khi mở
  useEffect(() => {
    if (isOpen && conversationId) {
      const interval = setInterval(() => {
        loadMessages(conversationId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, conversationId]);
async function loadConversationHistory(sid) {
  try {
    // Tìm conversation của user/guest
    let query = supabase
      .from('chatbot_conversations')
      .select('id')
      .eq('platform', 'website')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (user?.id) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.eq('session_id', sid);
    }

    // Sửa lỗi: KHÔNG dùng .single(), dùng array + kiểm tra phần tử
    const { data } = await query;
    const conv = data && data.length > 0 ? data[0] : null;

    if (conv) {
      setConversationId(conv.id);
      await loadMessages(conv.id);
    }
  } catch (err) {
    console.error('Load history error:', err);
  }
}
  async function loadMessages(convId) {
    try {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Load messages error:', err);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Gọi Edge Function xử lý tin nhắn
      const { data, error } = await supabase.functions.invoke('chatbot-process', {
        body: {
          platform: 'website',
          user_id: user?.id || null,
          session_id: user?.id ? null : sessionId,
          message_text: userMessage
        }
      });

      if (error) throw error;

      // Lấy conversation ID từ response hoặc load lại
      if (!conversationId) {
        await loadConversationHistory(sessionId);
      } else {
        await loadMessages(conversationId);
      }
    } catch (err) {
      console.error('Send message error:', err);
      // Hiển thị lỗi cho user
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender_type: 'bot',
        content: { text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!' },
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // Quick replies khi bắt đầu chat
  const quickReplies = [
    '👋 Xin chào',
    '🛍️ Xem sản phẩm mới',
    '📦 Kiểm tra đơn hàng',
    '❓ Chính sách đổi trả'
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-black text-white rounded-full shadow-2xl hover:bg-gray-800 transition-all duration-300 flex items-center justify-center z-50 group"
          aria-label="Open chat"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 transition-all duration-300 ${
            isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
          }`}
          style={{ maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-black to-gray-800 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">BeWo Assistant</h3>
                <p className="text-xs text-white/70">Trực tuyến</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                aria-label="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-600 mb-4">
                      👋 Xin chào! Tôi có thể giúp gì cho bạn?
                    </p>
                    <div className="space-y-2 w-full">
                      {quickReplies.map((reply, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInput(reply)}
                          className="w-full text-left px-4 py-2 bg-white hover:bg-gray-100 rounded-lg text-sm transition border"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            msg.sender_type === 'customer'
                              ? 'bg-black text-white rounded-br-none'
                              : msg.sender_type === 'bot'
                              ? 'bg-white text-gray-900 shadow-sm border rounded-bl-none'
                              : 'bg-blue-100 text-blue-900 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content.text}
                          </p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_type === 'customer' ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {msg.sender_type === 'bot' && '🤖 '} 
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 bg-white border-t rounded-b-2xl">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="p-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    aria-label="Send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {user ? `Đang chat với tư cách: ${user.email}` : 'Đang chat dưới dạng khách'}
                </p>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}