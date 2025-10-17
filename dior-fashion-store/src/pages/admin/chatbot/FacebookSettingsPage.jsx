// ============================================
// FACEBOOK SETTINGS PAGE
// File: src/pages/admin/chatbot/FacebookSettingsPage.jsx
// ============================================

import React, { useState, useEffect } from 'react';
import { Facebook, AlertCircle, CheckCircle, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import {
  getFacebookSettings,
  saveFacebookSettings,
  testFacebookConnection,
  disconnectFacebook
} from '../../../lib/api/chatbot';

export default function FacebookSettingsPage() {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    app_id: '',
    app_secret: '',
    page_id: '',
    access_token: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await getFacebookSettings();
      if (data) {
        setSettings(data);
        setFormData({
          app_id: data.app_id || '',
          app_secret: data.app_secret || '',
          page_id: data.page_id || '',
          access_token: data.access_token || ''
        });
      }
    } catch (err) {
      console.error('Load settings error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await saveFacebookSettings(formData);
      success('Settings saved successfully!');
      await loadSettings();
    } catch (err) {
      showError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    try {
      setTesting(true);
      const result = await testFacebookConnection();
      success(`✅ Connected to page: ${result.name}`);
      await loadSettings();
    } catch (err) {
      showError(err.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    if (!window.confirm('Are you sure you want to disconnect Facebook?')) return;

    try {
      await disconnectFacebook();
      success('Facebook disconnected');
      await loadSettings();
    } catch (err) {
      showError(err.message || 'Failed to disconnect');
    }
  }

  function copyWebhookUrl() {
    const url = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/chatbot-webhook`;
    navigator.clipboard.writeText(url);
    success('Webhook URL copied to clipboard!');
  }

  function copyVerifyToken() {
    if (settings?.verify_token) {
      navigator.clipboard.writeText(settings.verify_token);
      success('Verify token copied!');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const webhookUrl = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/chatbot-webhook`;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2">Facebook Settings</h1>
          <p className="text-gray-600">Configure Facebook Messenger integration</p>
        </div>

        {/* Connection Status Card */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Facebook className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-xl font-medium">Facebook Messenger</h2>
                <p className="text-sm text-gray-600">
                  {settings?.is_connected 
                    ? `Connected to: ${settings.page_name}` 
                    : 'Not connected'}
                </p>
              </div>
            </div>
            <div>
              {settings?.is_connected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Disconnected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Setup Instructions
          </h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li><strong>1.</strong> Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Facebook Developers</a></li>
            <li><strong>2.</strong> Create a new app (Type: Business)</li>
            <li><strong>3.</strong> Add "Messenger" product</li>
            <li><strong>4.</strong> Generate Page Access Token from your Facebook Page</li>
            <li><strong>5.</strong> Setup Webhook with URL and Verify Token below</li>
            <li><strong>6.</strong> Subscribe to webhook events: <code className="bg-gray-200 px-1 rounded">messages</code>, <code className="bg-gray-200 px-1 rounded">messaging_postbacks</code></li>
            <li><strong>7.</strong> Test connection below</li>
          </ol>
        </div>

        {/* Configuration Form */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App ID
              </label>
              <input
                type="text"
                value={formData.app_id}
                onChange={(e) => setFormData(prev => ({ ...prev, app_id: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                placeholder="123456789012345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App Secret
              </label>
              <input
                type="password"
                value={formData.app_secret}
                onChange={(e) => setFormData(prev => ({ ...prev, app_secret: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                placeholder="abc123def456..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page ID
              </label>
              <input
                type="text"
                value={formData.page_id}
                onChange={(e) => setFormData(prev => ({ ...prev, page_id: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                placeholder="987654321098765"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find your Page ID at: facebook.com/[your-page] → About → Page ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Access Token
              </label>
              <input
                type="password"
                value={formData.access_token}
                onChange={(e) => setFormData(prev => ({ ...prev, access_token: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                placeholder="EAABsbCS...ZD"
              />
              <p className="text-xs text-gray-500 mt-1">
                Generate from: Messenger Settings → Access Tokens
              </p>
            </div>
          </div>
        </div>

        {/* Webhook URL */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Webhook Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL (Callback URL)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 text-sm font-mono"
                />
                <button
                  onClick={copyWebhookUrl}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verify Token
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settings?.verify_token || 'Save settings first to generate'}
                  readOnly
                  className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 text-sm font-mono"
                />
                {settings?.verify_token && (
                  <button
                    onClick={copyVerifyToken}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    title="Copy Token"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use this token when configuring webhook in Facebook
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          <button
            onClick={handleTest}
            disabled={testing || !formData.access_token || !formData.page_id}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testing && <Loader2 className="w-4 h-4 animate-spin" />}
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          {settings?.is_connected && (
            <button
              onClick={handleDisconnect}
              className="px-6 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
            >
              Disconnect
            </button>
          )}

          <a
            href="https://developers.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto px-6 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Facebook Developers
          </a>
        </div>
      </div>
    </div>
  );
}