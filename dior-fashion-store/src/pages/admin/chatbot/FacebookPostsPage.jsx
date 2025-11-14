import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Loader2, RotateCcw, XCircle, PlayCircle, RefreshCw, Edit3, Send } from "lucide-react";
import FacebookPostEditor from "./FacebookPostEditor";

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  scheduled: "bg-blue-100 text-blue-800",
  posting: "bg-purple-100 text-purple-800",
  posted: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-600",
};

const statusBadge = (status) => {
  const cls = STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  return (
    <span
      className={
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold " +
        cls
      }
    >
      {status}
    </span>
  );
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
};

const FacebookPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [postingNow, setPostingNow] = useState({}); // Track individual post posting status
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase
        .from("facebook_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (err) throw err;
      setPosts(data || []);
    } catch (e) {
      console.error("Error loading facebook_posts:", e);
      setError("Không tải được danh sách bài auto-post.");
    } finally {
      setLoading(false);
    }
  };

  const callAutoPoster = async (action, payload = {}, showLoading = true, postId = null) => {
    try {
      if (showLoading) {
        if (postId) {
          setPostingNow(prev => ({ ...prev, [postId]: true }));
        } else {
          setRunning(true);
        }
      }
      setError("");

      // Gọi Edge Function thông qua URL Supabase từ client config (supabase.js),
      // không phụ thuộc import.meta.env phía browser để tránh lỗi undefined.
      const supabaseUrl =
        supabase?.supabaseUrl || supabase?.url || supabase?.restUrl;
      const supabaseKey =
        supabase?.supabaseKey || supabase?.anonKey || supabase?.key;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          "Không xác định được SUPABASE_URL hoặc anon key từ client. Kiểm tra cấu hình supabase.js."
        );
      }

      const functionUrl = `${supabaseUrl}/functions/v1`;

      const res = await fetch(`${functionUrl}/facebook-auto-poster`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ action, payload }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || `Action ${action} thất bại`);
      }

      await fetchPosts();
      
      // Show success message for post now action
      if (action === "POST_NOW") {
        // You can add a toast notification here if you have one
        console.log("✅ Đã đăng bài thành công!");
      }
    } catch (e) {
      console.error(`Error calling ${action}:`, e);
      setError(e.message || `Lỗi khi gọi ${action}`);
    } finally {
      if (showLoading) {
        if (postId) {
          setPostingNow(prev => {
            const newState = { ...prev };
            delete newState[postId];
            return newState;
          });
        } else {
          setRunning(false);
        }
      }
    }
  };

  const handleRunQueue = () =>
    callAutoPoster("PROCESS_PENDING_POSTS", {}, true);

  const handleRetry = (id) =>
    callAutoPoster("RETRY_FAILED_POST", { post_id: id }, false);

  const handleCancel = (id) =>
    callAutoPoster("CANCEL_POST", { post_id: id }, false);

  const handlePostNow = (id) => {
    if (window.confirm("Đăng bài này lên Facebook ngay bây giờ?")) {
      // Gọi Edge Function với action POST_NOW đã được implement trong backend
      callAutoPoster("POST_NOW", { post_id: id }, true, id);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Facebook Auto-Post Queue</h1>
          <p className="text-gray-600 text-sm">
            Theo dõi và điều khiển các bài viết Facebook được tạo tự động từ dữ
            liệu sản phẩm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPosts}
            disabled={loading || running}
            className="inline-flex items-center px-3 py-2 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Làm mới
          </button>
          <button
            onClick={handleRunQueue}
            disabled={running}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {running ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-1" />
            )}
            Chạy xử lý hàng đợi
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
            <span className="ml-2 text-gray-600 text-sm">
              Đang tải danh sách bài viết...
            </span>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm">
            Chưa có bản ghi nào trong hàng đợi facebook_posts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">
                    Loại
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">
                    Sản phẩm
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">
                    Page ID
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">
                    Lịch đăng
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">
                    Đăng lúc
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((p) => {
                  const isPostingNow = postingNow[p.id];
                  const canPostNow = ["pending", "scheduled", "failed", "draft"].includes(p.status);

                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-[10px]">
                        {String(p.id).slice(0, 8)}...
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold">{p.post_type || "-"}</div>
                        <div className="text-[10px] text-gray-500">
                          {p.triggered_by || ""}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {statusBadge(p.status)}
                        {p.retry_count > 0 && (
                          <div className="text-[9px] text-gray-500 mt-0.5">
                            retry: {p.retry_count}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[10px]">
                        {p.auto_post
                          ? <span className="inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Auto</span>
                          : <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Thủ công</span>
                        }
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-[11px] font-semibold">
                          {p.product_name || "-"}
                        </div>
                        <div className="text-[9px] text-gray-500">
                          {p.product_slug || ""}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[10px] text-gray-600">
                        {p.fb_page_id || "-"}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-gray-600">
                        {formatDateTime(p.scheduled_at)}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-gray-600">
                        {formatDateTime(p.posted_at)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            onClick={() => setSelectedPost(p)}
                            className="inline-flex items-center px-2 py-1 text-[9px] bg-gray-900 text-white rounded hover:bg-black"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Sửa
                          </button>

                          {canPostNow && (
                            <button
                              onClick={() => handlePostNow(p.id)}
                              disabled={isPostingNow}
                              className="inline-flex items-center px-2 py-1 text-[9px] bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isPostingNow ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Đang đăng...
                                </>
                              ) : (
                                <>
                                  <Send className="w-3 h-3 mr-1" />
                                  Đăng ngay
                                </>
                              )}
                            </button>
                          )}

                          {p.status === "failed" && (
                            <button
                              onClick={() => handleRetry(p.id)}
                              className="inline-flex items-center px-2 py-1 text-[9px] bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Retry
                            </button>
                          )}

                          {["pending", "scheduled", "failed"].includes(
                            p.status
                          ) && (
                            <button
                              onClick={() => handleCancel(p.id)}
                              className="inline-flex items-center px-2 py-1 text-[9px] bg-red-50 text-red-700 rounded hover:bg-red-100"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Hủy
                            </button>
                          )}
                        </div>
                        {p.error_message && (
                          <div className="mt-1 text-[8px] text-red-500 max-w-[180px] truncate">
                            {p.error_message}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-500">
        Lưu ý: Chức năng này phụ thuộc vào Edge Function "facebook-auto-poster"
        và bảng "facebook_posts" + "chatbot_facebook_settings". Đảm bảo đã cấu
        hình Page Access Token và auto_post_enabled cho từng tenant.
      </p>

      {selectedPost && (
        <FacebookPostEditor
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onSaved={fetchPosts}
        />
      )}
    </div>
  );
};

export default FacebookPostsPage;
