import React, { useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AvatarUploader from '../components/AvatarUploader';
import { User, Lock, Save, Shield, CheckCircle } from 'lucide-react';

const Profile = () => {
  const { user, role, setUser } = useContext(AuthContext);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [year, setYear] = useState(user?.year || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setUsername(user.username || '');
      setDepartment(user.department || '');
      setYear(user.year || '');
      setProfileImage(user.profileImage || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setLoadingProfile(true);

    try {
      const payload = role === 'Student'
        ? { fullName, department, year, profileImage }
        : { username, profileImage };

      const { data } = await api.put('/profile', payload);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      if (setUser) setUser(data);
    } catch (err) {
      console.error(err);
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Profile update failed.' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    setLoadingPassword(true);

    try {
      await api.put('/profile/password', { currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Password update failed.' });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <User className="h-8 w-8 text-primary-600" />
            Account & Profile Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your academic profile, avatar image, and security password.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Profile Details */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-250 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-150">
              <div className="bg-primary-50 p-2.5 rounded-xl border border-primary-100 text-primary-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-950">Profile Information</h3>
                <p className="text-xs text-gray-500">Personal & Academic Details</p>
              </div>
            </div>

            <AvatarUploader
              currentImage={profileImage}
              onUploadSuccess={(img) => setProfileImage(img)}
            />

            {profileMsg.text && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {role === 'Student' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-primary-500 focus:border-primary-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Department</label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-primary-500 focus:border-primary-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Year of Study</label>
                    <input
                      type="text"
                      required
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-primary-500 focus:border-primary-500 shadow-xs"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-primary-500 focus:border-primary-500 shadow-xs"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loadingProfile}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Save className="h-4 w-4" />
                <span>{loadingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>

          {/* Card 2: Password Security */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-250 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-150">
              <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100 text-purple-600">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-950">Change Password</h3>
                <p className="text-xs text-gray-500">Security Credentials</p>
              </div>
            </div>

            {passwordMsg.text && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-primary-500 focus:border-primary-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-primary-500 focus:border-primary-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-primary-500 focus:border-primary-500 shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loadingPassword}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Shield className="h-4 w-4" />
                <span>{loadingPassword ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
