import React from 'react';

const Navigation = ({ navigation, mobile = false }) => {
  // Kiểm tra dữ liệu
  if (!navigation || !Array.isArray(navigation)) {
    return null;
  }

  const containerClass = mobile
    ? "flex flex-col space-y-2 py-4 px-4"
    : "flex justify-center space-x-8 py-4";
  
  const linkClass = mobile
    ? "block py-3 px-4 text-gray-800 hover:text-black hover:bg-gray-50 rounded-lg transition text-sm font-medium tracking-wider uppercase"
    : "text-gray-800 hover:text-black transition border-b-2 border-transparent hover:border-black pb-1 text-sm font-medium tracking-wider uppercase";

  return (
    <nav className={containerClass}>
      {navigation.map((item, i) => (
        <a 
          key={i} 
          href={item === 'BAGS' ? '#products' : '#'} 
          className={linkClass}
        >
          {item}
        </a>
      ))}
    </nav>
  );
};

export default Navigation;