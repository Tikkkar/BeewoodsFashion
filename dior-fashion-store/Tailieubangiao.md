# 🤖 DIOR STORE - AI CONTEXT DOCUMENT

> **Purpose:** Essential context for AI to understand and improve the project
> **Last Updated:** 2025-01-13
> **AI Target:** Claude/GPT for UI improvements & Backend integration

---

## 🎯 PROJECT OVERVIEW

**Type:** E-commerce Fashion Store (DIOR-inspired luxury brand)
**Status:** 70% Complete (Frontend: 90% | Backend: 50%)
**Goal:** Premium online shopping experience with admin dashboard

---

## 🛠️ TECH STACK
Frontend: React 18.2.0 + Tailwind CSS 3.3.0
Backend: Supabase (PostgreSQL + Auth + Storage)
Routing: React Router DOM
Icons: Lucide React 0.263.1
State: React Hooks (useState, useEffect, custom hooks)
Storage: Supabase Database (migrated from localStorage)
Build: Create React App
---

## 📁 CRITICAL FILES FOR AI

### **Core Logic:**
1. `src/App.jsx` - Main orchestrator, all routes, global state
2. `src/lib/supabase.js` - Supabase client configuration
3. `src/lib/api/products.js` - API functions for products
4. `src/hooks/useProducts.js` - Custom hooks for data fetching
5. `src/hooks/useToast.js` - Toast notifications system

### **Styling:**
6. `src/index.css` - Global styles, Tailwind imports, custom animations
7. `tailwind.config.js` - Theme, colors, custom utilities

### **Key Pages:**
8. `src/pages/HomePage.jsx` - Main landing page with products (Supabase integrated)
9. `src/pages/ProductsPage.jsx` - All products with filters (Supabase integrated)
10. `src/pages/ProductDetailPage.jsx` - Single product page (Supabase integrated)
11. `src/pages/CheckoutPage.jsx` - Checkout form

### **Key Components:**
12. `src/components/layout/Header.jsx` - Navigation
13. `src/components/products/ProductCard.jsx` - Product display (Supabase integrated)
14. `src/components/products/QuickViewModal.jsx` - Quick view (Supabase integrated)
15. `src/components/hero/HeroSlider.jsx` - Banner slider (Supabase integrated)
16. `src/components/cart/CartSidebar.jsx` - Shopping cart
17. `src/components/cart/WishlistSidebar.jsx` - Wishlist

---

## ✅ COMPLETED FEATURES
✅ Product Grid with Search, Filter, Sort (Supabase integrated)
✅ Cart with LocalStorage persistence
✅ Wishlist with LocalStorage persistence
✅ Product Detail Page with sizes, quantity, reviews (Supabase integrated)
✅ Quick View Modal (Supabase integrated)
✅ Checkout Flow (form validation, order summary)
✅ Order Success Page
✅ Toast Notifications
✅ Responsive Design (mobile-friendly)
✅ Hero Slider with auto-play (Supabase integrated)
✅ Category Grid
✅ Brand Story Section
✅ Footer with sections
✅ BACKEND - SUPABASE:
✅ Database schema (11 tables)
✅ Row Level Security (RLS) policies
✅ Sample data imported
✅ Storage buckets configured
✅ Products API integration
✅ Categories API integration
✅ Banners API integration
✅ Product images management
✅ Product sizes management
✅ Reviews system

---

## 🚀 REMAINING TASKS

### **Phase 1: Complete Backend Integration** 🔥 CRITICAL🔥 HIGH PRIORITY (Next 2-3 days):
❌ Admin Dashboard - Product Management

Create/Edit/Delete products
Upload images to Supabase Storage
Manage sizes and stock
Real-time preview

❌ Admin Dashboard - Order Management

View all orders
Update order status
Filter by status/date
Export reports

❌ Checkout Integration with Supabase

Save orders to database
Generate order number
Send order confirmation
Update stock after purchase

❌ Authentication System

Login/Register pages
Supabase Auth integration
Protected admin routes
User profile page
Password reset

📊 MEDIUM PRIORITY (Week 2):
❌ Admin Dashboard - Categories & Banners

CRUD categories with images
CRUD banners for slider
Reorder display_order
Toggle is_active status

❌ Admin Dashboard - Analytics

Total revenue
Total orders by status
Best selling products
Recent orders table
Charts (optional)

❌ User Features

Order history page
Track order status
Re-order functionality
Saved addresses

🎨 LOW PRIORITY (Week 3):
❌ Admin Dashboard - Reviews Management

Approve/reject reviews
Reply to reviews
Flag inappropriate content

❌ Email Notifications

Order confirmation email
Shipping updates
Password reset email


### **Phase 2: UI/UX Improvements**
🎨 Better animations (page transitions, scroll effects)
🎨 Loading states (skeletons, spinners)
🎨 Micro-interactions (button ripples, smooth hovers)
🎨 Image optimization (lazy loading, progressive loading)
🎨 Better mobile UX
🎨 Dark mode toggle (optional)
🎨 Accessibility improvements

### **Phase 3: E-commerce Enhancements**
💳 Payment Integration (VNPay/Stripe)
📧 Email service (SendGrid/Resend)
📦 Shipping integration (GHN/GHTK)
📊 Advanced analytics
🔔 Push notifications
💬 Live chat support
📱 Mobile app (React Native - optional)

---

## 🗄️ DATABASE SCHEMA
```sql
Tables Created:
1. users - Extended auth.users with profile info
2. addresses - User shipping addresses
3. categories - Product categories
4. products - Main products table
5. product_images - Multiple images per product
6. product_sizes - Size variants with stock
7. orders - Customer orders
8. order_items - Order line items
9. reviews - Product reviews
10. wishlists - User wishlist items
11. banners - Homepage slider banners

Key Features:
- UUID primary keys
- Foreign key relationships
- Indexes for performance
- RLS policies for security
- Auto-generated order numbers
- Timestamp triggers

🎨 CURRENT UI STYLE
Design Philosophy:

Minimal & Elegant (luxury fashion)
Black & White color scheme
Generous whitespace
Clean typography
Subtle hover effects
Smooth animations

Tailwind Theme:

Primary: Black (#000000)
Secondary: White (#FFFFFF)
Accent: Gray shades
Font: System fonts (tracking-wide, font-light)


🎯 AI INSTRUCTIONS FOR NEW FEATURES
When building Admin Dashboard:

Follow minimal luxury aesthetic
Use Tailwind CSS only (no Material-UI)
Add loading states for all async operations
Include error handling and user feedback
Make it mobile-responsive
Add confirmation modals for destructive actions
Use toast notifications for success/error messages

Code Patterns to Follow:
javascript// ✅ API Calls with Error Handling
const { data, error } = await supabase
  .from('products')
  .select('*');

if (error) {
  console.error('Error:', error);
  toast.error('Failed to load products');
  return;
}

// ✅ Form Submission
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const { error } = await supabase
      .from('products')
      .insert([formData]);
    
    if (error) throw error;
    toast.success('Product created!');
    navigate('/admin/products');
  } catch (err) {
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
};

// ✅ Image Upload to Supabase Storage
const handleImageUpload = async (file) => {
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('products')
    .upload(fileName, file);
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(fileName);
  
  return publicUrl;
};

📝 ADMIN DASHBOARD REQUIREMENTS
Layout Structure:
/admin
├── /dashboard       - Analytics overview
├── /products        - Products list
├── /products/new    - Add new product
├── /products/:id    - Edit product
├── /categories      - Categories management
├── /banners         - Banners management
├── /orders          - Orders list
├── /orders/:id      - Order detail
└── /settings        - Admin settings
Admin Sidebar Menu:
📊 Dashboard
📦 Products
  ├─ All Products
  ├─ Add New
  └─ Categories
🖼️ Banners
🛒 Orders
⚙️ Settings
🚪 Logout
Key Features Needed:

Products Management:

DataTable with search, filter, sort
Add/Edit form with validation
Multiple image upload
Size & stock management
Rich text editor for description
Preview before publish


Orders Management:

Orders table with filters
Status update dropdown
Order detail view
Print invoice
Export to CSV


Image Upload:

Drag & drop
Multiple files
Preview thumbnails
Progress indicator
Image optimization (optional)




🔐 AUTHENTICATION REQUIREMENTS
User Roles:
javascript// In users table
role: 'customer' | 'admin'

// RLS Policies
- Customers can view their own orders
- Admins can view/edit everything
- Public can view products
Protected Routes:
javascript// Wrap admin routes with auth check
<Route path="/admin/*" element={
  <ProtectedRoute requiredRole="admin">
    <AdminLayout />
  </ProtectedRoute>
} />

🚫 WHAT AI SHOULD NOT DO
❌ Don't use CSS-in-JS libraries
❌ Don't use styled-components
❌ Don't use Material-UI or Bootstrap
❌ Don't add new dependencies without asking
❌ Don't use class components
❌ Don't use Redux (we use React hooks + Supabase)
❌ Don't hardcode API URLs
❌ Don't expose service_role key in frontend

✅ WHAT AI SHOULD DO
✅ Use Supabase for all data operations
✅ Follow existing code patterns
✅ Add proper error handling
✅ Include loading states
✅ Add toast notifications
✅ Make components responsive
✅ Add helpful comments
✅ Use TypeScript-style JSDoc (optional)
✅ Optimize images and performance
✅ Follow security best practices
✅ Test all CRUD operations

📊 PRIORITY MATRIX
HIGH PRIORITY (Do First):
1. Admin Product Management ⭐⭐⭐
2. Checkout → Save Orders ⭐⭐⭐
3. Authentication System ⭐⭐⭐

MEDIUM PRIORITY (Do Second):
4. Admin Orders Management ⭐⭐
5. Admin Categories/Banners ⭐⭐
6. User Order History ⭐⭐

LOW PRIORITY (Do Later):
7. Email Notifications ⭐
8. Payment Gateway ⭐
9. Advanced Analytics ⭐

🎯 SUCCESS CRITERIA
Project is considered "Complete" when:

✅ Users can browse and buy products
✅ Admin can manage products without coding
✅ Orders are saved to database
✅ Authentication works properly
✅ All pages are mobile-friendly
✅ No console errors
✅ Loading states everywhere
✅ Proper error handling


📈 CURRENT PROGRESS
Overall: 70% Complete

Frontend: 90% ✅
├─ Homepage: 100% ✅
├─ Products Page: 100% ✅
├─ Product Detail: 100% ✅
├─ Cart/Wishlist: 90% ✅
├─ Checkout: 80% ⚠️ (needs Supabase integration)
└─ Admin Dashboard: 0% ❌

Backend: 50% ⚠️
├─ Database Schema: 100% ✅
├─ RLS Policies: 100% ✅
├─ Products API: 100% ✅
├─ Categories API: 100% ✅
├─ Banners API: 100% ✅
├─ Orders API: 0% ❌
├─ Auth: 0% ❌
└─ Admin APIs: 0% ❌

📞 NEXT IMMEDIATE STEPS
For User:

Choose admin dashboard approach
Decide on authentication method
Test current Supabase integration
Add more sample products via Supabase Editor

For AI (Claude):

Build Admin Product Management page
Create ImageUpload component
Build Admin API functions
Add Authentication
Integrate Checkout with Orders table


END OF AI CONTEXT
AI: Project is 70% complete. Focus on Admin Dashboard and Authentication next! 🚀

---

## 📋 TÓM TẮT NHỮNG VIỆC CẦN LÀM

### **🔥 URGENT (Tuần này):**
1. ✅ Admin Dashboard - Product Management
2. ✅ Admin Dashboard - Upload Images
3. ✅ Checkout Integration với Supabase
4. ✅ Authentication (Login/Register)

### **📊 QUAN TRỌNG (Tuần sau):**
5. Admin Orders Management
6. Admin Categories & Banners
7. User Order History
8. Email Notifications

### **🎨 BỔ SUNG (Sau này):**
9. Payment Gateway (VNPay)
10. Shipping Integration
11. Advanced Analytics
12. Mobile App (optional)