// src/data.js

export const INITIAL_DATA = {
  brand: {
    name: 'BeeWo',
    tagline: 'The House of BeeWo embodies timeless elegance and exceptional craftsmanship.'
  },
  
  topBarMessage: 'COMPLIMENTARY DELIVERY & RETURNS',
  
  navigation: [
    { text: 'Về BeeWo', 
      url: '/about' 
    },
    { text: 'Bộ Sưu Tập', 
      url: '/products', 
      submenu: [
        { text: 'Tất cả', url: '/products' },
        { text: 'Handbags', url: '/category/handbags' },
      ]
    },
    { text: 'Tất Cả Sản Phẩm', 
      url: '/category/haute-couture',
      submenu: [
        { text: 'Áo', 
          url: '/category/haute-couture', 
          submenu: [
            { text: 'Áo Khoác', url: '/category/haute-couture' },
            { text: 'Áo Sơ Mi', url: '/category/haute-couture' },
            { text: 'Áo Thun', url: '/category/haute-couture' },
          ]
        },
        { text: 'Blazer', url: '/category/accessories' },
        { text: 'Quần', url: '/category/accessories' },
        { text: 'Chân Váy', url: '/category/accessories' },
        { text: 'Bộ', url: '/category/accessories' },
      ]
    },
    { text: 'Ưu Đãi Độc Quyền', url: '/category/bags' },
    { text: 'Tin Tức', url: '/sale-off' },
    { text: 'Tuyển Dụng', url: '/recruitment' }
  ],
  
  products: [
    { 
      id: 1, 
      name: 'Bar Jacket', 
      price: 85000000,
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',
    },
    // ... Dữ liệu sản phẩm khác của bạn
  ],
  
  banners: [
    { 
      id: 1, 
      title: 'SPRING 2025', 
      subtitle: 'The New Collection',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200',
    },
     // ... Dữ liệu banner khác của bạn
  ],
  
  categories: [
    { 
      name: 'Ready-to-Wear', 
      img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400' 
    },
    // ... Dữ liệu danh mục khác của bạn
  ],
  
  footerSections: [
    {
      title: 'CLIENT SERVICES',
      links: ['Contact Us', 'FAQ', 'Store Locator', 'Book an Appointment']
    },
    {
      title: 'THE HOUSE',
      links: ['Our Heritage', 'Savoir-Faire', 'Careers', 'Press']
    },
    {
      title: 'LEGAL',
      links: ['Privacy Policy', 'Terms of Use', 'Cookies', 'Accessibility']
    }
  ]
};