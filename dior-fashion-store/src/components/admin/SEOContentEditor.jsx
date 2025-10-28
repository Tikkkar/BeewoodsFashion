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

const SEOContentEditor = ({ initialProductId = null }) => {
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
  });

  const [contentBlocks, setContentBlocks] = useState([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiConfig, setAiConfig] = useState({ configured: false, message: "" });

  const [validation, setValidation] = useState({
    title: { isValid: true, message: "" },
    description: { isValid: true, message: "" },
    keywords: { isValid: true, message: "" },
  });

  const [showPreview, setShowPreview] = useState(false);

  const SEO_LIMITS = {
    title: { min: 30, max: 60, optimal: 55 },
    description: { min: 120, max: 160, optimal: 155 },
    keywords: { max: 10 },
  };

  useEffect(() => {
    fetchProducts();
    // Check Gemini config
    const config = checkGeminiConfig();
    setAiConfig(config);
    console.log("🤖 Gemini status:", config.message);
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
        .from("products")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      setProducts(data || []);

      if (!selectedProductId && data && data.length > 0) {
        setSelectedProductId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("❌ Lỗi khi tải danh sách sản phẩm: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetail = async (productId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) throw error;

      setSeoData({
        seo_title: data.seo_title || "",
        seo_description: data.seo_description || "",
        seo_keywords: data.seo_keywords || "",
        product_name: data.name,
        product_slug: data.slug,
        description: data.description || "",
        price: data.price || "",
        category: data.category || "",
      });

      if (data.attributes && data.attributes.content_blocks) {
        setContentBlocks(data.attributes.content_blocks);
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
    } catch (error) {
      console.error("Error fetching product:", error);
      alert("❌ Lỗi khi tải chi tiết sản phẩm: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSEOChange = (field, value) => {
    setSeoData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const validateField = (field, value) => {
    const newValidation = { ...validation };

    switch (field) {
      case "seo_title":
        const titleLength = value.length;
        if (titleLength === 0) {
          newValidation.title = {
            isValid: true,
            message: "Để trống sẽ dùng tên sản phẩm",
          };
        } else if (titleLength < SEO_LIMITS.title.min) {
          newValidation.title = {
            isValid: false,
            message: `Quá ngắn (tối thiểu ${SEO_LIMITS.title.min} ký tự)`,
          };
        } else if (titleLength > SEO_LIMITS.title.max) {
          newValidation.title = {
            isValid: false,
            message: `Quá dài (tối đa ${SEO_LIMITS.title.max} ký tự)`,
          };
        } else if (
          titleLength >= SEO_LIMITS.title.min &&
          titleLength <= SEO_LIMITS.title.optimal
        ) {
          newValidation.title = { isValid: true, message: "Độ dài tối ưu!" };
        } else {
          newValidation.title = { isValid: true, message: "Chấp nhận được" };
        }
        break;

      case "seo_description":
        const descLength = value.length;
        if (descLength === 0) {
          newValidation.description = {
            isValid: true,
            message: "Để trống sẽ dùng mô tả sản phẩm",
          };
        } else if (descLength < SEO_LIMITS.description.min) {
          newValidation.description = {
            isValid: false,
            message: `Quá ngắn (tối thiểu ${SEO_LIMITS.description.min} ký tự)`,
          };
        } else if (descLength > SEO_LIMITS.description.max) {
          newValidation.description = {
            isValid: false,
            message: `Quá dài (tối đa ${SEO_LIMITS.description.max} ký tự)`,
          };
        } else if (
          descLength >= SEO_LIMITS.description.min &&
          descLength <= SEO_LIMITS.description.optimal
        ) {
          newValidation.description = {
            isValid: true,
            message: "Độ dài tối ưu!",
          };
        } else {
          newValidation.description = {
            isValid: true,
            message: "Chấp nhận được",
          };
        }
        break;

      case "seo_keywords":
        const keywords = value.split(",").filter((k) => k.trim());
        if (keywords.length === 0) {
          newValidation.keywords = {
            isValid: true,
            message: "Để trống được phép",
          };
        } else if (keywords.length > SEO_LIMITS.keywords.max) {
          newValidation.keywords = {
            isValid: false,
            message: `Quá nhiều từ khóa (tối đa ${SEO_LIMITS.keywords.max})`,
          };
        } else {
          newValidation.keywords = {
            isValid: true,
            message: `${keywords.length} từ khóa`,
          };
        }
        break;
    }

    setValidation(newValidation);
  };

  const getProgressColor = (current, max, optimal) => {
    if (current === 0) return "bg-gray-300";
    if (current < optimal * 0.5) return "bg-red-500";
    if (current <= optimal) return "bg-green-500";
    if (current <= max) return "bg-yellow-500";
    return "bg-red-500";
  };

  // ============================================
  // AI FUNCTIONS
  // ============================================

  /**
   * Tự động tạo toàn bộ nội dung SEO bằng AI
   */
  const handleGenerateFullSEO = async () => {
    if (!aiConfig.configured) {
      alert("⚠️ Gemini API chưa được cấu hình!\n" + aiConfig.message);
      return;
    }

    if (
      !window.confirm(
        "🤖 Tạo nội dung SEO tự động?\n\nNội dung hiện tại sẽ được thay thế."
      )
    ) {
      return;
    }

    try {
      setGeneratingContent(true);

      const result = await generateSEOContent({
        productName: seoData.product_name,
        productDescription: seoData.description,
        productPrice: seoData.price,
        productCategory: seoData.category,
        tone: "friendly",
      });

      // Update SEO fields
      setSeoData((prev) => ({
        ...prev,
        seo_title: result.seoTitle,
        seo_description: result.seoDescription,
        seo_keywords: result.seoKeywords,
      }));

      // Update content blocks với IDs mới
      const blocksWithIds = result.contentBlocks.map((block) => ({
        ...block,
        id: Date.now() + Math.random(),
      }));
      setContentBlocks(blocksWithIds);

      // Validate lại
      validateField("seo_title", result.seoTitle);
      validateField("seo_description", result.seoDescription);
      validateField("seo_keywords", result.seoKeywords);

      alert("✅ Đã tạo nội dung SEO tự động thành công!");
    } catch (error) {
      console.error("Error generating SEO:", error);
      alert("❌ " + error.message);
    } finally {
      setGeneratingContent(false);
    }
  };

  /**
   * Tạo một khối nội dung cụ thể
   */
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
      });

      const newBlock = {
        id: Date.now(),
        type: "text",
        title: result.title,
        content: result.content,
      };

      setContentBlocks((prev) => [...prev, newBlock]);
      alert("✅ Đã tạo khối nội dung!");
    } catch (error) {
      console.error("Error generating block:", error);
      alert("❌ " + error.message);
    } finally {
      setGeneratingContent(false);
    }
  };

  /**
   * Phân tích ảnh sản phẩm bằng AI
   */
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

      // Update block với thông tin AI tạo
      updateBlock(blockId, {
        alt: result.suggestedAltText,
        caption: result.suggestedCaption,
      });

      alert(
        `✅ Đã phân tích ảnh!\n\n📝 Mô tả: ${
          result.description
        }\n\n🏷️ Từ khóa: ${result.keywords.join(", ")}`
      );
    } catch (error) {
      console.error("Error analyzing image:", error);
      alert("❌ " + error.message);
    } finally {
      setAnalyzingImage(false);
    }
  };

  // ✅ UPLOAD IMAGE TO SUPABASE STORAGE
  const handleImageUpload = async (blockId, file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("⚠️ Vui lòng chọn file ảnh!");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("⚠️ Kích thước ảnh không được vượt quá 5MB!");
      return;
    }

    try {
      setUploadingImage(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      console.log("📤 Uploading to Supabase Storage:", filePath);

      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      console.log("✅ Upload success:", publicUrl);

      updateBlock(blockId, { url: publicUrl });

      alert("✅ Tải ảnh lên thành công!");
    } catch (error) {
      console.error("❌ Upload error:", error);
      alert("❌ Lỗi khi tải ảnh lên: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type,
      ...(type === "text"
        ? { title: "", content: "" }
        : { url: "", alt: "", caption: "" }),
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateBlock = (id, updates) => {
    setContentBlocks(
      contentBlocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      )
    );
  };

  const deleteBlock = (id) => {
    if (window.confirm("Xóa khối nội dung này?")) {
      setContentBlocks(contentBlocks.filter((block) => block.id !== id));
    }
  };

  const moveBlock = (id, direction) => {
    const index = contentBlocks.findIndex((block) => block.id === id);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= contentBlocks.length) return;

    const newBlocks = [...contentBlocks];
    [newBlocks[index], newBlocks[newIndex]] = [
      newBlocks[newIndex],
      newBlocks[index],
    ];
    setContentBlocks(newBlocks);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("products")
        .update({
          seo_title: seoData.seo_title,
          seo_description: seoData.seo_description,
          seo_keywords: seoData.seo_keywords,
          attributes: {
            content_blocks: contentBlocks,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedProductId);

      if (error) throw error;

      alert("✅ Lưu thành công!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("❌ Lỗi khi lưu: " + error.message);
    } finally {
      setSaving(false);
    }
  };

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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn sản phẩm để chỉnh sửa SEO
        </label>
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
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">
                      Trợ lý AI
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAIPanel(!showAIPanel)}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    {showAIPanel ? "Ẩn" : "Hiện"}
                  </button>
                </div>

                {showAIPanel && (
                  <div className="space-y-3">
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

                    <p className="text-xs text-purple-700 text-center mt-2">
                      💡 AI sẽ phân tích sản phẩm và tạo nội dung SEO tối ưu
                    </p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={seoData.seo_title}
                    onChange={(e) =>
                      handleSEOChange("seo_title", e.target.value)
                    }
                    placeholder={`Để trống sẽ dùng: ${seoData.product_name}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span
                      className={
                        validation.title.isValid
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {validation.title.message}
                    </span>
                    <span className="text-gray-500">
                      {seoData.seo_title.length} / {SEO_LIMITS.title.optimal} ký
                      tự
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(
                        seoData.seo_title.length,
                        SEO_LIMITS.title.max,
                        SEO_LIMITS.title.optimal
                      )}`}
                      style={{
                        width: `${Math.min(
                          (seoData.seo_title.length / SEO_LIMITS.title.max) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* SEO Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description
                  </label>
                  <textarea
                    value={seoData.seo_description}
                    onChange={(e) =>
                      handleSEOChange("seo_description", e.target.value)
                    }
                    placeholder="Mô tả ngắn gọn, hấp dẫn để hiển thị trên kết quả tìm kiếm"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span
                      className={
                        validation.description.isValid
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {validation.description.message}
                    </span>
                    <span className="text-gray-500">
                      {seoData.seo_description.length} /{" "}
                      {SEO_LIMITS.description.optimal} ký tự
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(
                        seoData.seo_description.length,
                        SEO_LIMITS.description.max,
                        SEO_LIMITS.description.optimal
                      )}`}
                      style={{
                        width: `${Math.min(
                          (seoData.seo_description.length /
                            SEO_LIMITS.description.max) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* SEO Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Keywords
                  </label>
                  <input
                    type="text"
                    value={seoData.seo_keywords}
                    onChange={(e) =>
                      handleSEOChange("seo_keywords", e.target.value)
                    }
                    placeholder="áo sơ mi, thời trang công sở, cao cấp"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="mt-2 text-sm">
                    <span
                      className={
                        validation.keywords.isValid
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
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
                  <button
                    onClick={() => addBlock("text")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    <Type className="w-4 h-4" />
                    Thêm văn bản
                  </button>
                  <button
                    onClick={() => addBlock("image")}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    <Image className="w-4 h-4" />
                    Thêm ảnh
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {contentBlocks.map((block, index) => (
                  <div
                    key={block.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {block.type === "text" ? (
                          <Type className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Image className="w-4 h-4 text-green-600" />
                        )}
                        <span className="text-sm font-semibold">
                          {block.type === "text"
                            ? "Khối văn bản"
                            : "Khối hình ảnh"}{" "}
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveBlock(block.id, "up")}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveBlock(block.id, "down")}
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

                    {block.type === "text" ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={block.title}
                          onChange={(e) =>
                            updateBlock(block.id, { title: e.target.value })
                          }
                          placeholder="Tiêu đề phần (tùy chọn)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <textarea
                          value={block.content}
                          onChange={(e) =>
                            updateBlock(block.id, { content: e.target.value })
                          }
                          placeholder="Nội dung văn bản (hỗ trợ HTML: <strong>, <em>, <br>)"
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none font-mono"
                        />
                        <p className="text-xs text-gray-500">
                          💡 Có thể dùng: &lt;strong&gt;in đậm&lt;/strong&gt;,
                          &lt;em&gt;in nghiêng&lt;/em&gt;
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
                                  <span className="text-sm text-blue-600 font-medium">
                                    Đang tải lên...
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm text-blue-600 font-medium">
                                    Tải ảnh lên
                                  </span>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageUpload(block.id, e.target.files[0])
                              }
                              className="hidden"
                              disabled={uploadingImage}
                            />
                          </label>

                          {/* AI Analyze Button */}
                          {aiConfig.configured && block.url && (
                            <button
                              onClick={() => handleAnalyzeImage(block.id)}
                              disabled={analyzingImage}
                              className="px-4 py-3 bg-purple-50 border-2 border-purple-300 rounded-lg hover:bg-purple-100 transition text-sm font-medium text-purple-600 disabled:opacity-50 flex items-center gap-2"
                            >
                              {analyzingImage ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Phân tích...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4" />
                                  AI phân tích
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Manual URL Input */}
                        <div className="relative">
                          <input
                            type="text"
                            value={block.url}
                            onChange={(e) =>
                              updateBlock(block.id, { url: e.target.value })
                            }
                            placeholder="Hoặc nhập URL hình ảnh"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>

                        {block.url && (
                          <img
                            src={block.url}
                            alt={block.alt || "Product image"}
                            className="w-full rounded-lg max-h-64 object-cover"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        )}
                        <input
                          type="text"
                          value={block.caption}
                          onChange={(e) =>
                            updateBlock(block.id, { caption: e.target.value })
                          }
                          placeholder="Chú thích ảnh (hiển thị dưới ảnh)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={block.alt}
                          onChange={(e) =>
                            updateBlock(block.id, { alt: e.target.value })
                          }
                          placeholder="Alt text (quan trọng cho SEO)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <p className="text-xs text-gray-500">
                          📸 Chọn "Tải ảnh lên" để upload từ máy tính, sau đó
                          dùng "AI phân tích" để tạo alt text tự động
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
                  <p className="text-sm">
                    Nhấn "Thêm văn bản" hoặc "Thêm ảnh" để bắt đầu
                  </p>
                </div>
              )}
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

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Xem trước
              </h3>
              <div className="border border-gray-200 rounded-lg p-6 bg-white space-y-6 max-h-[600px] overflow-y-auto">
                {contentBlocks.map((block) => (
                  <div key={block.id}>
                    {block.type === "text" ? (
                      <div>
                        {block.title && (
                          <h3 className="text-xl font-bold mb-3">
                            {block.title}
                          </h3>
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
                            alt={block.alt || "Product image"}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOContentEditor;
