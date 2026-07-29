import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Shield, Mail, Calendar, User, LayoutGrid, FilePlus } from 'lucide-react';

const AdminDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/admin/profile');
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-red-800 to-red-600 px-6 py-8 sm:px-8 text-white flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 p-3.5 rounded-full border border-white/20">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold">{profile?.username}</h1>
                <p className="text-red-100 text-sm">Coordinator Email: {profile?.email}</p>
              </div>
            </div>
            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              {profile?.role} Profile
            </span>
          </div>

          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">
              Account Metadata
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Role</h3>
                  <p className="text-base text-gray-900 font-medium">{profile?.role}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Email</h3>
                  <p className="text-base text-gray-900 font-medium">{profile?.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Created On</h3>
                  <p className="text-base text-gray-900 font-medium">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-start space-x-4">
            <div className="bg-red-50 p-3 rounded-lg text-red-600">
              <FilePlus className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Create Event</h3>
              <p className="text-gray-600 text-sm mb-2">Publish a new event to the student registrations catalog.</p>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">Upcoming in Phase 2</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-start space-x-4">
            <div className="bg-red-50 p-3 rounded-lg text-red-600">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Manage Registrations</h3>
              <p className="text-gray-600 text-sm mb-2">View event signups, attendance records, and student profiles.</p>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">Upcoming in Phase 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
