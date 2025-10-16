import React from 'react';
import { Outlet } from 'react-router-dom';

import TopBar from './TopBar';
import Header from './Header';
import Footer from './Footer';

// Nhận các props cần thiết từ App.jsx để truyền xuống
const PublicLayout = ({ brandData, cart, wishlist, menuOpen, setMenuOpen, setCartOpen, setWishlistOpen }) => {
  return (
    <>
      <TopBar message={brandData.topBarMessage} />
      <Header
        brandName={brandData.brand.name}
        cart={cart}
        wishlist={wishlist}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen(!menuOpen)}
        onCartClick={() => setCartOpen(true)}
        onWishlistClick={() => setWishlistOpen(true)}
        navigation={brandData.navigation}
      />
      
      {/* Nội dung của các trang con sẽ được render ở đây */}
      <Outlet />

      <Footer 
        brand={brandData.brand} 
        sections={brandData.footerSections} 
      />
    </>
  );
};

export default PublicLayout;