import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Users, CheckCircle, Clock, Plus, Award, Briefcase, FileText } from 'lucide-react';

const VolunteerManagement = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator'].includes(user?.role);

  // Student state
  const [myVolunteer, setMyVolunteer] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [department, setDepartment] = useState('');
  const [skills, setSkills] = useState('');
  const [applyMessage, setApplyMessage] = useState('');

  // Admin state
  const [volunteersList, setVolunteersList] = useState([]);
  const [selectedVol, setSelectedVol] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchAdminVolunteers();
    } else {
      fetchStudentVolunteer();
    }
    fetchEventsList();
  }, [isAdmin]);

  const fetchEventsList = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudentVolunteer = async () => {
    try {
      const res = await api.get('/volunteers/my');
      setMyVolunteer(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminVolunteers = async () => {
    try {
      const res = await api.get('/volunteers/admin');
      setVolunteersList(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/volunteers/apply', { eventId: selectedEventId, department, skills });
      setApplyMessage('Volunteer application submitted successfully!');
      fetchStudentVolunteer();
    } catch (err) {
      setApplyMessage(err.response?.data?.message || 'Error submitting application');
    }
  };

  const handleApproveStatus = async (volId, status) => {
    try {
      await api.put(`/volunteers/admin/approve/${volId}`, { status });
      fetchAdminVolunteers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!selectedVol) return;
    try {
      await api.post('/volunteers/admin/tasks', {
        volunteerId: selectedVol.id,
        eventId: selectedVol.eventId,
        title: taskTitle,
        description: taskDesc,
      });
      setTaskTitle('');
      setTaskDesc('');
      setSelectedVol(null);
      fetchAdminVolunteers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/volunteers/tasks/${taskId}/status`, { status: newStatus });
      fetchStudentVolunteer();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8 w-full min-w-0">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between w-full min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
              <Users className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">Volunteer Portal</h1>
              <p className="text-sm text-gray-500 truncate">
                {isAdmin ? 'Manage event volunteers and task assignments' : 'Apply for volunteer positions and track assigned tasks'}
              </p>
            </div>
          </div>
        </div>

        {/* Student View */}
        {!isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full min-w-0">
            {/* Application Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">Apply as Event Volunteer</h2>
              {applyMessage && (
                <div className="text-xs p-3 bg-purple-50 text-purple-700 rounded-xl font-medium">
                  {applyMessage}
                </div>
              )}
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Select Event</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  >
                    <option value="">Select Event</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. CS / IT"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Skills & Specializations</label>
                  <textarea
                    placeholder="e.g. Media, Hospitality, Technical Support"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition"
                >
                  Submit Application
                </button>
              </form>
            </div>

            {/* Dashboard / Assigned Events */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Volunteer Performance Dashboard</h2>
                  <span className="text-xs font-bold px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                    Total Hours: {myVolunteer?.totalHours || 0} hrs
                  </span>
                </div>

                <div className="space-y-4">
                  {myVolunteer?.applications?.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4">No active volunteer applications yet.</p>
                  ) : (
                    myVolunteer?.applications?.map((app) => (
                      <div key={app.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900">{app.Event?.title}</h3>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                            app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {app.status}
                          </span>
                        </div>

                        {app.VolunteerTasks?.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-gray-200">
                            <h4 className="text-xs font-semibold text-gray-700">Assigned Tasks</h4>
                            {app.VolunteerTasks.map((task) => (
                              <div key={task.id} className="flex items-center justify-between bg-white p-3 rounded-lg border text-xs">
                                <div>
                                  <p className="font-semibold text-gray-900">{task.title}</p>
                                  <p className="text-gray-500">{task.description}</p>
                                </div>
                                <select
                                  value={task.status}
                                  onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                  className="px-2 py-1 bg-gray-50 border rounded text-xs"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin View */}
        {isAdmin && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Volunteer Applications & Task Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b">
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Skills</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteersList.map((vol) => (
                    <tr key={vol.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-900">{vol.Student?.fullName}</td>
                      <td className="p-3">{vol.Event?.title}</td>
                      <td className="p-3">{vol.department}</td>
                      <td className="p-3 text-xs text-gray-500">{vol.skills}</td>
                      <td className="p-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${
                          vol.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          vol.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {vol.status}
                        </span>
                      </td>
                      <td className="p-3 flex items-center gap-2">
                        {vol.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveStatus(vol.id, 'approved')}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveStatus(vol.id, 'rejected')}
                              className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {vol.status === 'approved' && (
                          <button
                            onClick={() => setSelectedVol(vol)}
                            className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-xs font-medium"
                          >
                            Assign Task
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Task Modal */}
            {selectedVol && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Assign Task to {selectedVol.Student?.name}</h3>
                  <form onSubmit={handleAssignTask} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Task Title</label>
                      <input
                        type="text"
                        required
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
                      <textarea
                        value={taskDesc}
                        onChange={(e) => setTaskDesc(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedVol(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold"
                      >
                        Assign Task
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerManagement;
