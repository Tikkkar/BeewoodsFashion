# 📦 DEVELOPER HANDOFF PACKAGE
# DIOR Fashion Store - Tài liệu bàn giao cho lập trình viên

> **Mục đích:** Tài liệu này giúp lập trình viên mới nhanh chóng hiểu và tiếp tục phát triển dự án

**Ngày tạo:** 2025-01-11
**Version:** 1.0.0
**Status:** Production Ready (MVP Phase)

---

## 📋 MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Files cần đọc bắt buộc](#2-files-cần-đọc-bắt-buộc)
3. [Cấu trúc dự án chi tiết](#3-cấu-trúc-dự-án-chi-tiết)
4. [Setup môi trường](#4-setup-môi-trường)
5. [Data flow & Architecture](#5-data-flow--architecture)
6. [Key files reference](#6-key-files-reference)
7. [Roadmap phát triển](#7-roadmap-phát-triển)
8. [Coding conventions](#8-coding-conventions)
9. [Testing guide](#9-testing-guide)
10. [Deployment guide](#10-deployment-guide)

---

## 1. TỔNG QUAN DỰ ÁN

### 🎯 Mục tiêu
E-commerce website bán quần áo thời trang cao cấp với Visual Editor tích hợp.

### 🛠️ Tech Stack
```
Frontend: React 18.2.0 + Tailwind CSS 3.3.0
Icons: Lucide React 0.263.1
Build Tool: Create React App
State Management: React Hooks (useState, useEffect)
Package Manager: npm
```

### 📊 Current Status
- **MVP Completion:** 70%
- **Core Features:** ✅ Done
- **E-commerce Features:** ⚠️ Partial
- **Admin Features:** ✅ Done (Visual Editor)

### 🎯 Next Priorities
1. LocalStorage persistence
2. Cart sidebar functionality
3. Search & Filter products
4. Backend API integration
5. Authentication system

---

## 2. FILES CẦN ĐỌC BẮT BUỘC

### 📚 **ĐỌC THEO THỨ TỰ NÀY:**

#### **BƯỚC 1: Overview Documents** (30 phút đầu)
```
📄 README.md
   └─> Tổng quan dự án, features, installation
   
📄 DEVELOPER_HANDOFF.md (file này)
   └─> Architecture, handoff guide
   
📄 package.json
   └─> Dependencies, scripts
```

#### **BƯỚC 2: Core Architecture** (1-2 giờ)
```
📁 src/
   ├─ 📄 App.jsx ⭐⭐⭐⭐⭐
   │  └─> Root component, orchestrator chính
   │
   ├─ 📄 data/initialData.js ⭐⭐⭐⭐⭐
   │  └─> Single source of truth cho tất cả data
   │
   ├─ 📄 hooks/useEditor.js ⭐⭐⭐⭐⭐
   │  └─> State management logic
   │
   └─ 📄 utils/formatters.js ⭐⭐⭐
      └─> Helper functions
```

#### **BƯỚC 3: Component Architecture** (2-3 giờ)
```
📁 src/components/
   │
   ├─ 📁 layout/ ⭐⭐⭐⭐
   │  ├─ Header.jsx        (Navigation logic)
   │  ├─ TopBar.jsx        (Announcement)
   │  ├─ Navigation.jsx    (Menu system)
   │  ├─ Footer.jsx        (Footer layout)
   │  └─ FooterSection.jsx (Footer sections)
   │
   ├─ 📁 common/ ⭐⭐⭐
   │  ├─ Button.jsx        (Reusable button)
   │  ├─ IconButton.jsx    (Icon buttons)
   │  └─ SectionTitle.jsx  (Section headers)
   │
   ├─ 📁 products/ ⭐⭐⭐⭐⭐
   │  ├─ ProductGrid.jsx   (Products display)
   │  ├─ ProductCard.jsx   (Single product)
   │  ├─ CategoryGrid.jsx  (Categories display)
   │  └─ CategoryCard.jsx  (Single category)
   │
   ├─ 📁 hero/ ⭐⭐⭐
   │  ├─ HeroSlider.jsx    (Main slider)
   │  ├─ HeroSlide.jsx     (Single slide)
   │  ├─ SliderControls.jsx(Prev/Next buttons)
   │  └─ SliderDots.jsx    (Slide indicators)
   │
   ├─ 📁 editor/ ⭐⭐⭐⭐⭐
   │  ├─ EditorPanel.jsx      (Main editor UI)
   │  ├─ BrandEditor.jsx      (Edit brand)
   │  ├─ ProductsEditor.jsx   (Manage products)
   │  ├─ BannersEditor.jsx    (Manage banners)
   │  └─ CategoriesEditor.jsx (Manage categories)
   │
   └─ 📁 sections/ ⭐⭐⭐
      ├─ BrandStory.jsx    (About brand)
      ├─ ServicesSection.jsx
      └─ ServiceCard.jsx
```

#### **BƯỚC 4: Styling & Config** (30 phút)
```
📄 src/index.css
   └─> Global styles, Tailwind imports

📄 tailwind.config.js
   └─> Tailwind configuration

📄 postcss.config.js
   └─> PostCSS configuration
```

---

## 3. CẤU TRÚC DỰ ÁN CHI TIẾT

### 📁 **Full Directory Tree với mô tả**

```
dior-fashion-store/
│
├── public/
│   ├── index.html              # HTML template
│   └── favicon.ico             # Website icon
│
├── src/
│   │
│   ├── components/
│   │   │
│   │   ├── common/             # ⚙️ REUSABLE COMPONENTS
│   │   │   ├── Button.jsx      # Button với variants (default, secondary, large)
│   │   │   ├── IconButton.jsx  # Button với icon và optional badge
│   │   │   └── SectionTitle.jsx# Styled heading component
│   │   │
│   │   ├── layout/             # 🏗️ LAYOUT COMPONENTS
│   │   │   ├── Header.jsx      # Sticky header với navigation
│   │   │   │                   # Props: brandName, cart, menuOpen, onMenuToggle, navigation
│   │   │   │                   # Contains: Brand logo, menu toggle, icons, navigation
│   │   │   │
│   │   │   ├── TopBar.jsx      # Announcement bar
│   │   │   │                   # Props: message
│   │   │   │                   # Purpose: Display promotional messages
│   │   │   │
│   │   │   ├── Navigation.jsx  # Navigation menu component
│   │   │   │                   # Props: navigation, mobile
│   │   │   │                   # Variants: Desktop (horizontal), Mobile (vertical)
│   │   │   │
│   │   │   ├── Footer.jsx      # Footer container
│   │   │   │                   # Props: brand, sections
│   │   │   │                   # Layout: 4 columns (brand + 3 sections)
│   │   │   │
│   │   │   └── FooterSection.jsx # Individual footer section
│   │   │                       # Props: section
│   │   │                       # Renders: title + links
│   │   │
│   │   ├── hero/               # 🎪 HERO SLIDER COMPONENTS
│   │   │   ├── HeroSlider.jsx  # Main slider container
│   │   │   │                   # Props: slides, currentSlide, onNext, onPrev, onSelectSlide
│   │   │   │                   # Features: Auto-play, manual navigation, dots
│   │   │   │
│   │   │   ├── HeroSlide.jsx   # Individual slide
│   │   │   │                   # Props: slide, isActive
│   │   │   │                   # Contains: Background image, title, subtitle, CTA
│   │   │   │
│   │   │   ├── SliderControls.jsx # Prev/Next buttons
│   │   │   │                   # Props: onPrev, onNext
│   │   │   │
│   │   │   └── SliderDots.jsx  # Slide indicators
│   │   │                       # Props: count, current, onSelect
│   │   │
│   │   ├── products/           # 🛍️ PRODUCT COMPONENTS
│   │   │   ├── ProductGrid.jsx # Grid layout for products
│   │   │   │                   # Props: products, onAddToCart, title
│   │   │   │                   # Layout: Responsive grid (2→3→4 columns)
│   │   │   │
│   │   │   ├── ProductCard.jsx # Single product display
│   │   │   │                   # Props: product, onAddToCart
│   │   │   │                   # Features: Image, name, price, category, wishlist, add to cart
│   │   │   │
│   │   │   ├── CategoryGrid.jsx# Grid layout for categories
│   │   │   │                   # Props: categories, title
│   │   │   │                   # Layout: Responsive grid (1→3 columns)
│   │   │   │
│   │   │   └── CategoryCard.jsx# Single category display
│   │   │                       # Props: category
│   │   │                       # Features: Image, overlay, name, hover effects
│   │   │
│   │   ├── sections/           # 📄 PAGE SECTIONS
│   │   │   ├── BrandStory.jsx  # About brand section
│   │   │   │                   # Layout: 2 columns (image + text)
│   │   │   │                   # Content: Brand history, mission
│   │   │   │
│   │   │   ├── ServicesSection.jsx # Services overview
│   │   │   │                   # Props: services
│   │   │   │                   # Layout: 3 columns
│   │   │   │
│   │   │   └── ServiceCard.jsx # Individual service
│   │   │                       # Props: service
│   │   │
│   │   └── editor/             # ✏️ VISUAL EDITOR COMPONENTS
│   │       ├── EditorPanel.jsx     # Main editor container
│   │       │                       # Props: data, setData, onSave, onClose
│   │       │                       # Features: Tabs, save button, responsive
│   │       │
│   │       ├── BrandEditor.jsx     # Edit brand information
│   │       │                       # Can edit: name, tagline, topBarMessage, navigation
│   │       │                       # Features: Add/delete navigation items
│   │       │
│   │       ├── ProductsEditor.jsx  # Manage products
│   │       │                       # Features: CRUD operations on products
│   │       │                       # UI: List view with expand/collapse edit form
│   │       │
│   │       ├── BannersEditor.jsx   # Manage hero banners
│   │       │                       # Features: CRUD operations on banners
│   │       │                       # Can edit: title, subtitle, image URL
│   │       │
│   │       └── CategoriesEditor.jsx# Manage categories
│   │                               # Features: CRUD operations on categories
│   │                               # Can edit: name, image URL
│   │
│   ├── data/
│   │   └── initialData.js      # ⭐ SINGLE SOURCE OF TRUTH
│   │                           # Contains ALL application data:
│   │                           # - brand info
│   │                           # - topBarMessage
│   │                           # - navigation menu
│   │                           # - products array
│   │                           # - banners array
│   │                           # - categories array
│   │                           # - footerSections array
│   │
│   ├── hooks/
│   │   └── useEditor.js        # ⭐ CUSTOM HOOK FOR STATE MANAGEMENT
│   │                           # Manages:
│   │                           # - data (current editing data)
│   │                           # - savedData (last saved state)
│   │                           # - editMode (editor open/close)
│   │                           # Functions:
│   │                           # - handleSave()
│   │                           # - handleReset()
│   │                           # - toggleEditMode()
│   │
│   ├── utils/
│   │   └── formatters.js       # 🔧 UTILITY FUNCTIONS
│   │                           # - formatPrice(price) → VND format
│   │                           # - formatDate(date) → DD/MM/YYYY
│   │                           # - generateId(items) → Auto-increment ID
│   │
│   ├── App.jsx                 # ⭐ ROOT COMPONENT
│   │                           # Main orchestrator
│   │                           # Manages global state:
│   │                           # - cart, menuOpen, currentSlide, editMode
│   │                           # Contains all main sections
│   │
│   ├── index.js                # 📍 ENTRY POINT
│   │                           # ReactDOM.render()
│   │                           # Wraps App with StrictMode
│   │
│   └── index.css               # 🎨 GLOBAL STYLES
│                               # Tailwind imports
│                               # Custom CSS classes
│                               # Scrollbar hide utility
│
├── package.json                # 📦 DEPENDENCIES & SCRIPTS
│                               # - dependencies: react, lucide-react
│                               # - devDependencies: tailwind, postcss
│                               # - scripts: start, build, test
│
├── tailwind.config.js          # ⚙️ TAILWIND CONFIGURATION
│                               # Content paths
│                               # Theme extensions
│                               # Custom utilities
│
├── postcss.config.js           # ⚙️ POSTCSS CONFIGURATION
│                               # Tailwind plugin
│                               # Autoprefixer
│
├── .gitignore                  # 🚫 GIT IGNORE
│                               # node_modules, build, .env
│
├── README.md                   # 📖 PROJECT DOCUMENTATION
│                               # Installation guide
│                               # Features overview
│                               # Usage instructions
│
└── DEVELOPER_HANDOFF.md        # 📦 THIS FILE
                                # Developer onboarding guide
```

---

## 4. SETUP MÔI TRƯỜNG

### 🔧 **Prerequisites**
```bash
Node.js: >= 14.0.0
npm: >= 6.0.0
Git: >= 2.0.0
Code Editor: VS Code (recommended)
```

### 📥 **Installation Steps**

```bash
# 1. Clone repository
git clone 
cd dior-fashion-store

# 2. Install dependencies
npm install

# 3. Start development server
npm start

# Server sẽ chạy tại: http://localhost:3000
```

### 🔌 **VS Code Extensions (Recommended)**

```
1. ES7+ React/Redux/React-Native snippets
2. Tailwind CSS IntelliSense
3. Prettier - Code formatter
4. ESLint
5. Auto Rename Tag
6. Auto Close Tag
7. Path Intellisense
8. GitLens
```

### ⚙️ **Environment Variables**

Hiện tại chưa cần `.env` file. Khi tích hợp backend, cần tạo:

```bash
# .env.local
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_KEY=your-api-key
REACT_APP_STRIPE_KEY=your-stripe-key
```

---

## 5. DATA FLOW & ARCHITECTURE

### 🔄 **Data Flow Diagram**

```
┌─────────────────────────────────────────────────────┐
│                  initialData.js                      │
│         (Single Source of Truth)                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ brand, products, banners, categories, etc.   │  │
│  └──────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────────┘
                    │
                    ↓
         ┌──────────────────────┐
         │   useEditor Hook     │
         │  (State Management)  │
         ├──────────────────────┤
         │ - data               │
         │ - setData            │
         │ - editMode           │
         │ - handleSave()       │
         └──────────┬───────────┘
                    │
                    ↓
         ┌──────────────────────┐
         │      App.jsx         │
         │  (Root Component)    │
         ├──────────────────────┤
         │ - cart state         │
         │ - menuOpen state     │
         │ - currentSlide state │
         └──────────┬───────────┘
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
   ┌────────┐  ┌────────┐  ┌────────┐
   │ Header │  │Products│  │ Editor │
   └────────┘  └────────┘  └────────┘
        │           │           │
        ↓           ↓           ↓
   Navigation   ProductCard  BrandEditor
                CategoryCard ProductsEditor
```

### 🎯 **Component Communication**

```javascript
// Parent → Child (Props)
<ProductCard 
  product={product}           // Data
  onAddToCart={handleAddCart} // Callback
/>

// Child → Parent (Callback)
const ProductCard = ({ product, onAddToCart }) => {
  return (
    <button onClick={() => onAddToCart(product)}>
      Add to Cart
    
  );
};
```

### 🔧 **State Management Pattern**

```javascript
// App.jsx (Parent)
const [cart, setCart] = useState([]);

const handleAddToCart = (product) => {
  setCart([...cart, product]);
};

// ProductCard.jsx (Child)
<Button onClick={() => onAddToCart(product)}>
  Add to Cart

```

---

## 6. KEY FILES REFERENCE

### ⭐ **TOP 10 Most Important Files**

#### **#1: `src/App.jsx`**
**Vai trò:** Root component, orchestrator chính
**Khi nào sửa:**
- Thêm/xóa sections trong layout
- Thay đổi global state
- Tích hợp routing
- Thêm global providers (Auth, Theme)

**Key Code Patterns:**
```javascript
// State management
const { data, setData, editMode, handleSave, toggleEditMode } = useEditor();
const [cart, setCart] = useState([]);

// Event handlers
const handleAddToCart = (product) => {
  setCart([...cart, product]);
};

// Layout structure



  
  
  


```

---

#### **#2: `src/data/initialData.js`**
**Vai trò:** Single source of truth
**Khi nào sửa:**
- Thêm sản phẩm mới
- Thay đổi banners
- Update navigation menu
- Đổi brand info

**Structure:**
```javascript
export const INITIAL_DATA = {
  brand: {
    name: 'DIOR',
    tagline: '...'
  },
  topBarMessage: '...',
  navigation: ['WOMEN', 'MEN', ...],
  products: [{id, name, price, category, image}, ...],
  banners: [{id, title, subtitle, image}, ...],
  categories: [{name, img}, ...],
  footerSections: [{title, links}, ...]
};
```

---

#### **#3: `src/hooks/useEditor.js`**
**Vai trò:** Custom hook quản lý editor state
**Khi nào sửa:**
- Thêm localStorage persistence
- Implement undo/redo
- Integrate API calls
- Add validation logic

**Functions:**
```javascript
return {
  data,          // Current editing data
  setData,       // Update function
  savedData,     // Last saved state
  editMode,      // Boolean: editor open/close
  handleSave,    // Save function
  handleReset,   // Reset to saved
  toggleEditMode // Toggle editor
};
```

---

#### **#4: `src/components/editor/EditorPanel.jsx`**
**Vai trò:** Main editor UI
**Features:**
- Tab navigation (4 tabs)
- Save button
- Responsive design (fullscreen mobile, sidebar desktop)

**Khi nào sửa:**
- Thêm tab mới (e.g., Settings, SEO)
- Thay đổi UI/layout
- Thêm export/import functionality

---

#### **#5: `src/components/products/ProductGrid.jsx`**
**Vai trò:** Display products in grid
**Props:**
- `products`: Array<Product>
- `onAddToCart`: Function
- `title`: String

**Khi nào sửa:**
- Thay đổi grid layout (columns)
- Thêm filter/sort
- Implement pagination
- Add loading states

---

#### **#6: `src/components/products/ProductCard.jsx`**
**Vai trò:** Single product display
**Features:**
- Image với hover effects
- Price formatting
- Add to cart button
- Wishlist icon

**Khi nào sửa:**
- Thêm quick view modal
- Thêm rating stars
- Thêm quantity selector
- Thêm variant selection

---

#### **#7: `src/components/layout/Header.jsx`**
**Vai trò:** Sticky header với navigation
**Features:**
- Brand logo
- Menu toggle (mobile)
- Icons (search, wishlist, user, cart)
- Navigation menu

**Khi nào sửa:**
- Thêm search bar
- Thêm user dropdown menu
- Thay đổi mobile menu style
- Thêm notifications

---

#### **#8: `src/utils/formatters.js`**
**Vai trò:** Utility functions
**Functions:**
- `formatPrice(price)` → "85,000,000 VND"
- `formatDate(date)` → "11/01/2025"
- `generateId(items)` → 7

**Khi nào sửa:**
- Thêm format functions mới
- Đổi currency format
- Thêm validation helpers

---

#### **#9: `tailwind.config.js`**
**Vai trò:** Tailwind configuration
**Khi nào sửa:**
- Thêm custom colors
- Thêm custom fonts
- Extend theme
- Add plugins

```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#FFFFFF'
      }
    }
  }
}
```

---

#### **#10: `package.json`**
**Vai trò:** Dependencies & scripts
**Khi nào sửa:**
- Thêm new package
- Update dependencies
- Thêm custom scripts

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  }
}
```

---

## 7. ROADMAP PHÁT TRIỂN

### 🎯 **PHASE 1: Essential Features (Week 1-2)**

#### **Priority 1: Data Persistence**
```
Files cần sửa:
- src/hooks/useEditor.js
  └─> Thêm localStorage save/load

Code example:
useEffect(() => {
  const saved = localStorage.getItem('diorData');
  if (saved) {
    setData(JSON.parse(saved));
  }
}, []);

const handleSave = () => {
  localStorage.setItem('diorData', JSON.stringify(data));
  setSavedData(data);
};
```

#### **Priority 2: Cart Sidebar**
```
Files cần tạo:
- src/components/cart/CartSidebar.jsx
- src/components/cart/CartItem.jsx

Files cần sửa:
- src/App.jsx (thêm cartOpen state)
- src/components/layout/Header.jsx (onClick cart icon)
```

#### **Priority 3: Search Functionality**
```
Files cần tạo:
- src/components/common/SearchBar.jsx

Files cần sửa:
- src/App.jsx (thêm search state & filter logic)
- src/components/layout/Header.jsx (thêm SearchBar)
```

---

### 🎯 **PHASE 2: Enhanced UX (Week 3-4)**

#### **Priority 4: Product Filter**
```
Files cần tạo:
- src/components/products/FilterBar.jsx

Files cần sửa:
- src/App.jsx (filter logic)
- src/components/products/ProductGrid.jsx
```

#### **Priority 5: Product Quick View**
```
Files cần tạo:
- src/components/products/ProductModal.jsx

Files cần sửa:
- src/components/products/ProductCard.jsx (thêm onClick)
```

---

### 🎯 **PHASE 3: Backend Integration (Week 5-8)**

#### **Priority 6: API Service Layer**
```
Files cần tạo:
- src/services/api.js
- src/services/auth.js
- src/services/products.js

Example:
// src/services/api.js
const API_URL = process.env.REACT_APP_API_URL;

export const fetchProducts = async () => {
  const response = await fetch(`${API_URL}/products`);
  return response.json();
};
```

#### **Priority 7: Authentication**
```
Files cần tạo:
- src/context/AuthContext.js
- src/components/auth/LoginModal.jsx
- src/components/auth/RegisterModal.jsx

Files cần sửa:
- src/index.js (wrap với AuthProvider)
- src/components/layout/Header.jsx (user menu)
```

---

### 🎯 **PHASE 4: E-commerce Features (Week 9-12)**

#### **Priority 8: Checkout Flow**
```
Files cần tạo:
- src/pages/Checkout.jsx
- src/components/checkout/CheckoutForm.jsx
- src/components/checkout/OrderSummary.jsx

Cần thêm:
- React Router Dom
- Form validation (React Hook Form)
```

#### **Priority 9: Payment Integration**
```
Files cần tạo:
- src/services/payment.js
- src/components/checkout/PaymentForm.jsx

Dependencies cần thêm:
- @stripe/stripe-js
- @stripe/react-stripe-js
```

---

## 8. CODING CONVENTIONS

### 📝 **File Naming**
```
Components: PascalCase
├─ ProductCard.jsx
├─ HeroSlider.jsx
└─ BrandEditor.jsx

Utilities: camelCase
├─ formatters.js
├─ validators.js
└─ api.js

Constants: UPPER_SNAKE_CASE
└─ API_CONSTANTS.js
```

### 📝 **Component Structure**
```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { Icon } from 'lucide-react';
import OtherComponent from './OtherComponent';

// 2. Component definition
const MyComponent = ({ prop1, prop2 }) => {
  // 3. State
  const [state, setState] = useState(null);
  
  // 4. Effects
  useEffect(() => {
    // side effects
  }, []);
  
  // 5. Handlers
  const handleClick = () => {
    // logic
  };
  
  // 6. Early returns
  if (!data) return null;
  
  // 7. JSX
  return (
    
      {/* content */}
    
  );
};

// 8. Export
export default MyComponent;
```

### 📝 **Props Destructuring**
```javascript
// ✅ Good
const ProductCard = ({ product, onAddToCart }) => {
  return {product.name}
};

// ❌ Bad
const ProductCard = (props) => {
  return {props.product.name}
};
```

### 📝 **Conditional Rendering**
```javascript
// ✅ Early return
if (!data) return null;

// ✅ Ternary for simple conditions
{isLoading ?  : }

// ✅ && operator
{error && }

// ❌ Avoid nested ternaries
{isLoading ?  : isError ?  : }
```

---