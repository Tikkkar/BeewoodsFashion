import React, { useState } from 'react';
import { Settings, X, Save } from 'lucide-react';
import BrandEditor from './BrandEditor';
import ProductsEditor from './ProductsEditor';
import BannersEditor from './BannersEditor';
import CategoriesEditor from './CategoriesEditor';

const EditorPanel = ({ data, setData, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState('brand');
  
  return (
    <>
      {/* Overlay để đóng editor khi click bên ngoài (mobile) */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Editor Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-200">
        {/* Header với nút Save và Close */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Settings size={20} />
              <span className="hidden sm:inline">Editor Panel</span>
              <span className="sm:hidden">Editor</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              aria-label="Close Editor"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Nút Save */}
          <button
            onClick={onSave}
            className="w-full bg-black text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition font-semibold text-sm md:text-base"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
        
        {/* Tabs Navigation - Scrollable trên mobile */}
        <div className="flex overflow-x-auto border-b border-gray-200 sticky top-[120px] md:top-[124px] bg-white z-10 scrollbar-hide">
          {['brand', 'products', 'banners', 'categories'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 md:px-0 md:flex-1 py-3 text-xs md:text-sm font-medium capitalize whitespace-nowrap transition ${
                activeTab === tab 
                  ? 'border-b-2 border-black text-black bg-gray-50' 
                  : 'text-gray-500 hover:text-black hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Content Area */}
        <div className="p-3 md:p-4">
          {activeTab === 'brand' && <BrandEditor data={data} setData={setData} />}
          {activeTab === 'products' && <ProductsEditor data={data} setData={setData} />}
          {activeTab === 'banners' && <BannersEditor data={data} setData={setData} />}
          {activeTab === 'categories' && <CategoriesEditor data={data} setData={setData} />}
        </div>
      </div>
    </>
  );
};

export default EditorPanel;