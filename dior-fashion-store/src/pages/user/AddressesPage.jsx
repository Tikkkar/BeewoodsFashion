import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUserAddresses, createAddress, updateAddress, deleteAddress } from '../../lib/api/user';
import { Loader2, Plus, Edit, Trash2, MapPin, Star } from 'lucide-react';

const AddressModal = ({ address, onClose, onSave }) => {
  const [data, setData] = useState(address || {
    full_name: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    is_default: false
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(data);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {data.id ? 'Edit Address' : 'Add New Address'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={data.full_name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={data.phone}
                onChange={handleChange}
                placeholder="0123456789"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium mb-2">Street Address *</label>
              <input
                type="text"
                name="address"
                value={data.address}
                onChange={handleChange}
                placeholder="123 Đường ABC"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
            </div>

            {/* City, District, Ward */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <input
                  type="text"
                  name="city"
                  value={data.city}
                  onChange={handleChange}
                  placeholder="Hà Nội"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">District</label>
                <input
                  type="text"
                  name="district"
                  value={data.district}
                  onChange={handleChange}
                  placeholder="Hoàn Kiếm"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ward</label>
                <input
                  type="text"
                  name="ward"
                  value={data.ward}
                  onChange={handleChange}
                  placeholder="Phường 1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            {/* Default Address */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={data.is_default}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Set as default address</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Address</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AddressesPage = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setLoading(true);
    const { data } = await getUserAddresses(user.id);
    if (data) setAddresses(data);
    setLoading(false);
  };

  const handleSave = async (addressData) => {
    if (addressData.id) {
      await updateAddress(addressData.id, addressData);
    } else {
      await createAddress(addressData);
    }
    setEditingAddress(null);
    loadAddresses();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      await deleteAddress(id);
      loadAddresses();
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
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold mb-1">Shipping Addresses</h2>
          <p className="text-gray-600 text-sm">Manage your delivery addresses</p>
        </div>
        <button
          onClick={() => setEditingAddress({})}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          <Plus size={20} />
          <span>Add Address</span>
        </button>
      </div>

      {/* Addresses Grid */}
      {addresses.length === 0 ? (
        <div className="text-center py-16">
          <MapPin size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No addresses yet</h3>
          <p className="text-gray-600 mb-6">Add your first shipping address</p>
          <button
            onClick={() => setEditingAddress({})}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`border-2 rounded-lg p-6 hover:shadow-md transition ${
                addr.is_default 
                  ? 'border-black bg-gray-50' 
                  : 'border-gray-200'
              }`}
            >
              {/* Default Badge */}
              {addr.is_default && (
                <div className="flex items-center gap-2 mb-3">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-medium">Default Address</span>
                </div>
              )}

              {/* Address Info */}
              <div className="mb-4">
                <h3 className="font-bold mb-1">{addr.full_name}</h3>
                <p className="text-sm text-gray-600 mb-1">{addr.phone}</p>
                <p className="text-sm text-gray-700">
                  {addr.address}
                  {addr.ward && `, ${addr.ward}`}
                  {addr.district && `, ${addr.district}`}
                  {addr.city && `, ${addr.city}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setEditingAddress(addr)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-sm"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editingAddress && (
        <AddressModal
          address={editingAddress}
          onClose={() => setEditingAddress(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default AddressesPage;