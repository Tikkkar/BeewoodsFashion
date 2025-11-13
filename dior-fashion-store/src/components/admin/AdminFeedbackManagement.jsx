import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Edit2, Trash2, Plus, Save, X, Eye, EyeOff, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminFeedbackManagement = () => {
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
    checkStorageBucket();
  }, []);

  // Check if storage bucket exists
  const checkStorageBucket = async () => {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      console.log('Available buckets:', data);
      
      if (error) {
        console.error('Error listing buckets:', error);
        toast.error('Lỗi kiểm tra storage bucket');
        return;
      }

      const imagesBucket = data.find(bucket => bucket.name === 'images');
      if (!imagesBucket) {
        console.error('Bucket "images" not found!');
        toast.error('Bucket "images" chưa được tạo trong Supabase Storage');
      } else {
        console.log('Bucket "images" exists:', imagesBucket);
      }
    } catch (error) {
      console.error('Error checking storage:', error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      console.log('Fetching feedbacks...');
      
      const { data, error } = await supabase
        .from('customer_feedbacks')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching feedbacks:', error);
        throw error;
      }
      
      console.log('Fetched feedbacks:', data);
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error in fetchFeedbacks:', error);
      toast.error(`Không thể tải danh sách feedback: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    try {
      console.log('Starting image upload...', file);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `feedbacks/${fileName}`;

      console.log('Uploading to path:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw error;
    }
  };

  const deleteImage = async (imageUrl) => {
    try {
      const path = imageUrl.split('/images/')[1];
      if (path) {
        console.log('Deleting image:', path);
        const { error } = await supabase.storage.from('images').remove([path]);
        if (error) {
          console.error('Delete error:', error);
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Image selected:', file);
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ảnh phải nhỏ hơn 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh');
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      console.log('Image preview created');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== STARTING SUBMIT ===');
    console.log('Form data:', formData);
    console.log('Image file:', imageFile);
    console.log('Editing:', editingFeedback ? 'Yes' : 'No');
    
    setUploading(true);

    try {
      let imageUrl = formData.customer_image;

      // Validate
      if (!formData.customer_name.trim()) {
        toast.error('Vui lòng nhập tên khách hàng');
        setUploading(false);
        return;
      }

      // Upload new image if selected
      if (imageFile) {
        console.log('Uploading new image...');
        imageUrl = await uploadImage(imageFile);
        console.log('Image uploaded successfully:', imageUrl);
        
        // Delete old image if updating
        if (editingFeedback && editingFeedback.customer_image) {
          console.log('Deleting old image...');
          await deleteImage(editingFeedback.customer_image);
        }
      } else if (!imageUrl) {
        toast.error('Vui lòng chọn ảnh khách hàng');
        setUploading(false);
        return;
      }

      const feedbackData = {
        customer_name: formData.customer_name.trim(),
        customer_image: imageUrl,
        display_order: parseInt(formData.display_order) || 0,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      console.log('Feedback data to save:', feedbackData);

      if (editingFeedback) {
        // Update existing feedback
        console.log('Updating feedback ID:', editingFeedback.id);
        
        const { data, error } = await supabase
          .from('customer_feedbacks')
          .update(feedbackData)
          .eq('id', editingFeedback.id)
          .select();

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        
        console.log('Update response:', data);
        toast.success('Cập nhật feedback thành công!');
      } else {
        // Create new feedback
        console.log('Creating new feedback...');
        
        const { data, error } = await supabase
          .from('customer_feedbacks')
          .insert([feedbackData])
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        
        console.log('Insert response:', data);
        toast.success('Thêm feedback thành công!');
      }

      handleCloseModal();
      await fetchFeedbacks();
      
    } catch (error) {
      console.error('=== ERROR IN SUBMIT ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      toast.error(`Có lỗi xảy ra: ${error.message}`);
    } finally {
      setUploading(false);
      console.log('=== SUBMIT COMPLETED ===');
    }
  };

  const handleDelete = async (id, imageUrl) => {
    if (!window.confirm('Bạn có chắc muốn xóa feedback này?')) return;

    try {
      console.log('Deleting feedback:', id);
      
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
      toast.error(`Có lỗi xảy ra: ${error.message}`);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      console.log('Toggling active status for:', id);
      
      const { error } = await supabase
        .from('customer_feedbacks')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Cập nhật trạng thái thành công!');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(`Có lỗi xảy ra: ${error.message}`);
    }
  };

  const handleOpenModal = (feedback = null) => {
    console.log('Opening modal with feedback:', feedback);
    
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
    console.log('Closing modal');
    setIsModalOpen(false);
    setEditingFeedback(null);
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Feedback Khách hàng</h2>
          <p className="text-sm text-gray-600 mt-1">
            Tổng: {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''}
          </p>
        </div>
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
          <p className="text-gray-600 mt-4">Đang tải...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">Chưa có feedback nào</p>
          <button
            onClick={() => handleOpenModal()}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Thêm feedback đầu tiên
          </button>
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
                  onError={(e) => {
                    console.error('Image load error:', feedback.customer_image);
                    e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                  }}
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
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
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
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
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
                  <div className="mb-3 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        console.error('Preview load error');
                        toast.error('Lỗi hiển thị ảnh preview');
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                        setFormData({ ...formData, customer_image: '' });
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      <X size={16} />
                    </button>
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
                <p className="text-xs text-gray-500 mt-1">
                  Tối đa 5MB. Hỗ trợ: JPG, PNG, WEBP
                </p>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium mb-1">Thứ tự hiển thị</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Số thứ tự càng nhỏ sẽ hiển thị trước
                </p>
              </div>

              {/* Is Active Checkbox */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded w-4 h-4"
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
                  className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={uploading || !formData.customer_name.trim() || (!imageFile && !formData.customer_image)}
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

export default AdminFeedbackManagement;
