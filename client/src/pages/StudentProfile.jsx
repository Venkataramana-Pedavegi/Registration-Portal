import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import RegistrationBadge from '../components/RegistrationBadge';
import { ArrowLeft, User, Mail, BookOpen, GraduationCap, Calendar, CheckCircle } from 'lucide-react';

const StudentProfile = () => {
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const handleResendVerification = async () => {
    try {
      setResending(true);
      setResendStatus('');
      const { data } = await api.post('/student/resend-verification', { email: profileData.student.email });
      setResendStatus(data.message || 'Verification email sent successfully.');
    } catch (err) {
      console.error(err);
      setResendStatus(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/student/${id}/profile`);
        setProfileData(data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to retrieve student profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <Link
          to="/admin-dashboard"
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>Back to Dashboard</span>
        </Link>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        ) : (
          profileData && (
            <div className="bg-white rounded-2xl shadow-xs border border-gray-250 overflow-hidden space-y-6">
              
              {/* Cover Banner */}
              <div className="bg-gradient-to-r from-primary-800 to-primary-600 p-8 text-white flex items-center gap-6">
                <div className="bg-white/10 p-4 rounded-full border border-white/20 shrink-0">
                  <User className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold">{profileData.student.fullName}</h1>
                  <p className="text-primary-100 text-sm mt-0.5">Roll Number: {profileData.student.rollNumber}</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200 text-sm">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Email Address</span>
                    <span className="font-semibold text-gray-900 break-all">{profileData.student.email}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Department</span>
                    <span className="font-semibold text-gray-900">{profileData.student.department}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Year of Study</span>
                    <span className="font-semibold text-gray-900">{profileData.student.year}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Verification Status</span>
                    <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full border text-[11px] mt-1 ${
                      profileData.student.isVerified 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {profileData.student.isVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>

                {!profileData.student.isVerified && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-800">Email Address Unverified</span>
                      <p className="text-[10px] text-gray-500">This student has not completed email verification. Click to resend active token.</p>
                    </div>
                    <button
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition duration-155"
                    >
                      {resending ? 'Resending...' : 'Resend Verification'}
                    </button>
                  </div>
                )}

                {resendStatus && (
                  <div className="p-3 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-xl">
                    {resendStatus}
                  </div>
                )}

                {/* Metrics cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                    <span className="text-2xl font-black text-blue-900">{profileData.stats.totalRegistrations}</span>
                    <span className="text-xs text-blue-600 font-semibold block uppercase">Total Signups</span>
                  </div>
                  <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                    <span className="text-2xl font-black text-green-900">{profileData.stats.completedEventsCount}</span>
                    <span className="text-xs text-green-600 font-semibold block uppercase">Completed</span>
                  </div>
                  <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                    <span className="text-2xl font-black text-red-900">{profileData.stats.cancelledCount}</span>
                    <span className="text-xs text-red-600 font-semibold block uppercase">Cancelled</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
                    <span className="text-2xl font-black text-purple-900">{profileData.stats.attendancePercentage}%</span>
                    <span className="text-xs text-purple-600 font-semibold block uppercase">Attendance</span>
                  </div>
                </div>

                {/* Registrations list */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Event Signup Audit Records</h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden text-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 text-xs font-bold text-gray-700 uppercase">
                        <tr>
                          <th className="px-6 py-3.5 text-left">Event Title</th>
                          <th className="px-6 py-3.5 text-left">Category</th>
                          <th className="px-6 py-3.5 text-left">Date</th>
                          <th className="px-6 py-3.5 text-left">Status</th>
                          <th className="px-6 py-3.5 text-left">Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {profileData.registrations.map((reg) => (
                          <tr key={reg.id}>
                            <td className="px-6 py-4 font-semibold text-gray-950">{reg.Event?.title || 'Unknown Event'}</td>
                            <td className="px-6 py-4 text-gray-600">{reg.Event?.category}</td>
                            <td className="px-6 py-4 text-gray-600">
                              {reg.Event ? new Date(reg.Event.eventDate).toLocaleDateString() : ''}
                            </td>
                            <td className="px-6 py-4">
                              <RegistrationBadge status={reg.status} />
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-800">
                              {reg.Attendance ? reg.Attendance.attendanceStatus : 'Unmarked'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )
        )}

      </div>
    </div>
  );
};

export default StudentProfile;
