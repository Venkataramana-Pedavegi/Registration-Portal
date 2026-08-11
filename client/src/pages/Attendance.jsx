import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import AttendanceTable from '../components/AttendanceTable';
import ExportButton from '../components/ExportButton';
import { CheckSquare, Calendar, Users, Percent, CheckCircle, XCircle } from 'lucide-react';

const Attendance = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [error, setError] = useState('');



  // Fetch list of events for the dropdown selector
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await api.get('/events');
        setEvents(data);
        if (data.length > 0) {
          setSelectedEventId(data[0].id || data[0]._id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load events list.');
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // Fetch attendance list for selected event
  const fetchAttendance = async (eventId) => {
    if (!eventId) return;
    try {
      setLoadingAttendance(true);
      const { data } = await api.get(`/attendance/event/${eventId}`);
      setAttendanceData(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load attendance records.');
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchAttendance(selectedEventId);
    }
  }, [selectedEventId]);

  const handleMarkAttendance = async (registrationId, status) => {
    try {
      await api.post('/attendance', {
        registrationId,
        attendanceStatus: status,
      });
      // Refresh attendance list
      fetchAttendance(selectedEventId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to mark attendance.');
    }
  };



  if (loadingEvents) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <CheckSquare className="h-8 w-8 text-primary-600" />
              Event Attendance Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">Select an event to mark and monitor student attendance records.</p>
          </div>
          <ExportButton endpoint="/export/attendance" filename="attendance_report.csv" label="Export Attendance CSV" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        )}



        {/* Event Selector Dropdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Select Campus Event</label>
          <div className="relative">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="block w-full py-3 px-4 pr-8 border border-gray-300 rounded-xl text-gray-900 bg-white font-semibold text-sm focus:ring-primary-500 focus:border-primary-500 shadow-xs"
            >
              {events.map((ev) => (
                <option key={ev.id || ev._id} value={ev.id || ev._id}>
                  {ev.title} — ({ev.category}) — {new Date(ev.eventDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Row */}
        {attendanceData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs flex items-center gap-4">
              <div className="bg-blue-50 text-blue-700 p-3 rounded-xl border border-blue-100 shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium block">Total Registered</span>
                <span className="text-2xl font-extrabold text-gray-950">{attendanceData.stats.totalRegistered}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs flex items-center gap-4">
              <div className="bg-green-50 text-green-700 p-3 rounded-xl border border-green-100 shrink-0">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium block">Present</span>
                <span className="text-2xl font-extrabold text-green-800">{attendanceData.stats.presentCount}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs flex items-center gap-4">
              <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 shrink-0">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium block">Absent</span>
                <span className="text-2xl font-extrabold text-red-800">{attendanceData.stats.absentCount}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs flex items-center gap-4">
              <div className="bg-purple-50 text-purple-700 p-3 rounded-xl border border-purple-100 shrink-0">
                <Percent className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium block">Attendance Rate</span>
                <span className="text-2xl font-extrabold text-purple-900">{attendanceData.stats.attendancePercentage}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {loadingAttendance ? (
          <div className="py-16">
            <Loader size="large" />
          </div>
        ) : (
          attendanceData && (
            <AttendanceTable
              participants={attendanceData.participants}
              onMarkAttendance={handleMarkAttendance}
            />
          )
        )}

      </div>
    </div>
  );
};

export default Attendance;
