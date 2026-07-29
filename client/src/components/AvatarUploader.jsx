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
        const base64 = reader.result;
        setImageUrl(base64);
        if (onUploadSuccess) onUploadSuccess(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex items-center gap-5">
      <div className="relative group">
        <img
          src={imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
          alt="Profile Avatar"
          className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md"
        />
        <label className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
          <Camera className="h-6 w-6 text-white" />
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>
      <div>
        <label className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-3.5 py-2 rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
          <Upload className="h-4 w-4" />
          <span>Upload Avatar Image</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
        <p className="text-[11px] text-gray-400 mt-1">PNG, JPG or WebP up to 5MB.</p>
      </div>
    </div>
  );
};

export default AvatarUploader;
