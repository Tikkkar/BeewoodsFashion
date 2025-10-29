import React, { useState, useEffect } from "react";
import {
  getAdminCategories,
  saveCategory,
  deleteCategory,
  uploadImage,
} from "../../lib/api/admin";
import {
  Edit,
  Trash2,
  Plus,
  Loader2,
  Image as ImageIcon,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";

const CategoryModal = ({ category, onClose, onSave }) => {
  const [data, setData] = useState(
    category || {
      name: "",
      slug: "",
      image_url: "",
      is_active: true,
      display_order: 0,
    }
  );
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(category?.image_url || "");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === "checkbox" ? checked : value;

    // Auto-generate slug from name
    if (name === "name" && !data.id) {
      setData((prev) => ({
        ...prev,
        name: finalValue,
        slug: finalValue
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      }));
    } else {
      setData((prev) => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrl = data.image_url;

      // Upload new image if selected
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile, "categories");
      }

      await onSave({ ...data, image_url: finalImageUrl });
      onClose();
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {data.id ? "Edit" : "Add"} Category
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Category Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 text-sm">
                      <ImageIcon size={16} />
                      <span>Change Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <ImageIcon
                      size={40}
                      className="mx-auto text-gray-400 mb-2"
                    />
                    <p className="text-gray-600 text-sm mb-1">
                      Click to upload
                    </p>
                    <p className="text-xs text-gray-400">
                      Recommended: 400x300px
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Category Name *
              </label>
              <input
                name="name"
                value={data.name}
                onChange={handleChange}
                placeholder="Women's Fashion"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium mb-2">Slug *</label>
              <input
                name="slug"
                value={data.slug}
                onChange={handleChange}
                placeholder="womens-fashion"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                URL-friendly identifier
              </p>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Display Order
              </label>
              <input
                name="display_order"
                type="number"
                value={data.display_order}
                onChange={handleChange}
                placeholder="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lower numbers appear first
              </p>
            </div>

            {/* Active Toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={data.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-sm font-medium">
                  Active (Show in store)
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Category</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    const { data } = await getAdminCategories();
    if (data) {
      setCategories(data);
      setFilteredCategories(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  const handleSave = async (category) => {
    await saveCategory(category);
    setEditingCategory(null);
    loadCategories();
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    ) {
      await deleteCategory(id);
      loadCategories();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-gray-600">
            Sắp xếp sản phẩm của bạn vào các danh mục
          </p>
        </div>
        <button
          onClick={() => setEditingCategory({})}
          className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition"
        >
          <Plus size={20} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      {/* Categories Grid */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm
              ? "No categories found"
              : "No categories yet. Add your first category!"}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  {/* Category Image */}
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon size={24} className="text-gray-400" />
                    </div>
                  )}

                  {/* Category Info */}
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          cat.is_active ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span className="font-medium text-lg">{cat.name}</span>
                    </div>
                    <span className="text-gray-400 text-sm">/{cat.slug}</span>
                    <span className="text-gray-400 text-sm ml-3">
                      Order: {cat.display_order}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingCategory(cat)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Total Categories</p>
          <p className="text-2xl font-bold">{categories.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {categories.filter((c) => c.is_active).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Inactive</p>
          <p className="text-2xl font-bold text-red-600">
            {categories.filter((c) => !c.is_active).length}
          </p>
        </div>
      </div>

      {/* Modal */}
      {editingCategory && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default AdminCategories;
