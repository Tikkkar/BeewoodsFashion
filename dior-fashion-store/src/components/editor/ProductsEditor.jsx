import React, { useState } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';

const ProductsEditor = ({ data, setData }) => {
  const [editingId, setEditingId] = useState(null);
  
  const updateProduct = (id, updates) => {
    const newProducts = data.products.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    setData({ ...data, products: newProducts });
  };
  
  const deleteProduct = (id) => {
    setData({ ...data, products: data.products.filter(p => p.id !== id) });
  };
  
  const addProduct = () => {
    const newId = Math.max(...data.products.map(p => p.id)) + 1;
    setData({
      ...data,
      products: [...data.products, {
        id: newId,
        name: 'New Product',
        price: 50000000,
        category: 'Ready-to-Wear',
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600'
      }]
    });
  };
  
  return (
    <div className="space-y-4">
      {data.products.map(product => (
        <div key={product.id} className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
            <div className="flex-1">
              <p className="font-medium text-sm">{product.name}</p>
              <p className="text-xs text-gray-500">{product.category}</p>
            </div>
            <button
              onClick={() => setEditingId(editingId === product.id ? null : product.id)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => deleteProduct(product.id)}
              className="p-2 hover:bg-red-50 text-red-500 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          {editingId === product.id && (
            <div className="space-y-2 pt-3 border-t">
              <input
                type="text"
                value={product.name}
                onChange={(e) => updateProduct(product.id, { name: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
                placeholder="Product Name"
              />
              <input
                type="number"
                value={product.price}
                onChange={(e) => updateProduct(product.id, { price: parseInt(e.target.value) })}
                className="w-full px-2 py-1 text-sm border rounded"
                placeholder="Price"
              />
              <input
                type="text"
                value={product.category}
                onChange={(e) => updateProduct(product.id, { category: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
                placeholder="Category"
              />
              <input
                type="text"
                value={product.image}
                onChange={(e) => updateProduct(product.id, { image: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
                placeholder="Image URL"
              />
            </div>
          )}
        </div>
      ))}
      
      <button
        onClick={addProduct}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-black text-sm flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Add New Product
      </button>
    </div>
  );
};

export default ProductsEditor;