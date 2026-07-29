import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import EventCard from '../components/EventCard';
import { User, BookOpen, GraduationCap, Calendar, Compass, ArrowUpDown } from 'lucide-react';

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState('');

  // Filtering / Sorting state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('date_asc');

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

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Student Profile Card (Minimized Overview) */}
        {loadingProfile ? (
          <div className="h-28 flex items-center justify-center bg-white rounded-2xl border border-gray-200">
            <Loader size="medium" />
          </div>
        ) : (
          profile && (
            <div className="bg-white rounded-2xl border border-gray-250 shadow-xs overflow-hidden flex flex-col md:flex-row items-stretch">
              <div className="bg-gradient-to-r from-primary-800 to-primary-600 px-6 py-6 md:px-8 text-white flex items-center gap-4 shrink-0">
                <div className="bg-white/10 p-2.5 rounded-full border border-white/20">
                  <User className="h-8 w-8 text-white" />
                </div>
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

        {/* Explorer Heading */}
        <div>
          <h2 className="text-2xl font-extrabold text-gray-950 flex items-center gap-2">
            <Compass className="h-7 w-7 text-primary-600 animate-pulse" />
            Campus Events Explorer
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Explore active events, tech symposiums, workshops, and sports meets.</p>
        </div>

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
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
