import React, { useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AvatarUploader from '../components/AvatarUploader';
import { User, Lock, Save, Shield, Clock, ToggleLeft, ToggleRight, CheckCircle2, ShieldAlert } from 'lucide-react';

const Profile = () => {
  const { user, role, setUser } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('profile'); // profile, password, history, security

  // Profile Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [year, setYear] = useState(user?.year || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Login History state
  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Security Toggles
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [lockoutAlerts, setLockoutAlerts] = useState(true);

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

  // Fetch Login History
  const fetchLoginHistory = async () => {
    try {
      setLoadingHistory(true);
      const { data } = await api.get('/profile/login-history');
      setLoginHistory(data);
    } catch (err) {
      console.error('Failed to load login history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchLoginHistory();
    }
  }, [activeTab]);

  // Calculate password strength score
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-gray-200' };
    
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/\W/.test(pass)) score += 1;

    if (pass.length < 8) {
      return { score: 1, label: 'Too Short (Min 8 chars)', color: 'bg-red-500', width: 'w-1/5' };
    }
    
    switch (score) {
      case 5:
        return { score: 5, label: 'Strong (Enterprise Grade)', color: 'bg-green-600', width: 'w-full' };
      case 4:
        return { score: 4, label: 'Good', color: 'bg-green-400', width: 'w-4/5' };
      case 3:
      case 2:
        return { score: 2, label: 'Medium (Include Symbols & Caps)', color: 'bg-yellow-400', width: 'w-2/5' };
      default:
        return { score: 1, label: 'Weak', color: 'bg-red-400', width: 'w-1/5' };
    }
  };

  const strength = getPasswordStrength(newPassword);

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
      console.error('Profile update error:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Profile update failed.';
      setProfileMsg({ type: 'error', text: errMsg });
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

    if (strength.score < 5) {
      setPasswordMsg({ type: 'error', text: 'Password does not meet password policy. Must include uppercase, lowercase, numbers, symbols, and at least 8 characters.' });
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
      <div className="max-w-7xl w-full mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary-600" />
            Security & Account Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your academic profile credentials, active sessions logs, and account protection settings.</p>
        </div>

        {/* Outer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Navigation Tabs Panel */}
          <div className="bg-white rounded-2xl border border-gray-250 p-4 shadow-xs h-fit space-y-1 w-full">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition duration-150 ${
                activeTab === 'profile' ? 'bg-primary-50 text-primary-700 border border-primary-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <User className="h-4.5 w-4.5" />
              <span>Profile Information</span>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition duration-150 ${
                activeTab === 'password' ? 'bg-primary-50 text-primary-700 border border-primary-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Lock className="h-4.5 w-4.5" />
              <span>Credentials & Password</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition duration-150 ${
                activeTab === 'history' ? 'bg-primary-50 text-primary-700 border border-primary-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Clock className="h-4.5 w-4.5" />
              <span>Login History logs</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition duration-150 ${
                activeTab === 'security' ? 'bg-primary-50 text-primary-700 border border-primary-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Shield className="h-4.5 w-4.5" />
              <span>Account Security Alerts</span>
            </button>
          </div>

          {/* Active Tab Panel details */}
          <div className="md:col-span-3 relative w-full bg-white p-6 sm:p-8 rounded-2xl border border-gray-250 shadow-xs">
            
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-150">
                  <div className="bg-primary-50 p-2.5 rounded-xl border border-primary-100 text-primary-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-950">Profile Details</h3>
                    <p className="text-xs text-gray-500">Your profile details on the portal.</p>
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

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-2xl">
                  {role === 'Student' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
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
                    </div>
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
            )}

            {activeTab === 'password' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-150">
                  <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100 text-purple-600">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-950">Change Password</h3>
                    <p className="text-xs text-gray-500">Security Credentials Policy Enforcement</p>
                  </div>
                </div>

                {passwordMsg.text && (
                  <div className={`p-3.5 rounded-xl text-xs font-semibold ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {passwordMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-2xl">
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
                    
                    {/* Live Password Strength Meter */}
                    {newPassword && (
                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-gray-400">Password Strength:</span>
                          <span className={strength.score === 5 ? 'text-green-600' : 'text-gray-500'}>{strength.label}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${strength.color} ${strength.width} transition-all duration-355`} />
                        </div>
                      </div>
                    )}
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
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-150">
                  <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-950">Recent Logins History</h3>
                    <p className="text-xs text-gray-500">Monitor active sessions and device audits of your account.</p>
                  </div>
                </div>

                {loadingHistory ? (
                  <div className="text-center py-10 text-gray-500 text-xs font-medium">Loading login history...</div>
                ) : loginHistory.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs font-medium">No recent logins registered.</div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-150 text-left text-xs text-gray-900">
                      <thead className="bg-gray-50 font-bold text-gray-700">
                        <tr>
                          <th className="px-5 py-3">Timestamp</th>
                          <th className="px-5 py-3">IP Address</th>
                          <th className="px-5 py-3">Device/OS</th>
                          <th className="px-5 py-3">Browser</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {loginHistory.map((lh) => (
                          <tr key={lh.id || lh._id} className="hover:bg-gray-50">
                            <td className="px-5 py-3 font-mono text-gray-500 whitespace-nowrap">
                              {new Date(lh.createdAt).toLocaleString()}
                            </td>
                            <td className="px-5 py-3 font-mono font-bold text-gray-950">
                              {lh.ipAddress}
                            </td>
                            <td className="px-5 py-3 text-gray-650 whitespace-nowrap">
                              {lh.device || 'Unknown OS'}
                            </td>
                            <td className="px-5 py-3 text-gray-650">
                              {lh.browser || 'Unknown'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-150">
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-amber-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-950">Security Settings</h3>
                    <p className="text-xs text-gray-500">Configure email alerts and account protection notifications.</p>
                  </div>
                </div>

                <div className="divide-y divide-gray-150 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">New Device Alerts</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Receive instant email security alerts when logged in from a new browser or computer device.</p>
                    </div>
                    <button onClick={() => setLoginAlerts(!loginAlerts)} className="text-primary-600">
                      {loginAlerts ? <ToggleRight className="h-9 w-9" /> : <ToggleLeft className="h-9 w-9 text-gray-300" />}
                    </button>
                  </div>
                  
                  <div className="p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Account Lockout Notifications</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Get notified immediately via email if your account is locked out due to repeated failed logins.</p>
                    </div>
                    <button onClick={() => setLockoutAlerts(!lockoutAlerts)} className="text-primary-600">
                      {lockoutAlerts ? <ToggleRight className="h-9 w-9" /> : <ToggleLeft className="h-9 w-9 text-gray-300" />}
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-250 p-4 rounded-xl flex gap-3 text-amber-800 text-xs">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-bold block">Account Lockout Protection Active</span>
                    Sri Vasavi Events enforces a maximum of 5 failed login attempts before locking out account credentials temporarily for 15 minutes. This secures your academic records from brute-force attempts.
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
