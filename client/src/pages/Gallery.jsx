import React, { useState, useEffect, useContext } from 'react';
import GalleryService from '../services/GalleryService';
import GalleryFilter from '../components/GalleryFilter';
import GalleryGrid from '../components/GalleryGrid';
import MediaViewer from '../components/MediaViewer';
import UploadGalleryModal from '../components/UploadGalleryModal';
import { Sparkles, Calendar, Play, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Gallery = () => {
  const { role } = useContext(AuthContext);
  const [mediaList, setMediaList] = useState([]);
  const [featuredList, setFeaturedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [year, setYear] = useState('');
  const [mediaType, setMediaType] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, pages: 1 });

  // Lightbox Viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Admin Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditMediaOpen, setIsEditMediaOpen] = useState(false);
  const [editingMediaItem, setEditingMediaItem] = useState(null);

  const fetchFeaturedMedia = async () => {
    try {
      setLoadingFeatured(true);
      const res = await GalleryService.getGalleries({ isFeatured: true, limit: 4 });
      setFeaturedList(res.media || []);
    } catch (err) {
      console.error('Error fetching featured media:', err);
    } finally {
      setLoadingFeatured(false);
    }
  };

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
      };
      if (search) params.search = search;
      if (category) params.category = category;
      if (year) params.year = year;
      if (mediaType) params.mediaType = mediaType;

      const data = await GalleryService.getGalleries(params);
      setMediaList(data.media || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching gallery media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedMedia();
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [search, category, year, mediaType, page]);

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setYear('');
    setMediaType('');
    setPage(1);
  };

  const handleItemClick = (index) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPage(newPage);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${url}`;
  };

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary-600 animate-pulse" />
              Campus Event Gallery
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Browse memories, highlights, and key moments from completed campus workshops, technical symposiums, and cultural fests.
            </p>
          </div>
          {(role === 'Admin' || role === 'Super Admin') && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm shadow-sm transition duration-150 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Upload Media</span>
            </button>
          )}
        </div>

        {/* Featured Section */}
        {featuredList.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              ⭐ Featured Highlights
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredList.map((item, idx) => {
                const isVideo = item.mediaType?.toUpperCase() === 'VIDEO' || item.mediaUrl?.endsWith('.mp4') || item.mediaUrl?.endsWith('.webm');
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      // Temporary set media list to featured list just for this viewer session
                      setMediaList(featuredList);
                      setViewerIndex(idx);
                      setViewerOpen(true);
                    }}
                    className="group relative h-64 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-black"
                  >
                    {isVideo ? (
                      <video src={getMediaUrl(item.mediaUrl)} className="w-full h-full object-cover opacity-80" muted />
                    ) : (
                      <img src={getMediaUrl(item.mediaUrl)} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" alt="Featured" />
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4">
                      {isVideo && <Play className="absolute top-4 right-4 w-7 h-7 bg-primary-600 p-2 text-white rounded-full" />}
                      <span className="bg-amber-500 text-white font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full w-fit mb-1.5 flex items-center gap-0.5">
                        Highlight
                      </span>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{item.title || item.Event?.title}</h3>
                      {item.Event?.category && (
                        <p className="text-[10px] font-semibold text-gray-300 mt-0.5">{item.Event.category}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Section */}
        <GalleryFilter
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          year={year}
          setYear={setYear}
          mediaType={mediaType}
          setMediaType={setMediaType}
          onClear={handleClearFilters}
        />

        {/* Grid Section */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            📷 Gallery Media Explorer
          </h2>

          <GalleryGrid
            mediaList={mediaList}
            loading={loading}
            isAdminMode={role === 'Admin' || role === 'Super Admin'}
            onItemClick={handleItemClick}
            onEditClick={(item) => {
              setEditingMediaItem(item);
              setIsEditMediaOpen(true);
            }}
            onDeleteClick={async (mediaId) => {
              if (window.confirm('Are you sure you want to delete this media item?')) {
                try {
                  await GalleryService.deleteGalleryMedia(mediaId);
                  fetchMedia();
                  fetchFeaturedMedia();
                } catch (err) {
                  console.error(err);
                  alert('Failed to delete media item.');
                }
              }
            }}
          />
        </div>

        {/* Pagination Section */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-3 pt-6">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-650 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-gray-700">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.pages}
              className="p-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-650 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Viewer */}
      {viewerOpen && (
        <MediaViewer
          mediaList={mediaList}
          currentIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onIndexChange={setViewerIndex}
        />
      )}

      {/* Upload Media Modal */}
      <UploadGalleryModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchMedia();
          fetchFeaturedMedia();
        }}
      />

      {/* Edit Details Modal */}
      {isEditMediaOpen && editingMediaItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-black text-gray-900 text-left">Edit Media Details</h3>
            
            <div className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Title</label>
                <input
                  type="text"
                  value={editingMediaItem.title || ''}
                  onChange={(e) => setEditingMediaItem({ ...editingMediaItem, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={editingMediaItem.description || ''}
                  onChange={(e) => setEditingMediaItem({ ...editingMediaItem, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-255 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  rows="3"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center text-xs font-bold text-gray-650 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingMediaItem.isFeatured || false}
                    onChange={(e) => setEditingMediaItem({ ...editingMediaItem, isFeatured: e.target.checked })}
                    className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 mr-2"
                  />
                  Mark as Featured Highlight
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsEditMediaOpen(false);
                  setEditingMediaItem(null);
                }}
                className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold px-3 py-1.5 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await GalleryService.updateGalleryMedia(editingMediaItem.id, {
                      title: editingMediaItem.title,
                      description: editingMediaItem.description,
                      isFeatured: editingMediaItem.isFeatured,
                    });
                    alert('Media updated successfully!');
                    setIsEditMediaOpen(false);
                    setEditingMediaItem(null);
                    fetchMedia();
                    fetchFeaturedMedia();
                  } catch (err) {
                    console.error(err);
                    alert('Failed to update media details.');
                  }
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs shadow-xs transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
