// ============================================
// CHAT WIDGET - Floating chatbot cho website
// File: src/components/chatbot/ChatWidget.jsx
// ============================================

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Minimize2, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import {
  sendChatMessage,
  setAgentStatus,
  getAgentStatus,
} from "../../lib/api/chatbot";

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [agentEnabled, setAgentEnabled] = useState(true);
  const messagesEndRef = useRef(null);

  // Khởi tạo session ID cho guest
  useEffect(() => {
    let sid = localStorage.getItem("chatbot_session_id");
    if (!sid) {
      sid = "guest_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("chatbot_session_id", sid);
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
        .from("chatbot_conversations")
        .select("id")
        .eq("platform", "website")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (user?.id) {
        query = query.eq("user_id", user.id);
      } else {
        query = query.eq("session_id", sid);
      }

      // Sửa lỗi: KHÔNG dùng .single(), dùng array + kiểm tra phần tử
      const { data } = await query;
      const conv = data && data.length > 0 ? data[0] : null;

      if (conv) {
        setConversationId(conv.id);
        await loadMessages(conv.id);

        // Lấy trạng thái agent cho conversation hiện tại
        try {
          const res = await getAgentStatus(conv.id);
          const enabled =
            (res?.data && res.data.agent_enabled) ??
            res?.agent_enabled ??
            true;
          setAgentEnabled(enabled);
        } catch (e) {
          console.warn("Get agent status error:", e);
          setAgentEnabled(true);
        }
      }
    } catch (err) {
      console.error("Load history error:", err);
    }
  }

  async function loadMessages(convId) {
    try {
      const { data, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    } catch (err) {
      console.error("Load messages error:", err);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const tempId = Date.now();

    // 1) Clear input + append user message ngay lập tức (UI phản hồi tức thời)
    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender_type: "customer",
        message_type: "text",
        content: { text: userMessage },
        created_at: new Date().toISOString(),
      },
    ]);
    setLoading(true);

    try {
      // 2) Gọi Edge Function xử lý tin nhắn
      const apiResponse = await sendChatMessage({
        platform: "website",
        user_id: user?.id || null,
        session_id: user?.id ? null : sessionId,
        message_text: userMessage,
      });

      // apiResponse có thể là:
      // - { success: true, response: "...", meta: { conversation_id } } từ handleMessage
      // - { success: true, data: {...} } cho các action khác
      const data =
        apiResponse?.data && apiResponse.data.conversationId
          ? apiResponse.data
          : apiResponse;
      const error = apiResponse?.error && !apiResponse.success
        ? apiResponse.error
        : null;

      if (error) {
        console.error("Send message error:", error);
        // Không spam lỗi nếu server trả ra khác 2xx, chỉ update tin nhắn cuối cùng
        setMessages((prev) => [
          ...prev.slice(0, -1), // bỏ temp user nếu cần, hoặc giữ tuỳ ý
          prev[prev.length - 1],
          {
            id: `err_${tempId}`,
            sender_type: "bot",
            message_type: "text",
            content: {
              text:
                "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau ít phút nhé! 💕",
            },
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }

      // 3) Nếu thành công:
      // Trường hợp agent bị tắt: không chờ bot, chỉ giữ tin khách
      if (data?.mode === "agent_disabled") {
        const cid =
          data?.meta?.conversation_id || data?.conversation_id || conversationId;
        if (cid && !conversationId) {
          setConversationId(cid);
        }
        // Load lại messages để đồng bộ nếu cần (nhưng sẽ không có bot auto)
        if (cid) {
          await loadMessages(cid);
        }
        setAgentEnabled(false);
        return;
      }

      // Trường hợp bình thường có conversation_id từ meta hoặc root
      const resolvedConvId =
        data?.meta?.conversation_id ||
        data?.conversation_id ||
        conversationId;

      if (resolvedConvId && !conversationId) {
        setConversationId(resolvedConvId);
        await loadMessages(resolvedConvId);
      } else if (resolvedConvId) {
        await loadMessages(resolvedConvId);
      } else {
        // fallback: tìm lại lịch sử từ session
        await loadConversationHistory(sessionId);
      }
    } catch (err) {
      console.error("Send message error:", err);
      // Với lỗi kết nối, cũng ghi đè bubble cuối thành lỗi mềm để tránh để lại state sai
      setMessages((prev) => {
        if (prev.length === 0) {
          return [
            {
              id: `err_${tempId}`,
              sender_type: "bot",
              message_type: "text",
              content: {
                text:
                  "Xin lỗi, có lỗi kết nối tạm thời. Vui lòng thử lại giúp em nhé! 💕",
              },
              created_at: new Date().toISOString(),
            },
          ];
        }
        const updated = [...prev];
        updated[updated.length - 1] = {
          id: `err_${tempId}`,
          sender_type: "bot",
          message_type: "text",
          content: {
            text:
              "Xin lỗi, có lỗi kết nối tạm thời. Vui lòng thử lại giúp em nhé! 💕",
          },
          created_at: new Date().toISOString(),
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }

  // Helper để lấy product URL
  function getProductUrl(content) {

    // Ưu tiên 1: Có product_slug hoặc slug
    if (content.product_slug) {
      return `/product/${content.product_slug}`;
    }
    if (content.slug) {
      return `/product/${content.slug}`;
    }

    // Ưu tiên 2: Parse slug từ product_link
    if (content.product_link) {
      try {
    
        // Xử lý cả URL đầy đủ và relative path
        let pathname;
        if (content.product_link.startsWith("http")) {
          const url = new URL(content.product_link);
          pathname = url.pathname;
        } else {
          pathname = content.product_link;
        }


        // Extract slug từ path: /products/abc-xyz-123 hoặc /product/abc-xyz-123
        const pathParts = pathname.split("/").filter((p) => p); // Remove empty strings

        // Lấy phần cuối cùng của path (là slug)
        const slug = pathParts[pathParts.length - 1];

        if (slug && slug !== "products" && slug !== "product") {
          return `/product/${slug}`;
        }
      } catch (e) {
        console.warn(
          "❌ Failed to parse product_link:",
          content.product_link,
          e
        );
      }
    }

    // Ưu tiên 3: Fallback về ID
    if (content.product_id) {
      return `/product/${content.product_id}`;
    }
    if (content.id) {
      return `/product/${content.id}`;
    }

    // Debug: Log nếu không tìm thấy
    console.error("❌ Cannot find product URL from content:", content);
    return null;
  }

  // Quick replies khi bắt đầu chat
  const quickReplies = [
    "👋 Xin chào",
    "🛍️ Xem sản phẩm mới",
    "📦 Kiểm tra đơn hàng",
    "❓ Chính sách đổi trả",
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
            isMinimized ? "w-80 h-14" : "w-96 h-[600px]"
          }`}
          style={{ maxHeight: "calc(100vh - 100px)" }}
        >
          {/* Header */}
              <div className="bg-gradient-to-r from-black to-gray-800 text-white p-4 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">BeWo</h3>
                <p className="text-xs text-white/70">Trực tuyến</p>
              </div>
            </div>
              <div className="flex items-center gap-3">
                {/* Toggle Agent per conversation */}
                <label className="flex items-center gap-1 text-[10px] bg-white/10 px-2 py-1 rounded-full cursor-pointer">
                  <span>Agent</span>
                  <input
                    type="checkbox"
                    className="accent-white"
                    checked={agentEnabled}
                    onChange={async (e) => {
                      const enabled = e.target.checked;
                      setAgentEnabled(enabled);
                      if (conversationId) {
                        try {
                          await setAgentStatus(conversationId, enabled);
                        } catch (err) {
                          console.error("Set agent status error:", err);
                        }
                      }
                    }}
                  />
                </label>

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
                    {messages.map((msg) => {
                      // Debug log
                      if (msg.message_type === "image") {
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender_type === "customer"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              msg.message_type === "product_card" ||
                              msg.message_type === "image"
                                ? "max-w-[90%]" // Rộng hơn cho product/image
                                : "max-w-[75%]" // Nhỏ hơn cho text
                            } ${
                              msg.sender_type === "customer"
                                ? "bg-black text-white rounded-br-none"
                                : msg.sender_type === "bot"
                                ? "bg-white text-gray-900 shadow-sm border rounded-bl-none"
                                : "bg-blue-100 text-blue-900 rounded-bl-none"
                            }`}
                          >
                            {/* Text message */}
                            {msg.content.text && (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.content.text}
                              </p>
                            )}

                            {/* ⭐ Hiển thị ảnh đơn nếu có */}
                            {msg.message_type === "image" &&
                              msg.content.image_url && (
                                <div className="mt-3">
                                  <img
                                    src={msg.content.image_url}
                                    alt={msg.content.product_name || "Product"}
                                    className="rounded-lg w-full h-auto shadow-md"
                                    style={{
                                      maxHeight: "250px",
                                      objectFit: "cover",
                                    }}
                                  />
                                  {msg.content.product_name && (
                                    <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                                      <p className="font-semibold text-gray-900">
                                        {msg.content.product_name}
                                      </p>
                                      {msg.content.product_price && (
                                        <p className="text-red-600 font-bold mt-1">
                                          {formatPrice(
                                            msg.content.product_price
                                          )}
                                        </p>
                                      )}
                                      {getProductUrl(msg.content) ? (
                                        <a
                                          href={getProductUrl(msg.content)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-block w-full text-center mt-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                                        >
                                          Xem chi tiết →
                                        </a>
                                      ) : (
                                        <p className="text-xs text-gray-400 mt-2 text-center">
                                          (Không có link sản phẩm)
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                            {/* ⭐ Hiển thị product cards nếu có */}
                            {msg.message_type === "product_card" &&
                              msg.content.products &&
                              msg.content.products.length > 0 && (
                                <div className="mt-3 space-y-3">
                                  {msg.content.products.map((product, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition"
                                    >
                                      {/* Product Image */}
                                      {product.images &&
                                        product.images.length > 0 && (
                                          <img
                                            src={
                                              product.images.find(
                                                (img) => img.is_primary
                                              )?.image_url ||
                                              product.images[0].image_url
                                            }
                                            alt={product.name}
                                            className="w-full h-48 object-cover"
                                          />
                                        )}

                                      {/* Product Info */}
                                      <div className="p-3">
                                        <h4 className="font-semibold text-sm mb-1 line-clamp-2 text-gray-900">
                                          {product.name}
                                        </h4>
                                        <p className="text-red-600 font-bold text-base mb-2">
                                          {formatPrice(product.price)}
                                        </p>
                                        {product.stock !== undefined && (
                                          <p className="text-xs text-gray-500 mb-2">
                                            {product.stock > 0
                                              ? `Còn ${product.stock} sản phẩm`
                                              : "Hết hàng"}
                                          </p>
                                        )}
                                        {product.description && (
                                          <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                                            {product.description}
                                          </p>
                                        )}
                                        <a
                                          href={`/product/${product.slug}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-block w-full text-center px-4 py-2 bg-black text-white text-xs rounded-lg hover:bg-gray-800 transition"
                                        >
                                          Xem chi tiết →
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                            {/* Timestamp */}
                            <p
                              className={`text-xs mt-2 ${
                                msg.sender_type === "customer"
                                  ? "text-white/70"
                                  : "text-gray-500"
                              }`}
                            >
                              {msg.sender_type === "bot" && "🤖 "}
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Loading indicator */}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                            <span className="text-xs text-gray-500">
                              Đang trả lời...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={sendMessage}
                className="p-4 bg-white border-t rounded-b-2xl"
              >
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
                  {user
                    ? `Đang chat với tư cách: ${user.email}`
                    : "Đang chat dưới dạng khách"}
                </p>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
