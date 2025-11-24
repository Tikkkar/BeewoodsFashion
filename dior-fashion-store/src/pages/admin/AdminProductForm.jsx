import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  getAdminProductById,
  getAdminCategories,
  createProduct,
  updateProduct,
  uploadImage,
} from "../../lib/api/admin";
import ImageUpload from "../../components/admin/ImageUpload";
import { X, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";

// Hàm helper để tạo slug
const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};

const generateUniqueSlug = (name) => {
  const baseSlug = slugify(name);
  const timestamp = Date.now().toString().slice(-6);
  return `${baseSlug}-${timestamp}`;
};

const API_BASE_URL =
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "";

const SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  // ✨ THAY ĐỔI: category_id -> category_ids (mảng)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    product_code: "",
    description: "",
    price: "",
    original_price: "",
    stock: "",
    category_ids: [],
    is_active: true,
    is_featured: false,
    weight_g: "",
    length_cm: "",
    width_cm: "",
    height_cm: "",
  });
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([{ size: "", stock: "" }]);
  const [images, setImages] = useState({
    existing: [],
    toUpload: [],
    toRemove: [],
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditing);
  const [uploadProgress, setUploadProgress] = useState(0);

  // AI assist state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiInfo, setAiInfo] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: catData } = await getAdminCategories();
        if (catData) setCategories(catData);

        if (isEditing) {
          const { data: prodData } = await getAdminProductById(id);
          if (prodData) {
            setFormData({
              name: prodData.name || "",
              slug: prodData.slug || "",
              product_code: prodData.product_code || "",
              description: prodData.description || "",
              price: prodData.price || "",
              original_price: prodData.original_price || "",
              stock: prodData.stock || "",
              // ✨ THAY ĐỔI: Lấy mảng ID danh mục từ dữ liệu
              category_ids: prodData.categories?.map((c) => c.id) || [],
              is_active: prodData.is_active,
              is_featured: prodData.is_featured,
              weight_g: prodData.weight_g || "",
              length_cm: prodData.length_cm || "",
              width_cm: prodData.width_cm || "",
              height_cm: prodData.height_cm || "",
            });
            setImages((prev) => ({
              ...prev,
              existing: prodData.product_images?.map((i) => i.image_url) || [],
            }));
            if (prodData.product_sizes?.length) {
              setSizes(prodData.product_sizes);
            } else {
              setSizes([{ size: "", stock: "" }]);
            }
          } else {
            toast.error("Không tìm thấy sản phẩm cần chỉnh sửa."); // Dịch: Could not find product to edit.
            navigate("/admin/products");
          }
        }
      } catch (error) {
        console.error("Load data error:", error);
        toast.error("Không thể tải dữ liệu ban đầu."); // Dịch: Failed to load initial data.
      } finally {
        setPageLoading(false);
      }
    };
    loadData();
  }, [id, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✨ MỚI: Hàm xử lý chọn/bỏ chọn danh mục
  const handleCategoryChange = (categoryId) => {
    setFormData((prev) => {
      const newCategoryIds = prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter((id) => id !== categoryId)
        : [...prev.category_ids, categoryId];
      return { ...prev, category_ids: newCategoryIds };
    });
  };

  const handleSizeChange = (index, field, value) => {
    const newSizes = [...sizes];
    newSizes[index][field] = value;
    setSizes(newSizes);
  };

  const addSize = () => setSizes([...sizes, { size: "", stock: "" }]);
  const removeSize = (index) => setSizes(sizes.filter((_, i) => i !== index));

  const handleFilesChange = (files) =>
    setImages((p) => ({ ...p, toUpload: [...p.toUpload, ...files] }));

  const handleRemoveExisting = (url) =>
    setImages((p) => ({
      ...p,
      existing: p.existing.filter((i) => i !== url),
      toRemove: [...p.toRemove, url],
    }));

  // Lấy URL ảnh đại diện (ưu tiên ảnh đã tồn tại, nếu không dùng ảnh mới đã upload xong)
  const getMainImageUrl = () => {
    if (images.existing && images.existing.length > 0) {
      return images.existing[0];
    }
    // Với ảnh mới, URL chỉ có sau khi upload xong nên dùng finalImageUrls trong submit.
    // Để dùng AI trước khi lưu sản phẩm, bạn có thể upload ảnh tạm lên storage, rồi truyền URL vào đây.
    return null;
  };

  // Gọi Supabase Edge Function product-from-image để gợi ý dữ liệu từ ảnh
  const handleGenerateFromImage = async () => {
    setAiError("");
    setAiInfo("");

    if (!API_BASE_URL || !SUPABASE_ANON_KEY) {
      setAiError(
        "Thiếu cấu hình Supabase URL/ANON_KEY. Vui lòng thiết lập biến môi trường."
      );
      return;
    }

    let mainImageUrl = getMainImageUrl();

    try {
      setAiLoading(true);

      // Nếu chưa có ảnh existing nhưng có ảnh mới, upload tạm ảnh đầu tiên để lấy URL cho AI
      if (!mainImageUrl && images.toUpload.length > 0) {
        try {
          const tempUrl = await compressAndUploadImage(images.toUpload[0]);
          mainImageUrl = tempUrl;
        } catch (uploadErr) {
          console.error("Upload tạm ảnh cho AI thất bại:", uploadErr);
          throw new Error(
            "Không thể upload ảnh để AI phân tích. Vui lòng thử lại."
          );
        }
      }

      if (!mainImageUrl) {
        setAiError(
          "Vui lòng chọn ít nhất một ảnh sản phẩm rồi thử lại."
        );
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/functions/v1/product-from-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            imageUrl: mainImageUrl,
            titleHint: formData.name || "",
            descriptionHint: formData.description || "",
            brandName: "",
            categoryHint: "",
            priceHint: formData.price ? Number(formData.price) : undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Không thể sinh dữ liệu từ ảnh");
      }

      setFormData((prev) => ({
        ...prev,
        name: data.name || prev.name,
        slug: data.slug || prev.slug,
        description: data.description || prev.description,
        price: data.price || prev.price,
        original_price: data.original_price || prev.original_price,
        // category_ids giữ nguyên; admin map thủ công từ data.categories nếu muốn
      }));

      setAiInfo(
        "Đã gợi ý dữ liệu sản phẩm từ ảnh. Vui lòng kiểm tra và chỉnh sửa trước khi lưu."
      );
    } catch (err) {
      console.error("AI generate product-from-image error:", err);
      setAiError(
        err.message ||
        "Có lỗi khi gọi AI. Vui lòng thử lại hoặc nhập thủ công."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const compressAndUploadImage = async (file) => {
    try {
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/jpeg",
      };
      const compressedFile = await imageCompression(file, options);
      return await uploadImage(compressedFile, "products");
    } catch (error) {
      if (file.size < 5 * 1024 * 1024) {
        return await uploadImage(file, "products");
      }
      throw new Error(`Image ${file.name} too large or failed to process`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✨ THAY ĐỔI: Kiểm tra mảng category_ids
    if (!formData.name || formData.category_ids.length === 0) {
      toast.error("Tên sản phẩm và ít nhất một Danh mục là bắt buộc."); // Dịch: Product name and at least one Category are required.
      return;
    }

    if (images.toUpload.length === 0 && images.existing.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hình ảnh sản phẩm."); // Dịch: Please add at least one product image.
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Đang xử lý hình ảnh..."); // Dịch: Processing images...

    try {
      const uploadedUrls = [];
      for (let i = 0; i < images.toUpload.length; i++) {
        setUploadProgress(Math.round(((i + 1) / images.toUpload.length) * 100));
        toast.loading(`Đang tải ảnh ${i + 1}/${images.toUpload.length}...`, {
          // Dịch: Uploading image 1/X...
          id: toastId,
        });
        const url = await compressAndUploadImage(images.toUpload[i]);
        uploadedUrls.push(url);
      }

      const finalImageUrls = [...images.existing, ...uploadedUrls];
      toast.loading("Đang lưu dữ liệu sản phẩm...", { id: toastId }); // Dịch: Saving product data...

      const submissionData = {
        name: formData.name,
        slug: formData.slug
          ? slugify(formData.slug)
          : generateUniqueSlug(formData.name),
        product_code: formData.product_code || null,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        original_price: formData.original_price
          ? parseFloat(formData.original_price)
          : null,
        stock: parseInt(formData.stock) || 0,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        weight_g: parseInt(formData.weight_g) || 0,
        length_cm: parseInt(formData.length_cm) || 0,
        width_cm: parseInt(formData.width_cm) || 0,
        height_cm: parseInt(formData.height_cm) || 0,
      };

      const finalSizes = sizes
        .filter((s) => s.size && s.stock)
        .map((s) => ({ size: s.size, stock: parseInt(s.stock, 10) || 0 }));

      if (isEditing) {
        await updateProduct(
          id,
          submissionData,
          finalImageUrls,
          finalSizes,
          formData.category_ids
        );
        toast.success("Sản phẩm đã được cập nhật!", { id: toastId }); // Dịch: Product updated!
      } else {
        await createProduct(
          submissionData,
          finalImageUrls,
          finalSizes,
          formData.category_ids
        );
        toast.success("Sản phẩm đã được tạo!", { id: toastId }); // Dịch: Product created!
      }

      setTimeout(() => navigate("/admin/products"), 500);
    } catch (err) {
      console.error("❌ Submit error:", err);
      toast.error(err.message || "Lưu sản phẩm thất bại.", { id: toastId }); // Dịch: Failed to save product.
    } finally {
      setLoading(false);
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
    <form onSubmit={handleSubmit} className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {isEditing ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới"}
          </h1>
          <p className="text-sm text-gray-500">
            Sử dụng AI để gợi ý nội dung từ hình ảnh, sau đó tinh chỉnh trước khi lưu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
          <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            Trạng thái:{" "}
            <span className={formData.is_active ? "text-green-600" : "text-red-600"}>
              {formData.is_active ? "Hiển thị" : "Đang ẩn"}
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            AI hỗ trợ:{" "}
            <span className={aiLoading ? "text-yellow-600" : "text-green-600"}>
              {aiLoading ? "Đang chạy..." : "Sẵn sàng"}
            </span>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base md:text-lg font-semibold">
              Thông tin cơ bản
            </h2>
            <p className="text-xs text-gray-500">
              Tên, giá, mô tả tổng quan của sản phẩm.
            </p>
          </div>
          {formData.slug && (
            <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-[10px] text-gray-500">
              URL: /products/{formData.slug}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Tên sản phẩm"
            className="p-3 border rounded w-full md:col-span-2"
            required
          />
          <div className="md:col-span-2 flex flex-col gap-1">
            <input
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="Đường dẫn URL (bỏ trống để tự tạo)"
              className="p-3 border rounded"
            />
            <p className="text-[10px] text-gray-400">
              Nếu để trống, hệ thống sẽ tạo slug tự động từ tên sản phẩm.
            </p>
          </div>
          <div className="md:col-span-2 flex flex-col gap-1">
            <input
              name="product_code"
              value={formData.product_code}
              onChange={handleChange}
              placeholder="Mã sản phẩm (VD: SP001, DIOR-TS-001)"
              className="p-3 border rounded"
            />
            <p className="text-[10px] text-gray-400">
              Mã sản phẩm để quản lý nội bộ, khác với slug (URL).
            </p>
          </div>
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
            placeholder="Giá gốc (Nếu đơn hàng có giảm giá thì viết vào đây)"
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
          <div />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả sản phẩm"
            className="p-3 border rounded md:col-span-2 h-28"
          />
        </div>
      </div>

      {/* Shipping Info */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base md:text-lg font-semibold">
              Thông tin vận chuyển (J&T)
            </h2>
            <p className="text-xs text-gray-500">
              Cần thiết để tính phí vận chuyển chính xác.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Trọng lượng (gram)</label>
            <input
              name="weight_g"
              type="number"
              value={formData.weight_g || ""}
              onChange={handleChange}
              placeholder="VD: 500"
              className="p-3 border rounded"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Dài (cm)</label>
            <input
              name="length_cm"
              type="number"
              value={formData.length_cm || ""}
              onChange={handleChange}
              placeholder="VD: 30"
              className="p-3 border rounded"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Rộng (cm)</label>
            <input
              name="width_cm"
              type="number"
              value={formData.width_cm || ""}
              onChange={handleChange}
              placeholder="VD: 20"
              className="p-3 border rounded"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Cao (cm)</label>
            <input
              name="height_cm"
              type="number"
              value={formData.height_cm || ""}
              onChange={handleChange}
              placeholder="VD: 10"
              className="p-3 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base md:text-lg font-semibold">Danh mục</h2>
            <p className="text-xs text-gray-500">
              Chọn một hoặc nhiều danh mục phù hợp với sản phẩm.
            </p>
          </div>
          <span className="text-[10px] text-gray-400">
            {formData.category_ids.length > 0
              ? `${formData.category_ids.length} danh mục đã chọn`
              : "Chưa chọn danh mục"}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
          {categories.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
            >
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
      <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base md:text-lg font-semibold">
              Kích thước & tồn kho chi tiết
            </h2>
            <p className="text-xs text-gray-500">
              Khai báo tồn kho theo size để hiển thị chính xác cho khách.
            </p>
          </div>
        </div>
        {sizes.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={s.size}
              onChange={(e) => handleSizeChange(i, "size", e.target.value)}
              placeholder="Size (ví dụ: S, M, L)"
              className="p-3 border rounded w-full"
            />
            <input
              type="number"
              value={s.stock}
              onChange={(e) => handleSizeChange(i, "stock", e.target.value)}
              placeholder="Tồn kho cho size này"
              className="p-3 border rounded w-full"
            />
            {sizes.length > 1 && (
              <button
                type="button"
                onClick={() => removeSize(i)}
                className="text-red-500 p-2 hover:bg-red-50 rounded-full"
              >
                <X size={18} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addSize}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          + Thêm kích thước {/* Dịch: + Add size */}
        </button>
      </div>

      {/* Images + AI Assist */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base md:text-lg font-semibold">
              Hình ảnh sản phẩm & AI trợ lý
            </h2>
            <p className="text-xs text-gray-500">
              Tải ảnh sản phẩm, sau đó dùng AI để gợi ý nội dung tự động.
            </p>
          </div>
        </div>
        <ImageUpload
          existingImages={images.existing}
          onFilesChange={handleFilesChange}
          onRemoveExisting={handleRemoveExisting}
        />
        {images.toUpload.length > 0 && (
          <p className="text-sm text-gray-600">
            {images.toUpload.length} ảnh chờ tải lên
          </p>
        )}

        <div className="flex items-center gap-3 pt-2 border-t mt-2">
          <button
            type="button"
            onClick={handleGenerateFromImage}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {aiLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            )}
            <span>
              {aiLoading
                ? "Đang phân tích ảnh..."
                : "Dùng AI gợi ý từ ảnh (beta)"}
            </span>
          </button>
          {aiInfo && (
            <span className="text-xs text-green-600">{aiInfo}</span>
          )}
          {aiError && (
            <span className="text-xs text-red-600">{aiError}</span>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-base md:text-lg font-semibold mb-3">Cài đặt hiển thị</h2>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />{" "}
            Hiển thị {/* Dịch: Display / Show */}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleChange}
            />{" "}
            Nổi bật {/* Dịch: Featured */}
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <button
          type="button"
          onClick={() => navigate("/admin/products")}
          className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
          disabled={loading}
        >
          Hủy {/* Dịch: Cancel */}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-6 py-3 rounded-lg disabled:bg-gray-400 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Đang lưu..." : "Lưu sản phẩm"}{" "}
          {/* Dịch: Saving... / Save product */}
        </button>
      </div>
    </form>
  );
};

export default AdminProductForm;
