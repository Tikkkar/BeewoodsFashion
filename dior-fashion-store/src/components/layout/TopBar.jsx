import React from 'react';
import { Phone, MapPin } from 'lucide-react';

const TopBar = ({ message }) => {
  return (
    <div className="bg-black text-white text-xs">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          {/* Left: Shipping message */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline">🚚</span>
            <p className="line-clamp-1">{message || 'MIỄN PHÍ VẬN CHUYỂN cho đơn hàng từ 2 sản phẩm'}</p>
          </div>

          {/* Right: Contact info */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="tel:0983918411" className="flex items-center gap-1 hover:text-red-400 transition">
              <Phone size={12} />
              <span>0983.918.411</span>
            </a>
            <div className="w-px h-3 bg-white/30"></div>
            <a href="#stores" className="flex items-center gap-1 hover:text-red-400 transition">
              <MapPin size={12} />
              <span>Hệ thống cửa hàng</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;