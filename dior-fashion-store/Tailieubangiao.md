# 🤖 BeWo STORE - AI CONTEXT DOCUMENT

> **Purpose:** Essential context for AI to understand and improve the project
> **Last Updated:** 2025-01-15 (Phase 3 Complete)
> **AI Target:** Claude/GPT for UI improvements & Backend integration

---

## 🎯 PROJECT OVERVIEW

**Type:** E-commerce Fashion Store (BeWo-inspired luxury brand)
**Status:** 98% Complete (Frontend: 98% | Backend: 95% | Auth: 100% | Admin: 100% | User: 100%)
**Goal:** Premium online shopping experience with full admin dashboard and user features

---

## 🛠️ TECH STACK
- **Frontend:** React 18.2.0 + Tailwind CSS 3.3.0
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Routing:** React Router DOM
- **Icons:** Lucide React 0.263.1
- **State:** React Hooks (useState, useEffect, custom hooks)
- **Storage:** Supabase Database (migrated from localStorage)
- **Auth:** Supabase Auth (Email/Password)
- **Build:** Create React App

---

## 📁 CRITICAL FILES FOR AI

### **Core Logic:**
1. `src/App.jsx` - Main orchestrator, routes, global state, AuthProvider
2. `src/lib/supabase.js` - Supabase client configuration
3. `src/lib/api/products.js` - Products API functions
4. `src/lib/api/orders.js` - Orders API functions
5. `src/lib/api/auth.js` - Authentication API functions
6. `src/lib/api/admin.js` - Admin API functions (Products, Categories, Banners, Orders, Stats)
7. `src/lib/api/user.js` - User API (Profile, Addresses, Orders) ✨ NEW
8. `src/lib/api/reviews.js` - Reviews API ✨ NEW
9. `src/lib/api/wishlist.js` - Wishlist API ✨ NEW
10. `src/hooks/useProducts.js` - Custom hooks for data fetching
11. `src/hooks/useAuth.js` - Auth context and hooks
12. `src/hooks/useToast.js` - Toast notifications system
13. `src/lib/api/discounts.js` - Discount code API ✨ NEW

### **Styling:**
13. `src/index.css` - Global styles, Tailwind imports, custom animations
14. `tailwind.config.js` - Theme, colors, custom utilities

### **Key Pages (Frontend):**
15. `src/pages/HomePage.jsx` - Main landing (Supabase integrated)
16. `src/pages/ProductsPage.jsx` - All products with filters (Supabase integrated)
17. `src/pages/ProductDetailPage.jsx` - Single product (Supabase integrated)
18. `src/pages/CheckoutPage.jsx` - Checkout form (Supabase integrated)
19. `src/pages/OrderSuccessPage.jsx` - Order confirmation (Supabase integrated)
20. `src/pages/auth/LoginPage.jsx` - Login page (Supabase Auth)
21. `src/pages/auth/RegisterPage.jsx` - Register page (Supabase Auth)

### **Admin Pages:**
22. `src/pages/admin/AdminLayout.jsx` - Admin sidebar layout
23. `src/pages/admin/AdminDashboard.jsx` - Dashboard with stats & best selling
24. `src/pages/admin/AdminProducts.jsx` - Products list management
25. `src/pages/admin/AdminProductForm.jsx` - Add/Edit product form
26. `src/pages/admin/AdminCategories.jsx` - Categories CRUD with image upload
27. `src/pages/admin/AdminBanners.jsx` - Banners CRUD for hero slider
28. `src/pages/admin/AdminOrders.jsx` - Orders list with filters & search
29. `src/pages/admin/AdminOrderDetail.jsx` - Order detail & status update

### **User Pages:** ✨ NEW
30. `src/pages/user/ProfileLayout.jsx` - User profile sidebar layout
31. `src/pages/user/ProfilePage.jsx` - View/Edit profile & Change password
32. `src/pages/user/OrderHistoryPage.jsx` - Order history with filters
33. `src/pages/user/OrderDetailPage.jsx` - Order detail & cancel order
34. `src/pages/user/AddressesPage.jsx` - Addresses CRUD
35. `src/pages/user/WishlistPage.jsx` - Wishlist display

### **Key Components:**
36. `src/components/layout/Header.jsx` - Navigation with auth dropdown
37. `src/components/products/ProductCard.jsx` - Product display
38. `src/components/cart/CartSidebar.jsx` - Shopping cart
39. `src/components/cart/WishlistSidebar.jsx` - Wishlist
40. `src/components/auth/ProtectedRoute.jsx` - Route protection
41. `src/components/hero/HeroSlider.jsx` - Banner slider
42. `src/components/admin/ImageUpload.jsx` - Reusable image uploader
43. `src/components/reviews/StarRating.jsx` - Star rating component ✨ NEW
44. `src/components/reviews/ReviewForm.jsx` - Add review form ✨ NEW

---

## ✅ COMPLETED FEATURES

### **Frontend (98%):**
✅ Product Grid with Search, Filter, Sort, Pagination (Supabase)
✅ Cart with localStorage persistence + quantity controls
✅ Wishlist with localStorage persistence
✅ Product Detail Page (sizes, quantity, reviews) (Supabase)
✅ Quick View Modal (Supabase)
✅ Checkout Flow (Supabase orders integration)
✅ Discount Code application on Checkout page ✨ NEW
✅ Order Success Page (Supabase data)
✅ Toast Notifications (replaced alerts)
✅ Responsive Design (mobile-friendly)
✅ Hero Slider with auto-play (Supabase banners)
✅ Category Grid (Supabase)
✅ Brand Story Section
✅ Footer with sections

### **Backend (95%):**
✅ Database schema (11 tables with proper relationships)
✅ Row Level Security (RLS) policies configured
✅ Sample data imported
✅ Storage buckets configured (products, banners, categories)
✅ Products API fully integrated
✅ Categories API fully integrated
✅ Banners API fully integrated
✅ Orders API (create, get by ID, get by number)
✅ Discount code verification system ✨ NEW
✅ Order Items creation
✅ Stock management after order
✅ Product images management
✅ Product sizes management
✅ Reviews system fully integrated ✨
✅ Wishlist system fully integrated ✨
✅ User addresses management ✨

### **Authentication (100%):**
✅ Supabase Auth integration (Email/Password)
✅ Login Page with validation
✅ Register Page with validation
✅ Auth Context/Provider (useAuth hook)
✅ Protected Routes component
✅ User profile loading from database
✅ Role-based access (customer/admin)
✅ Auth state persistence across refreshes
✅ Header dropdown menu for authenticated users
✅ Logout functionality
✅ RLS policies allowing anonymous + authenticated access
✅ Fixed infinite auth loop on page refresh

### **Admin Dashboard (100%):** ✨ PHASE 2 COMPLETE
✅ Admin Layout with Sidebar & Mobile Menu
✅ Admin Dashboard with Statistics:
  - Total Revenue (from completed orders)
  - Total Orders (all statuses)
  - Pending Orders count
  - Active Products count
  - Recent Orders table (last 5)
  - **Best Selling Products** (top 5 by quantity sold)
  - Quick action links
✅ Admin Products Management (CRUD):
  - List all products with search/filter
  - Add new product form
  - Edit existing product
  - Delete product with confirmation
  - Upload multiple images to Supabase Storage
  - Manage sizes and stock
  - Set featured products
  - Active/Inactive toggle
✅ Admin Categories Management (CRUD):
  - List categories with search/filter
  - Add/Edit/Delete categories
  - **Upload category images** to Supabase Storage
  - Image preview in modal
  - Display order management
  - Active/Inactive toggle
  - Stats cards (Total, Active, Inactive)
✅ Admin Banners Management (CRUD):
  - List banners with image preview
  - Add/Edit/Delete banners
  - Upload banner images to Supabase Storage
  - Reorder banners (up/down arrows)
  - Display order management
  - Active/Inactive toggle
  - Button text & link configuration
✅ Admin Orders Management:
  - List all orders in table
  - **Search by order number, customer name, email**
  - **Filter by status** (all, pending, processing, shipping, completed, cancelled)
  - **Stats cards** (Total Orders, Revenue, Pending, Completed)
  - View order details
  - Update order status
  - Customer information display
  - Summary footer with counts

### **User Features (100%):** ✨ PHASE 3 COMPLETE
✅ User Profile Management:
  - View profile information
  - Edit full name, phone
  - Change password with validation
  - Account info display
✅ Order History & Tracking:
  - View all user orders
  - Filter by status
  - View detailed order information
  - Cancel pending orders
  - Track order status
✅ Addresses Management:
  - List all addresses
  - Add new address (full form)
  - Edit existing address
  - Delete address
  - Set default address
  - Default address indicator
✅ Wishlist Management:
  - View wishlist
  - Add/Remove products
  - Sync to database
  - Add to cart from wishlist
✅ Reviews System:
  - Star rating component (interactive & display)
  - Review form modal
  - Submit product reviews
  - Verified purchase badge
  - Prevent duplicate reviews
  - Calculate average rating

---

## 🎨 CURRENT UI STYLE

**Design Philosophy:**
- Minimal & Elegant (luxury fashion)
- Black & White color scheme
- Generous whitespace
- Clean typography
- Subtle hover effects
- Smooth animations

**Tailwind Theme:**
- Primary: Black (#000000)
- Secondary: White (#FFFFFF)
- Accent: Gray shades
- Font: System fonts (tracking-wide, font-light)

---

## 🚀 REMAINING TASKS

### **Phase 4: Enhancements** (Optional - Future Development)
⬜ Payment Gateway Integration (VNPay/Stripe)
⬜ Email Notifications (Order confirmation, status updates)
⬜ Shipping Integration (GHN/GHTK)
⬜ Advanced Search (Algolia or similar)
⬜ Product Recommendations (based on views/purchases)
⬜ Advanced Analytics Dashboard (charts, trends)
⬜ Dark Mode (optional)
⬜ Mobile App (React Native - optional)
⬜ SEO Optimization
⬜ Performance Optimization

---

## 🗄️ DATABASE SCHEMA (SUPABASE)

```sql
Tables:
1. users - Extended auth.users with profile info (role: customer/admin)
2. addresses - User shipping addresses
3. categories - Product categories (name, slug, image_url, is_active)
4. products - Main products (name, slug, price, description, stock, is_active, is_featured)
5. product_images - Multiple images per product (image_url, is_primary, display_order)
6. product_sizes - Size variants with stock (size, stock)
7. orders - Customer orders (auto-generated order_number, status, payment_status)
8. order_items - Order line items
9. reviews - Product reviews (rating, comment, is_verified_purchase)
10. wishlists - User wishlist items
11. banners - Homepage slider banners (title, subtitle, image_url, display_order)
12. discounts - Stores discount codes and rules (code, type, value, is_active) -- NEW

Key Features:
- UUID primary keys
- Foreign key relationships with ON DELETE CASCADE
- Indexes for performance (slug, email, created_at)
- RLS policies for security
- Auto-generated order numbers (ORD-YYYYMMDD-XXXX)
- Timestamp triggers (created_at, updated_at)
```

### 🔐 RLS POLICIES (CONFIGURED)

```sql
PUBLIC ACCESS (Anonymous Users):
✅ View active products (is_active = true)
✅ View active categories
✅ View active banners
✅ View product images
✅ View product sizes
✅ View reviews
✅ Create orders (guest checkout)
✅ Create order items
✅ View active discount codes -- NEW

AUTHENTICATED USERS:
✅ All of above
✅ View own profile
✅ Update own profile
✅ View own orders
✅ Create reviews
✅ Manage own wishlist
✅ Manage own addresses

ADMIN USERS (role = 'admin'):
✅ All of above
✅ Manage products (CRUD)
✅ Manage categories (CRUD)
✅ Manage banners (CRUD)
✅ View all orders
✅ Update order status
✅ View dashboard statistics
```

---

## 🎯 AI INSTRUCTIONS FOR PHASE 4 (ENHANCEMENTS - OPTIONAL)

Phase 4 is optional and focuses on advanced features. Only implement if needed:

1. **Payment Integration** - VNPay or Stripe
2. **Email System** - SendGrid or AWS SES
3. **Shipping Integration** - GHN or GHTK API
4. **Advanced Search** - Algolia or Elasticsearch
5. **Recommendations** - AI-based product suggestions
6. **Analytics** - Charts with Chart.js or Recharts

---

## 🔑 KEY PATTERNS

### Authentication Check:
```javascript
const { user, isAdmin } = useAuth();

// In component
if (!user) {
  return <Navigate to="/login" />;
}
```

### Protected User Route:
```javascript
<Route 
  path="/profile/*" 
  element={
    <ProtectedRoute>
      <ProfileLayout />
    </ProtectedRoute>
  } 
/>
```

### Toast Notifications:
```javascript
const { success, error } = useToast();
success('Action completed!');
error('Something went wrong!');
```

### Price Formatting:
```javascript
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};
```

---

## 📊 PROGRESS TRACKER

**Overall Progress: 98%**

```
Frontend: ████████████████████░ 98%
Backend:  ███████████████████░░ 95%
Auth:     █████████████████████ 100%
Admin:    █████████████████████ 100% ✅
User:     █████████████████████ 100% ✅
```

### Completed:
✅ Products Display & Detail (Supabase)
✅ Cart & Checkout (Supabase orders)
✅ Authentication System (100%)
✅ RLS Policies
✅ Anonymous + Authenticated Access
✅ **Admin Dashboard (100%)** ✨
✅ **Products CRUD**
✅ **Categories CRUD with Image Upload**
✅ **Banners CRUD with Image Upload**
✅ **Orders Management with Filters**
✅ **Dashboard Statistics & Best Selling**
✅ **User Profile & Password** ✨
✅ **Order History & Tracking** ✨
✅ **Addresses CRUD** ✨
✅ **Reviews System** ✨
✅ **Wishlist Management** ✨
✅ Discount Code System ✨ NEW

### Next Up:
🔥 Phase 4 - Optional Enhancements (Payment, Email, Shipping, etc.)

---

## 🚫 WHAT AI SHOULD NOT DO

❌ Don't use CSS-in-JS libraries
❌ Don't use styled-components
❌ Don't use Material-UI or Bootstrap
❌ Don't add new dependencies without asking
❌ Don't use class components
❌ Don't use Redux (we use React hooks + Supabase)
❌ Don't hardcode API URLs
❌ Don't expose service_role key in frontend (use anon key only)
❌ Don't use localStorage for auth (Supabase handles this)
❌ Don't disable RLS in production

---

## ✅ WHAT AI SHOULD DO

✅ Use Supabase for all data operations
✅ Follow existing code patterns in admin.js and auth.js
✅ Add proper error handling with toast notifications
✅ Include loading states for async operations
✅ Make components mobile-responsive
✅ Add helpful comments for complex logic
✅ Use TypeScript-style JSDoc comments (optional)
✅ Optimize images and performance
✅ Follow security best practices (RLS, input validation)
✅ Test all CRUD operations before finalizing
✅ Keep UI consistent with existing aesthetic (black/white/minimal)

---

## 🎯 SUCCESS CRITERIA

### Phase 2 (Admin Dashboard) - ✅ COMPLETE

### Phase 3 (User Features) - ✅ COMPLETE
✅ User can view and edit their profile
✅ User can change password
✅ User can view order history with filters
✅ User can track order status
✅ User can cancel pending orders
✅ User can submit product reviews
✅ User can manage addresses (CRUD)
✅ User can add/remove wishlist items
✅ Wishlist syncs to database when logged in
✅ All pages are mobile-responsive
✅ No console errors
✅ Proper loading and error states

### Phase 4 (Enhancements) - ⬜ OPTIONAL

---

## 📝 KNOWN ISSUES & SOLUTIONS

### Issue 1: Auth Loop on Page Refresh ✅ FIXED
**Solution:** Use initialized flag in useAuth to prevent duplicate SIGNED_IN events
```javascript
const initialized = useRef(false);
if (event === 'INITIAL_SESSION' || !initialized.current) return;
```

### Issue 2: RLS Blocking Anonymous Users ✅ FIXED
**Solution:** Create policies with USING (is_active = true) for public tables
```sql
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);
```

### Issue 3: Products Timeout on Load ✅ FIXED
**Solution:** Add timeout in useProducts hook and better error handling
```javascript
const timeoutId = setTimeout(() => {
  setError('Timeout');
  setLoading(false);
}, 10000);
```

### Issue 4: AdminDashboard Bug ✅ FIXED
**Solution:** Changed `total` to `total_amount` in orders query
```javascript
const { data: orders, error } = await supabase
  .from('orders')
  .select('id, total_amount, status, created_at'); // ✅ Fixed
```

---

## 📞 NEXT IMMEDIATE STEPS FOR AI

**ALL MAIN PHASES COMPLETE! 🎉**

The e-commerce platform is now **98% complete** and fully functional with:
- ✅ Complete Admin Dashboard
- ✅ Complete User Features
- ✅ Full Authentication System
- ✅ Reviews & Wishlist

**If continuing with Phase 4 (Optional Enhancements):**

When user says: **"Add Payment"** or **"Integrate VNPay/Stripe"**
1. Research VNPay/Stripe API documentation
2. Create payment API wrapper
3. Add payment form component
4. Update checkout flow
5. Handle payment callbacks
6. Update order status based on payment

When user says: **"Add Email Notifications"**
1. Set up email service (SendGrid/AWS SES)
2. Create email templates
3. Add email triggers (order created, status updated)
4. Test email delivery

When user says: **"Add Shipping Integration"**
1. Research GHN/GHTK API
2. Create shipping calculator
3. Add tracking integration
4. Update order flow

---

## 🔗 USEFUL REFERENCES

**Design Inspiration:**
- dior.com (official)
- net-a-porter.com
- ssense.com

**Technical Docs:**
- Supabase: https://supabase.com/docs
- Tailwind: https://tailwindcss.com/docs
- React Router: https://reactrouter.com

---

## 🎉 PHASE 2 & 3 ACHIEVEMENTS

### Phase 2 - Admin Dashboard (COMPLETE):
1. ✅ **Full Admin Dashboard** with real-time statistics
2. ✅ **Products Management** - Complete CRUD with image upload
3. ✅ **Categories Management** - CRUD with image upload & search
4. ✅ **Banners Management** - CRUD for homepage slider
5. ✅ **Orders Management** - List, filter, search, update status
6. ✅ **Best Selling Products** - Analytics feature
7. ✅ **Dashboard Statistics** - Revenue, orders, products counts
8. ✅ **Image Upload System** - Reusable for all admin features
9. ✅ **Search & Filters** - Everywhere (categories, orders)
10. ✅ **Mobile Responsive** - Full admin panel works on mobile

### Phase 3 - User Features (COMPLETE): ✨
1. ✅ **User Profile** - View/Edit profile, Change password
2. ✅ **Order History** - List with filters, order tracking
3. ✅ **Order Details** - Full details with cancel functionality
4. ✅ **Addresses Management** - Full CRUD with default address
5. ✅ **Wishlist** - Database sync, add/remove products
6. ✅ **Reviews System** - Star rating, submit reviews, verified badge
7. ✅ **11 New Files Created** - 3 APIs, 5 pages, 2 components
8. ✅ **24 API Functions** - Complete user feature set
9. ✅ **Beautiful UI/UX** - Consistent design, mobile responsive
10. ✅ **Security** - RLS policies, user data protection
Phase 3.5 - Enhancements (COMPLETE): ✨ NEW
✅ Discount Code System - Full-featured discount code integration.

✅ Checkout UI Update - Added input for discount codes with real-time validation.

✅ Dynamic Price Calculation - Order summary updates automatically with discounts.

✅ Backend Verification - Securely validates codes against the database.

✅ Order Integration - Applied discounts are saved with the final order.
### Files Created in Phase 2:
- `AdminBanners.jsx` - Banners CRUD
- `ImageUpload.jsx` - Reusable uploader
- Enhanced: `admin.js`, `AdminDashboard.jsx`, `AdminCategories.jsx`, `AdminOrders.jsx`, `AdminLayout.jsx`

### Files Created in Phase 3: ✨
- **API:** `user.js`, `reviews.js`, `wishlist.js`
- **Pages:** `ProfileLayout.jsx`, `ProfilePage.jsx`, `OrderHistoryPage.jsx`, `OrderDetailPage.jsx`, `AddressesPage.jsx`, `WishlistPage.jsx`
- **Components:** `StarRating.jsx`, `ReviewForm.jsx`
Files Created/Enhanced in this phase 3.5:
API (New): discounts.js

API (Enhanced): orders.js

Pages (Enhanced): CheckoutPage.jsx
---

**END OF AI CONTEXT**

**AI: Project 98% Complete! Ready for Phase 4 Enhancements if needed!** 🚀