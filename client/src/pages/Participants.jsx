import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import ParticipantTable from '../components/ParticipantTable';
import SeatProgressBar from '../components/SeatProgressBar';
import { ArrowLeft, Users, Calendar, MapPin, Download, Mail, CheckSquare } from 'lucide-react';

const Participants = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bulk Email Modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Bulk Attendance Modal state
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('');

  const departments = [
    'Computer Science and Artificial Intelligence (CAI)',
    'Artificial Intelligence and Machine Learning (AIML)',
    'Information Technology (IT)',
    'Computer Science and Technology (CST)'
  ];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const statuses = ['Registered', 'Cancelled', 'Completed'];

  // Fetch Event details
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
    const timer = setTimeout(() => {
      fetchParticipants();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, department, year, status]);

  const handleExportCSV = () => {
    if (!participants || participants.length === 0) {
      alert('No participant records to export.');
      return;
    }
    const headers = ['Name', 'Roll Number', 'Email', 'Department', 'Year', 'Status', 'Date'];
    const rows = participants.map((p) => [
      p.Student?.fullName || 'N/A',
      p.Student?.rollNumber || 'N/A',
      p.Student?.email || 'N/A',
      p.Student?.department || 'N/A',
      p.Student?.year || 'N/A',
      p.status,
      new Date(p.registrationDate || p.createdAt).toLocaleDateString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `participants_event_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendBulkEmail = async (e) => {
    e.preventDefault();
    if (!emailSubject || !emailMessage) {
      alert('Subject and message body cannot be blank.');
      return;
    }
    try {
      setSendingEmail(true);
      await api.post(`/events/${id}/bulk-email`, { subject: emailSubject, message: emailMessage });
      alert('Announcements sent to all registered participants successfully!');
      setIsEmailModalOpen(false);
      setEmailSubject('');
      setEmailMessage('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to send bulk announcement.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleMarkBulkAttendance = async (attendanceStatus) => {
    try {
      setSubmittingAttendance(true);
      await api.post(`/events/${id}/bulk-attendance`, { status: attendanceStatus });
      alert(`Bulk attendance marked as ${attendanceStatus} and certificates generated successfully!`);
      setIsAttendanceModalOpen(false);
      await fetchParticipants();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to mark bulk attendance.');
    } finally {
      setSubmittingAttendance(false);
    }
  };

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

              {/* Action buttons row */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 border border-primary-300 hover:bg-primary-50 text-primary-700 font-semibold px-4 py-2 rounded-lg text-xs transition duration-150 cursor-pointer"
                  title="Send bulk announcement"
                >
                  <Mail className="h-4 w-4" />
                  <span>Send Mail</span>
                </button>
                <button
                  onClick={() => setIsAttendanceModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 border border-purple-300 hover:bg-purple-50 text-purple-700 font-semibold px-4 py-2 rounded-lg text-xs transition duration-150 cursor-pointer"
                  title="Mark all present or absent at once"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Bulk Attendance</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg text-xs transition duration-150 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Registration progress bar */}
            <div className="pt-4 border-t border-gray-155 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Signups</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Users className="h-5 w-5 text-gray-440" />
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

      {/* Bulk Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-650" /> Send Bulk Announcement
              </h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleSendBulkEmail} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. Bring your laptops for the hackathon"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Message Body</label>
                <textarea
                  required
                  rows={5}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Type your announcement detail here..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {sendingEmail ? 'Sending...' : 'Send to Participants'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Attendance Modal */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4 text-center">
            <h3 className="text-lg font-bold text-gray-900">Bulk Mark Attendance</h3>
            <p className="text-sm text-gray-500">
              Confirm marking ALL active registered participants of this event as PRESENT or ABSENT?
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Note: Marking students as "Present" will automatically issue participation certificates and trigger email copies!
            </p>
            <div className="flex justify-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsAttendanceModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAttendance}
                onClick={() => handleMarkBulkAttendance('Absent')}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                disabled={submittingAttendance}
                onClick={() => handleMarkBulkAttendance('Present')}
                className="px-4 py-2 bg-green-650 hover:bg-green-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Mark All Present
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Participants;
