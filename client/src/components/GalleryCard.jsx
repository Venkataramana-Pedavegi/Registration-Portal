import React from 'react';
import { Play, Eye, Edit, Trash2, Star, Calendar } from 'lucide-react';

const GalleryCard = ({
  item,
  onClick,
  isAdminMode = false,
  onEditClick,
  onDeleteClick,
}) => {
  const isVideo = item.mediaType?.toUpperCase() === 'VIDEO' || item.mediaUrl?.endsWith('.mp4') || item.mediaUrl?.endsWith('.webm');

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

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEditClick) onEditClick(item);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDeleteClick) onDeleteClick(item.id);
  };

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer select-none ${
        isAdminMode ? 'ring-1 ring-gray-100 hover:ring-primary-300' : ''
      }`}
    >
      {/* Media Content Container */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden shrink-0">
        {isVideo ? (
          <div className="w-full h-full relative">
            <video
              src={getMediaUrl(item.mediaUrl)}
              className="w-full h-full object-cover"
              preload="metadata"
              muted
            />
            {/* Dark overlay with large play icon */}
            <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors flex items-center justify-center">
              <Play className="w-12 h-12 text-white bg-primary-600/80 p-3 rounded-full shadow-md group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
        ) : (
          <img
            src={getMediaUrl(item.mediaUrl)}
            alt={item.title || 'Gallery item'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        )}

        {/* Hover overlay with detail expand button (only non-admin) */}
        {!isAdminMode && (
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="bg-white/95 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> View Fullscreen
            </span>
          </div>
        )}

        {/* Featured Badge */}
        {item.isFeatured && (
          <div className="absolute top-3 left-3 bg-amber-500/90 text-white backdrop-blur-xs font-bold text-[9px] uppercase px-2.5 py-1 rounded-full shadow-xs flex items-center gap-0.5 tracking-wider">
            <Star className="w-3 h-3 fill-current text-white" /> Featured
          </div>
        )}

        {/* Video Type Badge */}
        {isVideo && (
          <div className="absolute top-3 right-3 bg-black/60 text-white backdrop-blur-xs font-semibold text-[9px] uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
            Video
          </div>
        )}

        {/* Admin hover controls overlay */}
        {isAdminMode && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 p-1 rounded-lg backdrop-blur-xs">
            <button
              onClick={handleEdit}
              className="p-1.5 bg-white hover:bg-primary-50 text-gray-700 hover:text-primary-600 rounded-md transition shadow-xs"
              title="Edit Details"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 rounded-md transition shadow-xs"
              title="Delete Media"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Info Details Section */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-primary-700 transition-colors">
            {item.title || item.Event?.title || 'Untitled Highlight'}
          </h4>
        </div>
        
        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Event context tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-[10px] font-bold text-gray-400">
          {item.Event?.category && (
            <span className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-md uppercase">
              {item.Event.category}
            </span>
          )}
          {item.Event?.eventDate && (
            <span className="flex items-center gap-0.5">
              <Calendar className="w-3 h-3" />
              {new Date(item.Event.eventDate).getFullYear()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryCard;
