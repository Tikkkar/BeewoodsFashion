import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ImageUpload = ({ existingImages = [], onFilesChange, onRemoveExisting }) => {
  const [previews, setPreviews] = useState(existingImages);

  const onDrop = useCallback(acceptedFiles => {
    const validFiles = acceptedFiles.filter(file => file.size <= 5 * 1024 * 1024);
    if (validFiles.length < acceptedFiles.length) {
      toast.error('Some images were too large (max 5MB).');
    }
    
    if (validFiles.length > 0) {
      const newPreviews = validFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }));
      setPreviews(prev => [...prev, ...newPreviews]);
      onFilesChange(validFiles);
    }
  }, [onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.webp'] },
  });

  const handleRemove = (index, image) => {
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);

    if (typeof image === 'string') {
      onRemoveExisting(image); // It's an existing URL
    } else {
      onFilesChange(files => files.filter(f => f !== image)); // It's a new File object
    }
  };

  return (
    <div>
      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-black bg-gray-50' : 'border-gray-300'}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-gray-500">
          <UploadCloud className="w-10 h-10 mb-2" />
          <p>Drag & drop images, or click to select</p>
          <p className="text-xs">Max 5MB per image</p>
        </div>
      </div>
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {previews.map((file, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={typeof file === 'string' ? file : file.preview}
                alt={`Preview ${index}`}
                className="h-full w-full object-cover rounded-md"
                onLoad={() => { if (file.preview) URL.revokeObjectURL(file.preview) }}
              />
              <button
                type="button"
                onClick={() => handleRemove(index, file)}
                className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;