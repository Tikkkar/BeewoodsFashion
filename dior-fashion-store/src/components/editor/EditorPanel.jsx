import React, { useState } from 'react';
import { Settings, X, Save, Undo, Redo, Eye, EyeOff, RotateCcw } from 'lucide-react';
import BrandEditor from './BrandEditor';
import ProductsEditor from './ProductsEditor';
import BannersEditor from './BannersEditor';
import CategoriesEditor from './CategoriesEditor';

const EditorPanel = ({ 
  data, 
  setData, 
  onSave, 
  onClose, 
  onReset,
  undo,
  redo,
  canUndo,
  canRedo,
  previewMode,
  togglePreviewMode,
  historyIndex,
  historyLength
}) => {
  const [activeTab, setActiveTab] = useState('brand');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved

  const handleSaveClick = () => {
    setSaveStatus('saving');
    const success = onSave();
    if (success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  return (
    <>
      {/* Overlay để đóng editor khi click bên ngoài */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />
      
      {/* Editor Panel */}
      <div className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-[101] overflow-y-auto border-l border-gray-200 transition-all duration-300 ${
        previewMode ? 'w-full md:w-1/2' : 'w-full md:w-96'
      }`}>
        {/* Header với controls */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          {/* Title & Close Button - FIXED */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Settings size={20} />
              <span className="hidden sm:inline">Editor Panel</span>
              <span className="sm:hidden">Editor</span>
            </h2>
            
            {/* Close Button - NOW VISIBLE ON ALL DEVICES */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-gray-700 hover:text-black border border-gray-200"
              aria-label="Close Editor"
            >
              <X size={20} />
              <span className="hidden sm:inline text-sm font-medium">Close</span>
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex gap-2 mb-3">
            {/* Undo Button */}
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition ${
                canUndo 
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-900' 
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo size={16} />
              <span className="hidden sm:inline">Undo</span>
            </button>

            {/* Redo Button */}
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition ${
                canRedo 
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-900' 
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo size={16} />
              <span className="hidden sm:inline">Redo</span>
            </button>

            {/* Preview Toggle */}
            <button
              onClick={togglePreviewMode}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition ${
                previewMode
                  ? 'bg-black text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
              title="Toggle Preview"
            >
              {previewMode ? <EyeOff size={16} /> : <Eye size={16} />}
              <span className="hidden sm:inline">{previewMode ? 'Edit' : 'Preview'}</span>
            </button>
          </div>

          {/* History indicator */}
          {historyLength > 1 && (
            <div className="mb-3 text-xs text-gray-500 text-center bg-gray-50 py-1 rounded">
              History: {historyIndex + 1} / {historyLength}
            </div>
          )}

          {/* Save & Reset Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSaveClick}
              disabled={saveStatus === 'saving'}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition ${
                saveStatus === 'saved'
                  ? 'bg-green-500 text-white'
                  : saveStatus === 'saving'
                  ? 'bg-gray-400 text-white cursor-wait'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              <Save size={18} />
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && '✓ Saved!'}
              {saveStatus === 'idle' && 'Save Changes'}
            </button>

            <button
              onClick={onReset}
              className="py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition bg-gray-100 hover:bg-gray-200 text-gray-900"
              title="Reset to last saved"
            >
              <RotateCcw size={18} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto border-b border-gray-200 sticky top-[236px] md:top-[240px] bg-white z-10 scrollbar-hide">
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
        {!previewMode && (
          <div className="p-3 md:p-4">
            {activeTab === 'brand' && <BrandEditor data={data} setData={setData} />}
            {activeTab === 'products' && <ProductsEditor data={data} setData={setData} />}
            {activeTab === 'banners' && <BannersEditor data={data} setData={setData} />}
            {activeTab === 'categories' && <CategoriesEditor data={data} setData={setData} />}
          </div>
        )}

        {/* Preview Message */}
        {previewMode && (
          <div className="p-8 text-center text-gray-500">
            <Eye size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Preview Mode Active</p>
            <p className="text-sm">View your changes in the main window</p>
            <p className="text-xs mt-2">Click "Edit" button above to continue editing</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              Close Editor
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default EditorPanel;