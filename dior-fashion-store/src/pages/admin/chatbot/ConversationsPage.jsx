// ============================================
// CONVERSATIONS PAGE - Xem và quản lý chat (Realtime)
// File: src/pages/admin/chatbot/ConversationsPage.jsx
// ============================================

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Clock, Filter, RefreshCw } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { supabase } from '../../../lib/supabase';
import {
  getConversations,
  getMessages,
  sendAdminMessage,
  updateConversation
} from '../../../lib/api/chatbot';

export default function ConversationsPage() {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    platform: ''
  });

  // Load và refresh conversations ban đầu (1 lần)
  useEffect(() => {
    loadConversations();
  }, [filters]);

  // Supabase Realtime: conversations
  useEffect(() => {
    const channel = supabase
      .channel('admin-conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chatbot_conversations',
      }, payload => {
        loadConversations(); // Tự động reload khi có thay đổi
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line
  }, [filters]);

  // Load tin nhắn khi chọn conversation mới
  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
    }
  }, [selectedConv]);

  // Supabase Realtime: messages của từng conversation
  useEffect(() => {
    if (!selectedConv) return;
    const channel = supabase
      .channel('admin-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chatbot_messages',
        filter: `conversation_id=eq.${selectedConv.id}`,
      }, payload => {
        loadMessages(selectedConv.id);
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line
  }, [selectedConv]);

  async function loadConversations() {
    try {
      setLoading(true);
      const res = await getConversations(filters);
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setConversations(list);
    } catch (err) {
      console.error('Load conversations error:', err);
      showError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(convId) {
    try {
      const data = await getMessages(convId);
      setMessages(data);
    } catch (err) {
      console.error('Load messages error:', err);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConv) return;
    try {
      setSending(true);
      await sendAdminMessage(selectedConv.id, messageInput.trim());
      setMessageInput('');
      // Không cần gọi lại loadMessages khi dùng realtime
      success('Message sent!');
    } catch (err) {
      showError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  async function handleResolve(convId) {
    try {
      await updateConversation(convId, { status: 'resolved' });
      success('Conversation resolved');
      // Khi realtime active sẽ tự reload, không cần thủ công
      if (selectedConv?.id === convId) {
        setSelectedConv(null);
      }
    } catch (err) {
      showError('Failed to resolve conversation');
    }
  }

  // Toggle trạng thái Agent cho cuộc hội thoại đang chọn (hiện tạm lưu ở client)
  const [agentEnabled, setAgentEnabled] = useState(false);

  function handleToggleAgent() {
    setAgentEnabled((prev) => !prev);
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-white border-b px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light">Conversations</h1>
            <p className="text-sm text-gray-600">
              {conversations.length} total • {conversations.filter(c => c.status === 'active').length} active
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={filters.platform}
              onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
              className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black"
            >
              <option value="">All Platforms</option>
              <option value="facebook">Facebook</option>
              <option value="website">Website</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending_admin">Pending Admin</option>
              <option value="resolved">Resolved</option>
            </select>
            <button
              onClick={loadConversations}
              className="p-2 border rounded-lg hover:bg-gray-50"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex h-[calc(100%-5rem)]">
        {/* Sidebar - Conversations List */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <MessageSquare className="w-12 h-12 mb-2" />
              <p>No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                    selectedConv?.id === conv.id ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      {conv.customer_avatar ? (
                        <img src={conv.customer_avatar} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <User className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">
                          {conv.customer_name || 'Guest'}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          conv.platform === 'facebook' 
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {conv.platform}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          conv.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : conv.status === 'resolved'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {conv.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Main - Chat Window */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {selectedConv.customer_avatar ? (
                      <img src={selectedConv.customer_avatar} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{selectedConv.customer_name || 'Guest'}</p>
                    <p className="text-xs text-gray-500">
                      {selectedConv.platform} • {selectedConv.status}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Agent:{" "}
                      <span className={agentEnabled ? "text-green-600" : "text-red-600"}>
                        {agentEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Toggle Agent for this conversation */}
                  <label className="flex items-center gap-1 text-[10px] px-2 py-1 border rounded-full cursor-pointer bg-gray-50">
                    <span>Agent</span>
                    <input
                      type="checkbox"
                      checked={agentEnabled}
                      onChange={handleToggleAgent}
                    />
                  </label>
                  {selectedConv.status === 'active' && (
                    <button
                      onClick={() => handleResolve(selectedConv.id)}
                      className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                    >
                      Mark as Resolved
                    </button>
                  )}
                </div>
              </div>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'customer' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.sender_type === 'customer'
                          ? 'bg-white text-gray-900'
                          : msg.sender_type === 'bot'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content.text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender_type === 'customer' ? 'text-gray-500' : 'text-white/70'
                      }`}>
                        {msg.sender_type === 'bot' && '🤖 '} 
                        {msg.sender_type === 'admin' && '👤 Admin • '}
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Input */}
              <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageInput.trim()}
                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="w-16 h-16 mb-4" />
              <p className="text-lg">Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
