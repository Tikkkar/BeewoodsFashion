import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getAdminProductById, getAdminCategories, createProduct, updateProduct, uploadImage } from '../../lib/api/admin';
import ImageUpload from '../../components/admin/ImageUpload';
import { X, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

// Hàm helper để tạo slug
const slugify = (text) => {
  if (!text) return '';
  return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
};

const generateUniqueSlug = (name) => {
  const baseSlug = slugify(name);
  const timestamp = Date.now().toString().slice(-6);
  return `${baseSlug}-${timestamp}`;
};

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  // ✨ THAY ĐỔI: category_id -> category_ids (mảng)
  const [formData, setFormData] = useState({ 
    name: '', slug: '', description: '', price: '', original_price: '',
    stock: '', category_ids: [], is_active: true, is_featured: false 
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
              // ✨ THAY ĐỔI: Lấy mảng ID danh mục từ dữ liệu
              category_ids: prodData.categories?.map(c => c.id) || [], 
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
  
  // ✨ MỚI: Hàm xử lý chọn/bỏ chọn danh mục
  const handleCategoryChange = (categoryId) => {
    setFormData(prev => {
      const newCategoryIds = prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId];
      return { ...prev, category_ids: newCategoryIds };
    });
  };

  const handleSizeChange = (index, field, value) => {
    const newSizes = [...sizes];
    newSizes[index][field] = value;
    setSizes(newSizes);
  };

  const addSize = () => setSizes([...sizes, { size: '', stock: '' }]);
  const removeSize = (index) => setSizes(sizes.filter((_, i) => i !== index));

  const handleFilesChange = (files) => setImages(p => ({...p, toUpload: [...p.toUpload, ...files]}));
  
  const handleRemoveExisting = (url) => setImages(p => ({ ...p, existing: p.existing.filter(i => i !== url), toRemove: [...p.toRemove, url] }));

  const compressAndUploadImage = async (file) => {
    try {
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/jpeg' };
      const compressedFile = await imageCompression(file, options);
      return await uploadImage(compressedFile, 'products');
    } catch (error) {
      if (file.size < 5 * 1024 * 1024) {
        return await uploadImage(file, 'products');
      }
      throw new Error(`Image ${file.name} too large or failed to process`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✨ THAY ĐỔI: Kiểm tra mảng category_ids
    if (!formData.name || formData.category_ids.length === 0) {
      toast.error('Tên sản phẩm và ít nhất một Danh mục là bắt buộc.');
      return;
    }
    
    if (images.toUpload.length === 0 && images.existing.length === 0) {
      toast.error('Vui lòng thêm ít nhất một hình ảnh sản phẩm.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Đang xử lý hình ảnh...');

    try {
      const uploadedUrls = [];
      for (let i = 0; i < images.toUpload.length; i++) {
        setUploadProgress(Math.round(((i + 1) / images.toUpload.length) * 100));
        toast.loading(`Đang tải ảnh ${i + 1}/${images.toUpload.length}...`, { id: toastId });
        const url = await compressAndUploadImage(images.toUpload[i]);
        uploadedUrls.push(url);
      }
      
      const finalImageUrls = [...images.existing, ...uploadedUrls];
      toast.loading('Đang lưu dữ liệu sản phẩm...', { id: toastId });
      
      const submissionData = {
        name: formData.name,
        slug: formData.slug ? slugify(formData.slug) : generateUniqueSlug(formData.name),
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        stock: parseInt(formData.stock) || 0,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      };
      
      const finalSizes = sizes.filter(s => s.size && s.stock).map(s => ({ ...s, stock: parseInt(s.stock, 10) || 0 }));

      if (isEditing) {
        await updateProduct(id, submissionData, finalImageUrls, finalSizes, formData.category_ids);
        toast.success('Sản phẩm đã được cập nhật!', { id: toastId });
      } else {
        await createProduct(submissionData, finalImageUrls, finalSizes, formData.category_ids);
        toast.success('Sản phẩm đã được tạo!', { id: toastId });
      }
      
      setTimeout(() => navigate('/admin/products'), 500);
      
    } catch (err) {
      console.error('❌ Submit error:', err);
      toast.error(err.message || 'Lưu sản phẩm thất bại.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-12 h-12 animate-spin text-black" /></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
        <div>
            <h1 className="text-3xl font-bold">{isEditing ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm mới'}</h1>
            <p className="text-gray-600">Điền thông tin chi tiết cho sản phẩm.</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Tên sản phẩm" className="p-3 border rounded w-full md:col-span-2" required />
                <input name="slug" value={formData.slug} onChange={handleChange} placeholder="Đường dẫn URL (bỏ trống để tự tạo)" className="p-3 border rounded md:col-span-2"/>
                <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Giá bán (VND)" className="p-3 border rounded" required />
                <input name="original_price" type="number" value={formData.original_price} onChange={handleChange} placeholder="Giá gốc (nếu có)" className="p-3 border rounded"/>
                <input name="stock" type="number" value={formData.stock} onChange={handleChange} placeholder="Tổng tồn kho" className="p-3 border rounded" required />
                <div /> 
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả sản phẩm" className="p-3 border rounded md:col-span-2 h-28"/>
            </div>
        </div>

        {/* ✨ GIAO DIỆN MỚI: Chọn nhiều danh mục */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <h2 className="text-lg font-bold">Danh mục</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-48 overflow-y-auto">
            {categories.map(c => (
              <label key={c.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formData.category_ids.includes(c.id)}
                  onChange={() => handleCategoryChange(c.id)}
                  className="w-4 h-4"
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold">Kích thước & Tồn kho chi tiết</h2>
            {sizes.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input value={s.size} onChange={e => handleSizeChange(i, 'size', e.target.value)} placeholder="Size (ví dụ: S, M, L)" className="p-3 border rounded w-full"/>
                    <input type="number" value={s.stock} onChange={e => handleSizeChange(i, 'stock', e.target.value)} placeholder="Tồn kho cho size này" className="p-3 border rounded w-full"/>
                    {sizes.length > 1 && (<button type="button" onClick={() => removeSize(i)} className="text-red-500 p-2 hover:bg-red-50 rounded-full"><X size={18}/></button>)}
                </div>
            ))}
            <button type="button" onClick={addSize} className="text-sm font-medium text-blue-600 hover:text-blue-800">+ Thêm kích thước</button>
        </div>

        {/* Images */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-bold mb-4">Hình ảnh sản phẩm</h2>
            <ImageUpload existingImages={images.existing} onFilesChange={handleFilesChange} onRemoveExisting={handleRemoveExisting}/>
            {images.toUpload.length > 0 && (<p className="text-sm text-gray-600 mt-2">{images.toUpload.length} ảnh chờ tải lên</p>)}
        </div>

        {/* Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
             <h2 className="text-lg font-bold mb-4">Cài đặt</h2>
             <div className="flex gap-6">
               <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange}/> Hiển thị</label>
               <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange}/> Nổi bật</label>
            </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => navigate('/admin/products')} className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-200 transition" disabled={loading}>Hủy</button>
            <button type="submit" disabled={loading} className="bg-black text-white px-6 py-3 rounded-lg disabled:bg-gray-400 flex items-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
        </div>
    </form>
  );
};

export default AdminProductForm;
