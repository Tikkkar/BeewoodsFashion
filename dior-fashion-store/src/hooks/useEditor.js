import { useState } from 'react';
import { INITIAL_DATA } from '../data/initialData';

export const useEditor = () => {
  const [data, setData] = useState(INITIAL_DATA);
  const [savedData, setSavedData] = useState(INITIAL_DATA);
  const [editMode, setEditMode] = useState(false);

  const handleSave = () => {
    setSavedData(data);
    localStorage.setItem('diorStoreData', JSON.stringify(data));
    alert('✅ Changes saved successfully!');
  };

  const handleReset = () => {
    setData(savedData);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Load data from localStorage on mount
  const loadData = () => {
    const savedData = localStorage.getItem('diorStoreData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
        setSavedData(parsedData);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  };

  return {
    data,
    setData,
    savedData,
    editMode,
    handleSave,
    handleReset,
    toggleEditMode,
    loadData
  };
};