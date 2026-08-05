import React, { useState } from 'react';
import { Camera, Upload } from 'lucide-react';

const AvatarUploader = ({ currentImage, onUploadSuccess }) => {
  const [imageUrl, setImageUrl] = useState(currentImage || '');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setImageUrl(compressedBase64);
          if (onUploadSuccess) onUploadSuccess(compressedBase64);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full">
      {/* Absolute positioned Avatar at the top-right of the profile card */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 w-[80px] h-[80px] rounded-full overflow-hidden border-2 border-gray-200 shadow-xs bg-gray-50 shrink-0">
        <img
          src={imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
          alt="Profile Avatar"
          className="w-full h-full object-cover rounded-full"
        />
        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
          <Camera className="h-5 w-5 text-white" />
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>

      {/* Upload button and description inside the normal flow */}
      <div className="flex flex-col items-start space-y-1.5 text-left pt-2 pb-4">
        <label className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-3.5 py-2 rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition">
          <Upload className="h-4 w-4" />
          <span>Upload Avatar Image</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
        <p className="text-[11px] text-gray-400">PNG, JPG or WebP up to 5MB.</p>
      </div>
    </div>
  );
};

export default AvatarUploader;
