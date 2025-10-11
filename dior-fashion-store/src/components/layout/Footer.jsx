import React from 'react';
import FooterSection from './FooterSection';

const Footer = ({ brand, sections }) => {
  // Kiểm tra dữ liệu trước khi render
  if (!brand || !sections) {
    return null;
  }

  return (
    <footer className="bg-black text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Information */}
          <div>
            <h3 className="text-2xl font-light tracking-[0.3em] mb-6">
              {brand.name}
            </h3>
            <p className="text-gray-400 text-sm tracking-wide leading-relaxed">
              {brand.tagline}
            </p>
          </div>
          
          {/* Footer Sections */}
          {sections.map((section, i) => (
            <FooterSection key={i} section={section} />
          ))}
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-500 text-xs tracking-widest">
            © 2025 CHRISTIAN DIOR. ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;