import React from 'react';

const IconButton = ({ icon: Icon, badge, onClick, className = "" }) => (
  <button 
    onClick={onClick}
    className={`relative p-2 hover:bg-gray-100 rounded-full transition ${className}`}
  >
    <Icon size={20} />
    {badge > 0 && (
      <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

export default IconButton;