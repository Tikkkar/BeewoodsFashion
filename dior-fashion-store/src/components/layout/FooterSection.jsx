import React from 'react';

const FooterSection = ({ section }) => {
  // Kiểm tra dữ liệu
  if (!section || !section.title || !section.links) {
    return null;
  }

  return (
    <div>
      <h4 className="tracking-widest text-sm mb-6">
        {section.title}
      </h4>
      <ul className="space-y-3 text-gray-400 text-sm tracking-wide">
        {section.links.map((link, i) => (
          <li key={i}>
            <a href="#" className="hover:text-white transition">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterSection;