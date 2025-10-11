# 🤖 DIOR STORE - AI CONTEXT DOCUMENT

> **Purpose:** Essential context for AI to understand and improve the project
> **Last Updated:** 2025-01-11
> **AI Target:** Claude/GPT for UI improvements & Backend integration

---

## 🎯 PROJECT OVERVIEW

**Type:** E-commerce Fashion Store (DIOR-inspired luxury brand)
**Status:** 90% Frontend Complete | 0% Backend
**Goal:** Premium online shopping experience with admin visual editor

---

## 🛠️ TECH STACK

```
Frontend: React 18.2.0 + Tailwind CSS 3.3.0
Routing: React Router DOM
Icons: Lucide React 0.263.1
State: React Hooks (useState, useEffect, custom hooks)
Storage: LocalStorage (temporary - will migrate to database)
Build: Create React App
```

---

## 📁 CRITICAL FILES FOR AI

### **Core Logic:**
1. `src/App.jsx` - Main orchestrator, all routes, global state
2. `src/data/initialData.js` - All products, banners, categories data
3. `src/hooks/useEditor.js` - State management + localStorage
4. `src/hooks/useToast.js` - Toast notifications system

### **Styling:**
5. `src/index.css` - Global styles, Tailwind imports, custom animations
6. `tailwind.config.js` - Theme, colors, custom utilities

### **Key Pages:**
7. `src/pages/HomePage.jsx` - Main landing page with products
8. `src/pages/ProductDetailPage.jsx` - Single product page
9. `src/pages/CheckoutPage.jsx` - Checkout form

### **Key Components:**
10. `src/components/layout/Header.jsx` - Navigation
11. `src/components/products/ProductCard.jsx` - Product display
12. `src/components/cart/CartSidebar.jsx` - Shopping cart
13. `src/components/cart/WishlistSidebar.jsx` - Wishlist

---

## ✅ COMPLETED FEATURES

```
✅ Product Grid with Search, Filter, Sort, Pagination
✅ Cart with LocalStorage persistence
✅ Wishlist with LocalStorage persistence
✅ Product Detail Page (size selection, quantity, reviews)
✅ Quick View Modal
✅ Checkout Flow (form validation, order summary)
✅ Order Success Page
✅ Visual Editor (admin can edit products, banners, categories)
✅ Toast Notifications (replaced ugly alerts)
✅ Responsive Design (mobile-friendly)
✅ Hero Slider with auto-play
✅ Category Grid
✅ Brand Story Section
✅ Footer with sections
```

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

## 🚀 NEXT PRIORITIES

### **Phase 1: Backend (Supabase) - CRITICAL**
```
🔥 Database setup (products, users, orders)
🔥 Authentication (login/register)
🔥 Real-time order management
🔥 Admin dashboard
```

### **Phase 2: UI Improvements**
```
🎨 Better animations (page transitions, scroll effects)
🎨 Loading states (skeletons, spinners)
🎨 Micro-interactions (button ripples, smooth hovers)
🎨 Image optimization (lazy loading, progressive loading)
🎨 Better mobile UX
```

### **Phase 3: E-commerce Enhancements**
```
💳 VNPay/Stripe integration
📧 Email notifications
📦 Shipping integration (GHN/GHTK)
📊 Analytics dashboard
```

---

## 🎨 UI IMPROVEMENT AREAS

### **High Priority:**
1. **Animations** - Make interactions feel premium
2. **Loading States** - Better feedback during actions
3. **Mobile UX** - Improve touch targets and navigation
4. **Color Palette** - Add subtle accent colors
5. **Typography** - Better hierarchy and readability

### **Medium Priority:**
6. **Product Card** - More polished hover effects
7. **Navigation** - Mega menu for categories
8. **Footer** - More engaging design
9. **Forms** - Better validation UI
10. **Empty States** - More delightful empty cart/wishlist

### **Low Priority:**
11. **Dark Mode** - Toggle for dark theme
12. **Accessibility** - ARIA labels, keyboard navigation
13. **Performance** - Code splitting, lazy loading

---

## 🎯 AI INSTRUCTIONS FOR UI IMPROVEMENTS

### **When analyzing UI:**
1. Focus on **luxury brand aesthetic** (DIOR-level quality)
2. Maintain **minimal & clean** design language
3. Add **subtle animations** (not overwhelming)
4. Ensure **mobile-first** responsive design
5. Keep **accessibility** in mind

### **What to improve:**
- ✅ Suggest specific Tailwind classes
- ✅ Provide complete component code
- ✅ Add micro-interactions
- ✅ Improve color contrast
- ✅ Better spacing/hierarchy
- ✅ Smooth transitions
- ❌ Don't change core functionality
- ❌ Don't break existing features
- ❌ Don't use external CSS frameworks

### **Code style preferences:**
```javascript
// ✅ Functional components with hooks
const Component = ({ prop }) => {
  const [state, setState] = useState();
  return <div>...</div>;
};

// ✅ Tailwind for styling (no inline styles)
<div className="flex items-center gap-4 hover:bg-gray-100 transition">

// ✅ Lucide React for icons
import { ShoppingCart, Heart, Search } from 'lucide-react';

// ✅ Short, descriptive names
const handleClick = () => {}
const isOpen = true
```

---

## 🔑 KEY PATTERNS

### **State Management:**
```javascript
// Global state in App.jsx
const [cart, setCart] = useState(() => {
  const saved = localStorage.getItem('dior_cart');
  return saved ? JSON.parse(saved) : [];
});

// Save to localStorage
useEffect(() => {
  localStorage.setItem('dior_cart', JSON.stringify(cart));
}, [cart]);
```

### **Toast Notifications:**
```javascript
const { success, error } = useToast();
success('Added to cart!');
error('Something went wrong!');
```

### **Navigation:**
```javascript
const navigate = useNavigate();
navigate('/checkout');
navigate('/product/${id}');
```

### **Price Formatting:**
```javascript
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};
```

---

## 🎨 DESIGN TOKENS

```javascript
// Colors
primary: '#000000'      // Black
secondary: '#FFFFFF'    // White
gray-50: '#F9FAFB'     // Lightest
gray-900: '#111827'    // Darkest
red-500: '#EF4444'     // Error/Wishlist
green-500: '#10B981'   // Success

// Spacing Scale (Tailwind)
gap-2: 8px
gap-4: 16px
gap-6: 24px
gap-8: 32px
gap-12: 48px

// Typography
font-light: 300
font-medium: 500
tracking-wide: 0.025em
tracking-widest: 0.1em

// Shadows
shadow-sm: subtle
shadow-md: medium
shadow-2xl: prominent

// Transitions
transition: all 150ms
transition-colors: colors 200ms
```

---

## 🚫 WHAT AI SHOULD NOT DO

```
❌ Don't use CSS-in-JS libraries
❌ Don't use styled-components
❌ Don't use Material-UI or Bootstrap
❌ Don't add new dependencies without asking
❌ Don't break existing localStorage logic
❌ Don't change data structure in initialData.js
❌ Don't remove TypeScript comments (we might add TS later)
❌ Don't use class components
❌ Don't use Redux (we use React hooks)
```

---

## ✅ WHAT AI SHOULD DO

```
✅ Suggest Tailwind improvements
✅ Add smooth animations
✅ Improve accessibility
✅ Fix responsive issues
✅ Add loading states
✅ Improve micro-interactions
✅ Suggest better color contrasts
✅ Optimize performance
✅ Add helpful comments
✅ Follow existing patterns
✅ Keep code clean and readable
✅ Suggest best practices
```

---

## 🎯 SPECIFIC IMPROVEMENT REQUESTS

When user says: **"Improve UI"**
AI should ask:
1. "Which page/component?" (Homepage, Product Detail, Checkout, etc.)
2. "What aspect?" (Colors, animations, layout, typography, etc.)
3. "Any reference?" (Show me a website you like)

Then provide:
- ✅ Specific code changes
- ✅ Before/After comparison
- ✅ Explanation of improvements
- ✅ Mobile considerations

---

## 📝 NOTES FOR AI

- **User is non-technical** - Explain changes clearly
- **User prefers complete code** - Don't show snippets, show full files
- **User uses Claude** - You are the primary dev assistant
- **Budget-conscious** - Suggest free/cheap solutions
- **Timeline: 2-4 weeks** to launch with backend
- **Target: Vietnamese market** - VND currency, Vietnamese UX preferences
- **Brand: Luxury** - Every UI decision should feel premium

---

## 🔗 USEFUL REFERENCES

**Design Inspiration:**
- dior.com (official)
- net-a-porter.com
- mrporter.com
- ssense.com

**Tailwind Docs:**
- tailwindcss.com/docs

**React Patterns:**
- react.dev/learn

---

## 🎯 SUCCESS CRITERIA

**Good AI response includes:**
✅ Complete, working code
✅ Explanation of changes
✅ Mobile responsiveness
✅ Accessibility considerations
✅ Performance impact (if any)
✅ Clear instructions where to paste code

**Bad AI response:**
❌ "You could try..." without code
❌ Snippets instead of full files
❌ Breaking changes without warning
❌ Adding dependencies without discussion
❌ Overly complex solutions

---

**END OF AI CONTEXT**
**AI: You now have full context to help improve this project efficiently! �