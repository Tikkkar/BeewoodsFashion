import React, { useState, useEffect } from 'react';
import {
  History,
  Eye,
  Trash2,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "../../lib/supabase";

const FacebookPostsHistory = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, posted, failed

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('facebook_posts')
        .select(`
          *,
          products (
            name,
            slug,
            price,
            brand_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      alert('❌ Lỗi khi tải bài đăng: ' + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Xóa bài đăng này?')) return;

    try {
      const { error } = await supabase
        .from('facebook_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      alert('✅ Đã xóa bài đăng!');
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('❌ Lỗi khi xóa: ' + (error?.message || error));
    }
  };

  const handleRetry = async (postId) => {
    try {
      // Call edge function to retry this post
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/facebook-auto-poster`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: "RETRY_FAILED_POST",
            payload: { post_id: postId },
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        alert('✅ Đã retry bài đăng!');
        loadPosts();
      } else {
        alert('❌ Lỗi: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error retrying:', error);
      alert('❌ Lỗi khi retry: ' + (error?.message || error));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Đang chờ' },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Đã lên lịch' },
      posting: { color: 'bg-purple-100 text-purple-800', icon: Loader2, text: 'Đang đăng' },
      posted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Đã đăng' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Thất bại' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, text: 'Đã hủy' },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <History className="w-8 h-8 text-blue-600" />
            Lịch sử đăng Facebook
          </h1>
          <p className="text-gray-600 mt-2">
            Xem và quản lý các bài đăng tự động
          </p>
        </div>

        <button
          onClick={loadPosts}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow mb-6">
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'pending', label: 'Đang chờ' },
            { value: 'posted', label: 'Đã đăng' },
            { value: 'failed', label: 'Thất bại' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center shadow">
          <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Chưa có bài đăng nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg p-6 shadow hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {post.products?.name || post.product_name || 'Sản phẩm'}
                    </h3>
                    {getStatusBadge(post.status)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Loại:</span> {post.post_type} • 
                    <span className="font-medium"> Tone:</span> {post.post_tone} • 
                    <span className="font-medium"> Trigger:</span> {post.triggered_by}
                  </p>

                  <p className="text-sm text-gray-500">
                    Tạo lúc: {post.created_at ? new Date(post.created_at).toLocaleString('vi-VN') : '—'}
                    {post.posted_at && (
                      <> • Đăng lúc: {new Date(post.posted_at).toLocaleString('vi-VN')}</>
                    )}
                  </p>
                </div>

                <div className="flex gap-2">
                  {post.fb_post_id && (
                    <a
                      href={`https://facebook.com/${post.fb_post_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Xem trên Facebook"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}

                  {post.status === 'failed' && (
                    <button
                      onClick={() => handleRetry(post.id)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                      title="Thử lại"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  )}

                  {['pending', 'failed', 'cancelled'].includes(post.status) && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Xóa"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Caption Preview */}
              {post.caption && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                    {post.caption}
                  </p>
                </div>
              )}

              {/* Images */}
              {post.image_urls && post.image_urls.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {post.image_urls.slice(0, 4).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Image ${i + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ))}
                  {post.image_urls.length > 4 && (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-sm font-medium">
                      +{post.image_urls.length - 4}
                    </div>
                  )}
                </div>
              )}

              {/* Engagement Metrics (if posted) */}
              {post.status === 'posted' && post.engagement_metrics && (
                <div className="flex gap-6 text-sm text-gray-600 border-t pt-4">
                  <div>👍 {post.engagement_metrics.likes || 0} likes</div>
                  <div>💬 {post.engagement_metrics.comments || 0} comments</div>
                  <div>🔄 {post.engagement_metrics.shares || 0} shares</div>
                  {post.engagement_metrics.reach > 0 && (
                    <div>👁️ {post.engagement_metrics.reach} reach</div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {post.status === 'failed' && post.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <strong>Lỗi:</strong> {post.error_message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacebookPostsHistory;
