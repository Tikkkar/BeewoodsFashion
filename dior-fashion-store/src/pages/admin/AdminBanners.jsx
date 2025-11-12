import React, { useState, useEffect } from "react";
import {
  getAdminBanners,
  saveBanner,
  deleteBanner,
  uploadImage,
} from "../../lib/api/admin";
import {
  Edit,
  Trash2,
  Plus,
  Loader2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { toast } from "react-hot-toast";

const BannerModal = ({ banner, onClose, onSave }) => {
  // Default values cho tất cả các trường
  const defaultBanner = {
    title: "",
    subtitle: "",
    button_text: "Mua Ngay",
    button_link: "/products",
    image_url: "",
    is_active: true,
    show_content: true, // Mặc định hiển thị nội dung (tiêu đề, phụ đề, nút)
    show_title: true, // Hiển thị tiêu đề
    show_subtitle: true, // Hiển thị tiêu đề phụ
    show_button: true, // Hiển thị nút
    display_order: 0,
    text_color: "#FFFFFF",
    title_size: "text-5xl",
    subtitle_size: "text-xl",
    button_style: "primary",
    text_position: "left",
    overlay_opacity: 0.3,
    animation: "fade",
    mobile_image_url: "",
    start_date: "",
    end_date: "",
    // Kích thước theo thiết bị
    height_mobile: "500",      // px
    height_tablet: "600",      // px
    height_desktop: "70",      // vh
    height_large: "80",        // vh
  };

  const [data, setData] = useState({
    ...defaultBanner,
    ...(banner || {}),
  });

  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [mobileImageFile, setMobileImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(banner?.image_url || "");
  const [mobileImagePreview, setMobileImagePreview] = useState(
    banner?.mobile_image_url || ""
  );
  const [activeTab, setActiveTab] = useState("basic");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageSelect = (e, isMobile = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isMobile) {
        setMobileImageFile(file);
        setMobileImagePreview(URL.createObjectURL(file));
      } else {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrl = data.image_url;
      let finalMobileImageUrl = data.mobile_image_url;

      // Upload desktop image
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile, "banners");
      }

      // Upload mobile image
      if (mobileImageFile) {
        finalMobileImageUrl = await uploadImage(mobileImageFile, "banners");
      }

      if (!finalImageUrl) {
        toast.error("Vui lòng tải lên ảnh banner");
        setUploading(false);
        return;
      }

      // Chuẩn bị data để gửi
      const bannerData = {
        title: data.title || null, // Cho phép null
        subtitle: data.subtitle || null,
        button_text: data.button_text || null, // Cho phép null
        button_link: data.button_link || null,
        image_url: finalImageUrl,
        is_active: data.is_active,
        display_order: parseInt(data.display_order) || 0,
      };

      // Thêm id nếu đang edit
      if (data.id) {
        bannerData.id = data.id;
      }

      // Thêm các trường mở rộng (sẽ được DB tự động xử lý)
      bannerData.text_color = data.text_color || "#FFFFFF";
      bannerData.title_size = data.title_size || "text-5xl";
      bannerData.subtitle_size = data.subtitle_size || "text-xl";
      bannerData.button_style = data.button_style || "primary";
      bannerData.text_position = data.text_position || "left";
      bannerData.overlay_opacity = parseFloat(data.overlay_opacity) || 0.3;
      bannerData.animation = data.animation || "fade";
      bannerData.mobile_image_url = finalMobileImageUrl || null;
      bannerData.start_date = data.start_date || null;
      bannerData.end_date = data.end_date || null;
      
      // Responsive heights
      bannerData.height_mobile = parseInt(data.height_mobile) || 500;
      bannerData.height_tablet = parseInt(data.height_tablet) || 600;
      bannerData.height_desktop = parseInt(data.height_desktop) || 70;
      bannerData.height_large = parseInt(data.height_large) || 80;
      
      // Show content toggle
      bannerData.show_content = data.show_content !== false; // Default true

      // Title / Subtitle / Button toggles
      // Không gửi lên backend vì bảng banners hiện tại chưa có các cột này.
      // Các flag này chỉ dùng client-side (HeroSlider) khi đã mở rộng schema phù hợp.

      console.log("Saving banner data:", bannerData);
      await onSave(bannerData);
      toast.success("Lưu banner thành công!");
      onClose();
    } catch (error) {
      console.error("Error saving banner:", error);
      toast.error(
        error.message || "Có lỗi xảy ra khi lưu banner. Vui lòng kiểm tra console."
      );
    } finally {
      setUploading(false);
    }
  };

  const titleSizeOptions = [
    { value: "text-3xl", label: "Nhỏ" },
    { value: "text-4xl", label: "Trung bình" },
    { value: "text-5xl", label: "Lớn" },
    { value: "text-6xl", label: "Rất lớn" },
    { value: "text-7xl", label: "Khổng lồ" },
  ];

  const subtitleSizeOptions = [
    { value: "text-sm", label: "Nhỏ" },
    { value: "text-base", label: "Trung bình" },
    { value: "text-lg", label: "Lớn" },
    { value: "text-xl", label: "Rất lớn" },
    { value: "text-2xl", label: "Khổng lồ" },
  ];

  const buttonStyleOptions = [
    { value: "primary", label: "Chính (Đen)" },
    { value: "secondary", label: "Phụ (Trắng)" },
    { value: "outline", label: "Viền" },
    { value: "ghost", label: "Trong suốt" },
  ];

  const textPositionOptions = [
    { value: "left", label: "Trái", icon: AlignLeft },
    { value: "center", label: "Giữa", icon: AlignCenter },
    { value: "right", label: "Phải", icon: AlignRight },
  ];

  const animationOptions = [
    { value: "none", label: "Không có" },
    { value: "fade", label: "Mờ dần" },
    { value: "slide", label: "Trượt vào" },
    { value: "zoom", label: "Phóng to" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {data.id ? "Chỉnh sửa" : "Thêm"} Banner
          </h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              type="button"
              onClick={() => setActiveTab("basic")}
              className={`px-4 py-2 font-medium transition ${
                activeTab === "basic"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Cơ bản
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("design")}
              className={`px-4 py-2 font-medium transition ${
                activeTab === "design"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Thiết kế
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("schedule")}
              className={`px-4 py-2 font-medium transition ${
                activeTab === "schedule"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Lịch hiển thị
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Tab */}
            {activeTab === "basic" && (
              <>
                {/* Desktop Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ảnh Desktop *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Xem trước"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                          <ImageIcon size={18} />
                          <span>Đổi Ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageSelect(e, false)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <ImageIcon
                          size={48}
                          className="mx-auto text-gray-400 mb-4"
                        />
                        <p className="text-gray-600 mb-2">
                          Nhấn để tải lên ảnh banner
                        </p>
                        <p className="text-sm text-gray-400">
                          Đề xuất: 1920x600px
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageSelect(e, false)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Mobile Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ảnh Mobile (tùy chọn)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                    {mobileImagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={mobileImagePreview}
                          alt="Xem trước mobile"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                          <ImageIcon size={18} />
                          <span>Đổi Ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageSelect(e, true)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <ImageIcon
                          size={48}
                          className="mx-auto text-gray-400 mb-4"
                        />
                        <p className="text-gray-600 mb-2">
                          Nhấn để tải lên ảnh mobile
                        </p>
                        <p className="text-sm text-gray-400">
                          Đề xuất: 768x400px
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageSelect(e, true)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Nếu không tải lên, sẽ sử dụng ảnh desktop
                  </p>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tiêu đề
                  </label>
                  <input
                    name="title"
                    value={data.title}
                    onChange={handleChange}
                    placeholder="Bộ sưu tập Mới 2025 (để trống nếu chỉ dùng ảnh)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Có thể để trống nếu chỉ muốn hiển thị ảnh
                  </p>
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tiêu đề phụ
                  </label>
                  <input
                    name="subtitle"
                    value={data.subtitle || ""}
                    onChange={handleChange}
                    placeholder="Khám phá các xu hướng mới nhất"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                {/* Button Text & Link */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Chữ Nút
                    </label>
                    <input
                      name="button_text"
                      value={data.button_text}
                      onChange={handleChange}
                      placeholder="Mua Ngay"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Liên kết Nút
                    </label>
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
                  <label className="block text-sm font-medium mb-2">
                    Thứ tự Hiển thị
                  </label>
                  <input
                    name="display_order"
                    type="number"
                    value={data.display_order}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Số nhỏ hơn sẽ hiển thị trước
                  </p>
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
                    <span className="text-sm font-medium">
                      Hoạt động (Hiển thị trên trang chủ)
                    </span>
                  </label>
                </div>

                {/* Show Content Toggle */}
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="show_content"
                      checked={data.show_content !== false} // Default true
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">
                      Hiển thị nội dung (tiêu đề, phụ đề, nút)
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 ml-8">
                    Tắt để chỉ hiển thị ảnh banner, không có text hay button
                  </p>
                </div>

                {/* Show Title / Subtitle / Button Toggles */}
                {data.show_content !== false && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="show_title"
                        checked={data.show_title !== false} // Default true
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-xs font-medium">
                        Hiển thị tiêu đề
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="show_subtitle"
                        checked={data.show_subtitle !== false} // Default true
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-xs font-medium">
                        Hiển thị tiêu đề phụ
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="show_button"
                        checked={data.show_button !== false} // Default true
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-xs font-medium">
                        Hiển thị nút
                      </span>
                    </label>
                  </div>
                )}
              </>
            )}

            {/* Design Tab */}
            {activeTab === "design" && (
              <>
                {/* Text Color */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Màu chữ
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="color"
                      name="text_color"
                      value={data.text_color}
                      onChange={handleChange}
                      className="w-20 h-12 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      name="text_color"
                      value={data.text_color}
                      onChange={handleChange}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                {/* Title Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kích thước tiêu đề
                  </label>
                  <select
                    name="title_size"
                    value={data.title_size}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    {titleSizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subtitle Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kích thước tiêu đề phụ
                  </label>
                  <select
                    name="subtitle_size"
                    value={data.subtitle_size}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    {subtitleSizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Button Style */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kiểu nút
                  </label>
                  <select
                    name="button_style"
                    value={data.button_style}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    {buttonStyleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Text Position */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vị trí chữ
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {textPositionOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setData((prev) => ({
                              ...prev,
                              text_position: option.value,
                            }))
                          }
                          className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition ${
                            data.text_position === option.value
                              ? "border-black bg-gray-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <Icon size={24} />
                          <span className="text-sm">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Overlay Opacity */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Độ tối lớp phủ: {Math.round(data.overlay_opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    name="overlay_opacity"
                    min="0"
                    max="0.8"
                    step="0.1"
                    value={data.overlay_opacity}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Thêm lớp tối để chữ dễ đọc hơn
                  </p>
                </div>

                {/* Animation */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hiệu ứng
                  </label>
                  <select
                    name="animation"
                    value={data.animation}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    {animationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Responsive Heights */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    📐 Kích Thước Theo Thiết Bị
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Mobile Height */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        📱 Mobile (Điện thoại)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="height_mobile"
                          value={data.height_mobile || 500}
                          onChange={handleChange}
                          min="300"
                          max="1000"
                          step="50"
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                        <span className="text-sm text-gray-600 w-12">px</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Khuyến nghị: 400-600px
                      </p>
                    </div>

                    {/* Tablet Height */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        📱 Tablet (Máy tính bảng)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="height_tablet"
                          value={data.height_tablet || 600}
                          onChange={handleChange}
                          min="400"
                          max="1200"
                          step="50"
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                        <span className="text-sm text-gray-600 w-12">px</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Khuyến nghị: 500-700px
                      </p>
                    </div>

                    {/* Desktop Height */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        💻 Desktop (Máy tính)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="height_desktop"
                          value={data.height_desktop || 70}
                          onChange={handleChange}
                          min="40"
                          max="100"
                          step="5"
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                        <span className="text-sm text-gray-600 w-12">vh</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Khuyến nghị: 60-80vh (% chiều cao màn hình)
                      </p>
                    </div>

                    {/* Large Desktop Height */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        🖥️ Large Desktop (Màn hình lớn)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="height_large"
                          value={data.height_large || 80}
                          onChange={handleChange}
                          min="50"
                          max="100"
                          step="5"
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                        <span className="text-sm text-gray-600 w-12">vh</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Khuyến nghị: 70-90vh
                      </p>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      📏 Preview kích thước:
                    </p>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>• Mobile: {data.height_mobile || 500}px</p>
                      <p>• Tablet: {data.height_tablet || 600}px</p>
                      <p>• Desktop: {data.height_desktop || 70}vh (~{Math.round((data.height_desktop || 70) * 7.68)}px trên màn 1080p)</p>
                      <p>• Large: {data.height_large || 80}vh (~{Math.round((data.height_large || 80) * 7.68)}px trên màn 1080p)</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Schedule Tab */}
            {activeTab === "schedule" && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    Đặt lịch hiển thị banner tự động. Để trống nếu muốn hiển
                    thị vô thời hạn.
                  </p>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={data.start_date || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ngày kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={data.end_date || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                {data.start_date && data.end_date && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      Banner sẽ tự động hiển thị từ{" "}
                      <span className="font-medium">
                        {new Date(data.start_date).toLocaleString("vi-VN")}
                      </span>{" "}
                      đến{" "}
                      <span className="font-medium">
                        {new Date(data.end_date).toLocaleString("vi-VN")}
                      </span>
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                disabled={uploading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Đang Lưu...</span>
                  </>
                ) : (
                  <span>Lưu Banner</span>
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
    try {
      const { data } = await getAdminBanners();
      if (data) setBanners(data);
    } catch (error) {
      console.error("Error loading banners:", error);
      toast.error("Không thể tải danh sách banner");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleSave = async (banner) => {
    try {
      await saveBanner(banner);
      setEditingBanner(null);
      loadBanners();
    } catch (error) {
      console.error("Save error:", error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa banner này không?")) {
      try {
        await deleteBanner(id);
        toast.success("Xóa banner thành công!");
        loadBanners();
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Không thể xóa banner");
      }
    }
  };

  const handleReorder = async (banner, direction) => {
    const newOrder =
      direction === "up" ? banner.display_order - 1 : banner.display_order + 1;
    try {
      await saveBanner({ ...banner, display_order: newOrder });
      toast.success("Đã cập nhật thứ tự");
      loadBanners();
    } catch (error) {
      console.error("Reorder error:", error);
      toast.error("Không thể thay đổi thứ tự");
    }
  };

  const handleDuplicate = async (banner) => {
    const newBanner = {
      title: `${banner.title} (Sao chép)`,
      subtitle: banner.subtitle,
      button_text: banner.button_text,
      button_link: banner.button_link,
      image_url: banner.image_url,
      display_order: banners.length,
      is_active: false,
      text_color: banner.text_color,
      title_size: banner.title_size,
      subtitle_size: banner.subtitle_size,
      button_style: banner.button_style,
      text_position: banner.text_position,
      overlay_opacity: banner.overlay_opacity,
      animation: banner.animation,
      mobile_image_url: banner.mobile_image_url,
    };
    try {
      await saveBanner(newBanner);
      toast.success("Sao chép banner thành công!");
      loadBanners();
    } catch (error) {
      console.error("Duplicate error:", error);
      toast.error("Không thể sao chép banner");
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      await saveBanner({ ...banner, is_active: !banner.is_active });
      toast.success(banner.is_active ? "Đã ẩn banner" : "Đã hiển thị banner");
      loadBanners();
    } catch (error) {
      console.error("Toggle error:", error);
      toast.error("Không thể thay đổi trạng thái");
    }
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
          <h1 className="text-3xl font-bold">Banner</h1>
          <p className="text-gray-600">
            Quản lý banner trên trang chủ với nhiều tùy chỉnh
          </p>
        </div>
        <button
          onClick={() => setEditingBanner({})}
          className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition"
        >
          <Plus size={20} />
          <span>Thêm Banner</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Tổng số banner</p>
          <p className="text-2xl font-bold">{banners.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Đang hoạt động</p>
          <p className="text-2xl font-bold text-green-600">
            {banners.filter((b) => b.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Không hoạt động</p>
          <p className="text-2xl font-bold text-gray-400">
            {banners.filter((b) => !b.is_active).length}
          </p>
        </div>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 gap-6">
        {banners.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Chưa có banner nào</p>
            <button
              onClick={() => setEditingBanner({})}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
            >
              Thêm Banner Đầu tiên
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
                  <div className="relative">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {banner.mobile_image_url &&
                      banner.mobile_image_url !== banner.image_url && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Có ảnh mobile
                        </div>
                      )}
                  </div>
                </div>

                {/* Banner Info */}
                <div className="md:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold mb-1">
                          {banner.title}
                        </h3>
                        {banner.subtitle && (
                          <p className="text-gray-600 text-sm">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleActive(banner)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition ${
                          banner.is_active
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {banner.is_active ? (
                          <>
                            <Eye size={14} />
                            Hoạt động
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} />
                            Ẩn
                          </>
                        )}
                      </button>
                    </div>

                    {/* Banner Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Nút:</span>{" "}
                        {banner.button_text}
                      </div>
                      <div>
                        <span className="font-medium">Liên kết:</span>{" "}
                        {banner.button_link}
                      </div>
                      {banner.text_position && (
                        <div>
                          <span className="font-medium">Vị trí:</span>{" "}
                          {banner.text_position === "left"
                            ? "Trái"
                            : banner.text_position === "center"
                            ? "Giữa"
                            : "Phải"}
                        </div>
                      )}
                      {banner.animation && (
                        <div>
                          <span className="font-medium">Hiệu ứng:</span>{" "}
                          {banner.animation === "none"
                            ? "Không"
                            : banner.animation === "fade"
                            ? "Mờ dần"
                            : banner.animation === "slide"
                            ? "Trượt"
                            : "Phóng to"}
                        </div>
                      )}
                      {(banner.start_date || banner.end_date) && (
                        <div className="col-span-2">
                          <span className="font-medium">Lịch:</span>{" "}
                          {banner.start_date &&
                            new Date(banner.start_date).toLocaleDateString(
                              "vi-VN"
                            )}{" "}
                          -{" "}
                          {banner.end_date
                            ? new Date(banner.end_date).toLocaleDateString(
                                "vi-VN"
                              )
                            : "Không giới hạn"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleReorder(banner, "up")}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={index === 0}
                      title="Di chuyển lên"
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button
                      onClick={() => handleReorder(banner, "down")}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={index === banners.length - 1}
                      title="Di chuyển xuống"
                    >
                      <ArrowDown size={18} />
                    </button>
                    <div className="ml-auto flex gap-3">
                      <button
                        onClick={() => handleDuplicate(banner)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition flex items-center gap-2"
                        title="Sao chép"
                      >
                        <Copy size={18} />
                        <span>Sao chép</span>
                      </button>
                      <button
                        onClick={() => setEditingBanner(banner)}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-2"
                      >
                        <Edit size={18} />
                        <span>Sửa</span>
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
                      >
                        <Trash2 size={18} />
                        <span>Xóa</span>
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
