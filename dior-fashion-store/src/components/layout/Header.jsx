import React from 'react';
import { Menu, X, Search, Heart, User, ShoppingCart } from 'lucide-react';
import IconButton from '../common/IconButton';
import Navigation from './Navigation';

const Header = ({ brandName, cart, wishlist, menuOpen, onMenuToggle, onCartClick, onWishlistClick, navigation }) => (
  <header className="fixed top-0 left-0 w-full bg-white z-50 shadow-md">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      {/* Menu Button */}
      <button 
        onClick={onMenuToggle}
        className="p-2 hover:bg-gray-100 rounded-full transition md:hidden"
        aria-label="Toggle Menu"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Brand Name */}
      <h1 className="text-xl md:text-2xl font-bold tracking-widest uppercase">
        {brandName}
      </h1>

      {/* Action Icons */}
      <div className="flex items-center space-x-2 md:space-x-4">
        <IconButton icon={Search} className="hidden md:block" />
        <IconButton 
          icon={Heart} 
          badge={wishlist?.length || 0}
          onClick={onWishlistClick}
          className="hidden md:block" 
        />
        <IconButton icon={User} className="hidden md:block" />
        <IconButton 
          icon={ShoppingCart} 
          badge={cart.length}
          onClick={onCartClick}
        />
      </div>
    </div>
    
    {/* Desktop Navigation - Always visible on desktop */}
    <div className="hidden md:block border-t border-gray-200">
      <Navigation navigation={navigation} />
    </div>
    
    {/* Mobile Navigation - Toggle on mobile */}
    {menuOpen && (
      <div className="md:hidden border-t border-gray-200 bg-white">
        <Navigation navigation={navigation} mobile />
      </div>
    )}
  </header>
);

export default Header;