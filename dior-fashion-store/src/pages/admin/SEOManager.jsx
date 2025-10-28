import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SEOContentEditor from "../../components/admin/SEOContentEditor";

const SEOManagerPage = () => {
  const navigate = useNavigate();

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
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Quản lý SEO & Nội dung
                </h1>
                <p className="text-sm text-gray-600">
                  Tối ưu hóa SEO và nội dung chi tiết cho từng sản phẩm
                </p>
              </div>
            </div>
            <Link
              to="/admin/products"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              Danh sách sản phẩm
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <SEOContentEditor />
    </div>
  );
};

export default SEOManagerPage;
