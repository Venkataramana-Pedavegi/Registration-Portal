import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from './Loader';
import RegistrationBadge from './RegistrationBadge';
import { X, User, Mail, BookOpen, GraduationCap, Calendar, CheckCircle } from 'lucide-react';

const StudentProfileCard = ({ studentId, isOpen, onClose }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !studentId) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/student/${studentId}/profile`);
        setProfileData(data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load student profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [studentId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-800 to-primary-600 px-6 py-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-full border border-white/20">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Student Profile Overview</h2>
              <p className="text-xs text-primary-100">Administrator Detailed Audit View</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-primary-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="py-12">
              <Loader size="medium" />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center text-sm">{error}</div>
          ) : (
            profileData && (
              <>
                {/* Info Card */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Full Name</span>
                    <span className="font-bold text-gray-950 text-base">{profileData.student.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Roll Number</span>
                    <span className="font-bold text-primary-600">{profileData.student.rollNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{profileData.student.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span>{profileData.student.department} ({profileData.student.year})</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                    <span className="text-xl font-extrabold text-blue-900">{profileData.stats.totalRegistrations}</span>
                    <span className="text-[10px] text-blue-600 font-semibold block uppercase">Registrations</span>
                  </div>
                  <div className="bg-green-50 border border-green-100 p-3 rounded-xl">
                    <span className="text-xl font-extrabold text-green-900">{profileData.stats.completedEventsCount}</span>
                    <span className="text-[10px] text-green-600 font-semibold block uppercase">Completed</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl">
                    <span className="text-xl font-extrabold text-purple-900">{profileData.stats.attendancePercentage}%</span>
                    <span className="text-[10px] text-purple-600 font-semibold block uppercase">Attendance Rate</span>
                  </div>
                </div>

                {/* History table */}
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary-600" />
                    <span>Registered Events History</span>
                  </h3>
                  
                  {profileData.registrations.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-3 text-center bg-gray-50 rounded-lg">No event registrations recorded.</p>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 font-bold text-gray-700">
                          <tr>
                            <th className="px-4 py-2.5 text-left">Event Title</th>
                            <th className="px-4 py-2.5 text-left">Date</th>
                            <th className="px-4 py-2.5 text-left">Status</th>
                            <th className="px-4 py-2.5 text-left">Attendance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150 bg-white">
                          {profileData.registrations.map((reg) => (
                            <tr key={reg.id}>
                              <td className="px-4 py-2.5 font-semibold text-gray-900">{reg.Event?.title || 'Event'}</td>
                              <td className="px-4 py-2.5 text-gray-500">
                                {reg.Event ? new Date(reg.Event.eventDate).toLocaleDateString() : ''}
                              </td>
                              <td className="px-4 py-2.5">
                                <RegistrationBadge status={reg.status} />
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-gray-700">
                                {reg.Attendance ? reg.Attendance.attendanceStatus : 'Unmarked'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfileCard;
