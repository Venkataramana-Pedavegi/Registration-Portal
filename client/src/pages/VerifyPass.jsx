import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Loader from '../components/Loader';
import { CheckCircle, XCircle, User, Calendar, MapPin, Award, ShieldAlert, LogIn } from 'lucide-react';

const VerifyPass = () => {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isAdmin = ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator'].includes(user?.role);

  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPassDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/qrcode/verify/${registrationId}`);
      setPassData(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid pass details or record not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassDetails();
  }, [registrationId]);

  const handleMarkAttendance = async () => {
    setActionSuccess('');
    setError('');
    setActionLoading(true);
    try {
      const { data } = await api.post('/qrcode/scan', { registrationId });
      setActionSuccess(data.message || 'Attendance marked Present successfully.');
      fetchPassDetails();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to mark attendance.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-20">
        <Loader size="large" />
      </div>
    );
  }

  const isValidPass = passData?.isValid;

  return (
    <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xl">
        
        {/* Header Ribbon / Validity Banner */}
        <div className={`p-6 text-center text-white ${isValidPass ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
          <div className="flex justify-center mb-2">
            {isValidPass ? (
              <CheckCircle className="h-14 w-14 text-white drop-shadow-md animate-pulse" />
            ) : (
              <XCircle className="h-14 w-14 text-white drop-shadow-md" />
            )}
          </div>
          <h1 className="text-2xl font-black tracking-wide uppercase">{isValidPass ? 'Valid Entry Pass' : 'Invalid Entry Pass'}</h1>
          <p className="text-xs text-white opacity-90 mt-1 font-semibold">
            {passData?.message || error || 'Pass status verified successfully'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-red-650 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3.5 bg-green-50 text-green-800 rounded-xl border border-green-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="h-4.5 w-4.5 text-green-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {passData && (
            <div className="space-y-5">
              
              {/* Pass Metadata */}
              <div className="flex justify-between items-center text-xs text-gray-400 font-bold border-b pb-3">
                <span>REGISTRATION ID: #{passData.passId}</span>
                <span className="flex items-center gap-1.5">
                  QR STATUS: 
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${
                    isValidPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {isValidPass ? 'Valid' : 'Invalid'}
                  </span>
                </span>
              </div>

              {/* Student info */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-4 w-4 text-purple-500" />
                  Student Details
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Student Name</div>
                      <div className="font-extrabold text-gray-800">{passData.studentName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Student ID</div>
                      <div className="font-bold text-gray-700">#{passData.studentId || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Roll Number</div>
                      <div className="font-bold text-gray-700">{passData.rollNumber}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Department</div>
                      <div className="font-bold text-gray-700">{passData.department}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Email Address</div>
                    <div className="font-semibold text-gray-600 text-xs truncate">{passData.email}</div>
                  </div>
                </div>
              </div>

              {/* Event details */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Event Details
                </h3>
                <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100 space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <div className="text-[10px] font-bold text-purple-400 uppercase">Event Name</div>
                      <div className="font-extrabold text-gray-800">{passData.eventName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-purple-400 uppercase">Event ID</div>
                      <div className="font-bold text-gray-700">#{passData.eventId || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-1">
                      <Calendar className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-bold text-purple-400 uppercase">Date</div>
                        <div className="font-semibold text-gray-700 text-xs">{new Date(passData.eventDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-1">
                      <MapPin className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-bold text-purple-400 uppercase">Venue</div>
                        <div className="font-semibold text-gray-700 text-xs truncate">{passData.eventVenue}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Status */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 flex items-center justify-between text-sm">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Registration Status</div>
                  <div className="text-xs font-semibold text-gray-500"> SVEC Registration Entry </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                  passData.registrationStatus === 'Registered' 
                    ? 'bg-teal-100 text-teal-700' 
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {passData.registrationStatus}
                </span>
              </div>

              {/* Attendance Status */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Attendance Status</div>
                    <div className="text-xs font-semibold text-gray-500">
                      {passData.attendanceStatus === 'Present' && passData.markedAt 
                        ? `Scanned at ${new Date(passData.markedAt).toLocaleTimeString()}`
                        : 'Not scanned/marked yet'}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                  passData.attendanceStatus === 'Present' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {passData.attendanceStatus}
                </span>
              </div>

              {/* Admin Actions */}
              {isAdmin && isValidPass && passData.attendanceStatus !== 'Present' && (
                <button
                  onClick={handleMarkAttendance}
                  disabled={actionLoading}
                  className="w-full py-3 bg-purple-650 hover:bg-purple-750 text-white rounded-2xl font-bold text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader size="small" /> : 'Confirm & Mark Attendance'}
                </button>
              )}

            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex flex-col gap-2">
            {!user ? (
              <button
                onClick={() => navigate('/student-login')}
                className="w-full py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5"
              >
                <LogIn className="h-4 w-4" />
                Log In to SVEC Portal
              </button>
            ) : (
              <button
                onClick={() => navigate(isAdmin ? '/admin-dashboard' : '/student-dashboard')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-800 rounded-xl text-xs font-bold transition text-center"
              >
                Go to Dashboard
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default VerifyPass;
