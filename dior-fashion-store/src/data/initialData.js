export const INITIAL_DATA = {
  brand: {
    name: 'BeeWo',
    tagline: 'The House of BeeWo embodies timeless elegance and exceptional craftsmanship.'
  },
  
  topBarMessage: 'COMPLIMENTARY DELIVERY & RETURNS',
  
// ...
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
    // Ví dụ về một link hoàn toàn tùy chỉnh:
    { text: 'Tin Tức', url: '/sale-off' },
    { text: 'Tuyển Dụng', url: '/recruitment' }
  ],
// ...
  
  products: [
    { 
      id: 1, 
      name: 'Bar Jacket', 
      price: 85000000,
      originalPrice: 95000000,
      discount: 10,
      category: 'Ready-to-Wear', 
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',
      rating: 5,
      reviews: 124,
      stock: 8,
      colors: ['#000000', '#1F2937'],
      isFeatured: true
    },
    { 
      id: 2, 
      name: 'Lady Dior Bag', 
      price: 120000000, 
      category: 'Handbags', 
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600',
      rating: 5,
      reviews: 234,
      stock: 5,
      colors: ['#DC2626', '#000000', '#92400E'],
      isFeatured: true
    },
    { 
      id: 3, 
      name: 'Silk Evening Dress', 
      price: 95000000,
      originalPrice: 110000000,
      discount: 13,
      category: 'Haute Couture', 
      image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600',
      rating: 5,
      reviews: 167,
      stock: 3,
      colors: ['#DC2626', '#000000'],
      isFeatured: true
    },
    { 
      id: 4, 
      name: 'Oblique Scarf', 
      price: 15000000, 
      category: 'Accessories', 
      image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600',
      rating: 5,
      reviews: 89,
      stock: 20,
      isFeatured: true
    },
    { 
      id: 5, 
      name: 'Saddle Bag', 
      price: 98000000,
      originalPrice: 115000000,
      discount: 15,
      category: 'Handbags', 
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
      rating: 5,
      reviews: 201,
      stock: 12,
      colors: ['#000000', '#92400E', '#6B7280'],
      isFeatured: true
    },
    { 
      id: 6, 
      name: 'Tailored Blazer', 
      price: 72000000, 
      category: 'Ready-to-Wear', 
      image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600',
      rating: 4,
      reviews: 143,
      stock: 15,
      colors: ['#000000', '#FFFFFF', '#1F2937'],
      isFeatured: true
    },
    { 
      id: 7, 
      name: 'DiorEssence Perfume', 
      price: 8500000, 
      category: 'Accessories', 
      image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600',
      rating: 5,
      reviews: 312,
      stock: 50,
      isFeatured: true
    },
    { 
      id: 8, 
      name: 'Pleated Midi Skirt', 
      price: 65000000,
      originalPrice: 75000000,
      discount: 13,
      category: 'Ready-to-Wear', 
      image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600',
      rating: 5,
      reviews: 98,
      stock: 18,
      isFeatured: true
    },
    { 
      id: 9, 
      name: 'Book Tote Bag', 
      price: 95000000, 
      category: 'Handbags', 
      image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600',
      rating: 5,
      reviews: 276,
      stock: 9
    },
    { 
      id: 10, 
      name: 'Embroidered Evening Gown', 
      price: 145000000, 
      category: 'Haute Couture', 
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
      rating: 5,
      reviews: 87,
      stock: 2
    },
    { 
      id: 11, 
      name: 'Dioriviera Sunglasses', 
      price: 12500000, 
      category: 'Accessories', 
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600',
      rating: 5,
      reviews: 189,
      stock: 30
    },
    { 
      id: 12, 
      name: 'Cashmere Coat', 
      price: 125000000,
      originalPrice: 140000000,
      discount: 10,
      category: 'Ready-to-Wear', 
      image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600',
      rating: 5,
      reviews: 156,
      stock: 6
    },
    { 
      id: 13, 
      name: '30 Montaigne Bag', 
      price: 110000000, 
      category: 'Handbags', 
      image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600',
      rating: 5,
      reviews: 223,
      stock: 7,
      colors: ['#000000', '#DC2626', '#6B7280']
    },
    { 
      id: 14, 
      name: 'Silk Scarf with Logo', 
      price: 18000000, 
      category: 'Accessories', 
      image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600',
      rating: 4,
      reviews: 134,
      stock: 25
    },
    { 
      id: 15, 
      name: 'Lace Cocktail Dress', 
      price: 88000000, 
      category: 'Haute Couture', 
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600',
      rating: 5,
      reviews: 112,
      stock: 4
    },
    { 
      id: 16, 
      name: 'Leather Ankle Boots', 
      price: 42000000, 
      category: 'Accessories', 
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600',
      rating: 5,
      reviews: 198,
      stock: 22
    },
  ],
  
  banners: [
    { 
      id: 1, 
      title: 'SPRING 2025', 
      subtitle: 'The New Collection',
      description: 'Discover the latest designs from our Spring Collection',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200',
      buttonText: 'DISCOVER',
      buttonLink: '/products'
    },
    { 
      id: 2, 
      title: 'HAUTE COUTURE', 
      subtitle: 'Artistry & Excellence',
      description: 'Exceptional craftsmanship and timeless elegance',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200',
      buttonText: 'EXPLORE',
      buttonLink: '/products'
    },
    { 
      id: 3, 
      title: 'ICONIC BAGS', 
      subtitle: 'Timeless Elegance',
      description: 'The iconic handbags that define luxury',
      image: 'https://images.unsplash.com/photo-1591348278863-470d378d1dcf?w=1200',
      buttonText: 'SHOP NOW',
      buttonLink: '/products'
    },
  ],
  
  categories: [
    { 
      name: 'Ready-to-Wear', 
      img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400' 
    },
    { 
      name: 'Handbags', 
      img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400' 
    },
    { 
      name: 'Haute Couture', 
      img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400' 
    },
    { 
      name: 'Accessories', 
      img: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400' 
    }
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