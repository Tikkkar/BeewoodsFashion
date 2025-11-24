// src/pages/admin/AdminFeedbacks.jsx
import React, { useState, useEffect } from 'react';
import { Star, Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ImageUpload from '../../components/admin/ImageUpload';

const AdminFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_image: '',
    rating_average: 5,
    total_responses: 1,
    display_order: 0,
    is_active: true,
  });

  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_feedbacks')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      alert('Có lỗi khi tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesChange = (files) => {
    setSelectedFiles(files);
  };

  const handleRemoveExisting = (imageUrl) => {
    setFormData({ ...formData, customer_image: '' });
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `feedbacks/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_name) {
      alert('Vui lòng nhập tên khách hàng!');
      return;
    }

    try {
      setSaving(true);

      let imageUrl = formData.customer_image;

      // Upload new image if selected
      if (selectedFiles.length > 0) {
        imageUrl = await uploadImage(selectedFiles[0]);
      }

      if (!imageUrl) {
        alert('Vui lòng chọn ảnh khách hàng!');
        return;
      }

      const dataToSave = {
        ...formData,
        customer_image: imageUrl,
      };

      if (editingFeedback) {
        // Update
        const { error } = await supabase
          .from('customer_feedbacks')
          .update(dataToSave)
          .eq('id', editingFeedback.id);

        if (error) throw error;
        alert('Cập nhật feedback thành công!');
      } else {
        // Create
        const { error } = await supabase
          .from('customer_feedbacks')
          .insert([dataToSave]);

        if (error) throw error;
        alert('Thêm feedback thành công!');
      }

      closeModal();
      loadFeedbacks();
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Có lỗi khi lưu feedback: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (feedback) => {
    setEditingFeedback(feedback);
    setFormData({
      customer_name: feedback.customer_name,
      customer_image: feedback.customer_image,
      rating_average: feedback.rating_average || 5,
      total_responses: feedback.total_responses || 1,
      display_order: feedback.display_order || 0,
      is_active: feedback.is_active ?? true,
    });
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa feedback này?')) return;

    try {
      const { error } = await supabase
        .from('customer_feedbacks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Xóa feedback thành công!');
      loadFeedbacks();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Có lỗi khi xóa feedback!');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFeedback(null);
    setFormData({
      customer_name: '',
      customer_image: '',
      rating_average: 5,
      total_responses: 1,
      display_order: 0,
      is_active: true,
    });
    setSelectedFiles([]);
  };

  const openAddModal = () => {
    closeModal();
    setIsModalOpen(true);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Feedback Khách hàng</h1>
          <p className="text-gray-600 mt-1">Quản lý ảnh và phản hồi khách hàng hiển thị trên trang chủ</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          <Plus size={20} />
          Thêm Feedback
        </button>
      </div>

      {/* Feedbacks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {feedbacks.map((feedback) => (
          <div
            key={feedback.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition group"
          >
            {/* Image */}
            <div className="aspect-square bg-gray-100 relative">
              <img
                src={feedback.customer_image}
                alt={feedback.customer_name}
                className="w-full h-full object-cover"
              />
              {!feedback.is_active && (
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                  Ẩn
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{feedback.customer_name}</h3>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">{renderStars(feedback.rating_average)}</div>
                <span className="text-sm text-gray-600">{feedback.rating_average}</span>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {feedback.total_responses} phản hồi • Thứ tự: {feedback.display_order}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(feedback)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                >
                  <Edit2 size={16} />
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(feedback.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                >
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {feedbacks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">Chưa có feedback nào</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            <Plus size={20} />
            Thêm Feedback Đầu Tiên
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingFeedback ? 'Sửa Feedback' : 'Thêm Feedback Mới'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tên khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ảnh khách hàng <span className="text-red-500">*</span>
                </label>
                <ImageUpload
                  existingImages={formData.customer_image ? [formData.customer_image] : []}
                  onFilesChange={handleFilesChange}
                  onRemoveExisting={handleRemoveExisting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Khuyến nghị: Ảnh vuông, tối thiểu 500x500px
                </p>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Đánh giá trung bình
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.rating_average}
                    onChange={(e) => setFormData({ ...formData, rating_average: parseFloat(e.target.value) })}
                    className="w-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <div className="flex">{renderStars(formData.rating_average)}</div>
                </div>
              </div>

              {/* Total Responses */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Số lượng phản hồi
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.total_responses}
                  onChange={(e) => setFormData({ ...formData, total_responses: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Số nhỏ hơn sẽ hiển thị trước
                </p>
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Hiển thị trên trang chủ
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Đang lưu...
                    </span>
                  ) : (
                    editingFeedback ? 'Cập nhật' : 'Thêm mới'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbacks;