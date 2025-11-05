import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Edit2, Trash2, Plus, Save, X, Eye, EyeOff, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_image: '',
    display_order: 0,
    is_active: true
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_feedbacks')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Không thể tải danh sách feedback');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `feedbacks/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const deleteImage = async (imageUrl) => {
    try {
      const path = imageUrl.split('/images/')[1];
      if (path) {
        await supabase.storage.from('images').remove([path]);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ảnh phải nhỏ hơn 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = formData.customer_image;

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        
        // Delete old image if updating
        if (editingFeedback && editingFeedback.customer_image) {
          await deleteImage(editingFeedback.customer_image);
        }
      }

      const feedbackData = {
        customer_name: formData.customer_name,
        customer_image: imageUrl,
        display_order: formData.display_order,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      if (editingFeedback) {
        // Update existing feedback
        const { error } = await supabase
          .from('customer_feedbacks')
          .update(feedbackData)
          .eq('id', editingFeedback.id);

        if (error) throw error;
        toast.success('Cập nhật feedback thành công!');
      } else {
        // Create new feedback
        const { error } = await supabase
          .from('customer_feedbacks')
          .insert([feedbackData]);

        if (error) throw error;
        toast.success('Thêm feedback thành công!');
      }

      handleCloseModal();
      fetchFeedbacks();
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Có lỗi xảy ra khi lưu feedback');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, imageUrl) => {
    if (!window.confirm('Bạn có chắc muốn xóa feedback này?')) return;

    try {
      // Delete image
      if (imageUrl) {
        await deleteImage(imageUrl);
      }

      const { error } = await supabase
        .from('customer_feedbacks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Xóa feedback thành công!');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Có lỗi xảy ra khi xóa feedback');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('customer_feedbacks')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success('Cập nhật trạng thái thành công!');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleOpenModal = (feedback = null) => {
    if (feedback) {
      setEditingFeedback(feedback);
      setFormData({
        customer_name: feedback.customer_name || '',
        customer_image: feedback.customer_image || '',
        display_order: feedback.display_order || 0,
        is_active: feedback.is_active ?? true
      });
      setImagePreview(feedback.customer_image || '');
    } else {
      setEditingFeedback(null);
      setFormData({
        customer_name: '',
        customer_image: '',
        display_order: 0,
        is_active: true
      });
      setImagePreview('');
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFeedback(null);
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Quản lý Feedback Khách hàng</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800"
        >
          <Plus size={20} />
          Thêm Feedback
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Chưa có feedback nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden ${
                !feedback.is_active ? 'opacity-50' : ''
              }`}
            >
              {/* Image */}
              <div className="relative h-64 bg-gray-100">
                <img
                  src={feedback.customer_image}
                  alt={feedback.customer_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4">
                {/* Customer Name */}
                <h3 className="font-semibold text-lg mb-2">{feedback.customer_name}</h3>

                {/* Display Order Badge */}
                <div className="mb-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Thứ tự: {feedback.display_order}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(feedback.id, feedback.is_active)}
                    className={`flex-1 py-2 rounded flex items-center justify-center gap-1 text-sm ${
                      feedback.is_active
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    title={feedback.is_active ? 'Ẩn' : 'Hiện'}
                  >
                    {feedback.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => handleOpenModal(feedback)}
                    className="flex-1 bg-blue-100 text-blue-700 py-2 rounded flex items-center justify-center gap-1 hover:bg-blue-200 text-sm"
                    title="Sửa"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(feedback.id, feedback.customer_image)}
                    className="flex-1 bg-red-100 text-red-700 py-2 rounded flex items-center justify-center gap-1 hover:bg-red-200 text-sm"
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {editingFeedback ? 'Chỉnh sửa Feedback' : 'Thêm Feedback mới'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  placeholder="Nhập tên khách hàng"
                />
              </div>

              {/* Customer Image */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ảnh khách hàng <span className="text-red-500">*</span>
                </label>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Upload Button */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-black transition-colors"
                  >
                    <Upload size={20} />
                    <span>{imagePreview ? 'Thay đổi ảnh' : 'Chọn ảnh'}</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Tối đa 5MB</p>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium mb-1">Thứ tự hiển thị</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                />
              </div>

              {/* Is Active Checkbox */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Hiển thị trên trang chủ</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                  disabled={uploading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2"
                  disabled={uploading || !formData.customer_name || (!imageFile && !formData.customer_image)}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      {editingFeedback ? 'Cập nhật' : 'Thêm mới'}
                    </>
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

export default FeedbackManagement;