import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, Eye, Check, X, Plus, Image, Trash2, MoveUp, MoveDown, Type, Save, Loader2, ChevronDown, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SEOContentEditor = ({ initialProductId = null }) => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [seoData, setSeoData] = useState({
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    product_name: '',
    product_slug: ''
  });

  const [contentBlocks, setContentBlocks] = useState([]);

  const [validation, setValidation] = useState({
    title: { isValid: true, message: '' },
    description: { isValid: true, message: '' },
    keywords: { isValid: true, message: '' }
  });

  const [showPreview, setShowPreview] = useState(false);

  const SEO_LIMITS = {
    title: { min: 30, max: 60, optimal: 55 },
    description: { min: 120, max: 160, optimal: 155 },
    keywords: { max: 10 }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchProductDetail(selectedProductId);
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      setProducts(data || []);
      
      if (!selectedProductId && data && data.length > 0) {
        setSelectedProductId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('❌ Lỗi khi tải danh sách sản phẩm: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetail = async (productId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      setSeoData({
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        seo_keywords: data.seo_keywords || '',
        product_name: data.name,
        product_slug: data.slug
      });

      if (data.attributes && data.attributes.content_blocks) {
        setContentBlocks(data.attributes.content_blocks);
      } else {
        setContentBlocks([
          {
            id: Date.now(),
            type: 'text',
            content: data.description || '',
            title: 'Giới thiệu chung'
          }
        ]);
      }

      validateField('seo_title', data.seo_title || '');
      validateField('seo_description', data.seo_description || '');
      validateField('seo_keywords', data.seo_keywords || '');

    } catch (error) {
      console.error('Error fetching product:', error);
      alert('❌ Lỗi khi tải chi tiết sản phẩm: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSEOChange = (field, value) => {
    setSeoData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const validateField = (field, value) => {
    const newValidation = { ...validation };
    
    switch(field) {
      case 'seo_title':
        const titleLength = value.length;
        if (titleLength === 0) {
          newValidation.title = { isValid: true, message: 'Để trống sẽ dùng tên sản phẩm' };
        } else if (titleLength < SEO_LIMITS.title.min) {
          newValidation.title = { isValid: false, message: `Quá ngắn (tối thiểu ${SEO_LIMITS.title.min} ký tự)` };
        } else if (titleLength > SEO_LIMITS.title.max) {
          newValidation.title = { isValid: false, message: `Quá dài (tối đa ${SEO_LIMITS.title.max} ký tự)` };
        } else if (titleLength >= SEO_LIMITS.title.min && titleLength <= SEO_LIMITS.title.optimal) {
          newValidation.title = { isValid: true, message: 'Độ dài tối ưu!' };
        } else {
          newValidation.title = { isValid: true, message: 'Chấp nhận được' };
        }
        break;

      case 'seo_description':
        const descLength = value.length;
        if (descLength === 0) {
          newValidation.description = { isValid: true, message: 'Để trống sẽ dùng mô tả sản phẩm' };
        } else if (descLength < SEO_LIMITS.description.min) {
          newValidation.description = { isValid: false, message: `Quá ngắn (tối thiểu ${SEO_LIMITS.description.min} ký tự)` };
        } else if (descLength > SEO_LIMITS.description.max) {
          newValidation.description = { isValid: false, message: `Quá dài (tối đa ${SEO_LIMITS.description.max} ký tự)` };
        } else if (descLength >= SEO_LIMITS.description.min && descLength <= SEO_LIMITS.description.optimal) {
          newValidation.description = { isValid: true, message: 'Độ dài tối ưu!' };
        } else {
          newValidation.description = { isValid: true, message: 'Chấp nhận được' };
        }
        break;

      case 'seo_keywords':
        const keywords = value.split(',').filter(k => k.trim());
        if (keywords.length === 0) {
          newValidation.keywords = { isValid: true, message: 'Để trống được phép' };
        } else if (keywords.length > SEO_LIMITS.keywords.max) {
          newValidation.keywords = { isValid: false, message: `Quá nhiều từ khóa (tối đa ${SEO_LIMITS.keywords.max})` };
        } else {
          newValidation.keywords = { isValid: true, message: `${keywords.length} từ khóa` };
        }
        break;
    }
    
    setValidation(newValidation);
  };

  const getProgressColor = (current, max, optimal) => {
    if (current === 0) return 'bg-gray-300';
    if (current < optimal * 0.5) return 'bg-red-500';
    if (current <= optimal) return 'bg-green-500';
    if (current <= max) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // ✅ UPLOAD IMAGE TO SUPABASE STORAGE
  const handleImageUpload = async (blockId, file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('⚠️ Vui lòng chọn file ảnh!');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('⚠️ Kích thước ảnh không được vượt quá 5MB!');
      return;
    }

    try {
      setUploadingImage(true);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `seo-content/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      // Update block with image URL
      updateBlock(blockId, { url: publicUrl });

      console.log('✅ Image uploaded:', publicUrl);
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      alert('❌ Lỗi khi tải ảnh lên: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const addTextBlock = () => {
    const newBlock = {
      id: Date.now(),
      type: 'text',
      content: '',
      title: ''
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const addImageBlock = () => {
    const newBlock = {
      id: Date.now(),
      type: 'image',
      url: '',
      caption: '',
      alt: ''
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateBlock = (id, updates) => {
    setContentBlocks(contentBlocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id) => {
    setContentBlocks(contentBlocks.filter(block => block.id !== id));
  };

  const moveBlock = (id, direction) => {
    const index = contentBlocks.findIndex(block => block.id === id);
    if (direction === 'up' && index > 0) {
      const newBlocks = [...contentBlocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      setContentBlocks(newBlocks);
    } else if (direction === 'down' && index < contentBlocks.length - 1) {
      const newBlocks = [...contentBlocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      setContentBlocks(newBlocks);
    }
  };

  const handleSave = async () => {
    if (!selectedProductId) {
      alert('⚠️ Vui lòng chọn sản phẩm!');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        seo_title: seoData.seo_title || null,
        seo_description: seoData.seo_description || null,
        seo_keywords: seoData.seo_keywords || null,
        updated_at: new Date().toISOString()
      };

      const { data: currentProduct } = await supabase
        .from('products')
        .select('attributes')
        .eq('id', selectedProductId)
        .single();

      const currentAttributes = currentProduct?.attributes || {};
      
      updateData.attributes = {
        ...currentAttributes,
        content_blocks: contentBlocks
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', selectedProductId);

      if (error) throw error;

      alert('✅ Đã lưu thành công!');
      
      await fetchProductDetail(selectedProductId);

    } catch (error) {
      console.error('Error saving:', error);
      alert('❌ Lỗi khi lưu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const displayTitle = seoData.seo_title || seoData.product_name;
  const displayDescription = seoData.seo_description || 'Mô tả sản phẩm sẽ hiển thị ở đây nếu không có SEO description tùy chỉnh.';

  if (loading && !selectedProductId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quản lý SEO & Nội dung</h2>
        <p className="text-gray-600">Tối ưu hóa SEO và tùy chỉnh nội dung chi tiết cho sản phẩm</p>
      </div>

      {/* Product Selector */}
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Chọn sản phẩm để chỉnh sửa
        </label>
        <div className="relative">
          <select
            value={selectedProductId || ''}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-10"
          >
            <option value="">-- Chọn sản phẩm --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">Đang tải chi tiết sản phẩm...</p>
        </div>
      ) : !selectedProductId ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <Type className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">Vui lòng chọn sản phẩm để bắt đầu chỉnh sửa</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel - SEO Settings */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Cài đặt SEO
              </h3>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Tiêu đề SEO
                  <span className="text-xs text-gray-500 ml-2 font-normal">(Tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={seoData.seo_title}
                  onChange={(e) => handleSEOChange('seo_title', e.target.value)}
                  placeholder={seoData.product_name}
                  maxLength={SEO_LIMITS.title.max}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className={validation.title.isValid ? 'text-gray-600' : 'text-red-600'}>
                      {validation.title.message}
                    </span>
                    <span>{seoData.seo_title.length}/{SEO_LIMITS.title.max}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${getProgressColor(
                        seoData.seo_title.length,
                        SEO_LIMITS.title.max,
                        SEO_LIMITS.title.optimal
                      )}`}
                      style={{ width: `${Math.min((seoData.seo_title.length / SEO_LIMITS.title.max) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Mô tả SEO
                  <span className="text-xs text-gray-500 ml-2 font-normal">(Tùy chọn)</span>
                </label>
                <textarea
                  value={seoData.seo_description}
                  onChange={(e) => handleSEOChange('seo_description', e.target.value)}
                  placeholder="Mô tả ngắn gọn về sản phẩm..."
                  maxLength={SEO_LIMITS.description.max}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                />
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className={validation.description.isValid ? 'text-gray-600' : 'text-red-600'}>
                      {validation.description.message}
                    </span>
                    <span>{seoData.seo_description.length}/{SEO_LIMITS.description.max}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${getProgressColor(
                        seoData.seo_description.length,
                        SEO_LIMITS.description.max,
                        SEO_LIMITS.description.optimal
                      )}`}
                      style={{ width: `${Math.min((seoData.seo_description.length / SEO_LIMITS.description.max) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Từ khóa SEO
                  <span className="text-xs text-gray-500 ml-2 font-normal">(Tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={seoData.seo_keywords}
                  onChange={(e) => handleSEOChange('seo_keywords', e.target.value)}
                  placeholder="áo sơ mi, thời trang nam, cao cấp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="mt-1 text-xs text-gray-600">
                  {validation.keywords.message}
                </div>
              </div>

              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm mt-4"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Ẩn xem trước Google' : 'Xem trước Google'}
              </button>

              {showPreview && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">
                    beewoodsfashion.com/products/{seoData.product_slug}
                  </div>
                  <h3 className="text-lg text-blue-600 mb-1">
                    {displayTitle}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {displayDescription}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Mẹo SEO
              </h4>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>• Tiêu đề nên 50-60 ký tự</li>
                <li>• Mô tả nên 120-160 ký tự</li>
                <li>• Dùng từ khóa tự nhiên</li>
                <li>• Chèn ảnh với alt text tốt</li>
                <li>• Upload ảnh trực tiếp để tốc độ tải nhanh hơn</li>
              </ul>
            </div>
          </div>

          {/* Right Panel - Content Editor */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Nội dung chi tiết
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={addTextBlock}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm văn bản
                  </button>
                  <button
                    onClick={addImageBlock}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-2"
                  >
                    <Image className="w-4 h-4" />
                    Thêm ảnh
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {contentBlocks.map((block, index) => (
                  <div key={block.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {block.type === 'text' ? (
                          <Type className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Image className="w-4 h-4 text-green-600" />
                        )}
                        <span className="text-sm font-semibold">
                          {block.type === 'text' ? 'Khối văn bản' : 'Khối hình ảnh'} #{index + 1}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveBlock(block.id, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveBlock(block.id, 'down')}
                          disabled={index === contentBlocks.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {block.type === 'text' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={block.title}
                          onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                          placeholder="Tiêu đề phần (tùy chọn)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <textarea
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          placeholder="Nội dung văn bản (hỗ trợ HTML: <strong>, <em>, <br>)"
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none font-mono"
                        />
                        <p className="text-xs text-gray-500">
                          💡 Có thể dùng: &lt;strong&gt;in đậm&lt;/strong&gt;, &lt;em&gt;in nghiêng&lt;/em&gt;
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Upload Image Button */}
                        <div className="flex gap-2">
                          <label className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 transition">
                              {uploadingImage ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                  <span className="text-sm text-blue-600 font-medium">Đang tải lên...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm text-blue-600 font-medium">Tải ảnh lên</span>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(block.id, e.target.files[0])}
                              className="hidden"
                              disabled={uploadingImage}
                            />
                          </label>
                        </div>

                        {/* Manual URL Input */}
                        <div className="relative">
                          <input
                            type="text"
                            value={block.url}
                            onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                            placeholder="Hoặc nhập URL hình ảnh"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>

                        {block.url && (
                          <img 
                            src={block.url} 
                            alt={block.alt || 'Product image'}
                            className="w-full rounded-lg max-h-64 object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <input
                          type="text"
                          value={block.caption}
                          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                          placeholder="Chú thích ảnh (hiển thị dưới ảnh)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={block.alt}
                          onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                          placeholder="Alt text (quan trọng cho SEO)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <p className="text-xs text-gray-500">
                          📸 Chọn "Tải ảnh lên" để upload từ máy tính (khuyến nghị) hoặc nhập URL
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {contentBlocks.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Type className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Chưa có nội dung nào</p>
                  <p className="text-sm">Nhấn "Thêm văn bản" hoặc "Thêm ảnh" để bắt đầu</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Xem trước trang sản phẩm
              </h3>
              <div className="border border-gray-200 rounded-lg p-6 bg-white space-y-6 max-h-[600px] overflow-y-auto">
                {contentBlocks.map((block) => (
                  <div key={block.id}>
                    {block.type === 'text' ? (
                      <div>
                        {block.title && (
                          <h3 className="text-xl font-bold mb-3">{block.title}</h3>
                        )}
                        <p 
                          className="text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: block.content }}
                        />
                      </div>
                    ) : (
                      <figure className="my-6">
                        {block.url && (
                          <img 
                            src={block.url} 
                            alt={block.alt || 'Product image'}
                            className="w-full rounded-lg shadow-md"
                          />
                        )}
                        {block.caption && (
                          <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
                            {block.caption}
                          </figcaption>
                        )}
                      </figure>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-black text-white py-4 rounded-lg hover:bg-gray-800 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Lưu tất cả thay đổi
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOContentEditor;