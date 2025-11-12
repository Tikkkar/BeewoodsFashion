import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Circle,
  Sparkles,
  Filter,
  Eye,
  EyeOff,
  TrendingUp
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import SEOContentEditor from "../../components/admin/SEOContentEditor";

const SEOManagerPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get("productId") || null;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, optimized, partial, none
  const [showProductList, setShowProductList] = useState(true);

  useEffect(() => {
    fetchProductsWithSEOStatus();
  }, []);

  const fetchProductsWithSEOStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, 
          name, 
          slug,
          seo_title,
          seo_description,
          seo_keywords,
          attributes,
          brand_name,
          product_images(image_url, is_primary)
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      // Calculate SEO status for each product
      const productsWithStatus = data.map(product => {
        const status = calculateSEOStatus(product);
        const primaryImage = product.product_images?.find(img => img.is_primary)?.image_url 
          || product.product_images?.[0]?.image_url;
        
        return {
          ...product,
          seoStatus: status,
          primaryImage
        };
      });

      setProducts(productsWithStatus);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSEOStatus = (product) => {
    const hasTitle = product.seo_title && product.seo_title.length >= 30;
    const hasDescription = product.seo_description && product.seo_description.length >= 120;
    const hasKeywords = product.seo_keywords && product.seo_keywords.split(",").length >= 3;
    const hasContentBlocks = product.attributes?.content_blocks && product.attributes.content_blocks.length > 0;

    const score = [hasTitle, hasDescription, hasKeywords, hasContentBlocks].filter(Boolean).length;

    if (score === 4) return { level: "optimized", label: "Đã tối ưu", color: "green", score: 100 };
    if (score >= 2) return { level: "partial", label: "Chưa đầy đủ", color: "yellow", score: score * 25 };
    return { level: "none", label: "Chưa tối ưu", color: "red", score: 0 };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && product.seoStatus.level === filterStatus;
  });

  const stats = {
    total: products.length,
    optimized: products.filter(p => p.seoStatus.level === "optimized").length,
    partial: products.filter(p => p.seoStatus.level === "partial").length,
    none: products.filter(p => p.seoStatus.level === "none").length,
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      green: "bg-green-100 text-green-800 border-green-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      red: "bg-red-100 text-red-800 border-red-200"
    };

    const icons = {
      green: <CheckCircle2 className="w-4 h-4" />,
      yellow: <AlertCircle className="w-4 h-4" />,
      red: <Circle className="w-4 h-4" />
    };

    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${colors[status.color]}`}>
        {icons[status.color]}
        {status.label}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin/products")}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  Quản lý SEO & Nội dung
                </h1>
                <p className="text-sm text-gray-600">
                  Tối ưu SEO cho sản phẩm - {stats.optimized}/{stats.total} đã hoàn thiện
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowProductList(!showProductList)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              {showProductList ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showProductList ? "Ẩn danh sách" : "Hiện danh sách"}
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-600">Tổng sản phẩm</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 cursor-pointer hover:bg-green-100 transition" onClick={() => setFilterStatus("optimized")}>
              <div className="text-2xl font-bold text-green-600">{stats.optimized}</div>
              <div className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Đã tối ưu
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 cursor-pointer hover:bg-yellow-100 transition" onClick={() => setFilterStatus("partial")}>
              <div className="text-2xl font-bold text-yellow-600">{stats.partial}</div>
              <div className="text-xs text-yellow-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Chưa đầy đủ
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition" onClick={() => setFilterStatus("none")}>
              <div className="text-2xl font-bold text-red-600">{stats.none}</div>
              <div className="text-xs text-red-700 flex items-center gap-1">
                <Circle className="w-3 h-3" /> Chưa tối ưu
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Product List Sidebar */}
          {showProductList && (
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
                {/* Search & Filter */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterStatus("all")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        filterStatus === "all" 
                          ? "bg-purple-100 text-purple-700 border-2 border-purple-300" 
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setFilterStatus("none")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        filterStatus === "none" 
                          ? "bg-red-100 text-red-700 border-2 border-red-300" 
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Chưa làm
                    </button>
                  </div>
                </div>

                {/* Product List */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">Đang tải...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Không tìm thấy sản phẩm
                    </div>
                  ) : (
                    filteredProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setSearchParams({ productId: product.id });
                        }}
                        className={`w-full text-left p-3 rounded-lg border-2 transition ${
                          productId === product.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Product Image */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {product.primaryImage ? (
                              <img
                                src={product.primaryImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Sparkles className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {product.name}
                            </h4>
                            {product.brand_name && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                🏷️ {product.brand_name}
                              </p>
                            )}
                            <div className="mt-2">
                              <StatusBadge status={product.seoStatus} />
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mt-2">
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    product.seoStatus.color === "green" ? "bg-green-500" :
                                    product.seoStatus.color === "yellow" ? "bg-yellow-500" :
                                    "bg-red-500"
                                  }`}
                                  style={{ width: `${product.seoStatus.score}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Editor */}
          <div className={showProductList ? "lg:col-span-8" : "lg:col-span-12"}>
            {productId ? (
              <div className="bg-white rounded-lg shadow-sm">
                <SEOContentEditor 
                  initialProductId={productId} 
                  onSaveSuccess={fetchProductsWithSEOStatus}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Chọn sản phẩm để tối ưu SEO
                </h3>
                <p className="text-gray-600">
                  Chọn một sản phẩm từ danh sách bên trái để bắt đầu chỉnh sửa nội dung SEO
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOManagerPage;