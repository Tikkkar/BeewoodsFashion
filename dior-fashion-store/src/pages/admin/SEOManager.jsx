import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SEOContentEditor from "../../components/admin/SEOContentEditor";

/**
 * SEOManagerPage (simplified)
 * - Chỉ hiển thị SEOContentEditor
 * - Lấy productId từ query param ?productId=...
 */
const SEOManagerPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId") || null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin")}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Back to admin"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Quản lý SEO & Nội dung
                </h1>
                <p className="text-sm text-gray-600">
                  Tạo & chỉnh sửa SEO cho sản phẩm
                </p>
              </div>
            </div>

            <div>
              {/* reserved for future top-right actions (kept empty intentionally) */}
            </div>
          </div>
        </div>
      </div>

      {/* Main content: chỉ SEOContentEditor */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <SEOContentEditor initialProductId={productId} />
        </div>
      </main>
    </div>
  );
};

export default SEOManagerPage;
