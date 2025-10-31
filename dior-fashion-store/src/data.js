// src/data.js
// File này chứa tất cả dữ liệu tĩnh cho trang web,
// giúp dễ dàng quản lý và chỉnh sửa menu, thông tin thương hiệu, v.v.

export const brandData = {
  brand: {
    name: "BEWO",
    tagline: "Luxury Fashion",
    description: "Premium quality fashion for modern lifestyle",
  },
  topBarMessage: "Miễn Phí Vận Chuyển Cho Đơn Hàng Từ 1 triệu đồng",

  // Cấu trúc menu đã được sửa lại với các URL slug duy nhất
  navigation: [
    { text: "Về BEWO", url: "/about" },
    { text: "Bộ Sưu Tập", url: "/products" },
    {
      text: "Tất Cả Sản Phẩm",
      url: "/products", // Link cha trỏ đến trang tất cả sản phẩm
      submenu: [
        {
          text: "Áo",
          url: "/category/ao", // Link đến danh mục cha "Áo"
          submenu: [
            // Mỗi loại áo có một URL (slug) riêng biệt
            { text: "Áo Khoác", url: "/category/ao-khoac" },
            { text: "Áo Sơ Mi", url: "/category/ao-so-mi" },
            { text: "Áo Thun", url: "/category/ao-thun" },
          ],
        },
        { text: "Váy", url: "/category/vay" },
        { text: "Quần", url: "/category/quan" },
        { text: "Setvest", url: "/category/chan-vay" },
        { text: "Bộ", url: "/category/bo-do" },
      ],
    },
    { text: "Cửa Hàng", url: "/stores" },
    { text: "Ưu Đãi Độc Quyền", url: "/sale-off" },
    { text: "Tin Tức", url: "/news" },
    { text: "Tuyển Dụng", url: "/recruitment" },
  ],

  footerSections: [
    {
      title: "Shop",
      links: [
        { name: "All Products", path: "/products" },
        { name: "New Arrivals", path: "/products?featured=true" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "Shipping Policy", path: "/shipping-policy" },
        { name: "Return Policy", path: "/return-policy" },
        { name: "Privacy Policy", path: "/privacy-policy" },
      ],
    },
  ],
};
