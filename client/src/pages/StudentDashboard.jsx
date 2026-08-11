import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketProvider';
import Loader from '../components/Loader';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import EventCard from '../components/EventCard';
import ConfirmationDialog from '../components/ConfirmationDialog';
import {
  User,
  BookOpen,
  GraduationCap,
  Calendar,
  Compass,
  ArrowUpDown,
  Bookmark,
  Clock,
  CheckCircle,
  AlertTriangle,
  Heart,
  Trophy,
  Star,
  Download
} from 'lucide-react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState('');

  // Cancellation Modal State
  const [cancelId, setCancelId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Filtering / Sorting state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('date_asc');

  // Tab switcher
  const [dashboardTab, setDashboardTab] = useState('explorer');

  // Extra Gamification states
  const [gamificationStats, setGamificationStats] = useState(null);
  const [volunteerDashboard, setVolunteerDashboard] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Favorites list saved locally
  const [favorites, setFavorites] = useState([]);

  const categories = ['Technical', 'Cultural', 'Sports', 'Seminar', 'Workshop', 'Other'];
  const statuses = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

  // Fetch student profile details
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/student/profile');
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch registered events of this student
  const fetchRegistrations = async () => {
    try {
      const { data } = await api.get('/registrations/my-events');
      setRegistrations(data);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Fetch bookmarks
  useEffect(() => {
    if (profile?.id) {
      const saved = localStorage.getItem(`saved_events_${profile.id}`);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    }
  }, [profile]);

  const toggleFavorite = (eventId) => {
    if (!profile?.id) return;
    let updated;
    if (favorites.includes(eventId)) {
      updated = favorites.filter(id => id !== eventId);
    } else {
      updated = [...favorites, eventId];
    }
    setFavorites(updated);
    localStorage.setItem(`saved_events_${profile.id}`, JSON.stringify(updated));
  };

  // Fetch gamification & volunteer logs on demand
  const fetchExtraStats = async () => {
    try {
      setLoadingExtra(true);
      const [resStats, resVol, resCert] = await Promise.all([
        api.get('/leaderboard/stats').catch(() => ({ data: { points: 0, eventsAttended: 0, volunteerHours: 0, badges: [] } })),
        api.get('/volunteers/dashboard').catch(() => ({ data: { applications: [], totalHours: 0 } })),
        api.get('/certificates').catch(() => ({ data: [] })),
      ]);
      setGamificationStats(resStats.data);
      setVolunteerDashboard(resVol.data);
      setCertificates(resCert.data);
    } catch (err) {
      console.error('Failed to load sub-stats:', err);
    } finally {
      setLoadingExtra(false);
    }
  };

  useEffect(() => {
    if (dashboardTab !== 'explorer') {
      fetchExtraStats();
    }
  }, [dashboardTab]);

  useEffect(() => {
    if (!socket) return;

    const handleLiveUpdate = (update) => {
      setEvents((prevEvents) =>
        prevEvents.map((evt) =>
          evt.id === update.eventId
            ? { ...evt, availableSeats: update.remainingSeats }
            : evt
        )
      );
    };

    const handleEventCreated = (newEvent) => {
      setEvents((prevEvents) => {
        const exists = prevEvents.some((evt) => evt.id === newEvent.id);
        if (exists) return prevEvents;
        return [newEvent, ...prevEvents];
      });
    };

    const handleEventUpdated = (updatedEvent) => {
      setEvents((prevEvents) =>
        prevEvents.map((evt) => (evt.id === updatedEvent.id ? { ...evt, ...updatedEvent } : evt))
      );
    };

    const handleEventDeleted = (data) => {
      setEvents((prevEvents) => prevEvents.filter((evt) => evt.id !== data.eventId));
    };

    socket.on('live_counter_update', handleLiveUpdate);
    socket.on('seatCountUpdated', handleLiveUpdate);
    socket.on('seat:updated', handleLiveUpdate);
    
    socket.on('eventCreated', handleEventCreated);
    socket.on('event:created', handleEventCreated);
    socket.on('eventUpdated', handleEventUpdated);
    socket.on('event:updated', handleEventUpdated);
    socket.on('eventDeleted', handleEventDeleted);
    socket.on('event:deleted', handleEventDeleted);
    socket.on('volunteer:status_updated', fetchExtraStats);
 
    return () => {
      socket.off('live_counter_update', handleLiveUpdate);
      socket.off('seatCountUpdated', handleLiveUpdate);
      socket.off('seat:updated', handleLiveUpdate);
      
      socket.off('eventCreated', handleEventCreated);
      socket.off('event:created', handleEventCreated);
      socket.off('eventUpdated', handleEventUpdated);
      socket.off('event:updated', handleEventUpdated);
      socket.off('eventDeleted', handleEventDeleted);
      socket.off('event:deleted', handleEventDeleted);
      socket.off('volunteer:status_updated', fetchExtraStats);
    };
  }, [socket]);

  // Fetch events list
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (status) params.status = status;
      params.sort = sort;

      const { data } = await api.get('/events', { params });
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retrieve campus events.');
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, status, sort]);

  // Card interaction handlers
  const handleRegister = async (eventId) => {
    try {
      await api.post('/registrations', { eventId });
      alert('Event registration successful!');
      await Promise.all([fetchEvents(), fetchRegistrations()]);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Event registration failed.');
    }
  };

  const handleCancelClick = (regId) => {
    setCancelId(regId);
    setIsConfirmOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelId) return;
    try {
      await api.delete(`/registrations/${cancelId}`);
      setIsConfirmOpen(false);
      setCancelId(null);
      alert('Registration cancelled successfully.');
      await Promise.all([fetchEvents(), fetchRegistrations()]);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  // Compute stat counters
  const activeSignups = registrations.filter((r) => r.status === 'Registered');
  const upcomingCount = activeSignups.filter((r) => r.Event && r.Event.status === 'Upcoming').length;
  const completedCount = registrations.filter((r) => r.status === 'Completed' || (r.status === 'Registered' && r.Event && r.Event.status === 'Completed')).length;
  const cancelledCount = registrations.filter((r) => r.status === 'Cancelled').length;

  // Build registration lookup maps for the events grid
  const registeredEventMap = new Map();
  activeSignups.forEach((reg) => {
    if (reg.eventId) registeredEventMap.set(reg.eventId, reg.id);
  });

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8 w-full min-w-0">
        
        {/* Student Profile Card */}
        {loadingProfile ? (
          <div className="h-28 flex items-center justify-center bg-white rounded-2xl border border-gray-200">
            <Loader size="medium" />
          </div>
        ) : (
          profile && (
            <div className="bg-white rounded-2xl border border-gray-250 shadow-xs overflow-hidden flex flex-col md:flex-row items-stretch">
              <div className="bg-gradient-to-r from-primary-800 to-primary-600 px-6 py-6 md:px-8 text-white flex items-center gap-4 shrink-0">
                <img
                  src="/sri_vasavi_logo.png"
                  alt="Sri Vasavi Engineering College Emblem"
                  className="h-12 w-12 object-contain rounded-full border border-white/40 bg-white p-0.5 shadow-sm"
                />
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{profile.fullName}</h1>
                  <p className="text-primary-100 text-xs mt-0.5">Roll No: {profile.rollNumber}</p>
                </div>
              </div>
              
              <div className="p-6 flex-grow grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700 items-center">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-primary-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Department</span>
                    <span className="font-semibold text-gray-900">{profile.department}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4.5 w-4.5 text-primary-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Year of Study</span>
                    <span className="font-semibold text-gray-900">{profile.year}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-primary-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Email Contact</span>
                    <span className="font-semibold text-gray-900 truncate block max-w-[200px]">{profile.email}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* Dashboard Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs flex items-center gap-4">
            <div className="bg-blue-50 text-blue-700 p-3 rounded-xl border border-blue-100 shrink-0">
              <Bookmark className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium block">Active Signups</span>
              <span className="text-2xl font-extrabold text-gray-950">{activeSignups.length}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs flex items-center gap-4">
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-xl border border-yellow-100 shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium block">Upcoming Events</span>
              <span className="text-2xl font-extrabold text-gray-950">{upcomingCount}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs flex items-center gap-4">
            <div className="bg-green-50 text-green-700 p-3 rounded-xl border border-green-100 shrink-0">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium block">Completed Events</span>
              <span className="text-2xl font-extrabold text-gray-950">{completedCount}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs flex items-center gap-4">
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium block">Cancelled Signups</span>
              <span className="text-2xl font-extrabold text-gray-950">{cancelledCount}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Tab Switching Headers */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-950 flex items-center gap-2">
              <Compass className="h-7 w-7 text-primary-600" />
              Student Hub
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage registrations, points, badges, volunteer duties, and certificates.</p>
          </div>
          
          <div className="flex flex-wrap bg-white p-1 rounded-xl border border-gray-200 shadow-xs select-none">
            <button
              onClick={() => setDashboardTab('explorer')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dashboardTab === 'explorer' ? 'bg-primary-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-905'
              }`}
            >
              <Compass className="w-4 h-4" /> Events
            </button>
            <button
              onClick={() => setDashboardTab('achievements')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dashboardTab === 'achievements' ? 'bg-primary-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-905'
              }`}
            >
              <Trophy className="w-4 h-4" /> Achievements
            </button>
            <button
              onClick={() => setDashboardTab('timeline')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dashboardTab === 'timeline' ? 'bg-primary-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-905'
              }`}
            >
              <Clock className="w-4 h-4" /> Timeline
            </button>
            <button
              onClick={() => setDashboardTab('volunteering')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dashboardTab === 'volunteering' ? 'bg-primary-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-905'
              }`}
            >
              <User className="w-4 h-4" /> Volunteering
            </button>
            <button
              onClick={() => setDashboardTab('favorites')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dashboardTab === 'favorites' ? 'bg-primary-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-905'
              }`}
            >
              <Heart className="w-4 h-4 text-red-500 fill-red-500" /> Saved
            </button>
          </div>
        </div>

        {/* Tab Layout Renderers */}

        {dashboardTab === 'explorer' && (
          <div className="space-y-6">
            {/* Filter Controls Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-250 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <SearchBar search={search} setSearch={setSearch} placeholder="Search by title, venue, organizer..." />
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
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4.5 w-4.5 text-gray-400 shrink-0" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="block w-full py-2 pl-3 pr-8 border border-gray-300 rounded-lg text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="date_asc">Date: Earliest First</option>
                    <option value="date_desc">Date: Latest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Events Grid */}
            {loadingEvents ? (
              <div className="py-20">
                <Loader size="large" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
                {error}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 p-8 text-gray-500">
                <p className="font-semibold text-gray-700">No events found matching current criteria.</p>
                <p className="text-sm mt-1">Please try modifying search terms or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event.id || event._id} className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(event.id || event._id);
                      }}
                      className="absolute top-4 right-4 p-1.5 bg-white/90 backdrop-blur-xs rounded-full hover:bg-white transition shadow-sm cursor-pointer z-10"
                    >
                      <Heart
                        className={`w-4 h-4 transition ${
                          favorites.includes(event.id || event._id) ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-400 hover:text-red-500'
                        }`}
                      />
                    </button>
                    <EventCard
                      event={event}
                      isRegistered={registeredEventMap.has(event.id)}
                      registrationId={registeredEventMap.get(event.id)}
                      onRegister={handleRegister}
                      onCancel={handleCancelClick}
                      userRole="Student"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {dashboardTab === 'achievements' && (
          <div className="bg-white rounded-2xl shadow-xs border p-6 space-y-6">
            <h3 className="font-extrabold text-gray-950 text-lg">My Performance & Accomplishments</h3>
            
            {loadingExtra ? (
              <div className="py-12">
                <Loader size="medium" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl">
                    <span className="text-[10px] text-amber-850 font-bold uppercase tracking-wider block">Gamification Score</span>
                    <span className="text-2xl font-black text-amber-600">{gamificationStats?.points || 0} pts</span>
                  </div>
                  <div className="p-5 bg-purple-50 border border-purple-100 rounded-xl">
                    <span className="text-[10px] text-purple-850 font-bold uppercase tracking-wider block">Current Level</span>
                    <span className="text-2xl font-black text-purple-600">{gamificationStats?.level || 'Beginner'}</span>
                  </div>
                  <div className="p-5 bg-teal-50 border border-teal-100 rounded-xl">
                    <span className="text-[10px] text-teal-850 font-bold uppercase tracking-wider block">Volunteer Hours</span>
                    <span className="text-2xl font-black text-teal-600">{gamificationStats?.volunteerHours || 0} hrs</span>
                  </div>
                </div>

                {/* Badges List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Earned Badges</h4>
                  {(!gamificationStats?.badges || gamificationStats.badges.length === 0) ? (
                    <p className="text-xs text-gray-500">No badges earned yet. Join events or volunteer to start unlocking achievements!</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {gamificationStats.badges.map((badge) => (
                        <span key={badge} className="px-3.5 py-1.5 bg-amber-50 border border-amber-250 text-amber-805 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-2xs">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Certificates List */}
                <div className="pt-4 border-t space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Certificates</h4>
                  {certificates.length === 0 ? (
                    <p className="text-xs text-gray-500">No participation certificates generated yet. Complete event attendance to receive them.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {certificates.map((cert) => (
                        <div key={cert.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-gray-900 text-xs">{cert.Event?.title}</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                          </div>
                          <a
                            href={`${api.defaults.baseURL}/certificates/${cert.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white hover:bg-gray-100 border rounded-lg text-primary-600 transition shrink-0 cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {dashboardTab === 'timeline' && (
          <div className="bg-white rounded-2xl shadow-xs border p-6 space-y-6">
            <h3 className="font-extrabold text-gray-950 text-lg">My Timeline</h3>
            {registrations.length === 0 ? (
              <p className="text-xs text-gray-500">Timeline is currently empty. Register for events to build your history profile.</p>
            ) : (
              <div className="relative border-l-2 border-primary-200 ml-3.5 pl-6 space-y-6">
                {registrations.map((reg) => (
                  <div key={reg.id} className="relative">
                    <span className="absolute -left-[31px] top-0.5 bg-primary-55 text-primary-600 border border-primary-300 rounded-full p-1">
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">Registered for {reg.Event?.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Registration Date: {new Date(reg.registrationDate || reg.createdAt).toLocaleDateString()}
                      </p>
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                        reg.status === 'Registered' ? 'bg-green-50 text-green-705 border border-green-200' :
                        reg.status === 'Completed' ? 'bg-blue-50 text-blue-705 border border-blue-200' : 'bg-red-50 text-red-750 border border-red-200'
                      }`}>
                        {reg.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {dashboardTab === 'volunteering' && (
          <div className="bg-white rounded-2xl shadow-xs border p-6 space-y-6">
            <h3 className="font-extrabold text-gray-950 text-lg">Volunteering History</h3>
            
            {loadingExtra ? (
              <div className="py-12">
                <Loader size="medium" />
              </div>
            ) : !volunteerDashboard?.applications || volunteerDashboard.applications.length === 0 ? (
              <p className="text-xs text-gray-500">You have not volunteered for any events yet. Apply on the event details page to help organize!</p>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl text-teal-800 font-bold text-xs">
                  Total Volunteering Hours: {volunteerDashboard.totalHours || 0} Hours
                </div>
                <div className="space-y-3">
                  {volunteerDashboard.applications.map((app) => (
                    <div key={app.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-900 text-xs">{app.Event?.title}</h4>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          app.status === 'approved' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      
                      {/* Volunteer Tasks */}
                      {app.VolunteerTasks?.length > 0 && (
                        <div className="pl-4 border-l-2 border-purple-200 space-y-2">
                          <h5 className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">Assigned Tasks</h5>
                          {app.VolunteerTasks.map((task) => (
                            <div key={task.id} className="text-xs bg-white p-2.5 rounded-lg border border-purple-100 flex items-center justify-between">
                              <div>
                                <h6 className="font-bold text-gray-900 text-xs">{task.title}</h6>
                                <p className="text-[10px] text-gray-400 mt-0.5">{task.description}</p>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {task.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {dashboardTab === 'favorites' && (
          <div className="space-y-6">
            <h3 className="font-extrabold text-gray-950 text-lg">Saved & Bookmarked Events</h3>
            {events.filter((e) => favorites.includes(e.id || e._id)).length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-250 p-8 text-gray-500">
                <p className="font-semibold text-sm">No saved events.</p>
                <p className="text-xs mt-0.5">Click the heart icon on event cards in the Event Explorer tab to save them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.filter((e) => favorites.includes(e.id || e._id)).map((event) => (
                  <div key={event.id || event._id} className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(event.id || event._id);
                      }}
                      className="absolute top-4 right-4 p-1.5 bg-white/90 backdrop-blur-xs rounded-full hover:bg-white transition shadow-sm cursor-pointer z-10"
                    >
                      <Heart
                        className="w-4 h-4 text-red-500 fill-red-500 scale-110"
                      />
                    </button>
                    <EventCard
                      event={event}
                      isRegistered={registeredEventMap.has(event.id)}
                      registrationId={registeredEventMap.get(event.id)}
                      onRegister={handleRegister}
                      onCancel={handleCancelClick}
                      userRole="Student"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Confirm Event De-Registration"
        message="Are you sure you want to cancel your registration? This slot will be made available for other students immediately."
        onConfirm={handleCancelConfirm}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="Yes, Cancel Registration"
        cancelText="Keep Registration"
      />
    </div>
  );
};

export default StudentDashboard;
