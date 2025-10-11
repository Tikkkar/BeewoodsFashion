# 🛍️ DIOR Fashion Store

> Website thương mại điện tử thời trang cao cấp với Visual Editor tích hợp

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)
![Tailwind](https://img.shields.io/badge/tailwind-3.3.0-38bdf8.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Tính năng](#-tính-năng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cài đặt](#-cài-đặt)
- [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [Cơ chế hoạt động](#-cơ-chế-hoạt-động)
- [Mở rộng tính năng](#-mở-rộng-tính-năng)
- [Các file quan trọng](#-các-file-quan-trọng)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Tổng quan

**Dior Fashion Store** là một ứng dụng web thương mại điện tử được xây dựng bằng React, chuyên về bán quần áo và phụ kiện thời trang cao cấp. Website có giao diện sang trọng, hiện đại và tích hợp **Visual Editor** cho phép chỉnh sửa nội dung trực tiếp mà không cần code.

### 🌟 Điểm nổi bật:
- ✅ Giao diện UI/UX theo phong cách Dior luxury
- ✅ Responsive design - hoạt động mượt mà trên mọi thiết bị
- ✅ Visual Editor tích hợp - chỉnh sửa real-time
- ✅ Module hóa components - dễ dàng mở rộng
- ✅ Clean code architecture
- ✅ Performance optimized

---

## ✨ Tính năng

### 🎨 Tính năng hiện tại

#### 1. **Hero Slider**
- Slideshow banner tự động (5 giây/slide)
- Điều khiển prev/next
- Dots navigation
- Smooth transitions

#### 2. **Product Management**
- Hiển thị danh sách sản phẩm dạng grid
- Product card với hover effects
- Add to cart functionality
- Wishlist (yêu thích)
- Định dạng giá tiền VND

#### 3. **Category System**
- Hiển thị danh mục sản phẩm
- Image hover effects
- Responsive grid layout

#### 4. **Shopping Cart**
- Thêm sản phẩm vào giỏ
- Hiển thị số lượng sản phẩm
- Badge notification

#### 5. **Visual Editor** 🎛️
- **Brand Editor**: Chỉnh sửa tên thương hiệu, tagline, top bar message
- **Products Editor**: Thêm/sửa/xóa sản phẩm
- **Banners Editor**: Quản lý slideshow banners
- **Categories Editor**: Quản lý danh mục
- Real-time preview
- Save/Reset functionality

#### 6. **Navigation**
- Sticky header
- Mobile hamburger menu
- Desktop navigation menu
- Search, wishlist, user, cart icons

#### 7. **Footer**
- Multi-column layout
- Quick links
- Brand information
- Copyright notice

---

## 📁 Cấu trúc dự án

```
dior-fashion-store/
├── public/
│   ├── index.html              # HTML template chính
│   └── favicon.ico             # Icon website
│
├── src/
│   ├── components/             # Thư mục chứa tất cả components
│   │   ├── common/            # Components dùng chung
│   │   │   ├── Button.jsx     # Component button tái sử dụng
│   │   │   ├── IconButton.jsx # Button với icon
│   │   │   └── SectionTitle.jsx # Tiêu đề section
│   │   │
│   │   ├── layout/            # Components layout
│   │   │   ├── Header.jsx     # Header chính (sticky)
│   │   │   ├── TopBar.jsx     # Thanh thông báo trên cùng
│   │   │   ├── Navigation.jsx # Menu điều hướng
│   │   │   ├── Footer.jsx     # Footer chính
│   │   │   └── FooterSection.jsx # Section trong footer
│   │   │
│   │   ├── hero/              # Components hero section
│   │   │   ├── HeroSlider.jsx # Container slider chính
│   │   │   ├── HeroSlide.jsx  # Từng slide
│   │   │   ├── SliderControls.jsx # Nút prev/next
│   │   │   └── SliderDots.jsx # Chấm chỉ báo
│   │   │
│   │   ├── products/          # Components sản phẩm
│   │   │   ├── ProductGrid.jsx # Grid hiển thị products
│   │   │   ├── ProductCard.jsx # Card từng sản phẩm
│   │   │   ├── CategoryGrid.jsx # Grid danh mục
│   │   │   └── CategoryCard.jsx # Card danh mục
│   │   │
│   │   ├── sections/          # Components sections
│   │   │   ├── BrandStory.jsx # Section giới thiệu brand
│   │   │   ├── ServicesSection.jsx # Section dịch vụ
│   │   │   └── ServiceCard.jsx # Card dịch vụ
│   │   │
│   │   └── editor/            # Components Visual Editor
│   │       ├── EditorPanel.jsx # Panel chính của editor
│   │       ├── BrandEditor.jsx # Editor cho brand
│   │       ├── ProductsEditor.jsx # Editor cho products
│   │       ├── BannersEditor.jsx # Editor cho banners
│   │       └── CategoriesEditor.jsx # Editor cho categories
│   │
│   ├── data/                  # Dữ liệu ứng dụng
│   │   └── initialData.js     # ⭐ DATA CHÍNH - Tất cả data tập trung ở đây
│   │
│   ├── hooks/                 # Custom React Hooks
│   │   └── useEditor.js       # ⭐ Hook quản lý state editor
│   │
│   ├── utils/                 # Utility functions
│   │   └── formatters.js      # Hàm format price, date, generate ID
│   │
│   ├── App.jsx                # ⭐ COMPONENT CHÍNH - Root component
│   ├── index.js               # Entry point React
│   └── index.css              # Global CSS + Tailwind imports
│
├── package.json               # Dependencies và scripts
├── tailwind.config.js         # Config Tailwind CSS
├── postcss.config.js          # Config PostCSS
├── .gitignore                # Git ignore file
└── README.md                  # File này

⭐ = File quan trọng nhất cần quan tâm
```

---

## 🚀 Cài đặt

### 📋 Yêu cầu hệ thống

- Node.js >= 14.0.0
- npm >= 6.0.0 hoặc yarn >= 1.22.0

### 📥 Bước 1: Clone repository

```bash
git clone https://github.com/your-username/dior-fashion-store.git
cd dior-fashion-store
```

### 📦 Bước 2: Cài đặt dependencies

```bash
npm install
```

**Dependencies sẽ được cài:**
- `react` - UI library
- `react-dom` - React DOM renderer
- `lucide-react` - Icon library
- `tailwindcss` - CSS framework
- `postcss` - CSS transformer
- `autoprefixer` - CSS vendor prefixes

### ⚙️ Bước 3: Khởi động development server

```bash
npm start
```

Website sẽ chạy tại: **http://localhost:3000**

### 🏗️ Build cho production

```bash
npm run build
```

Folder `build/` sẽ chứa static files để deploy.

---

## 📖 Hướng dẫn sử dụng

### 🎛️ Sử dụng Visual Editor

1. **Mở Editor:**
   - Click nút "Open Editor" (icon bút) ở góc dưới bên phải

2. **Chỉnh sửa Brand:**
   - Tab "Brand" → Sửa tên thương hiệu, tagline, top bar message
   - Thêm/xóa navigation items

3. **Quản lý Products:**
   - Tab "Products" → Click icon Edit để sửa sản phẩm
   - Click icon Trash để xóa
   - Click "Add New Product" để thêm

4. **Quản lý Banners:**
   - Tab "Banners" → Chỉnh sửa title, subtitle, image URL
   - Thêm/xóa banners

5. **Quản lý Categories:**
   - Tab "Categories" → Sửa tên và hình ảnh danh mục
   - Thêm/xóa categories

6. **Lưu thay đổi:**
   - Click nút "Save Changes" ở đầu panel
   - Alert sẽ hiển thị khi save thành công

### 🛒 Mua sắm

1. **Xem sản phẩm:** Scroll xuống section "NEW ARRIVALS"
2. **Thêm vào giỏ:** Hover vào product card → Click "ADD TO CART"
3. **Xem giỏ hàng:** Click icon giỏ hàng trên header (hiển thị số lượng)

---

## 🔧 Cơ chế hoạt động

### 📊 Data Flow (Luồng dữ liệu)

```
initialData.js (source of truth)
      ↓
useEditor.js (state management)
      ↓
App.jsx (root component)
      ↓
    Props
      ↓
Child Components (Header, Products, Editor...)
```

### 🎣 State Management với useEditor Hook

**File:** `src/hooks/useEditor.js`

```javascript
// Hook này quản lý:
// 1. data - Dữ liệu hiện tại đang edit
// 2. savedData - Dữ liệu đã lưu
// 3. editMode - Trạng thái đóng/mở editor
// 4. handleSave - Lưu data
// 5. toggleEditMode - Bật/tắt editor
```

**Cách hoạt động:**
1. Load `INITIAL_DATA` từ `initialData.js`
2. User chỉnh sửa → update `data` state
3. Click "Save" → copy `data` sang `savedData`
4. Nếu không save → data vẫn giữ nguyên savedData

### 🎨 Component Architecture

#### Atomic Design Pattern

```
Atoms (Nhỏ nhất)
├── Button.jsx
├── IconButton.jsx
└── SectionTitle.jsx

Molecules (Kết hợp atoms)
├── ProductCard.jsx
├── CategoryCard.jsx
└── FooterSection.jsx

Organisms (Kết hợp molecules)
├── Header.jsx
├── ProductGrid.jsx
├── CategoryGrid.jsx
└── Footer.jsx

Templates (Layout)
└── App.jsx
```

### 🔄 Props Drilling

```
App.jsx
├── data (from useEditor)
├── setData (from useEditor)
└── Pass down via props
    ↓
    ├── Header (receives: brandName, cart, navigation)
    ├── ProductGrid (receives: products, onAddToCart)
    ├── CategoryGrid (receives: categories)
    └── EditorPanel (receives: data, setData, onSave)
```

---

## 🎯 Mở rộng tính năng

### 1️⃣ Thêm một Product mới

**File cần sửa:** `src/data/initialData.js`

```javascript
products: [
  // Thêm object mới vào array
  {
    id: 7, // ID tăng dần
    name: 'Tên sản phẩm',
    price: 50000000,
    category: 'Danh mục',
    image: 'URL hình ảnh'
  }
]
```

### 2️⃣ Thêm một Component mới

#### Bước 1: Tạo component file

**Vị trí:** `src/components/sections/NewSection.jsx`

```javascript
import React from 'react';

const NewSection = ({ title, content }) => {
  return (
    <section className="py-20 px-4">
      <h2 className="text-4xl font-light tracking-widest text-center mb-8">
        {title}
      </h2>
      <p className="text-center">{content}</p>
    </section>
  );
};

export default NewSection;
```

#### Bước 2: Import vào App.jsx

```javascript
import NewSection from './components/sections/NewSection';

function App() {
  return (
    <div>
      {/* ... existing components ... */}
      <NewSection title="NEW SECTION" content="Content here" />
    </div>
  );
}
```

### 3️⃣ Thêm tính năng Search

#### Bước 1: Tạo state trong App.jsx

```javascript
const [searchQuery, setSearchQuery] = useState('');

const filteredProducts = data.products.filter(product =>
  product.name.toLowerCase().includes(searchQuery.toLowerCase())
);
```

#### Bước 2: Tạo SearchBar component

**File:** `src/components/common/SearchBar.jsx`

```javascript
import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange }) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
      />
    </div>
  );
};

export default SearchBar;
```

#### Bước 3: Sử dụng trong App.jsx

```javascript
<SearchBar value={searchQuery} onChange={setSearchQuery} />
<ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />
```

### 4️⃣ Thêm tính năng Filter theo Category

#### Bước 1: Tạo state filter

```javascript
const [selectedCategory, setSelectedCategory] = useState('ALL');

const filteredProducts = selectedCategory === 'ALL'
  ? data.products
  : data.products.filter(p => p.category === selectedCategory);
```

#### Bước 2: Tạo FilterBar component

```javascript
const FilterBar = ({ categories, selected, onSelect }) => {
  return (
    <div className="flex gap-4 justify-center mb-8">
      <button
        onClick={() => onSelect('ALL')}
        className={`px-4 py-2 ${selected === 'ALL' ? 'bg-black text-white' : 'bg-gray-200'}`}
      >
        ALL
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-2 ${selected === cat ? 'bg-black text-white' : 'bg-gray-200'}`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};
```

### 5️⃣ Thêm tính năng Cart Detail (Chi tiết giỏ hàng)

#### Bước 1: Tạo CartSidebar component

**File:** `src/components/cart/CartSidebar.jsx`

```javascript
import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

const CartSidebar = ({ cart, onClose, onRemove }) => {
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Shopping Cart ({cart.length})</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
          <X size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {cart.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Giỏ hàng trống</p>
        ) : (
          <>
            {cart.map((item, index) => (
              <div key={index} className="flex gap-4 border-b pb-4">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover" />
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.category}</p>
                  <p className="font-bold">{formatPrice(item.price)}</p>
                </div>
                <button
                  onClick={() => onRemove(index)}
                  className="p-2 hover:bg-red-50 text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
              <button className="w-full bg-black text-white py-3 mt-4 rounded-lg hover:bg-gray-800">
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;
```

#### Bước 2: Tích hợp vào App.jsx

```javascript
const [cartOpen, setCartOpen] = useState(false);

const handleRemoveFromCart = (index) => {
  setCart(cart.filter((_, i) => i !== index));
};

// Trong JSX:
{cartOpen && (
  <CartSidebar
    cart={cart}
    onClose={() => setCartOpen(false)}
    onRemove={handleRemoveFromCart}
  />
)}

// Sửa Header để mở cart
<Header
  {...props}
  onCartClick={() => setCartOpen(true)}
/>
```

### 6️⃣ Thêm Authentication (Login/Register)

#### Bước 1: Tạo context

**File:** `src/context/AuthContext.js`

```javascript
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    // Logic login
    setUser({ email, name: 'User Name' });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

#### Bước 2: Wrap App với AuthProvider

**File:** `src/index.js`

```javascript
import { AuthProvider } from './context/AuthContext';

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

### 7️⃣ Kết nối Backend API

#### Bước 1: Tạo API service

**File:** `src/services/api.js`

```javascript
const API_URL = 'https://your-api.com/api';

export const fetchProducts = async () => {
  const response = await fetch(`${API_URL}/products`);
  return response.json();
};

export const createProduct = async (product) => {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  return response.json();
};

export const updateProduct = async (id, product) => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  return response.json();
};

export const deleteProduct = async (id) => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE'
  });
  return response.json();
};
```

#### Bước 2: Sử dụng trong component

```javascript
import { fetchProducts, createProduct } from '../services/api';
import { useEffect } from 'react';

function App() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      const data = await fetchProducts();
      setProducts(data);
    };
    loadProducts();
  }, []);

  const handleAddProduct = async (product) => {
    const newProduct = await createProduct(product);
    setProducts([...products, newProduct]);
  };
}
```

### 8️⃣ Thêm LocalStorage persistence

**File:** `src/hooks/useEditor.js`

```javascript
const handleSave = () => {
  setSavedData(data);
  // Lưu vào localStorage
  localStorage.setItem('diorStoreData', JSON.stringify(data));
  alert('✅ Changes saved successfully!');
};

// Load từ localStorage khi mount
useEffect(() => {
  const saved = localStorage.getItem('diorStoreData');
  if (saved) {
    const parsedData = JSON.parse(saved);
    setData(parsedData);
    setSavedData(parsedData);
  }
}, []);
```

---

## 📂 Các file quan trọng

### ⭐ TOP 5 Files quan trọng nhất

#### 1. `src/App.jsx` - COMPONENT GỐC

**Vai trò:**
- Root component chính của ứng dụng
- Quản lý state chung (cart, menuOpen, currentSlide)
- Orchestrate tất cả child components
- Xử lý business logic chính

**Khi nào cần sửa:**
- Thêm/xóa sections trong layout
- Thay đổi flow của ứng dụng
- Thêm global state mới
- Tích hợp components mới

**Code structure:**
```javascript
// State management
const { data, setData, editMode, ... } = useEditor();
const [cart, setCart] = useState([]);
const [menuOpen, setMenuOpen] = useState(false);

// Event handlers
const handleAddToCart = (product) => {...}
const handleNextSlide = () => {...}

// JSX Layout
return (
  <div>
    <TopBar />
    <Header />
    <main>
      <HeroSlider />
      <CategoryGrid />
      <ProductGrid />
    </main>
    <Footer />
  </div>
);
```

---

#### 2. `src/data/initialData.js` - DỮ LIỆU CHÍNH

**Vai trò:**
- Single source of truth cho tất cả data
- Chứa products, banners, categories, navigation
- Config brand information

**Khi nào cần sửa:**
- Thêm/sửa/xóa products
- Thay đổi banners
- Cập nhật navigation menu
- Đổi thông tin brand

**Structure:**
```javascript
export const INITIAL_DATA = {
  brand: { name, tagline },
  topBarMessage: '...',
  navigation: [...],
  products: [...],
  banners: [...],
  categories: [...],
  footerSections: [...]
};
```

**Lưu ý:**
- Mọi sự thay đổi ở đây sẽ ảnh hưởng toàn bộ app
- Đảm bảo format data đúng (id, name, price, image...)
- Kiểm tra image URLs hợp lệ

---

#### 3. `src/hooks/useEditor.js` - STATE MANAGEMENT

**Vai trò:**
- Custom hook quản lý editor state
- Handle save/reset logic
- Quản lý editMode

**Khi nào cần sửa:**
- Thêm localStorage persistence
- Thêm undo/redo functionality
- Tích hợp API calls
- Thêm validation logic

**Functions:**
```javascript
return {
  data,          // Current editing data
  setData,       // Update data
  savedData,     // Last saved data
  editMode,      // Editor open/close
  handleSave,    // Save function
  handleReset,   // Reset to saved
  toggleEditMode // Toggle editor
};
```

---

#### 4. `src/components/editor/EditorPanel.jsx` - VISUAL EDITOR

**Vai trò:**
- Main editor interface
- Tab navigation (Brand, Products, Banners, Categories)
- Coordinate editor sub-components

**Khi nào cần sửa:**
- Thêm tab editor mới
- Thay đổi UI editor
- Thêm features như export/import

**Structure:**
```javascript
const [activeTab, setActiveTab] = useState('brand');

<div className="editor-panel">
  <Header>
    <SaveButton onClick={onSave} />
  </Header>
  
  <Tabs>
    {['brand', 'products', 'banners', 'categories'].map(...)}
  </Tabs>
  
  <Content>
    {activeTab === 'brand' && <BrandEditor />}
    {activeTab === 'products' && <ProductsEditor />}
    ...
  </Content>
</div>
```

---

#### 5. `src/utils/formatters.js` - UTILITY FUNCTIONS

**Vai trò:**
- Helper functions tái sử dụng
- Format price, date
- Generate IDs

**Khi nào cần sửa:**
- Thêm format functions mới
- Đổi format tiền tệ
- Thêm validation functions

**Functions:**
```javascript
formatPrice(price)    // 85000000 → "85,000,000 VND"
formatDate(date)      // Format dates
generateId(items)     // Generate unique IDs
```

---

### 📋 Files theo chức năng

#### 🎨 UI Components

| File | Mô tả | Khi nào sửa |
|------|-------|-------------|
| `Button.jsx` | Button component với variants | Thêm style mới |
| `IconButton.jsx` | Button với icon và badge | Đổi icon size/style |
| `SectionTitle.jsx` | Tiêu đề section | Đổi typography |

#### 🏗️ Layout Components

| File | Mô tả | Khi nào sửa |
|------|-------|-------------|
| `Header.jsx` | Sticky header | Thêm menu items |
| `TopBar.jsx` | Announcement bar | Đổi message/style |
| `Navigation.jsx` | Navigation menu | Thêm/bớt links |
| `Footer.jsx` | Footer chính | Thay đổi layout |
| `FooterSection.jsx` | Section trong footer | Đổi links |

#### 🎪 Hero Components

| File | Mô tả | Khi nào sửa |
|------|-------|-------------|
| `HeroSlider.jsx` | Slider container | Thêm effects |
| `HeroSlide.jsx` | Individual slide | Đổi layout slide |
| `SliderControls.jsx` | Prev/Next buttons | Đổi position/style |
| `SliderDots.jsx` | Dot indicators | Đổi style dots |

#### 🛍️ Product Components

| File | Mô tả | Khi nào sửa |
|------|-------|-------------|
| `ProductGrid.jsx` | Product grid layout | Đổi số cột |
| `ProductCard.jsx` | Product card | Thêm quick view |
| `CategoryGrid.jsx` | Category grid | Thêm filter |
| `CategoryCard.jsx` | Category card | Đổi hover effect |

#### ✏️ Editor Components

| File | Mô tả | Khi nào sửa |
|------|-------|-------------|
| `EditorPanel.jsx` | Main editor UI | Thêm tabs mới |
| `BrandEditor.jsx` | Edit brand info | Thêm fields |
| `ProductsEditor.jsx` | Manage products | Thêm bulk edit |
| `BannersEditor.jsx` | Manage banners | Thêm preview |
| `CategoriesEditor.jsx` | Manage categories | Thêm drag-drop |

---

## 🔌 API Documentation

### Product Object Structure

```javascript
{
  id: Number,           // Unique identifier
  name: String,         // Product name
  price: Number,        // Price in VND
  category: String,     // Product category
  image: String         // Image URL
}
```

**Example:**
```javascript
{
  id: 1,
  name: 'Bar Jacket',
  price: 85000000,
  category: 'Ready-to-Wear',
  image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600'
}
```

### Banner Object Structure

```javascript
{
  id: Number,           // Unique identifier
  title: String,        // Banner title (large text)
  subtitle: String,     // Banner subtitle (small text)
  image: String         // Background image URL
}
```

**Example:**
```javascript
{
  id: 1,
  title: 'SPRING 2025',
  subtitle: 'The New Collection',
  image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200'
}
```

### Category Object Structure

```javascript
{
  name: String,         // Category name
  img: String           // Category image URL
}
```

**Example:**
```javascript
{
  name: 'READY-TO-WEAR',
  img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400'
}
```

### Footer Section Structure

```javascript
{
  title: String,        // Section title
  links: Array<String>  // Array of link names
}
```

**Example:**
```javascript
{
  title: 'CLIENT SERVICES',
  links: ['Contact Us', 'FAQ', 'Store Locator', 'Book an Appointment']
}
```

---

## 🛠️ Troubleshooting

### ❌ Lỗi thường gặp và cách fix

#### 1. **Web hiển thị trắng (blank screen)**

**Nguyên nhân:**
- File `index.js` thiếu code render
- Component bị crash
- Import sai đường dẫn

**Cách fix:**
```javascript
// Kiểm tra src/index.js phải có:
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Debug:**
- Mở Console (F12) → Xem error messages
- Check terminal có lỗi compile không
- Kiểm tra tất cả imports

---

#### 2. **Cannot read properties of undefined (reading 'map')**

**Nguyên nhân:**
- Props bị undefined hoặc null
- Data chưa load xong

**Cách fix:**
```javascript
// Thêm kiểm tra trước khi map
const ProductGrid = ({ products }) => {
  if (!products || products.length === 0) {
    return <div>No products</div>;
  }
  
  return (
    <div>
      {products.map(product => ...)}
    </div>
  );
};
```

---

#### 3. **Tailwind CSS không hoạt động**

**Nguyên nhân:**
- Chưa cài Tailwind
- Config sai
- CSS chưa import

**Cách fix:**

1. Kiểm tra `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  // ← Quan trọng!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

2. Kiểm tra `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

3. Restart server:
```bash
npm start
```

---

#### 4. **Module not found: Can't resolve './components/...'**

**Nguyên nhân:**
- File chưa tồn tại
- Đường dẫn sai
- Tên file sai

**Cách fix:**
```javascript
// ❌ Sai
import Header from './components/Header';

// ✅ Đúng
import Header from './components/layout/Header';
```

**Kiểm tra:**
- File có tồn tại không?
- Tên file đúng chính tả?
- Đường dẫn relative đúng?

---

#### 5. **Images không hiển thị**

**Nguyên nhân:**
- URL sai
- CORS policy
- Image bị xóa

**Cách fix:**
```javascript
// Thêm fallback image
<img 
  src={product.image} 
  alt={product.name}
  onError={(e) => e.target.src = 'https://placehold.co/600x600/eee/333?text=No+Image'}
/>
```

---

#### 6. **Editor không lưu data**

**Nguyên nhân:**
- `handleSave` không được gọi
- State không update

**Cách fix:**
```javascript
// Trong useEditor.js
const handleSave = () => {
  setSavedData(data);
  localStorage.setItem('diorStoreData', JSON.stringify(data));
  alert('✅ Changes saved successfully!');
};

// Kiểm tra có gọi đúng không
<button onClick={handleSave}>Save</button>
```

---

#### 7. **Port 3000 đã được sử dụng**

**Cách fix:**

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Hoặc dùng port khác:**
```bash
PORT=3001 npm start
```

---

## 🎓 Best Practices

### 📝 Code Style

#### 1. **Component Naming**
```javascript
// ✅ PascalCase cho components
const ProductCard = () => {}
const HeroSlider = () => {}

// ✅ camelCase cho functions
const handleAddToCart = () => {}
const formatPrice = () => {}

// ✅ UPPER_CASE cho constants
const MAX_PRODUCTS = 100;
const API_URL = 'https://api.example.com';
```

#### 2. **Props Destructuring**
```javascript
// ✅ Tốt - Destructure ngay trong params
const ProductCard = ({ product, onAddToCart }) => {
  return <div>{product.name}</div>
}

// ❌ Tránh
const ProductCard = (props) => {
  return <div>{props.product.name}</div>
}
```

#### 3. **Conditional Rendering**
```javascript
// ✅ Early return
const ProductGrid = ({ products }) => {
  if (!products) return null;
  
  return <div>...</div>
}

// ✅ Ternary cho đơn giản
{loading ? <Spinner /> : <Content />}

// ✅ && operator
{error && <ErrorMessage />}
```

#### 4. **Key Props**
```javascript
// ✅ Dùng unique ID
{products.map(product => (
  <ProductCard key={product.id} product={product} />
))}

// ❌ Tránh dùng index
{products.map((product, index) => (
  <ProductCard key={index} product={product} />
))}
```

---

### 🚀 Performance Tips

#### 1. **React.memo cho components không thay đổi thường xuyên**
```javascript
import React, { memo } from 'react';

const ProductCard = memo(({ product, onAddToCart }) => {
  return <div>...</div>
});
```

#### 2. **useMemo cho computed values**
```javascript
const filteredProducts = useMemo(() => {
  return products.filter(p => p.category === selectedCategory);
}, [products, selectedCategory]);
```

#### 3. **useCallback cho event handlers**
```javascript
const handleAddToCart = useCallback((product) => {
  setCart(prev => [...prev, product]);
}, []);
```

#### 4. **Lazy loading images**
```javascript
<img 
  src={product.image}
  loading="lazy"
  alt={product.name}
/>
```

---

### 🔒 Security Best Practices

#### 1. **Sanitize user input**
```javascript
// Khi thêm sản phẩm từ editor
const sanitizeInput = (input) => {
  return input.replace(/[<>]/g, '');
};
```

#### 2. **Validate data**
```javascript
const isValidProduct = (product) => {
  return (
    product.name &&
    product.price > 0 &&
    product.category &&
    product.image
  );
};
```

#### 3. **Không expose sensitive data**
```javascript
// ❌ Không làm thế này
const API_KEY = 'your-secret-key';

// ✅ Dùng .env
const API_KEY = process.env.REACT_APP_API_KEY;
```

---

## 📚 Tài liệu tham khảo

### React Documentation
- [React Official Docs](https://react.dev/)
- [React Hooks](https://react.dev/reference/react)
- [React Performance](https://react.dev/learn/render-and-commit)

### Tailwind CSS
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)
- [Tailwind Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)

### Icons
- [Lucide React](https://lucide.dev/)
- [React Icons](https://react-icons.github.io/react-icons/)

### Tools
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools)
- [VS Code Extensions](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)

---

## 🗺️ Roadmap tính năng

### ✅ Đã hoàn thành (v1.0.0)
- [x] Basic UI/UX
- [x] Product listing
- [x] Shopping cart
- [x] Visual Editor
- [x] Responsive design
- [x] Hero slider

### 🔄 Đang phát triển (v1.1.0)
- [ ] Cart sidebar với chi tiết
- [ ] Product search
- [ ] Category filter
- [ ] Wishlist functionality
- [ ] Product quick view

### 📋 Kế hoạch tương lai (v2.0.0)
- [ ] User authentication
- [ ] Checkout flow
- [ ] Payment integration
- [ ] Order management
- [ ] Admin dashboard
- [ ] Product reviews
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Email notifications
- [ ] SEO optimization

### 🚀 Long-term (v3.0.0)
- [ ] Mobile app (React Native)
- [ ] Progressive Web App (PWA)
- [ ] AI recommendation engine
- [ ] Live chat support
- [ ] Inventory management
- [ ] Analytics dashboard
- [ ] Social media integration
- [ ] CMS integration

---

## 🤝 Contributing

### Hướng dẫn đóng góp

#### 1. Fork repository
```bash
git clone https://github.com/your-username/dior-fashion-store.git
```

#### 2. Tạo branch mới
```bash
git checkout -b feature/your-feature-name
```

#### 3. Commit changes
```bash
git add .
git commit -m "Add: your feature description"
```

#### 4. Push to branch
```bash
git push origin feature/your-feature-name
```

#### 5. Tạo Pull Request

### Commit Message Convention
```
feat: Thêm tính năng mới
fix: Sửa bug
docs: Cập nhật documentation
style: Format code, không thay đổi logic
refactor: Refactor code
test: Thêm tests
chore: Cập nhật build tools, dependencies
```

---

## 📄 License

MIT License

Copyright (c) 2025 Dior Fashion Store

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 👥 Authors

- **Your Name** - *Initial work* - [GitHub](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- React team for amazing framework
- Tailwind CSS for utility-first CSS
- Lucide for beautiful icons
- Unsplash for free images
- Christian Dior for design inspiration

---

## 📧 Contact & Support

### Báo lỗi (Issues)
Nếu bạn gặp bug hoặc có đề xuất tính năng, vui lòng tạo issue tại:
**https://github.com/your-username/dior-fashion-store/issues**

### Email
**contact@diorfashionstore.com**

### Documentation
**https://docs.diorfashionstore.com**

---

## 🎉 Getting Started Checklist

Sau khi clone project, hãy làm theo checklist này:

- [ ] Clone repository
- [ ] Chạy `npm install`
- [ ] Kiểm tra `src/data/initialData.js` - customize data
- [ ] Chạy `npm start` - test development server
- [ ] Mở browser tại http://localhost:3000
- [ ] Test Visual Editor - click "Open Editor"
- [ ] Thử add product vào cart
- [ ] Test responsive - resize browser
- [ ] Đọc phần "Mở rộng tính năng" trong README
- [ ] Customize brand name, colors, images
- [ ] Deploy lên hosting (Vercel, Netlify, etc.)

---

## 🌟 Tips for Success

### Cho người mới bắt đầu:
1. **Đọc cấu trúc project kỹ** - Hiểu rõ mỗi folder làm gì
2. **Bắt đầu từ nhỏ** - Sửa màu, text trước khi thêm features lớn
3. **Sử dụng Console** - Debug bằng `console.log()`
4. **Đọc error messages** - Error thường chỉ rõ vấn đề
5. **Commit thường xuyên** - Dễ rollback khi có lỗi

### Cho developers:
1. **Module hóa tốt** - Một component làm một việc
2. **Reuse components** - Tránh duplicate code
3. **Performance matters** - Dùng memo, useMemo, useCallback
4. **Type safety** - Cân nhắc migrate sang TypeScript
5. **Testing** - Viết tests cho critical features

---

## 📊 Project Stats

- **Total Components:** 27+
- **Lines of Code:** ~3,000
- **Dependencies:** 6 main packages
- **Build Size:** ~500KB (gzipped)
- **Lighthouse Score:** 90+ Performance

---

## 🎯 Quick Commands Reference

```bash
# Development
npm start                  # Start dev server
npm run build             # Build for production
npm test                  # Run tests
npm run eject             # Eject from CRA

# Git
git status                # Check status
git add .                 # Stage all changes
git commit -m "message"   # Commit changes
git push                  # Push to remote

# Dependencies
npm install package       # Install package
npm uninstall package     # Remove package
npm update                # Update packages
npm outdated              # Check outdated packages

# Debugging
npm run build             # Check build errors
npm start --verbose       # Verbose logging
```

---

**💡 Tip:** Bookmark README này và quay lại tham khảo khi cần!

**🚀 Happy Coding!**