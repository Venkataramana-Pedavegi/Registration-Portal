import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Image,
  Video,
  Award,
  Download,
  Share2,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  FileText
} from 'lucide-react';

const EventGallerySection = ({ eventId, isAdmin, eventStatus }) => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  
  // Admin forms state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    mediaUrl: '',
    mediaType: 'image',
    isHighlight: false,
    isWinner: false,
    winnerName: '',
    downloadUrl: '',
  });

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    fetchGallery();
  }, [eventId]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/gallery/${eventId}`);
      setGallery(data || []);
    } catch (err) {
      console.error('Failed to load event gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setSharing(true);
    setTimeout(() => setSharing(false), 2000);
  };

  const handleAddMedia = async (e) => {
    e.preventDefault();
    try {
      await api.post('/gallery', {
        eventId,
        ...formData,
      });
      // Reset form
      setFormData({
        mediaUrl: '',
        mediaType: 'image',
        isHighlight: false,
        isWinner: false,
        winnerName: '',
        downloadUrl: '',
      });
      setShowAddForm(false);
      fetchGallery();
    } catch (err) {
      console.error(err);
      alert('Failed to add media item');
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm('Are you sure you want to delete this media item?')) return;
    try {
      await api.delete(`/gallery/${mediaId}`);
      fetchGallery();
    } catch (err) {
      console.error(err);
      alert('Failed to delete media item');
    }
  };

  const handleMove = async (index, direction) => {
    const newGallery = [...gallery];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newGallery.length) return;

    // Swap
    const temp = newGallery[index];
    newGallery[index] = newGallery[targetIndex];
    newGallery[targetIndex] = temp;

    // Build orderings
    const orderings = newGallery.map((item, idx) => ({
      id: item.id,
      order: idx + 1,
    }));

    try {
      // Optimistic update
      setGallery(newGallery);
      await api.put('/gallery/reorder', { orderings });
    } catch (err) {
      console.error('Reordering failed:', err);
      fetchGallery();
    }
  };

  // Filter lists
  const photos = gallery.filter((item) => item.mediaType === 'image' && !item.downloadUrl);
  const videos = gallery.filter((item) => item.mediaType === 'video' && !item.downloadUrl);
  const highlights = gallery.filter((item) => item.isHighlight);
  const winners = gallery.filter((item) => item.isWinner);
  const downloads = gallery.filter((item) => item.downloadUrl);

  const openLightbox = (item) => {
    const idx = photos.findIndex((p) => p.id === item.id);
    if (idx !== -1) setLightboxIndex(idx);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-205 p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-950 uppercase tracking-wider">Event Gallery & Memories</h2>
          <p className="text-xs text-gray-500 mt-0.5">Captures, highlights, and resources from this event</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold px-3 py-1.5 rounded-lg text-xs border border-gray-250 transition select-none cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{sharing ? 'Link Copied!' : 'Share'}</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 bg-primary-600 hover:bg-primary-750 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-xs select-none cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Media</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Add Media Form */}
      {isAdmin && showAddForm && (
        <form onSubmit={handleAddMedia} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <h3 className="font-bold text-sm text-gray-800">Add New Media / Asset</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Media URL</label>
              <input
                type="text"
                required
                placeholder="e.g. https://images.unsplash.com/... or Youtube URL"
                value={formData.mediaUrl}
                onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Asset Type</label>
              <select
                value={formData.mediaType}
                onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="image">Image (Photo)</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Download Resource URL (Optional)</label>
              <input
                type="text"
                placeholder="e.g. https://github.com/... or pdf url"
                value={formData.downloadUrl}
                onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Winner Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Team ByteCoders"
                value={formData.winnerName}
                onChange={(e) => setFormData({ ...formData, winnerName: e.target.value, isWinner: !!e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white"
              />
            </div>

            <div className="flex items-center gap-4 mt-5">
              <label className="inline-flex items-center text-xs font-bold text-gray-600">
                <input
                  type="checkbox"
                  checked={formData.isHighlight}
                  onChange={(e) => setFormData({ ...formData, isHighlight: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 mr-2"
                />
                Mark as Highlight
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-white hover:bg-gray-100 border text-gray-600 font-bold px-3 py-1.5 rounded-lg text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-750 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
            >
              Upload Asset
            </button>
          </div>
        </form>
      )}

      {/* Main Grid content */}
      {loading ? (
        <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      ) : gallery.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed p-6">
          <p className="font-semibold text-sm">No gallery available yet.</p>
          <p className="text-xs mt-0.5">Check back after event completion for photos, videos, highlights, and resources.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Winners Highlights Banner */}
          {winners.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-4.5 h-4.5 text-amber-600" />
                <span>Event Winners & Achievers</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {winners.map((win) => (
                  <div key={win.id} className="bg-white p-3.5 rounded-lg border border-amber-100 shadow-2xs flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-full">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-xs">{win.winnerName}</h4>
                      <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Podium Finisher</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlights Roll */}
          {highlights.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Key Highlights</h3>
              <div className="flex flex-wrap gap-2">
                {highlights.map((hl) => (
                  <span key={hl.id} className="bg-primary-50 border border-primary-100 text-primary-750 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                    {hl.winnerName || 'Outstanding Milestone'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photos Grid */}
          {photos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Photo Gallery</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((item, idx) => (
                  <div key={item.id} className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square border border-gray-150">
                    <img
                      src={item.mediaUrl}
                      alt="Event snapshot"
                      onClick={() => openLightbox(item)}
                      className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Admin Action Bar */}
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleMove(gallery.findIndex(g => g.id === item.id), -1)}
                          className="p-1 bg-white hover:bg-gray-100 text-gray-600 rounded-md border"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMove(gallery.findIndex(g => g.id === item.id), 1)}
                          className="p-1 bg-white hover:bg-gray-100 text-gray-600 rounded-md border"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(item.id)}
                          className="p-1 bg-red-500 hover:bg-red-650 text-white rounded-md border border-red-650"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos List */}
          {videos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Videos & Reels</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {videos.map((item) => (
                  <div key={item.id} className="group relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800 aspect-video flex flex-col justify-end">
                    <video src={item.mediaUrl} controls className="w-full h-full object-cover" />
                    
                    {/* Admin deletion on hover overlay */}
                    {isAdmin && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteMedia(item.id)}
                          className="p-1.5 bg-red-600 text-white rounded-lg border border-red-650"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Downloadable Materials / Slides */}
          {downloads.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Event Resources & Downloads</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {downloads.map((item) => (
                  <a
                    key={item.id}
                    href={item.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-xl border hover:border-primary-300 hover:bg-primary-50/20 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-primary-50 text-primary-600 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-xs">Event Presentation / Slide deck</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">Click to view/download material</p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 bg-black/95 z-55 flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 focus:outline-none"
          >
            <X className="w-8 h-8" />
          </button>
          
          <button
            onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
            className="absolute left-6 text-white hover:text-gray-300 focus:outline-none"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          
          <img
            src={photos[lightboxIndex]?.mediaUrl}
            alt="Expanded view"
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />

          <button
            onClick={() => setLightboxIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
            className="absolute right-6 text-white hover:text-gray-300 focus:outline-none"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      )}

    </div>
  );
};

export default EventGallerySection;
