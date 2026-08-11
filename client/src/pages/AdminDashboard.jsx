import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketProvider';
import Loader from '../components/Loader';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import EventTable from '../components/EventTable';
import EventModal from '../components/EventModal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { Plus, Shield, Users, Bookmark, CalendarClock, BookMarked, Landmark, Image as ImageIcon } from 'lucide-react';
import GalleryService from '../services/GalleryService';
import GalleryGrid from '../components/GalleryGrid';
import UploadGalleryModal from '../components/UploadGalleryModal';
import MediaViewer from '../components/MediaViewer';

const AdminDashboard = () => {
  const socket = useSocket();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');
  
  // Stats state
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    todaysRegistrations: 0,
    seatsFilled: 0,
    availableSeats: 0,
  });

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEventData, setEditEventData] = useState(null);
  const [deleteEventId, setDeleteEventId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Tabs Navigation
  const [activeTab, setActiveTab] = useState('events');

  // Gallery States
  const [selectedGalleryEventId, setSelectedGalleryEventId] = useState('');
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditMediaOpen, setIsEditMediaOpen] = useState(false);
  const [editingMediaItem, setEditingMediaItem] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const handleReorderMedia = (reorderedList) => {
    setGalleryMedia(reorderedList);
  };

  const handleReorderEnd = async () => {
    try {
      const orderings = galleryMedia.map((item, index) => ({
        id: item.id,
        displayOrder: index + 1,
      }));
      await GalleryService.reorderGalleryMedia(orderings);
    } catch (err) {
      console.error('Failed to save media order:', err);
      alert('Failed to save gallery order.');
    }
  };

  const categories = ['Technical', 'Cultural', 'Sports', 'Seminar', 'Workshop', 'Other'];
  const statuses = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

  // Fetch Admin Registration Statistics
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const { data } = await api.get('/admin/registrations');
      setStats(data);
    } catch (err) {
      console.error('Failed to load registrations stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch events list
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (status) params.status = status;
      params.sort = 'createdAt_desc'; // Latest events first

      const { data } = await api.get('/events', { params });
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleLiveUpdate = () => {
      fetchStats().catch((err) => console.error(err));
      fetchEvents().catch((err) => console.error(err));
    };

    socket.on('live_counter_update', handleLiveUpdate);
    socket.on('seatCountUpdated', handleLiveUpdate);
    socket.on('seat:updated', handleLiveUpdate);
    
    socket.on('registrationCreated', handleLiveUpdate);
    socket.on('registration:created', handleLiveUpdate);
    socket.on('registrationCancelled', handleLiveUpdate);
    socket.on('registration:cancelled', handleLiveUpdate);
    
    socket.on('waitlistUpdated', handleLiveUpdate);
    socket.on('waitlist:updated', handleLiveUpdate);
    
    socket.on('eventCreated', handleLiveUpdate);
    socket.on('event:created', handleLiveUpdate);
    socket.on('eventUpdated', handleLiveUpdate);
    socket.on('event:updated', handleLiveUpdate);
    socket.on('eventDeleted', handleLiveUpdate);
    socket.on('event:deleted', handleLiveUpdate);

    return () => {
      socket.off('live_counter_update', handleLiveUpdate);
      socket.off('seatCountUpdated', handleLiveUpdate);
      socket.off('seat:updated', handleLiveUpdate);
      
      socket.off('registrationCreated', handleLiveUpdate);
      socket.off('registration:created', handleLiveUpdate);
      socket.off('registrationCancelled', handleLiveUpdate);
      socket.off('registration:cancelled', handleLiveUpdate);
      
      socket.off('waitlistUpdated', handleLiveUpdate);
      socket.off('waitlist:updated', handleLiveUpdate);
      
      socket.off('eventCreated', handleLiveUpdate);
      socket.off('event:created', handleLiveUpdate);
      socket.off('eventUpdated', handleLiveUpdate);
      socket.off('event:updated', handleLiveUpdate);
      socket.off('eventDeleted', handleLiveUpdate);
      socket.off('event:deleted', handleLiveUpdate);
    };
  }, [socket]);

  useEffect(() => {
    // Debounce search input changes slightly
    const timer = setTimeout(() => {
      fetchEvents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, status]);

  // CRUD submissions
  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editEventData) {
        // Edit Mode
        const id = editEventData.id || editEventData._id;
        const { data } = await api.put(`/events/${id}`, formData);
        setEvents(events.map((e) => ((e.id || e._id) === id ? data : e)));
      } else {
        // Create Mode
        const { data } = await api.post('/events', formData);
        setEvents([data, ...events]);
      }
      // Re-fetch dashboard stats
      await fetchStats();
      return true;
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Action failed.');
      return false;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteEventId) return;
    try {
      await api.delete(`/events/${deleteEventId}`);
      setEvents(events.filter((e) => (e.id || e._id) !== deleteEventId));
      setIsConfirmOpen(false);
      setDeleteEventId(null);
      await fetchStats();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleDuplicateEvent = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/duplicate`);
      alert('Event duplicated successfully!');
      fetchEvents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to duplicate event.');
    }
  };

  const handleBackupDB = async () => {
    try {
      const res = await api.get('/admin/backup', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `svec_db_backup_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to download database backup.');
    }
  };

  const handleOpenEdit = (event) => {
    setEditEventData(event);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditEventData(null);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (id) => {
    setDeleteEventId(id);
    setIsConfirmOpen(true);
  };

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8 w-full min-w-0">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <img
                src="/sri_vasavi_logo.png"
                alt="Sri Vasavi Engineering College"
                className="h-10 w-10 object-contain rounded-full shadow-xs border border-primary-100 bg-white p-0.5"
              />
              <span>Sri Vasavi Event Admin Portal</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage events catalogue, registrations deadlines, and venue details.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackupDB}
              className="flex items-center justify-center gap-1.5 border border-gray-300 hover:bg-gray-55 text-gray-700 font-bold px-4 py-2.5 rounded-lg text-xs shadow-xs transition duration-150 cursor-pointer"
            >
              <span>Download Backup</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm shadow-sm transition duration-150 cursor-pointer"
            >
              <Plus className="h-5 w-5" />
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-250 select-none pb-0.5">
          <button
            onClick={() => setActiveTab('events')}
            className={`py-2 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'events'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-400 hover:text-gray-655'
            }`}
          >
            Events Catalogue
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-2 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'gallery'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-400 hover:text-gray-655'
            }`}
          >
            Gallery Management
          </button>
        </div>

        {activeTab === 'events' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl border border-gray-250 shadow-xs flex items-center gap-4">
                <div className="bg-primary-50 p-3 rounded-lg text-primary-600">
                  <BookMarked className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Signups</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-0.5">
                    {loadingStats ? '...' : stats.totalRegistrations}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-250 shadow-xs flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                  <CalendarClock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Today's Signups</p>
                  <h3 className="text-2xl font-black text-blue-900 mt-0.5">
                    {loadingStats ? '...' : stats.todaysRegistrations}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-250 shadow-xs flex items-center gap-4">
                <div className="bg-green-50 p-3 rounded-lg text-green-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Seats Filled</p>
                  <h3 className="text-2xl font-black text-green-900 mt-0.5">
                    {loadingStats ? '...' : stats.seatsFilled}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-250 shadow-xs flex items-center gap-4">
                <div className="bg-yellow-50 p-3 rounded-lg text-yellow-600">
                  <Landmark className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Available Seats</p>
                  <h3 className="text-2xl font-black text-yellow-900 mt-0.5">
                    {loadingStats ? '...' : stats.availableSeats}
                  </h3>
                </div>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-250 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <SearchBar search={search} setSearch={setSearch} placeholder="Search by title, venue, or organizer..." />
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <FilterDropdown
                  value={category}
                  setValue={setCategory}
                  options={categories}
                  label="Category"
                  allLabel="All Categories"
                />
                <FilterDropdown
                  value={status}
                  setValue={setStatus}
                  options={statuses}
                  label="Status"
                  allLabel="All Statuses"
                />
              </div>
            </div>

            {/* Main List Table */}
            {loading ? (
              <div className="py-20">
                <Loader size="large" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
                {error}
              </div>
            ) : (
              <EventTable
                events={events}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                onDuplicate={handleDuplicateEvent}
              />
            )}
          </>
        ) : (
          /* Gallery Management View */
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-left">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                  <ImageIcon className="w-5 h-5 text-primary-600" /> Event Media Gallery
                </h3>
                <p className="text-xs text-gray-500">Select an event to upload, edit, reorder or delete gallery highlights.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <select
                  value={selectedGalleryEventId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedGalleryEventId(id);
                    if (id) {
                      setLoadingGallery(true);
                      GalleryService.getEventGallery(id)
                        .then((data) => setGalleryMedia(data || []))
                        .catch((err) => console.error(err))
                        .finally(() => setLoadingGallery(false));
                    } else {
                      setGalleryMedia([]);
                    }
                  }}
                  className="bg-gray-50 border border-gray-250 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="">Select Event...</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({new Date(e.eventDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                {selectedGalleryEventId && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition duration-150 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Upload Media
                  </button>
                )}
              </div>
            </div>

            {selectedGalleryEventId ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-left">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Gallery Items ({galleryMedia.length})
                  </h4>
                  {galleryMedia.length > 1 && (
                    <p className="text-[10px] text-gray-400 font-semibold italic">
                      💡 Tip: Drag and drop cards to reorder their sequence.
                    </p>
                  )}
                </div>

                <GalleryGrid
                  mediaList={galleryMedia}
                  loading={loadingGallery}
                  isAdminMode={true}
                  onItemClick={(idx) => {
                    setViewerIndex(idx);
                    setViewerOpen(true);
                  }}
                  onEditClick={(item) => {
                    setEditingMediaItem(item);
                    setIsEditMediaOpen(true);
                  }}
                  onDeleteClick={async (mediaId) => {
                    if (window.confirm('Delete this gallery item? File will be removed.')) {
                      try {
                        await GalleryService.deleteGalleryMedia(mediaId);
                        setGalleryMedia(galleryMedia.filter((item) => item.id !== mediaId));
                      } catch (err) {
                        console.error(err);
                        alert('Failed to delete item.');
                      }
                    }
                  }}
                  onReorder={handleReorderMedia}
                  onReorderEnd={handleReorderEnd}
                />
              </div>
            ) : (
              <div className="bg-white p-12 text-center border border-gray-250 rounded-2xl">
                <p className="text-gray-400 font-bold">Please select an event above to manage its gallery.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popups/Modals */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        eventData={editEventData}
        title={editEventData ? 'Modify Event' : 'Publish New Event'}
      />

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Confirm Event Deletion"
        message="Are you sure you want to delete this event? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Gallery Upload Modal */}
      <UploadGalleryModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        selectedEventId={selectedGalleryEventId}
        onUploadSuccess={async () => {
          if (selectedGalleryEventId) {
            const data = await GalleryService.getEventGallery(selectedGalleryEventId);
            setGalleryMedia(data || []);
          }
        }}
      />

      {/* Edit Media Modal */}
      {isEditMediaOpen && editingMediaItem && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
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
                    if (selectedGalleryEventId) {
                      const data = await GalleryService.getEventGallery(selectedGalleryEventId);
                      setGalleryMedia(data || []);
                    }
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

      {/* Lightbox Viewer */}
      {viewerOpen && (
        <MediaViewer
          mediaList={galleryMedia}
          currentIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onIndexChange={setViewerIndex}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
