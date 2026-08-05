import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { Calendar as CalendarIcon, User, LogOut, Menu, X, Shield, Award, Trophy, Users, CheckCircle, Image as ImageIcon } from 'lucide-react';

const Navbar = () => {
  const { user, token, role, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdminRole = ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator'].includes(role);

  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-xs border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 xl:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2.5">
              <img
                src="/sri_vasavi_logo.png"
                alt="Sri Vasavi Engineering College"
                className="h-9 w-9 object-contain rounded-full shadow-xs border border-primary-100 bg-white"
              />
              <span className="font-extrabold text-lg text-gray-900 tracking-tight flex items-center gap-1">
                Sri Vasavi <span className="text-primary-600">Events</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1 lg:space-x-1.5 xl:space-x-3 text-[10px] lg:text-[11px] xl:text-xs font-semibold text-gray-600 flex-nowrap flex-shrink-0">
            <Link to="/" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex-shrink-0">
              Home
            </Link>
            <Link to="/calendar" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex items-center gap-0.5 xl:gap-1 flex-shrink-0">
              <CalendarIcon className="w-3 h-3 xl:w-3.5 xl:h-3.5" /> Calendar
            </Link>
            <Link to="/leaderboard" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex items-center gap-0.5 xl:gap-1 flex-shrink-0">
              <Trophy className="w-3 h-3 xl:w-3.5 xl:h-3.5" /> Leaderboard
            </Link>
            <Link to="/gallery" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex items-center gap-0.5 xl:gap-1 flex-shrink-0">
              <ImageIcon className="w-3 h-3 xl:w-3.5 xl:h-3.5" /> Gallery
            </Link>
            <Link to="/verify-certificate" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex items-center gap-0.5 xl:gap-1 flex-shrink-0">
              <CheckCircle className="w-3 h-3 xl:w-3.5 xl:h-3.5" /> Verify
            </Link>

            {token ? (
              <>
                {!isAdminRole ? (
                  <>
                    <Link to="/student-dashboard" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex-shrink-0">
                      Events
                    </Link>
                    <Link to="/my-registrations" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex-shrink-0">
                      Registrations
                    </Link>
                    <Link to="/certificates" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex-shrink-0">
                      Certificates
                    </Link>
                    <Link to="/volunteers" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex-shrink-0">
                      Volunteers
                    </Link>
                    <Link to="/achievements" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex items-center gap-0.5 flex-shrink-0">
                      <Award className="w-3 h-3" /> Achievements
                    </Link>
                    <Link to="/ai-recommendations" className="hover:text-indigo-600 text-indigo-650 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex items-center gap-0.5 flex-shrink-0 font-bold">
                      ⭐ Recommendations
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/admin-dashboard" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex-shrink-0">
                      Events
                    </Link>
                    <Link to="/analytics-dashboard" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex-shrink-0">
                      Analytics
                    </Link>
                    <Link to="/attendance" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex-shrink-0">
                      Attendance
                    </Link>
                    <Link to="/volunteers" className="hover:text-primary-600 px-1 lg:px-1.5 xl:px-2 py-1.5 rounded-md flex-shrink-0">
                      Volunteers
                    </Link>
                    
                    {/* Admin Hub dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                        className="hover:text-primary-600 px-1.5 lg:px-2.5 py-1.5 rounded-md flex items-center gap-1 flex-shrink-0 focus:outline-none"
                      >
                        <Shield className="h-3.5 w-3.5 text-primary-600" />
                        <span>Admin Hub</span>
                      </button>
                      
                      {adminMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 text-[11px] font-bold text-gray-700">
                          <Link to="/admin/admins" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-primary-650">Admins List</Link>
                          <Link to="/admin/roles" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-primary-650">Roles Info</Link>
                          <Link to="/admin/permissions" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-primary-650">Permissions Matrix</Link>
                          <Link to="/admin/students" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-primary-650">Students Directory</Link>
                          <Link to="/admin/volunteer-network" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-primary-650">Volunteer Center</Link>
                          <Link to="/admin/templates" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-primary-650">Templates & Cloning</Link>
                          <Link to="/admin/bulk" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-primary-650">Bulk Operations</Link>
                          <Link to="/admin/announcements" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-primary-650">Broadcasting Center</Link>
                          <Link to="/admin/system-settings" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-primary-650">System Settings</Link>
                          <Link to="/admin/backups" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-primary-650">Backups & Recovery</Link>
                          <Link to="/audit-logs" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-primary-650">Security Audit Logs</Link>
                          <hr className="my-1 border-gray-100" />
                          <Link to="/ai-search" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-indigo-600 text-indigo-650 font-bold">Smart Search (AI)</Link>
                          <Link to="/ai-assistant" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-indigo-600 text-indigo-650 font-bold">Copilot Assistant (AI)</Link>
                          <Link to="/ai-feedback-analysis" onClick={() => setAdminMenuOpen(false)} className="block px-4 py-2 hover:bg-gray-50 hover:text-indigo-600 text-indigo-650 font-bold">Feedback Analysis (AI)</Link>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <NotificationBell />

                <Link
                  to="/profile"
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 pr-3 pl-1.5 py-1 rounded-full text-[10px] lg:text-[11px] xl:text-xs font-semibold transition flex-shrink-0"
                >
                  <img
                    src={user?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                    alt="Avatar"
                    className="w-[50px] h-[50px] rounded-full object-cover flex-shrink-0 border border-gray-200"
                  />
                  <span>{user?.fullName || user?.name || user?.username}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1.5 rounded-md text-[10px] lg:text-[11px] xl:text-xs font-semibold transition flex-shrink-0"
                >
                  <LogOut className="h-3 w-3 xl:h-3.5 xl:w-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/student-login" className="hover:text-primary-600 px-1.5 lg:px-2.5 py-1.5 rounded-md flex-shrink-0">
                  Student Login
                </Link>
                <Link to="/student-register" className="bg-primary-600 text-white hover:bg-primary-700 px-2 lg:px-3 py-1.5 rounded-xl font-bold shadow-xs transition flex-shrink-0">
                  Register
                </Link>
                <Link to="/admin-login" className="text-gray-500 hover:text-gray-800 px-1.5 lg:px-2.5 py-1.5 rounded-md flex items-center gap-1 border border-gray-200 flex-shrink-0">
                  <Shield className="h-3 w-3 xl:h-3.5 xl:w-3.5" /> Admin
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-2 text-sm font-medium">
          <Link to="/" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Home</Link>
          <Link to="/calendar" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Event Calendar</Link>
          <Link to="/leaderboard" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Leaderboard</Link>
          <Link to="/gallery" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Gallery</Link>
          <Link to="/verify-certificate" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Verify Certificate</Link>
          {token && (
            <>
              {!isAdminRole ? (
                <>
                  <Link to="/student-dashboard" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Events</Link>
                  <Link to="/my-registrations" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Registrations</Link>
                  <Link to="/certificates" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Certificates</Link>
                  <Link to="/volunteers" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Volunteers</Link>
                </>
              ) : (
                <>
                  <Link to="/admin-dashboard" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Events</Link>
                  <Link to="/analytics-dashboard" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Analytics</Link>
                  <Link to="/attendance" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Attendance</Link>
                  <Link to="/volunteers" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Volunteers</Link>
                  <Link to="/reports" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Reports</Link>
                  <Link to="/audit-logs" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Audit</Link>
                </>
              )}
              <Link to="/profile" onClick={() => setIsOpen(false)} className="block py-2 hover:text-primary-600">Profile</Link>
              <button onClick={() => { setIsOpen(false); handleLogout(); }} className="w-full text-left text-red-600 py-2 hover:text-red-700">
                Logout
              </button>
            </>
          )}
          {!token && (
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link to="/student-login" onClick={() => setIsOpen(false)} className="block py-2 text-center hover:text-primary-600">
                Student Login
              </Link>
              <Link to="/student-register" onClick={() => setIsOpen(false)} className="block py-2 text-center bg-primary-600 text-white rounded-xl font-bold shadow-xs">
                Register
              </Link>
              <Link to="/admin-login" onClick={() => setIsOpen(false)} className="block py-2 text-center text-gray-500 hover:text-gray-800 border border-gray-200 rounded-md">
                Admin
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
