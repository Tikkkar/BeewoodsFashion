import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getAdminProductById, getAdminCategories, createProduct, updateProduct, uploadImage } from '../../lib/api/admin';
import ImageUpload from '../../components/admin/ImageUpload';
import { X, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

// Hàm helper để tạo slug UNIQUE
const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// Generate unique slug by adding timestamp
const generateUniqueSlug = (name) => {
  const baseSlug = slugify(name);
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits
  return `${baseSlug}-${timestamp}`;
};

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({ 
    name: '', slug: '', description: '', price: '', original_price: '',
    stock: '', category_id: '', is_active: true, is_featured: false 
  });
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([{ size: '', stock: '' }]);
  const [images, setImages] = useState({ existing: [], toUpload: [], toRemove: [] });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditing);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: catData } = await getAdminCategories();
        if (catData) setCategories(catData);

        if (isEditing) {
          const { data: prodData } = await getAdminProductById(id);
          if (prodData) {
            setFormData({
              name: prodData.name || '', 
              slug: prodData.slug || '', 
              description: prodData.description || '',
              price: prodData.price || '', 
              original_price: prodData.original_price || '', 
              stock: prodData.stock || '',
              category_id: prodData.category_id || '', 
              is_active: prodData.is_active, 
              is_featured: prodData.is_featured
            });
            setImages(prev => ({ 
              ...prev, 
              existing: prodData.product_images?.map(i => i.image_url) || [] 
            }));
            if (prodData.product_sizes?.length) {
              setSizes(prodData.product_sizes);
            } else {
              setSizes([{ size: '', stock: '' }]);
            }
          } else {
            toast.error('Could not find product to edit.');
            navigate('/admin/products');
          }
        }
      } catch (error) {
        console.error('Load data error:', error);
        toast.error('Failed to load initial data.');
      } finally {
        setPageLoading(false);
      }
    };
    loadData();
  }, [id, isEditing, navigate]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleSizeChange = (index, field, value) => {
    const newSizes = [...sizes];
    newSizes[index][field] = value;
    setSizes(newSizes);
  };

  const addSize = () => setSizes([...sizes, { size: '', stock: '' }]);
  const removeSize = (index) => setSizes(sizes.filter((_, i) => i !== index));

  const handleFilesChange = (files) => {
    console.log('📎 Files selected:', files.length);
    setImages(p => ({...p, toUpload: [...p.toUpload, ...files]}));
  };
  
  const handleRemoveExisting = (url) => {
    setImages(p => ({
      ...p, 
      existing: p.existing.filter(i => i !== url), 
      toRemove: [...p.toRemove, url]
    }));
  };

  // COMPRESS & UPLOAD SINGLE IMAGE
  const compressAndUploadImage = async (file, index, total) => {
    try {
      console.log(`🗜️ [${index + 1}/${total}] Compressing: ${file.name}`);
      console.log(`📏 Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Compression options
      const options = {
        maxSizeMB: 0.8,          // Target 800KB
        maxWidthOrHeight: 1920,  // Max dimension
        useWebWorker: true,
        fileType: 'image/jpeg'   // Convert to JPEG
      };

      const compressedFile = await imageCompression(file, options);
      console.log(`✅ Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Upload compressed file
      console.log(`📤 [${index + 1}/${total}] Uploading...`);
      const url = await uploadImage(compressedFile, 'products');
      console.log(`✅ [${index + 1}/${total}] Uploaded:`, url);
      
      return url;
      
    } catch (error) {
      console.error(`❌ [${index + 1}/${total}] Failed:`, error);
      
      // Fallback: Try upload original if compression fails
      if (file.size < 5 * 1024 * 1024) { // Only if < 5MB
        console.log(`⚠️ [${index + 1}/${total}] Trying original file...`);
        return await uploadImage(file, 'products');
      }
      
      throw new Error(`Image ${index + 1} too large or failed to process`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.category_id) {
      toast.error('Product Name and Category are required.');
      return;
    }
    
    if (images.toUpload.length === 0 && images.existing.length === 0) {
      toast.error('Please add at least one product image.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    
    const toastId = toast.loading('Processing images...');

    try {
      // UPLOAD IMAGES ONE BY ONE WITH PROGRESS
      const uploadedUrls = [];
      const totalImages = images.toUpload.length;
      
      console.log(`📸 Starting upload of ${totalImages} images...`);
      
      for (let i = 0; i < totalImages; i++) {
        const file = images.toUpload[i];
        
        // Update progress
        const progress = Math.round(((i + 1) / totalImages) * 100);
        setUploadProgress(progress);
        toast.loading(`Uploading image ${i + 1}/${totalImages}...`, { id: toastId });
        
        // Upload single image
        const url = await compressAndUploadImage(file, i, totalImages);
        uploadedUrls.push(url);
      }
      
      console.log('✅ All images uploaded:', uploadedUrls);
      
      // Combine existing + new images
      const finalImageUrls = [...images.existing, ...uploadedUrls];
      
      // Update toast
      toast.loading('Saving product data...', { id: toastId });
      
      // Prepare data - Generate UNIQUE slug
      let finalSlug = formData.slug ? slugify(formData.slug) : '';
      
      // If slug empty or editing, generate unique slug
      if (!finalSlug || !isEditing) {
        finalSlug = generateUniqueSlug(formData.name);
      }

      const submissionData = {
        ...formData,
        slug: finalSlug,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      };
      
      // Remove nested objects
      delete submissionData.product_images;
      delete submissionData.product_sizes;
      delete submissionData.categories;
      
      // Prepare sizes
      const finalSizes = sizes
        .filter(s => s.size && s.stock)
        .map(s => ({ ...s, stock: parseInt(s.stock, 10) || 0 }));

      // Save product
      if (isEditing) {
        await updateProduct(id, submissionData, finalImageUrls, finalSizes);
        toast.success('Product updated successfully!', { id: toastId });
      } else {
        await createProduct(submissionData, finalImageUrls, finalSizes);
        toast.success('Product created successfully!', { id: toastId });
      }
      
      // Navigate back
      setTimeout(() => navigate('/admin/products'), 500);
      
    } catch (err) {
      console.error('❌ Submit error:', err);
      toast.error(err.message || 'Failed to save product. Please try again.', { id: toastId });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
        <div>
            <h1 className="text-3xl font-bold">{isEditing ? 'Edit Product' : 'Create New Product'}</h1>
            <p className="text-gray-600">Điền thông tin chi tiết cho sản phẩm.</p>
        </div>

        {/* Basic Info */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Tên sản phẩm" 
                  className="p-3 border rounded w-full" 
                  required
                />
                <select 
                  name="category_id" 
                  value={formData.category_id} 
                  onChange={handleChange} 
                  className="p-3 border rounded w-full" 
                  required
                >
                    <option value="">Chọn danh mục</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input 
                  name="slug" 
                  value={formData.slug} 
                  onChange={handleChange} 
                  placeholder="Đường dẫn URL (bỏ trống để tự tạo)" 
                  className="p-3 border rounded md:col-span-2"
                />
                <input 
                  name="price" 
                  type="number" 
                  value={formData.price} 
                  onChange={handleChange} 
                  placeholder="Giá bán (VND)" 
                  className="p-3 border rounded"
                  required
                />
                <input 
                  name="original_price" 
                  type="number" 
                  value={formData.original_price} 
                  onChange={handleChange} 
                  placeholder="Giá gốc (nếu có)" 
                  className="p-3 border rounded"
                />
                <input 
                  name="stock" 
                  type="number" 
                  value={formData.stock} 
                  onChange={handleChange} 
                  placeholder="Tổng tồn kho" 
                  className="p-3 border rounded"
                  required
                />
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  placeholder="Mô tả sản phẩm" 
                  className="p-3 border rounded md:col-span-2 h-28"
                />
            </div>
        </div>

        {/* Sizes */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold">Kích thước & Tồn kho chi tiết</h2>
            {sizes.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input 
                      value={s.size} 
                      onChange={e => handleSizeChange(i, 'size', e.target.value)} 
                      placeholder="Size (ví dụ: S, M, L)" 
                      className="p-3 border rounded w-full"
                    />
                    <input 
                      type="number" 
                      value={s.stock} 
                      onChange={e => handleSizeChange(i, 'stock', e.target.value)} 
                      placeholder="Tồn kho cho size này" 
                      className="p-3 border rounded w-full"
                    />
                    {sizes.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeSize(i)} 
                        className="text-red-500 p-2 hover:bg-red-50 rounded-full"
                      >
                        <X size={18}/>
                      </button>
                    )}
                </div>
            ))}
            <button 
              type="button" 
              onClick={addSize} 
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              + Thêm kích thước
            </button>
        </div>

        {/* Images */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-bold mb-4">Hình ảnh sản phẩm</h2>
            <ImageUpload 
              existingImages={images.existing} 
              onFilesChange={handleFilesChange}
              onRemoveExisting={handleRemoveExisting}
            />
            {images.toUpload.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {images.toUpload.length} ảnh chờ tải lên
              </p>
            )}
        </div>

        {/* Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
             <h2 className="text-lg font-bold mb-4">Cài đặt</h2>
             <div className="flex gap-6">
               <label className="flex items-center gap-2">
                 <input 
                   type="checkbox" 
                   name="is_active" 
                   checked={formData.is_active} 
                   onChange={handleChange} 
                 /> 
                 Hiển thị
               </label>
               <label className="flex items-center gap-2">
                 <input 
                   type="checkbox" 
                   name="is_featured" 
                   checked={formData.is_featured} 
                   onChange={handleChange} 
                 /> 
                 Nổi bật
               </label>
            </div>
        </div>

        {/* Upload Progress */}
        {loading && uploadProgress > 0 && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uploading images...</span>
              <span className="text-sm text-gray-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-black h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => navigate('/admin/products')} 
              className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
              disabled={loading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="bg-black text-white px-6 py-3 rounded-lg disabled:bg-gray-400 flex items-center gap-2"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
        </div>
    </form>
  );
};

export default AdminProductForm;