import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import EventTable from '../components/EventTable';
import EventModal from '../components/EventModal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { Plus, Shield, Users, Bookmark, CalendarClock, BookMarked, Landmark } from 'lucide-react';

const AdminDashboard = () => {
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
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary-600" />
              Event Management Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage events catalogue, registrations deadlines, and venue details.</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm shadow-sm transition duration-150"
          >
            <Plus className="h-5 w-5" />
            <span>Create Event</span>
          </button>
        </div>

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
          />
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
    </div>
  );
};

export default AdminDashboard;
