import React, { useState, useEffect } from 'react';
import { X, Upload, Star, Film, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import GalleryService from '../services/GalleryService';

const UploadGalleryModal = ({ isOpen, onClose, selectedEventId = null, onUploadSuccess }) => {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState(selectedEventId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState('IMAGE'); // 'IMAGE' or 'VIDEO'
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]); // Array of File objects
  
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSelectedFiles([]);
      setTitle('');
      setDescription('');
      setMediaType('IMAGE');
      setIsFeatured(false);
      setUploading(false);
      setUploadProgress(0);
      setEventId(selectedEventId || '');
      
      // Fetch events list for selection
      api.get('/events')
        .then(({ data }) => {
          setEvents(data);
        })
        .catch((err) => console.error('Error fetching events for dropdown:', err));
    }
  }, [isOpen, selectedEventId]);

  if (!isOpen) return null;

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleFiles = (files) => {
    setError('');
    const validFiles = [];
    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
      const isVideo = ['mp4', 'webm'].includes(ext);

      if (!isImage && !isVideo) {
        setError('Only JPG, JPEG, PNG, WEBP, MP4, and WEBM files are allowed.');
        continue;
      }

      // Max size: 20MB
      if (file.size > 20 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Limit is 20MB.`);
        continue;
      }

      validFiles.push(file);
    }
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!eventId) {
      setError('Please select an event.');
      return;
    }
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('mediaType', mediaType);
      formData.append('isFeatured', isFeatured);

      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      await GalleryService.uploadGalleryMedia(formData, (progress) => {
        setUploadProgress(progress);
      });

      showToast('Media uploaded successfully!');
      setTimeout(() => {
        if (onUploadSuccess) onUploadSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to upload files. Please try again.';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      
      {/* Toast Alert Popup */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold shadow-lg animate-slideDown ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-150 shrink-0">
          <h2 className="text-lg font-black text-gray-900">Upload Gallery Media</h2>
          <button 
            onClick={onClose} 
            disabled={uploading} 
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleUploadSubmit} className="flex-grow overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-1.5">
              <AlertCircle className="w-4.5 h-4.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Event */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-left">
              Select Event *
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-250 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">Choose an event...</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({new Date(e.eventDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Title & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-left">
                Media Title (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter title/caption..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-left">
                Media Type *
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-left">
              Media Description (Optional)
            </label>
            <textarea
              placeholder="Provide a brief context or description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-250 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              rows="2.5"
            />
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center text-xs font-bold text-gray-650 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500 h-4.5 w-4.5 mr-2"
              />
              Mark as Featured Highlight
            </label>
          </div>

          {/* Drag & Drop File Selector */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition ${
              dragActive ? 'border-primary-500 bg-primary-50/40' : 'border-gray-250 hover:border-gray-355 bg-gray-55/40'
            }`}
          >
            <div className="bg-primary-50 text-primary-600 p-3 rounded-full border border-primary-100">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-center select-none">
              <p className="text-xs font-bold text-gray-800">
                Drag and drop your fests media here, or{' '}
                <label className="text-primary-600 hover:text-primary-700 cursor-pointer underline">
                  browse files
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Supported: JPG, JPEG, PNG, WEBP, MP4, WEBM (Max size 20MB per file)
              </p>
            </div>
          </div>

          {/* Selected Files Queue */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider text-left">
                Files Queue ({selectedFiles.length})
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-150 rounded-xl p-2 bg-gray-50/50">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white border border-gray-200 px-3.5 py-2 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      {file.type.startsWith('video/') ? (
                        <Film className="w-4 h-4 text-primary-500 shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-gray-700 truncate">{file.name}</span>
                      <span className="text-[9px] text-gray-400 shrink-0">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-red-500 hover:text-red-600 text-xs font-bold p-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-gray-150 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold px-4 py-2 rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || selectedFiles.length === 0 || !eventId}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-xs transition"
            >
              {uploading ? `Uploading (${uploadProgress}%)` : 'Upload'}
            </button>
          </div>
        </form>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="w-full h-1 bg-gray-100 relative shrink-0">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadGalleryModal;
