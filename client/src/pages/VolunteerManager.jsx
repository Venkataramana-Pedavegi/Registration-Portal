import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Award, Plus, CheckCircle, Clock, BookOpen, User, Trophy, Search, AlertCircle } from 'lucide-react';

const VolunteerManager = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [selectedVol, setSelectedVol] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [manHours, setManHours] = useState('0');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ status: statusFilter });
      const { data } = await api.get(`/volunteers/admin?${params.toString()}`);
      setVolunteers(data);

      const analyticsRes = await api.get('/volunteers/admin/analytics');
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch volunteer applications records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, [statusFilter]);

  const handleApproveStatus = async (id, status) => {
    setSuccess('');
    setError('');
    try {
      await api.put(`/volunteers/admin/approve/${id}`, { status });
      setSuccess(`Volunteer application ${status} successfully.`);
      fetchVolunteers();
    } catch (err) {
      console.error(err);
      setError('Failed to update volunteer status.');
    }
  };

  const handleOpenTask = (vol) => {
    setSelectedVol(vol);
    setTaskTitle('');
    setTaskDesc('');
    setIsTaskModalOpen(true);
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      await api.post('/volunteers/admin/tasks', {
        volunteerId: selectedVol.id,
        eventId: selectedVol.eventId,
        title: taskTitle,
        description: taskDesc,
      });
      setSuccess(`Task assigned successfully to ${selectedVol.Student?.fullName || 'volunteer'}.`);
      setIsTaskModalOpen(false);
      fetchVolunteers();
    } catch (err) {
      console.error(err);
      setError('Failed to assign volunteering task.');
    }
  };

  const handleOpenHours = (vol) => {
    setSelectedVol(vol);
    setManHours(String(vol.hours || 0));
    setIsHoursModalOpen(true);
  };

  const handleUpdateHours = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      await api.put(`/volunteers/admin/hours/${selectedVol.id}`, { hours: parseInt(manHours) });
      setSuccess(`Updated volunteer hours successfully.`);
      setIsHoursModalOpen(false);
      fetchVolunteers();
    } catch (err) {
      console.error(err);
      setError('Failed to update volunteer hours log.');
    }
  };

  const handleIssueCertificate = async (vol) => {
    setSuccess('');
    setError('');
    try {
      const { data } = await api.post(`/volunteers/admin/certificate/${vol.id}`);
      setSuccess(`Volunteer participation certificate issued. ID: ${data.certificate?.certificateId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to issue volunteer certificate.');
    }
  };

  // Local filter search
  const filteredVolunteers = volunteers.filter((vol) => {
    const studentName = vol.Student?.fullName || '';
    const rollNumber = vol.Student?.rollNumber || '';
    const eventName = vol.Event?.title || '';
    const term = search.toLowerCase();
    return (
      studentName.toLowerCase().includes(term) ||
      rollNumber.toLowerCase().includes(term) ||
      eventName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="h-8 w-8 text-primary-600" />
            Volunteer Networks Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">Approve applications, update service hours, assign custom event duties, and issue volunteer certificates.</p>
        </div>

        {/* Banners */}
        {success && (
          <div className="p-4 bg-green-50 text-green-800 rounded-xl border border-green-200 text-sm font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-250 flex items-center gap-4">
              <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                <User className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active Volunteers</div>
                <div className="text-2xl font-black text-gray-900">{analytics.approvedCount}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-250 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Service Hours</div>
                <div className="text-2xl font-black text-gray-900">{analytics.totalHours} hrs</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-250 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tasks Completed</div>
                <div className="text-2xl font-black text-gray-900">{analytics.completedTasks}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-250 flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="flex-grow">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Top Volunteer Rank</div>
                {analytics.topVolunteers && analytics.topVolunteers[0] ? (
                  <div className="text-xs font-bold text-gray-800 truncate">
                    {analytics.topVolunteers[0].Student?.fullName} ({analytics.topVolunteers[0].hours} hrs)
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-gray-400">None yet</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full flex items-center gap-2 border border-gray-300 rounded-xl px-3 bg-white">
            <Search className="h-4.5 w-4.5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by student name, roll number, or event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2 border-0 focus:ring-0 text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Application</option>
            <option value="approved">Approved volunteers</option>
            <option value="rejected">Rejected applications</option>
          </select>
        </div>

        {/* Volunteers list */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader size="large" /></div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400 font-bold bg-white rounded-2xl border">
            No volunteer records found.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-250">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Event Assignment</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Skills</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVolunteers.map((vol) => (
                    <tr key={vol.id} className="hover:bg-gray-55">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{vol.Student?.fullName}</div>
                          <div className="text-[11px] text-gray-500 font-semibold uppercase">{vol.Student?.rollNumber} • {vol.department}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-800">{vol.Event?.title}</div>
                        <div className="text-[10px] text-gray-400">{new Date(vol.Event?.eventDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate">
                        {vol.skills || 'General Assist'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {vol.hours || 0} hrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          vol.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                          vol.status === 'rejected' ? 'bg-red-50 text-red-750 border border-red-150' :
                          'bg-amber-50 text-amber-700 border border-amber-250'
                        }`}>
                          {vol.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2.5">
                          {vol.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveStatus(vol.id, 'approved')}
                                className="px-3 py-1 bg-green-600 hover:bg-green-755 text-white font-bold rounded-lg text-xs transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproveStatus(vol.id, 'rejected')}
                                className="px-3 py-1 bg-red-650 hover:bg-red-750 text-white font-bold rounded-lg text-xs transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {vol.status === 'approved' && (
                            <>
                              <button
                                onClick={() => handleOpenTask(vol)}
                                className="px-2.5 py-1 bg-primary-600 hover:bg-primary-750 text-white font-bold rounded-lg text-[10px] transition"
                              >
                                Assign Task
                              </button>
                              <button
                                onClick={() => handleOpenHours(vol)}
                                className="px-2.5 py-1 bg-purple-650 hover:bg-purple-750 text-white font-bold rounded-lg text-[10px] transition"
                              >
                                Log Hours
                              </button>
                              <button
                                onClick={() => handleIssueCertificate(vol)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-750 text-white font-bold rounded-lg text-[10px] transition shadow-xs"
                              >
                                Certify
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Assign Task */}
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
              <h3 className="text-xl font-extrabold text-gray-900">Assign Task to {selectedVol?.Student?.fullName}</h3>
              
              <form onSubmit={handleAssignTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Help Desk Operations"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Task Description</label>
                  <textarea
                    rows={4}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Describe duties, reporting venue details..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-650 hover:bg-primary-750 text-white rounded-xl text-sm font-bold transition"
                  >
                    Assign Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Log Hours */}
        {isHoursModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl space-y-4">
              <h3 className="text-xl font-extrabold text-gray-900">Log Volunteer Hours</h3>
              <p className="text-xs text-gray-400 font-semibold leading-normal">
                Directly configure total verified volunteering hours logged under {selectedVol?.Student?.fullName} for event "{selectedVol?.Event?.title}".
              </p>
              
              <form onSubmit={handleUpdateHours} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Total Hours Logged</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={manHours}
                    onChange={(e) => setManHours(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-center font-bold"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsHoursModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-755 text-white rounded-xl text-sm font-bold transition shadow-sm"
                  >
                    Update Hours
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VolunteerManager;
