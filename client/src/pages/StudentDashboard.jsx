import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { User, BookOpen, GraduationCap, Calendar, Mail, Clipboard } from 'lucide-react';

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/student/profile');
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <Loader size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md w-full text-center">
          <p className="font-semibold mb-2">Error Loading Profile</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary-800 to-primary-600 px-6 py-8 sm:px-8 text-white flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 p-3.5 rounded-full border border-white/20">
                <User className="h-10 w-10 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold">{profile?.fullName}</h1>
                <p className="text-primary-100 text-sm">Roll Number: {profile?.rollNumber}</p>
              </div>
            </div>
            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              Student Profile
            </span>
          </div>

          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">
              Academic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <BookOpen className="h-5 w-5 text-primary-600 mt-0.5" />
                <div>
                  <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Department</h3>
                  <p className="text-base text-gray-900 font-medium">{profile?.department}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <GraduationCap className="h-5 w-5 text-primary-600 mt-0.5" />
                <div>
                  <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Year of Study</h3>
                  <p className="text-base text-gray-900 font-medium">{profile?.year}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-primary-600 mt-0.5" />
                <div>
                  <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Email Address</h3>
                  <p className="text-base text-gray-900 font-medium">{profile?.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-primary-600 mt-0.5" />
                <div>
                  <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Joined On</h3>
                  <p className="text-base text-gray-900 font-medium">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center space-x-2 text-primary-600 font-bold mb-4">
            <Clipboard className="h-5 w-5" />
            <h2 className="text-lg text-gray-900">Your Registered Events</h2>
          </div>
          <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-500">
            <p className="text-sm mb-1">No registered events found.</p>
            <p className="text-xs">Phase 2 will allow you to browse and register for active college events.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
