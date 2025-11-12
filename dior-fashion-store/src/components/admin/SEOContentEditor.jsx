import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Search,
  Eye,
  Check,
  X,
  Plus,
  Image,
  Trash2,
  MoveUp,
  MoveDown,
  Type,
  Save,
  Loader2,
  ChevronDown,
  Upload,
  Sparkles,
  Wand2,
  FileText,
  ImageIcon,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  generateSEOContent,
  analyzeProductImage,
  generateContentBlock,
  checkGeminiConfig,
} from "../../services/geminiSEOService.ts";

/**
 * SEOContentEditor
 * Props:
 *  - initialProductId (optional)
 */
const SEOContentEditor = ({ initialProductId = null,onSaveSuccess }) => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);

  const [seoData, setSeoData] = useState({
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    product_name: "",
    product_slug: "",
    description: "",
    price: "",
    category: "",
    brandName: "",
  });

  const [contentBlocks, setContentBlocks] = useState([]);
  const [productImages, setProductImages] = useState([]); // Store product images
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiConfig, setAiConfig] = useState({ configured: false, message: "" });

  const [validation, setValidation] = useState({
    title: { isValid: true, message: "" },
    description: { isValid: true, message: "" },
    keywords: { isValid: true, message: "" },
  });

  const SEO_LIMITS = {
    title: { min: 30, max: 60, optimal: 55 },
    description: { min: 120, max: 160, optimal: 155 },
    keywords: { max: 10 },
  };

  useEffect(() => {
    fetchProducts();
    const config = checkGeminiConfig();
    setAiConfig(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchProductDetail(selectedProductId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId]);

  // ============== Data fetching ==============
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
      if (!selectedProductId && data && data.length > 0) {
        setSelectedProductId(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      alert("❌ Lỗi khi tải danh sách sản phẩm: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetail = async (productId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images (
            id,
            image_url,
            is_primary,
            display_order
          )
        `)
        .eq("id", productId)
        .single();

      if (error) throw error;

      const brandFromDb = data.brand_name || data.brandName || "";

      // Extract product images from product_images table
      const images = [];
      console.log('[Editor] 📥 Fetching product data:', {
        productId,
        productName: data.name,
        hasProductImages: !!data.product_images,
        productImagesCount: Array.isArray(data.product_images) ? data.product_images.length : 0,
        productImages: data.product_images,
      });

      if (Array.isArray(data.product_images) && data.product_images.length > 0) {
        // Sort by display_order and extract URLs
        const sortedImages = data.product_images
          .sort((a, b) => (a.display_order || 99) - (b.display_order || 99));
        
        sortedImages.forEach(img => {
          if (img.image_url) {
            images.push(img.image_url);
            console.log('[Editor] ✅ Added image:', img.image_url, `(primary: ${img.is_primary}, order: ${img.display_order})`);
          }
        });
      } else {
        console.warn('[Editor] ⚠️ No product_images found for this product');
      }
      
      console.log(`[Editor] 🎯 Total images extracted: ${images.length}`, images);
      setProductImages(images);

      setSeoData({
        seo_title: data.seo_title || "",
        seo_description: data.seo_description || "",
        seo_keywords: data.seo_keywords || "",
        product_name: data.name,
        product_slug: data.slug,
        description: data.description || "",
        price: data.price || "",
        category: data.category || data.categorySlug || "",
        brandName: brandFromDb,
      });

      if (data.attributes && data.attributes.content_blocks) {
        // ensure blocks have ids
        const blocks = data.attributes.content_blocks.map((b, i) => ({
          id: b.id || Date.now() + i,
          ...b,
        }));
        setContentBlocks(blocks);
      } else {
        setContentBlocks([
          {
            id: Date.now(),
            type: "text",
            content: data.description || "",
            title: "Giới thiệu chung",
          },
        ]);
      }

      validateField("seo_title", data.seo_title || "");
      validateField("seo_description", data.seo_description || "");
      validateField("seo_keywords", data.seo_keywords || "");
    } catch (err) {
      console.error("Error fetching product:", err);
      alert("❌ Lỗi khi tải chi tiết sản phẩm: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // ============== Helpers & validation ==============
  const handleSEOChange = (field, value) => {
    setSeoData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const validateField = (field, value) => {
    const newValidation = { ...validation };

    switch (field) {
      case "seo_title": {
        const titleLength = (value || "").length;
        if (titleLength === 0) {
          newValidation.title = { isValid: true, message: "Để trống sẽ dùng tên sản phẩm" };
        } else if (titleLength < SEO_LIMITS.title.min) {
          newValidation.title = { isValid: false, message: `Quá ngắn (tối thiểu ${SEO_LIMITS.title.min} ký tự)` };
        } else if (titleLength > SEO_LIMITS.title.max) {
          newValidation.title = { isValid: false, message: `Quá dài (tối đa ${SEO_LIMITS.title.max} ký tự)` };
        } else if (titleLength >= SEO_LIMITS.title.min && titleLength <= SEO_LIMITS.title.optimal) {
          newValidation.title = { isValid: true, message: "Độ dài tối ưu!" };
        } else {
          newValidation.title = { isValid: true, message: "Chấp nhận được" };
        }
        break;
      }
      case "seo_description": {
        const descLength = (value || "").length;
        if (descLength === 0) {
          newValidation.description = { isValid: true, message: "Để trống sẽ dùng mô tả sản phẩm" };
        } else if (descLength < SEO_LIMITS.description.min) {
          newValidation.description = { isValid: false, message: `Quá ngắn (tối thiểu ${SEO_LIMITS.description.min} ký tự)` };
        } else if (descLength > SEO_LIMITS.description.max) {
          newValidation.description = { isValid: false, message: `Quá dài (tối đa ${SEO_LIMITS.description.max} ký tự)` };
        } else if (descLength >= SEO_LIMITS.description.min && descLength <= SEO_LIMITS.description.optimal) {
          newValidation.description = { isValid: true, message: "Độ dài tối ưu!" };
        } else {
          newValidation.description = { isValid: true, message: "Chấp nhận được" };
        }
        break;
      }
      case "seo_keywords": {
        const keywords = (value || "").split(",").map((k) => k.trim()).filter(Boolean);
        if (keywords.length === 0) {
          newValidation.keywords = { isValid: true, message: "Để trống được phép" };
        } else if (keywords.length > SEO_LIMITS.keywords.max) {
          newValidation.keywords = { isValid: false, message: `Quá nhiều từ khóa (tối đa ${SEO_LIMITS.keywords.max})` };
        } else {
          newValidation.keywords = { isValid: true, message: `${keywords.length} từ khóa` };
        }
        break;
      }
      default:
        break;
    }

    setValidation(newValidation);
  };

  const getProgressColor = (current, max, optimal) => {
    if (!current) return "bg-gray-300";
    if (current < optimal * 0.5) return "bg-red-500";
    if (current <= optimal) return "bg-green-500";
    if (current <= max) return "bg-yellow-500";
    return "bg-red-500";
  };

  // ============== AI integration ==============
  const handleGenerateFullSEO = async () => {
    if (!aiConfig.configured) {
      alert("⚠️ Gemini API chưa được cấu hình!\n" + aiConfig.message);
      return;
    }
    if (!window.confirm("🤖 Tạo nội dung SEO tự động?\n\nNội dung hiện tại sẽ được thay thế.")) return;

    try {
      setGeneratingContent(true);

      // Debug: Check product images state
      console.log('[Editor] 🖼️ Product images state:', productImages);
      console.log('[Editor] 📊 Product images count:', productImages.length);

      // Prepare payload with real product images and brand
      const payload = {
        productName: seoData.product_name,
        productDescription: seoData.description,
        productPrice: seoData.price ? String(seoData.price) : undefined,
        productCategory: seoData.category,
        brandName: seoData.brandName || undefined, // Always include brand if available
        tone: "friendly",
        // Pass product images to AI service
        productImages: productImages.length > 0 ? productImages : undefined,
      };

      console.log('[Editor] 📤 Sending payload to AI:', {
        productName: payload.productName,
        brandName: payload.brandName,
        hasProductImages: !!payload.productImages,
        productImagesCount: payload.productImages?.length || 0,
        productImages: payload.productImages,
      });

      const result = await generateSEOContent(payload);

      // map/normalize
      const seoTitle = result.seoTitle || result.seo_title || "";
      const seoDescription = result.seoDescription || result.seo_description || "";
      const seoKeywords =
        result.seoKeywords ||
        result.seo_keywords ||
        (result.seo_keywords_list ? result.seo_keywords_list.join(", ") : "") ||
        (Array.isArray(result.keywords) ? result.keywords.join(", ") : "") ||
        result.keywords ||
        "";

      setSeoData((prev) => ({
        ...prev,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
      }));

      const blocks = Array.isArray(result.contentBlocks)
        ? result.contentBlocks
        : Array.isArray(result.content_blocks)
        ? result.content_blocks
        : [];

      // Give ids and basic normalization, replacing placeholder URLs with real product images
      const normalized = (blocks || []).map((b, i) => {
        const blockUrl = b.url || b.image || b.src || "";
        
        // Check if URL is placeholder or invalid
        const isPlaceholder = !blockUrl || 
          blockUrl.trim() === "" || 
          /^(example|placeholder|null|undefined|https?:\/\/example\.com)/i.test(blockUrl);
        
        // Use real product image if placeholder, or keep original if valid
        const finalUrl = isPlaceholder && productImages.length > 0 
          ? productImages[i % productImages.length]  // Cycle through available images
          : blockUrl;

        return {
          id: b.id || Date.now() + i,
          type: b.type || "text",
          title: b.title || b.label || "",
          content: b.content || b.text || "",
          url: finalUrl,
          alt: b.alt || b.alt_text || "",
          caption: b.caption || b.caption_text || "",
        };
      });

      setContentBlocks(normalized);

      // Try to auto-analyze images in returned blocks (fill missing alt/caption)
      if (aiConfig.configured) {
        const imageBlocks = normalized.filter((b) => b.type === "image" && b.url && (!b.alt || !b.caption));
        if (imageBlocks.length > 0) {
          setAnalyzingImage(true);
          for (const b of imageBlocks) {
            try {
              const analysis = await analyzeProductImage(b.url, seoData.product_name);
              updateBlock(b.id, {
                alt: b.alt || analysis.suggestedAltText,
                caption: b.caption || analysis.suggestedCaption,
              });
            } catch (err) {
              // ignore per-block errors
              console.warn("Image analysis error for", b.url, err);
            }
          }
          setAnalyzingImage(false);
        }
      }

      // Validate fields
      validateField("seo_title", seoTitle);
      validateField("seo_description", seoDescription);
      validateField("seo_keywords", seoKeywords);

      alert("✅ Đã tạo nội dung SEO tự động thành công!");
    } catch (err) {
      console.error("Error generating SEO:", err);
      alert("❌ " + (err.message || err));
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleGenerateBlock = async (blockType) => {
    if (!aiConfig.configured) {
      alert("⚠️ Gemini API chưa được cấu hình!");
      return;
    }

    try {
      setGeneratingContent(true);
      const result = await generateContentBlock(blockType, {
        productName: seoData.product_name,
        productDescription: seoData.description,
        brandName: seoData.brandName || undefined, // Always include brand if available
      });

      const newBlock = {
        id: Date.now(),
        type: "text",
        title: result.title || "",
        content: result.content || "",
      };
      setContentBlocks((p) => [...p, newBlock]);
      alert("✅ Đã tạo khối nội dung!");
    } catch (err) {
      console.error("Error generating block:", err);
      alert("❌ " + (err.message || err));
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleAnalyzeImage = async (blockId) => {
    if (!aiConfig.configured) {
      alert("⚠️ Gemini API chưa được cấu hình!");
      return;
    }
    const block = contentBlocks.find((b) => b.id === blockId);
    if (!block || !block.url) {
      alert("⚠️ Vui lòng tải ảnh lên trước!");
      return;
    }

    try {
      setAnalyzingImage(true);
      const result = await analyzeProductImage(block.url, seoData.product_name);
      updateBlock(blockId, {
        alt: result.suggestedAltText,
        caption: result.suggestedCaption,
      });
      alert(`✅ Đã phân tích ảnh!\n\n📝 Mô tả: ${result.description}\n\n🏷️ Từ khóa: ${result.keywords?.join(", ") || ""}`);
    } catch (err) {
      console.error("Error analyzing image:", err);
      alert("❌ " + (err.message || err));
    } finally {
      setAnalyzingImage(false);
    }
  };

  // ============== Upload & block helpers ==============
  const handleImageUpload = async (blockId, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("⚠️ Vui lòng chọn file ảnh!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("⚠️ Kích thước ảnh không được vượt quá 5MB!");
      return;
    }

    try {
      setUploadingImage(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;
      const { data, error } = await supabase.storage.from("product-images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;
      updateBlock(blockId, { url: publicUrl });
      alert("✅ Tải ảnh lên thành công!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Lỗi khi tải ảnh lên: " + (err.message || err));
    } finally {
      setUploadingImage(false);
    }
  };

  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type,
      ...(type === "text" ? { title: "", content: "" } : { url: "", alt: "", caption: "" }),
    };
    setContentBlocks((p) => [...p, newBlock]);
  };

  const updateBlock = (id, updates) => {
    setContentBlocks((p) => p.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteBlock = (id) => {
    if (window.confirm("Xóa khối nội dung này?")) {
      setContentBlocks((p) => p.filter((b) => b.id !== id));
    }
  };

  const moveBlock = (id, direction) => {
    setContentBlocks((p) => {
      const index = p.findIndex((b) => b.id === id);
      if (index === -1) return p;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= p.length) return p;
      const arr = [...p];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  // ============== Save ==============
 const handleSave = async () => {
    try {
      setSaving(true);
      const attributes = { content_blocks: contentBlocks };
      const { error } = await supabase
        .from("products")
        .update({
          seo_title: seoData.seo_title,
          seo_description: seoData.seo_description,
          seo_keywords: seoData.seo_keywords,
          attributes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedProductId);

      if (error) throw error;
      
      alert("✅ Lưu thành công!");
      
      // Callback để refresh danh sách
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err) {
      console.error("Error saving:", err);
      alert("❌ Lỗi khi lưu: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // ============== Render ==============
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Product Selector */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Chọn sản phẩm để chỉnh sửa SEO</label>
        <select
          value={selectedProductId || ""}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} (/{product.slug})
            </option>
          ))}
        </select>
      </div>

      {selectedProductId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Panel */}
            {aiConfig.configured && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Trợ lý AI</h3>
                    {productImages.length > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        📸 {productImages.length} ảnh
                      </span>
                    )}
                    {seoData.brandName && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        🏷️ {seoData.brandName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowAIPanel(!showAIPanel)} className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                      {showAIPanel ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                </div>

                {showAIPanel && (
                  <div className="space-y-3">
                    {/* Brand Info Notice */}
                    {seoData.brandName && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">🏷️</span>
                          <div>
                            <p className="font-semibold text-blue-900">Tích hợp thương hiệu: {seoData.brandName}</p>
                            <p className="text-blue-700 text-xs mt-1">
                              AI sẽ tự động thêm "{seoData.brandName}" vào SEO title, description, keywords và content để tăng nhận diện thương hiệu
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={handleGenerateFullSEO}
                      disabled={generatingContent}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      {generatingContent ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Tạo toàn bộ SEO tự động
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleGenerateBlock("introduction")}
                        disabled={generatingContent}
                        className="px-3 py-2 bg-white border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition text-sm disabled:opacity-50"
                      >
                        <FileText className="w-4 h-4 inline mr-1" />
                        Giới thiệu
                      </button>
                      <button
                        onClick={() => handleGenerateBlock("features")}
                        disabled={generatingContent}
                        className="px-3 py-2 bg-white border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition text-sm disabled:opacity-50"
                      >
                        <FileText className="w-4 h-4 inline mr-1" />
                        Đặc điểm
                      </button>
                      <button
                        onClick={() => handleGenerateBlock("styling")}
                        disabled={generatingContent}
                        className="px-3 py-2 bg-white border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition text-sm disabled:opacity-50"
                      >
                        <FileText className="w-4 h-4 inline mr-1" />
                        Phối đồ
                      </button>
                      <button
                        onClick={() => handleGenerateBlock("care")}
                        disabled={generatingContent}
                        className="px-3 py-2 bg-white border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition text-sm disabled:opacity-50"
                      >
                        <FileText className="w-4 h-4 inline mr-1" />
                        Bảo quản
                      </button>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
                      <div className="space-y-1">
                        <p className="font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI sẽ tự động:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 ml-4">
                          {seoData.brandName && (
                            <li>Tích hợp thương hiệu <strong>{seoData.brandName}</strong> vào title, description & keywords</li>
                          )}
                          {productImages.length > 0 && (
                            <li>Phân tích và mô tả <strong>{productImages.length} ảnh</strong> sản phẩm</li>
                          )}
                          <li>Tạo nội dung SEO tối ưu với từ khóa phù hợp</li>
                          <li>Đề xuất alt text & caption cho từng ảnh</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SEO Metadata */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">SEO Metadata</h3>

              <div className="space-y-4">
                {/* SEO Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title</label>
                  <input
                    type="text"
                    value={seoData.seo_title}
                    onChange={(e) => handleSEOChange("seo_title", e.target.value)}
                    placeholder={`Để trống sẽ dùng: ${seoData.product_name}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className={validation.title.isValid ? "text-green-600" : "text-red-600"}>{validation.title.message}</span>
                    <span className="text-gray-500">{seoData.seo_title.length} / {SEO_LIMITS.title.optimal} ký tự</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(seoData.seo_title.length, SEO_LIMITS.title.max, SEO_LIMITS.title.optimal)}`}
                      style={{ width: `${Math.min((seoData.seo_title.length / SEO_LIMITS.title.max) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* SEO Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description</label>
                  <textarea
                    value={seoData.seo_description}
                    onChange={(e) => handleSEOChange("seo_description", e.target.value)}
                    placeholder="Mô tả ngắn gọn, hấp dẫn để hiển thị trên kết quả tìm kiếm"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className={validation.description.isValid ? "text-green-600" : "text-red-600"}>{validation.description.message}</span>
                    <span className="text-gray-500">{seoData.seo_description.length} / {SEO_LIMITS.description.optimal} ký tự</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(seoData.seo_description.length, SEO_LIMITS.description.max, SEO_LIMITS.description.optimal)}`}
                      style={{ width: `${Math.min((seoData.seo_description.length / SEO_LIMITS.description.max) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* SEO Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SEO Keywords</label>
                  <input
                    type="text"
                    value={seoData.seo_keywords}
                    onChange={(e) => handleSEOChange("seo_keywords", e.target.value)}
                    placeholder="áo sơ mi, thời trang công sở, cao cấp"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="mt-2 text-sm">
                    <span className={validation.keywords.isValid ? "text-green-600" : "text-red-600"}>
                      {validation.keywords.message}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Blocks */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Nội dung chi tiết</h3>
                <div className="flex gap-2">
                  <button onClick={() => addBlock("text")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                    <Type className="w-4 h-4" /> Thêm văn bản
                  </button>
                  <button onClick={() => addBlock("image")} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                    <Image className="w-4 h-4" /> Thêm ảnh
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {contentBlocks.map((block, index) => (
                  <div key={block.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {block.type === "text" ? <Type className="w-4 h-4 text-blue-600" /> : <Image className="w-4 h-4 text-green-600" />}
                        <span className="text-sm font-semibold">{block.type === "text" ? "Khối văn bản" : "Khối hình ảnh"} #{index + 1}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => moveBlock(block.id, "up")} disabled={index === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30">
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => moveBlock(block.id, "down")} disabled={index === contentBlocks.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30">
                          <MoveDown className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteBlock(block.id)} className="p-1 hover:bg-red-100 rounded text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {block.type === "text" ? (
                      <div className="space-y-2">
                        <input type="text" value={block.title || ""} onChange={(e) => updateBlock(block.id, { title: e.target.value })} placeholder="Tiêu đề phần (tùy chọn)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <textarea value={block.content || ""} onChange={(e) => updateBlock(block.id, { content: e.target.value })} placeholder="Nội dung văn bản (hỗ trợ HTML: <strong>, <em>, <br>)" rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none font-mono" />
                        <p className="text-xs text-gray-500">💡 Có thể dùng: &lt;strong&gt;in đậm&lt;/strong&gt;, &lt;em&gt;in nghiêng&lt;/em&gt;</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
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
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(block.id, e.target.files ? e.target.files[0] : null)} className="hidden" disabled={uploadingImage} />
                          </label>

                          {aiConfig.configured && block.url && (
                            <button onClick={() => handleAnalyzeImage(block.id)} disabled={analyzingImage} className="px-4 py-3 bg-purple-50 border-2 border-purple-300 rounded-lg hover:bg-purple-100 transition text-sm font-medium text-purple-600 disabled:opacity-50 flex items-center gap-2">
                              {analyzingImage ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" /> Phân tích...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4" /> AI phân tích
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="relative">
                          <input type="text" value={block.url || ""} onChange={(e) => updateBlock(block.id, { url: e.target.value })} placeholder="Hoặc nhập URL hình ảnh" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>

                        {block.url && <img src={block.url} alt={block.alt || "Product image"} className="w-full rounded-lg max-h-64 object-cover" onError={(e) => (e.target.style.display = "none")} />}

                        <input type="text" value={block.caption || ""} onChange={(e) => updateBlock(block.id, { caption: e.target.value })} placeholder="Chú thích ảnh (hiển thị dưới ảnh)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <input type="text" value={block.alt || ""} onChange={(e) => updateBlock(block.id, { alt: e.target.value })} placeholder="Alt text (quan trọng cho SEO)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <p className="text-xs text-gray-500">📸 Chọn "Tải ảnh lên" để upload từ máy tính, sau đó dùng "AI phân tích" để tạo alt text tự động</p>
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

            <button onClick={handleSave} disabled={saving} className="w-full bg-black text-white py-4 rounded-lg hover:bg-gray-800 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Lưu tất cả thay đổi
                </>
              )}
            </button>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" /> Xem trước
              </h3>
              <div className="border border-gray-200 rounded-lg p-6 bg-white space-y-6 max-h-[600px] overflow-y-auto">
                {contentBlocks.map((block) => (
                  <div key={block.id}>
                    {block.type === "text" ? (
                      <div>
                        {block.title && <h3 className="text-xl font-bold mb-3">{block.title}</h3>}
                        <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: block.content }} />
                      </div>
                    ) : (
                      <figure className="my-6">
                        {block.url && <img src={block.url} alt={block.alt || "Product image"} className="w-full rounded-lg shadow-md" />}
                        {block.caption && <figcaption className="text-center text-sm text-gray-500 mt-3 italic">{block.caption}</figcaption>}
                      </figure>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOContentEditor;