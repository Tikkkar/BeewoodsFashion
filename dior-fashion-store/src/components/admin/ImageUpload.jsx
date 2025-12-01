  import React, { useState, useCallback } from 'react';
  import { useDropzone } from 'react-dropzone';
  import { UploadCloud, X } from 'lucide-react';
  import { toast } from 'react-hot-toast';

  const ImageUpload = ({ existingImages = [], onFilesChange, onRemoveExisting }) => {
    const [previews, setPreviews] = useState(existingImages);

    const onDrop = useCallback(acceptedFiles => {
      const validFiles = acceptedFiles.filter(file => {
        // Max 5MB file size
        if (file.size > 5 * 1024 * 1024) return false;
        
        // Check image dimensions
        return true;
      });
      
      if (validFiles.length < acceptedFiles.length) {
        toast.error('Some images were too large (max 5MB).');
      }

      // Validate and resize images
      Promise.all(validFiles.map(file => validateAndResizeImage(file)))
        .then(processedFiles => {
          const filtered = processedFiles.filter(Boolean);
          if (filtered.length > 0) {
            const newPreviews = filtered.map(file => Object.assign(file, {
              preview: URL.createObjectURL(file)
            }));
            setPreviews(prev => [...prev, ...newPreviews]);
            onFilesChange(filtered);
          }
        });
    }, [onFilesChange]);

    // Validate and resize image if needed
    const validateAndResizeImage = async (file) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 2048; // Maximum width for any image
          const maxHeight = 2048;
          
          // If image is within limits, return original
          if (img.width <= maxWidth && img.height <= maxHeight) {
            toast.success(`${file.name}: ✓ Optimized size`);
            resolve(file);
            return;
          }

          // Resize image
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              toast.warning(`${file.name}: Resized from ${img.width}x${img.height} to ${Math.round(width)}x${Math.round(height)}`);
              resolve(resizedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.85);
        };

        img.onerror = () => {
          toast.error(`Failed to load ${file.name}`);
          resolve(null);
        };

        img.src = URL.createObjectURL(file);
      });
    };

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
