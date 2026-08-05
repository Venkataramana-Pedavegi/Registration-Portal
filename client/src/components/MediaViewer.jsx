import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Maximize2, Play, Pause } from 'lucide-react';
import GalleryService from '../services/GalleryService';

const MediaViewer = ({ mediaList, currentIndex, onClose, onIndexChange }) => {
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  
  const currentItem = mediaList[currentIndex];

  useEffect(() => {
    // Reset zoom when navigating
    setZoom(1);
    setIsPlaying(false);
    
    // Track view in background
    if (currentItem?.id) {
      GalleryService.incrementMediaViews(currentItem.id).catch((err) =>
        console.error('Error tracking media view:', err)
      );
    }
  }, [currentIndex, currentItem?.id]);

  if (!currentItem) return null;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    // Remove base /api from server port address
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${url}`;
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    } else {
      onIndexChange(mediaList.length - 1); // Wrap around
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < mediaList.length - 1) {
      onIndexChange(currentIndex + 1);
    } else {
      onIndexChange(0); // Wrap around
    }
  };

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(getMediaUrl(currentItem.mediaUrl));
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', currentItem.title || `download_${currentItem.id}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      // Track download stats
      await GalleryService.incrementMediaDownloads(currentItem.id);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback direct open in new window
      window.open(getMediaUrl(currentItem.mediaUrl), '_blank');
    }
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev(e);
      if (e.key === 'ArrowRight') handleNext(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const isVideo = currentItem.mediaType?.toUpperCase() === 'VIDEO' || currentItem.mediaUrl?.endsWith('.mp4') || currentItem.mediaUrl?.endsWith('.webm');

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      {/* Header controls */}
      <div className="flex justify-between items-center px-6 py-4 bg-black/40 z-10 select-none">
        <div className="text-white text-sm font-semibold">
          {currentItem.title || currentItem.Event?.title || 'Event Media'} 
          <span className="text-gray-400 ml-2">
            ({currentIndex + 1} of {mediaList.length})
          </span>
        </div>
        
        <div className="flex items-center space-x-3 text-white">
          {!isVideo && (
            <>
              <button 
                onClick={handleZoomOut} 
                className="p-2 hover:bg-white/10 rounded-full transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button 
                onClick={handleZoomIn} 
                className="p-2 hover:bg-white/10 rounded-full transition"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </>
          )}
          <button 
            onClick={handleDownload} 
            className="p-2 hover:bg-white/10 rounded-full transition"
            title="Download Media"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full transition bg-red-600/20 text-red-500 hover:text-red-400"
            title="Close Lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow relative flex items-center justify-center overflow-hidden px-4">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          className="absolute left-6 p-3 bg-black/30 hover:bg-white/10 text-white rounded-full transition border border-white/5 z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Media Wrapper */}
        <div 
          className="max-w-4xl max-h-[70vh] flex items-center justify-center transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {isVideo ? (
            <div className="relative rounded-lg overflow-hidden bg-black max-w-full">
              <video
                ref={videoRef}
                src={getMediaUrl(currentItem.mediaUrl)}
                className="max-h-[70vh] max-w-full rounded-lg"
                controls
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 text-white opacity-0 hover:opacity-100 transition duration-200"
              >
                {isPlaying ? (
                  <Pause className="w-16 h-16 bg-black/60 p-4 rounded-full" />
                ) : (
                  <Play className="w-16 h-16 bg-black/60 p-4 rounded-full pl-6" />
                )}
              </button>
            </div>
          ) : (
            <img
              src={getMediaUrl(currentItem.mediaUrl)}
              alt={currentItem.title || 'Gallery item'}
              className="object-contain max-h-[70vh] max-w-full rounded-md shadow-2xl select-none pointer-events-none transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="absolute right-6 p-3 bg-black/30 hover:bg-white/10 text-white rounded-full transition border border-white/5 z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Info Footer */}
      <div 
        className="bg-black/50 border-t border-white/10 px-8 py-6 text-white select-none z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-100">
              {currentItem.title || currentItem.Event?.title || 'Event Highlight'}
            </h3>
            {currentItem.description && (
              <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">
                {currentItem.description}
              </p>
            )}
            {currentItem.Event?.description && !currentItem.description && (
              <p className="text-xs text-gray-400 italic">
                Event Context: {currentItem.Event.description}
              </p>
            )}
          </div>
          <div className="text-xs text-gray-400 self-end space-y-1 text-right flex-shrink-0">
            {currentItem.Event?.category && (
              <div>Category: <span className="text-primary-400 font-semibold uppercase">{currentItem.Event.category}</span></div>
            )}
            {currentItem.Event?.eventDate && (
              <div>Event Date: {new Date(currentItem.Event.eventDate).toLocaleDateString()}</div>
            )}
            <div>Uploaded by: {currentItem.uploader?.username || 'Admin'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaViewer;
