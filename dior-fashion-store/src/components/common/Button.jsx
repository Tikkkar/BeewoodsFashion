import React from 'react';

const Button = ({ children, variant = "default", onClick, className = "" }) => {
  const variants = {
    'default': 'border border-black px-6 py-2 text-xs tracking-widest hover:bg-black hover:text-white',
    'secondary': 'bg-black text-white px-6 py-2 text-xs tracking-widest hover:bg-gray-800',
  };

  return (
    <button 
      onClick={onClick}
      className={`${variants[variant]} transition duration-300 ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;