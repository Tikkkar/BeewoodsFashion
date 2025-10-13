import React, { useState, useEffect } from 'react';
import { getAdminBanners, saveBanner, deleteBanner, uploadImage } from '../../lib/api/admin';
import { Edit, Trash2, Plus, Loader2, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BannerModal = ({ banner, onClose, onSave }) => {
  const [data, setData] = useState(banner || { 
    title: '', 
    subtitle: '', 
    button_text: 'Shop Now',
    button_link: '/products',
    image_url: '',
    is_active: true, 
    display_order: 0 
  });
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(banner?.image_url || '');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let finalImageUrl = data.image_url;
      
      // Upload new image if selected
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile, 'banners');
      }
      
      if (!finalImageUrl) {
        toast.error('Please upload a banner image');
        setUploading(false);
        return;
      }
      
      await onSave({ ...data, image_url: finalImageUrl });
      onClose();
    } catch (error) {
      console.error('Error saving banner:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">{data.id ? 'Edit' : 'Add'} Banner</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Banner Image *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                      <ImageIcon size={18} />
                      <span>Change Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Click to upload banner image</p>
                    <p className="text-sm text-gray-400">Recommended: 1920x600px</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input 
                name="title" 
                value={data.title} 
                onChange={handleChange} 
                placeholder="New Collection 2025" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                required 
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium mb-2">Subtitle</label>
              <input 
                name="subtitle" 
                value={data.subtitle} 
                onChange={handleChange} 
                placeholder="Discover the latest trends" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Button Text & Link */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Button Text</label>
                <input 
                  name="button_text" 
                  value={data.button_text} 
                  onChange={handleChange} 
                  placeholder="Shop Now" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Button Link</label>
                <input 
                  name="button_link" 
                  value={data.button_link} 
                  onChange={handleChange} 
                  placeholder="/products" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium mb-2">Display Order</label>
              <input 
                name="display_order" 
                type="number" 
                value={data.display_order} 
                onChange={handleChange} 
                placeholder="0" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">Lower numbers appear first</p>
            </div>

            {/* Active Toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="is_active" 
                  checked={data.is_active} 
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Active (Show on homepage)</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                disabled={uploading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Banner</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(null);

  const loadBanners = async () => {
    setLoading(true);
    const { data } = await getAdminBanners();
    if (data) setBanners(data);
    setLoading(false);
  };

  useEffect(() => { loadBanners(); }, []);

  const handleSave = async (banner) => {
    await saveBanner(banner);
    setEditingBanner(null);
    loadBanners();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      await deleteBanner(id);
      loadBanners();
    }
  };

  const handleReorder = async (banner, direction) => {
    const newOrder = direction === 'up' ? banner.display_order - 1 : banner.display_order + 1;
    await saveBanner({ ...banner, display_order: newOrder });
    loadBanners();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banners</h1>
          <p className="text-gray-600">Quản lý banner trên trang chủ</p>
        </div>
        <button 
          onClick={() => setEditingBanner({})} 
          className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition"
        >
          <Plus size={20} />
          <span>Add Banner</span>
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 gap-6">
        {banners.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No banners yet</p>
            <button 
              onClick={() => setEditingBanner({})}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
            >
              Add Your First Banner
            </button>
          </div>
        ) : (
          banners.map((banner, index) => (
            <div 
              key={banner.id} 
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition"
            >
              <div className="grid md:grid-cols-3 gap-6 p-6">
                {/* Banner Image */}
                <div className="md:col-span-1">
                  <img 
                    src={banner.image_url} 
                    alt={banner.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>

                {/* Banner Info */}
                <div className="md:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{banner.title}</h3>
                        {banner.subtitle && (
                          <p className="text-gray-600 text-sm">{banner.subtitle}</p>
                        )}
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        banner.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Button:</span> {banner.button_text}
                      </div>
                      <div>
                        <span className="font-medium">Link:</span> {banner.button_link}
                      </div>
                      <div>
                        <span className="font-medium">Order:</span> {banner.display_order}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleReorder(banner, 'up')}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button 
                      onClick={() => handleReorder(banner, 'down')}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      disabled={index === banners.length - 1}
                      title="Move down"
                    >
                      <ArrowDown size={18} />
                    </button>
                    <div className="ml-auto flex gap-3">
                      <button 
                        onClick={() => setEditingBanner(banner)} 
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-2"
                      >
                        <Edit size={18}/>
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(banner.id)} 
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
                      >
                        <Trash2 size={18}/>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {editingBanner && (
        <BannerModal 
          banner={editingBanner} 
          onClose={() => setEditingBanner(null)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
};

export default AdminBanners;