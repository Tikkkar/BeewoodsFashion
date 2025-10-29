import { useState, useEffect, useCallback } from "react";
import { INITIAL_DATA } from "../data/initialData";

export const useEditor = () => {
  // History management for Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load data from localStorage on mount
  const getInitialData = () => {
    const savedData = localStorage.getItem("bewoStoreData");
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (error) {
        console.error("Error loading saved data:", error);
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  };

  const initialData = getInitialData();
  const [data, setData] = useState(initialData);
  const [savedData, setSavedData] = useState(initialData);
  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Initialize history with current data
  useEffect(() => {
    if (history.length === 0) {
      setHistory([data]);
      setHistoryIndex(0);
    }
  }, []);

  // Enhanced setData with history tracking
  const setDataWithHistory = useCallback(
    (newData) => {
      setData(newData);

      // Add to history (remove any future states if we're not at the end)
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newData);

      // Limit history to 50 states to prevent memory issues
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        setHistoryIndex(historyIndex + 1);
      }

      setHistory(newHistory);
    },
    [history, historyIndex]
  );

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setData(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setData(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Check if can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Save function
  const handleSave = () => {
    setSavedData(data);
    localStorage.setItem("bewoStoreData", JSON.stringify(data));
    return true; // Return success status
  };

  // Reset to last saved state
  const handleReset = () => {
    setData(savedData);
    // Reset history to saved state
    setHistory([savedData]);
    setHistoryIndex(0);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Toggle preview mode
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only work when editor is open
      if (!editMode) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editMode, undo, redo]);

  return {
    data,
    setData: setDataWithHistory, // Use history-aware setter
    savedData,
    editMode,
    previewMode,
    handleSave,
    handleReset,
    toggleEditMode,
    togglePreviewMode,
    undo,
    redo,
    canUndo,
    canRedo,
    historyIndex,
    historyLength: history.length,
  };
};
