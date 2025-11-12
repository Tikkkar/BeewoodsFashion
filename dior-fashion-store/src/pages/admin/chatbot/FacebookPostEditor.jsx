import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  Loader2,
  Save,
  X,
  Hash,
  Image as ImageIcon,
  Type,
  Info,
} from "lucide-react";

/**
 * FacebookPostEditor
 * Mục tiêu:
 * - Cho phép admin xem & chỉnh sửa chi tiết 1 bản ghi facebook_posts
 * - Thấy đầy đủ thông tin: caption, hashtags, ảnh, link, trạng thái, metadata AI...
 * - Dùng form đơn giản, dễ tích hợp, không phụ thuộc rich text editor nặng
 *
 * Props:
 * - post: bản ghi facebook_posts (hoặc null)
 * - onClose: đóng modal
 * - onSaved: callback sau khi lưu (reload list)
 */
const FacebookPostEditor = ({ post, onClose, onSaved }) => {
  const [caption, setCaption] = useState(post?.caption || "");
  const [imageUrls, setImageUrls] = useState(
    Array.isArray(post?.image_urls) ? post.image_urls.join("\n") : ""
  );
  const [productUrl, setProductUrl] = useState(post?.product_url || "");
  const [postTone, setPostTone] = useState(post?.post_tone || "friendly");
  const [status, setStatus] = useState(post?.status || "pending");
  const [scheduledAt, setScheduledAt] = useState(
    post?.scheduled_at
      ? new Date(post.scheduled_at).toISOString().slice(0, 16)
      : ""
  );
  const [aiMetadata, setAiMetadata] = useState(
    post?.ai_metadata || post?.fb_response || {}
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (post) {
      setCaption(post.caption || "");
      setImageUrls(
        Array.isArray(post.image_urls) ? post.image_urls.join("\n") : ""
      );
      setProductUrl(post.product_url || "");
      setPostTone(post.post_tone || "friendly");
      setStatus(post.status || "pending");
      setScheduledAt(
        post.scheduled_at
          ? new Date(post.scheduled_at).toISOString().slice(0, 16)
          : ""
      );
      setAiMetadata(post.ai_metadata || post.fb_response || {});
    }
  }, [post]);

  if (!post) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const images = imageUrls
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const updates = {
        caption,
        image_urls: images,
        product_url: productUrl || null,
        post_tone: postTone,
        status,
        scheduled_at: scheduledAt
          ? new Date(scheduledAt).toISOString()
          : post.scheduled_at,
      };

      const { error: err } = await supabase
        .from("facebook_posts")
        .update(updates)
        .eq("id", post.id);

      if (err) throw err;

      if (onSaved) onSaved();
      onClose();
    } catch (e) {
      console.error("Error updating facebook_post:", e);
      setError(e.message || "Không thể lưu thay đổi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              Chỉnh sửa bài auto-post Facebook
            </h2>
            <p className="text-xs text-gray-500">
              ID: {String(post.id).slice(0, 8)} • Loại: {post.post_type} •
              Trigger: {post.triggered_by}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Caption */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
              <Type className="w-3 h-3" />
              Caption hiển thị trên Facebook
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/70 focus:border-black outline-none resize-y min-h-[100px]"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Nhập caption..."
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>Độ dài: {caption.length} ký tự</span>
              <span>
                Gợi ý: 80-150 ký tự phần đầu, có CTA & emoji phù hợp thị trường
                VN.
              </span>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
              <ImageIcon className="w-3 h-3" />
              Ảnh bài viết (mỗi dòng 1 URL)
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-xs focus:ring-2 focus:ring-black/70 focus:border-black outline-none resize-y min-h-[70px]"
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
            />
            {Array.isArray(post.image_urls) && post.image_urls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {post.image_urls.slice(0, 3).map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="w-12 h-12 object-cover rounded border"
                  />
                ))}
                {post.image_urls.length > 3 && (
                  <span className="text-[10px] text-gray-500">
                    +{post.image_urls.length - 3} ảnh nữa
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Link + Tone + Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Link sản phẩm / Landing page
              </label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-black/70 focus:border-black outline-none"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="/product/slug-hoac-full-url"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Tone nội dung
              </label>
              <select
                className="w-full border rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-black/70 focus:border-black outline-none"
                value={postTone}
                onChange={(e) => setPostTone(e.target.value)}
              >
                <option value="friendly">Thân thiện</option>
                <option value="professional">Chuyên nghiệp</option>
                <option value="enthusiastic">Nhiệt huyết</option>
                <option value="luxury">Sang trọng</option>
                <option value="casual">Tự nhiên</option>
                <option value="urgent">Khẩn cấp / FOMO</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Trạng thái
              </label>
              <select
                className="w-full border rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-black/70 focus:border-black outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="posting">Posting</option>
                <option value="posted">Posted</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">
              Lịch đăng (Scheduled At)
            </label>
            <input
              type="datetime-local"
              className="w-full md:w-1/2 border rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-black/70 focus:border-black outline-none"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Để trống để giữ nguyên. Edge Function sẽ chỉ đăng các bài
              pending/scheduled có scheduled_at nhỏ hơn hoặc bằng thời điểm chạy.
            </p>
          </div>

          {/* AI Metadata / Debug */}
          {aiMetadata && Object.keys(aiMetadata).length > 0 && (
            <div className="border rounded-md px-3 py-2 bg-gray-50">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1">
                <Info className="w-3 h-3" />
                Thông tin AI / Facebook Response (read-only)
              </div>
              <pre className="text-[9px] text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {JSON.stringify(aiMetadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
          <div className="text-[10px] text-gray-500 flex items-center gap-1">
            <Hash className="w-3 h-3" />
            ID đầy đủ: {post.id}
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <span className="text-[10px] text-red-500 mr-2">
                {error}
              </span>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
              disabled={saving}
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-xs rounded-md bg-black text-white hover:bg-gray-900 flex items-center gap-1 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookPostEditor;
