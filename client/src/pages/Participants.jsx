import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import ParticipantTable from '../components/ParticipantTable';
import SeatProgressBar from '../components/SeatProgressBar';
import { ArrowLeft, Users, Calendar, MapPin, Download } from 'lucide-react';

const Participants = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('');

  const departments = ['Computer Science', 'Electronics & Communication', 'Electrical & Electronics', 'Mechanical', 'Civil', 'Information Technology'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const statuses = ['Registered', 'Cancelled', 'Completed'];

  // Fetch Event details (to show capacity stats at top)
  const fetchEventDetails = async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data);
    } catch (err) {
      console.error('Failed to load event details:', err);
    }
  };

  // Fetch Participants list matching query params
  const fetchParticipants = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (department) params.department = department;
      if (year) params.year = year;
      if (status) params.status = status;

      const { data } = await api.get(`/events/${id}/participants`, { params });
      setParticipants(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retrieve participants list.');
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await Promise.all([fetchEventDetails(), fetchParticipants()]);
      setLoading(false);
    };
    bootstrap();
  }, [id]);

  useEffect(() => {
    // Live update participants list on filter changes (debounced search)
    const timer = setTimeout(() => {
      fetchParticipants();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, department, year, status]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <Loader size="large" />
      </div>
    );
  }

  const activeParticipantsCount = participants.filter((p) => p.status === 'Registered').length;

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Back navigation */}
        <Link
          to="/admin-dashboard"
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>Back to Event Dashboard</span>
        </Link>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {event && (
          <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="bg-primary-50 text-primary-800 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                  {event.category}
                </span>
                <h1 className="text-2xl font-extrabold text-gray-950 mt-2">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-550 mt-1.5 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 shrink-0" />
                    {new Date(event.eventDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {event.venue}
                  </span>
                </div>
              </div>

              {/* CSV export helper */}
              <button
                onClick={() => alert('Export feature upcoming in Phase 4.')}
                className="flex items-center justify-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg text-xs transition duration-150"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Registration progress bar */}
            <div className="pt-4 border-t border-gray-150 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Signups</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Users className="h-5 w-5 text-gray-450" />
                  <span className="text-xl font-extrabold text-gray-900">{activeParticipantsCount}</span>
                  <span className="text-xs text-gray-400">active entries</span>
                </div>
              </div>
              <div className="md:col-span-2">
                <SeatProgressBar availableSeats={event.availableSeats} capacity={event.capacity} />
              </div>
            </div>

          </div>
        )}

        {/* Filter controls */}
        <div className="bg-white p-4 rounded-xl border border-gray-250 shadow-xs flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4">
          <SearchBar search={search} setSearch={setSearch} placeholder="Search by student name or roll number..." />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            <FilterDropdown
              value={department}
              setValue={setDepartment}
              options={departments}
              label="Dept"
              allLabel="All Depts"
            />
            <FilterDropdown
              value={year}
              setValue={setYear}
              options={years}
              label="Year"
              allLabel="All Years"
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

        {/* List table */}
        <ParticipantTable participants={participants} />

      </div>
    </div>
  );
};

export default Participants;
