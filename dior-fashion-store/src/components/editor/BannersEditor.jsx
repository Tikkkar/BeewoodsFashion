import React, { useState } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';

const BannersEditor = ({ data, setData }) => {
  const [editingId, setEditingId] = useState(null);
  
  const updateBanner = (id, updates) => {
    const newBanners = data.banners.map(b => 
      b.id === id ? { ...b, ...updates } : b
    );
    setData({ ...data, banners: newBanners });
  };
  
  const deleteBanner = (id) => {
    setData({ ...data, banners: data.banners.filter(b => b.id !== id) });
  };
  
  const addBanner = () => {
    const newId = Math.max(...data.banners.map(b => b.id)) + 1;
    setData({
      ...data,
      banners: [...data.banners, {
        id: newId,
        title: 'NEW BANNER',
        subtitle: 'Subtitle here',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200'
      }]
    });
  };
  
  return (
    <div className="space-y-4">
      {data.banners.map(banner => (
        <div key={banner.id} className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <img src={banner.image} alt={banner.title} className="w-20 h-12 object-cover rounded" />
            <div className="flex-1">
              <p className="font-medium text-sm">{banner.title}</p>
              <p className="text-xs text-gray-500">{banner.subtitle}</p>
            </div>
            <button
              onClick={() => setEditingId(editingId === banner.id ? null : banner.id)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => deleteBanner(banner.id)}
              className="p-2 hover:bg-red-50 text-red-500 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          {editingId === banner.id && (
            <div className="space-y-2 pt-3 border-t">
              <input
                type="text"
                value={banner.title}
                onChange={(e) => updateBanner(banner.id, { title: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
                placeholder="Title"
              />
              <input
                type="text"
                value={banner.subtitle}
                onChange={(e) => updateBanner(banner.id, { subtitle: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
                placeholder="Subtitle"
              />
              <input
                type="text"
                value={banner.image}
                onChange={(e) => updateBanner(banner.id, { image: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
                placeholder="Image URL"
              />
            </div>
          )}
        </div>
      ))}
      
      <button
        onClick={addBanner}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-black text-sm flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Add New Banner
      </button>
    </div>
  );
};

export default BannersEditor;