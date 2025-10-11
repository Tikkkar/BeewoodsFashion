import React from 'react';

const SectionTitle = ({ children, className = "" }) => (
  <h2 className={`text-4xl font-light tracking-widest uppercase ${className}`}>
    {children}
  </h2>
);

export default SectionTitle;