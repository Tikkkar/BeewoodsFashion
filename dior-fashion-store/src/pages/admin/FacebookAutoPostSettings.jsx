import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, TestTube, History, Sparkles, 
  Clock, Hash, Image, Loader2, CheckCircle, XCircle,
  AlertCircle, RefreshCw
} from 'lucide-react';
import { supabase,SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/supabase';

/**
 * FacebookAutoPostSettings
 * Trang quản trị cấu hình auto-post Facebook
 */
const FacebookAutoPostSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState({
    auto_post_enabled: false,
    auto_post_on_seo_update: true,
    auto_post_on_new_product: true,
    auto_post_delay_minutes: 5,
    post_tone: 'friendly',
    custom_hashtags: [],
    include_category_hashtags: true,
    include_brand_hashtags: true,
    max_images: 10,
    preferred_post_times: ['09:00', '12:00', '18:00', '20:00'],
    max_posts_per_day: 10,
    min_interval_minutes: 60,
  });

  const [stats, setStats] = useState({
    total_posts: 0,
    pending: 0,
    posted: 0,
    failed: 0,
  });

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chatbot_facebook_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setConfig({
          auto_post_enabled: data.auto_post_enabled ?? false,
          auto_post_on_seo_update: data.auto_post_on_seo_update ?? true,
          auto_post_on_new_product: data.auto_post_on_new_product ?? true,
          auto_post_delay_minutes: data.auto_post_delay_minutes ?? 5,
          post_tone: data.post_tone ?? 'friendly',
          custom_hashtags: data.custom_hashtags ?? [],
          include_category_hashtags: data.include_category_hashtags ?? true,
          include_brand_hashtags: data.include_brand_hashtags ?? true,
          max_images: data.max_images ?? 10,
          preferred_post_times: data.preferred_post_times ?? ['09:00', '12:00', '18:00', '20:00'],
          max_posts_per_day: data.max_posts_per_day ?? 10,
          min_interval_minutes: data.min_interval_minutes ?? 60,
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
      alert('❌ Lỗi khi tải cấu hình: ' + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('facebook_posts')
        .select('status');

      if (error) throw error;

      const posts = data ?? [];
      const statsData = {
        total_posts: posts.length,
        pending: posts.filter(p => p.status === 'pending').length,
        posted: posts.filter(p => p.status === 'posted').length,
        failed: posts.filter(p => p.status === 'failed').length,
      };

      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('chatbot_facebook_settings')
        .update({
          auto_post_enabled: config.auto_post_enabled,
          auto_post_on_seo_update: config.auto_post_on_seo_update,
          auto_post_on_new_product: config.auto_post_on_new_product,
          auto_post_delay_minutes: config.auto_post_delay_minutes,
          post_tone: config.post_tone,
          custom_hashtags: config.custom_hashtags,
          include_category_hashtags: config.include_category_hashtags,
          include_brand_hashtags: config.include_brand_hashtags,
          max_images: config.max_images,
          preferred_post_times: config.preferred_post_times,
          max_posts_per_day: config.max_posts_per_day,
          min_interval_minutes: config.min_interval_minutes,
          updated_at: new Date().toISOString(),
        })
        .eq('is_connected', true)
        .single();

      if (error) throw error;

      alert('✅ Đã lưu cấu hình thành công!');
      loadStats();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('❌ Lỗi khi lưu: ' + (error?.message || error));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/facebook-auto-poster`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'PROCESS_PENDING_POSTS',
            payload: {},
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(`✅ Đã xử lý ${result.processed} bài đăng!`);
        loadStats();
      } else {
        alert('❌ Lỗi: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error testing:', error);
      alert('❌ Lỗi khi test: ' + (error?.message || error));
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            Tự động đăng Facebook
          </h1>
          <p className="text-gray-600 mt-2">
            Cấu hình hệ thống tự động đăng bài lên Facebook Page khi cập nhật sản phẩm
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={testing || !config.auto_post_enabled}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang test...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4" />
                Test ngay
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu cấu hình
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng bài đăng</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_posts}</p>
            </div>
            <History className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đang chờ</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đã đăng</p>
              <p className="text-3xl font-bold text-green-600">{stats.posted}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Thất bại</p>
              <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Bật tính năng tự động đăng
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Khi bật, hệ thống sẽ tự động tạo và đăng bài lên Facebook
                </p>
              </div>
              <button
                onClick={() => setConfig({ ...config, auto_post_enabled: !config.auto_post_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.auto_post_enabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-pressed={config.auto_post_enabled}
                aria-label="Toggle auto post"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    config.auto_post_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Khi nào tự động đăng?
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.auto_post_on_seo_update}
                  onChange={(e) => setConfig({ ...config, auto_post_on_seo_update: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-gray-900 font-medium">
                    Khi cập nhật SEO Title hoặc Description
                  </span>
                  <p className="text-sm text-gray-600">
                    Tự động đăng khi admin chỉnh sửa SEO metadata trong SEO Editor
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.auto_post_on_new_product}
                  onChange={(e) => setConfig({ ...config, auto_post_on_new_product: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-gray-900 font-medium">
                    Khi thêm sản phẩm mới
                  </span>
                  <p className="text-sm text-gray-600">
                    Tự động đăng khi có sản phẩm mới được thêm vào hệ thống
                  </p>
                </div>
              </label>

              <div className="mt-4 pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delay trước khi đăng (phút)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={config.auto_post_delay_minutes}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setConfig({ ...config, auto_post_delay_minutes: Number.isFinite(v) ? v : 0 });
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Thời gian chờ trước khi đăng bài (cho admin review nếu cần)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <Sparkles className="w-5 h-5 inline mr-2" />
              Tone giọng văn
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'professional', label: 'Chuyên nghiệp', icon: '💼' },
                { value: 'friendly', label: 'Thân thiện', icon: '😊' },
                { value: 'enthusiastic', label: 'Nhiệt tình', icon: '🎉' },
                { value: 'luxury', label: 'Cao cấp', icon: '💎' },
                { value: 'casual', label: 'Thoải mái', icon: '😎' },
                { value: 'urgent', label: 'Khẩn cấp', icon: '⚡' },
              ].map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => setConfig({ ...config, post_tone: tone.value })}
                  className={`p-4 rounded-lg border-2 transition ${
                    config.post_tone === tone.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{tone.icon}</div>
                  <div className="font-medium text-gray-900">{tone.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <Hash className="w-5 h-5 inline mr-2" />
              Hashtags
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.include_category_hashtags}
                  onChange={(e) => setConfig({ ...config, include_category_hashtags: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-gray-900">
                  Tự động thêm hashtag từ category sản phẩm
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.include_brand_hashtags}
                  onChange={(e) => setConfig({ ...config, include_brand_hashtags: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-gray-900">
                  Tự động thêm hashtag từ thương hiệu
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Hashtags (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={config.custom_hashtags.join(', ')}
                  onChange={(e) => setConfig({
                    ...config,
                    custom_hashtags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                  })}
                  placeholder="BEWOFashion, thờitrang, sale"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Ví dụ: BEWOFashion, thờitrang, shopping, sale
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <Image className="w-5 h-5 inline mr-2" />
              Ảnh và Giới hạn
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng ảnh tối đa mỗi bài (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={config.max_images}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setConfig({ ...config, max_images: Number.isFinite(v) ? v : 1 });
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Facebook cho phép tối đa 10 ảnh mỗi bài đăng
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số bài đăng tối đa mỗi ngày
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={config.max_posts_per_day}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setConfig({ ...config, max_posts_per_day: Number.isFinite(v) ? v : 1 });
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khoảng cách tối thiểu giữa các bài (phút)
                </label>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={config.min_interval_minutes}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setConfig({ ...config, min_interval_minutes: Number.isFinite(v) ? v : 60 });
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Tránh spam Facebook, nên để ít nhất 60 phút
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              {config.auto_post_enabled ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
              <h3 className="text-lg font-bold text-gray-900">Trạng thái</h3>
            </div>

            {config.auto_post_enabled ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-medium">Đang hoạt động</span>
                </div>
                <p className="text-sm text-gray-700">
                  Hệ thống sẽ tự động đăng bài khi có trigger
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-yellow-700">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="font-medium">Đã tắt</span>
                </div>
                <p className="text-sm text-gray-700">
                  Bật tính năng để sử dụng auto-post
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thao tác nhanh
            </h3>

            <div className="space-y-2">
              <a
                href="/admin/facebook-posts"
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <History className="w-4 h-4" />
                Xem lịch sử đăng bài
              </a>

              <button
                onClick={loadStats}
                className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                Làm mới thống kê
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">
              💡 Mẹo sử dụng
            </h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• Kiểm tra bài đăng trong 5 phút delay để đảm bảo chất lượng</li>
              <li>• Dùng tone friendly cho engagement tốt nhất</li>
              <li>• Giới hạn 8-12 bài mỗi ngày để tránh spam</li>
              <li>• Hashtag mix 50% generic + 50% niche</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookAutoPostSettings;
