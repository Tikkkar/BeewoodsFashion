import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUserProfile, updateUserProfile, changePassword } from '../../lib/api/user';
import { Loader2, Edit, Save, X, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data } = await getUserProfile();
    if (data) {
      setProfile({
        full_name: data.full_name || '',
        email: data.email || user?.email || '',
        phone: data.phone || ''
      });
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const { data } = await updateUserProfile(user.id, profile);
    
    if (data) {
      setEditing(false);
    }
    
    setSaving(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    const { success } = await changePassword(passwordData.newPassword);
    
    if (success) {
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Profile Information</h2>
          <p className="text-gray-600 text-sm">Manage your personal information</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            <Edit size={18} />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={profile.full_name}
            onChange={handleChange}
            disabled={!editing}
            className={`w-full p-3 border border-gray-300 rounded-lg ${
              editing 
                ? 'focus:ring-2 focus:ring-black focus:border-transparent' 
                : 'bg-gray-50 cursor-not-allowed'
            }`}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            disabled
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            disabled={!editing}
            placeholder="0123456789"
            className={`w-full p-3 border border-gray-300 rounded-lg ${
              editing 
                ? 'focus:ring-2 focus:ring-black focus:border-transparent' 
                : 'bg-gray-50 cursor-not-allowed'
            }`}
          />
        </div>

        {/* Action Buttons */}
        {editing && (
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                loadProfile();
              }}
              className="flex items-center gap-2 px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              disabled={saving}
            >
              <X size={18} />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Change Password Section */}
      <div className="pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold mb-1">Change Password</h3>
            <p className="text-gray-600 text-sm">Update your account password</p>
          </div>
          {!changingPassword && (
            <button
              onClick={() => setChangingPassword(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Lock size={18} />
              <span>Change Password</span>
            </button>
          )}
        </div>

        {changingPassword && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 bg-gray-50 p-6 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setChangingPassword(false);
                  setPasswordData({ newPassword: '', confirmPassword: '' });
                }}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Updating...
                  </span>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Info */}
      <div className="pt-8 border-t border-gray-200">
        <h3 className="text-lg font-bold mb-4">Account Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Account Created</p>
            <p className="font-medium">
              {new Date(user?.created_at).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Account Status</p>
            <p className="font-medium text-green-600">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;