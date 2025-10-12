import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const BrandEditor = ({ data, setData }) => (
  <div className="space-y-4">
    {/* Các phần Brand Name, Tagline, Top Bar Message giữ nguyên */}
    <div>
      <label className="block text-sm font-medium mb-2">Brand Name</label>
      <input
        type="text"
        value={data.brand.name}
        onChange={(e) => setData({ ...data, brand: { ...data.brand, name: e.target.value } })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium mb-2">Tagline</label>
      <textarea
        value={data.brand.tagline}
        onChange={(e) => setData({ ...data, brand: { ...data.brand, tagline: e.target.value } })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        rows="3"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium mb-2">Top Bar Message</label>
      <input
        type="text"
        value={data.topBarMessage}
        onChange={(e) => setData({ ...data, topBarMessage: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
    
    {/* Phần Navigation Items được nâng cấp */}
    <div>
      <label className="block text-sm font-medium mb-2">Navigation Items</label>
      {data.navigation.map((item, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 mb-2 items-center">
          {/* Input cho Tên hiển thị */}
          <input
            type="text"
            value={item.text}
            placeholder="Link Text (e.g., WOMEN)"
            onChange={(e) => {
              const newNav = [...data.navigation];
              newNav[i] = { ...newNav[i], text: e.target.value };
              setData({ ...data, navigation: newNav });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
          
          <div className="flex gap-2">
            {/* Input cho Đường dẫn (URL) */}
            <input
              type="text"
              value={item.url}
              placeholder="URL (e.g., /category/women)"
              onChange={(e) => {
                const newNav = [...data.navigation];
                newNav[i] = { ...newNav[i], url: e.target.value };
                setData({ ...data, navigation: newNav });
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={() => {
                const newNav = data.navigation.filter((_, idx) => idx !== i);
                setData({ ...data, navigation: newNav });
              }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => setData({ 
          ...data, 
          navigation: [...data.navigation, { text: 'NEW LINK', url: '/new-page' }] 
        })}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-black text-sm flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Add Navigation Item
      </button>
    </div>
  </div>
);

export default BrandEditor;