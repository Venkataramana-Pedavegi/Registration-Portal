import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { Calendar, User, LogOut, Menu, X, Shield, Award, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, token, role, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-xs border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-primary-600 p-2 rounded-lg text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-lg text-gray-900 tracking-tight">
                Event<span className="text-primary-600">Portal</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to="/" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-xs font-semibold">
              Home
            </Link>

            {token ? (
              <>
                {role === 'Student' ? (
                  <>
                    <Link
                      to="/student-dashboard"
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-xs font-semibold"
                    >
                      Events
                    </Link>
                    <Link
                      to="/my-registrations"
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-xs font-semibold"
                    >
                      Registrations
                    </Link>
                    <Link
                      to="/certificates"
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-xs font-semibold"
                    >
                      Certificates
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/admin-dashboard"
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-xs font-semibold"
                    >
                      Events
                    </Link>
                    <Link
                      to="/analytics-dashboard"
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-xs font-semibold"
                    >
                      Analytics
                    </Link>
                    <Link
                      to="/attendance"
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-xs font-semibold"
                    >
                      Attendance
                    </Link>
                    <Link
                      to="/reports"
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-xs font-semibold"
                    >
                      Reports
                    </Link>
                    <Link
                      to="/export-reports"
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-xs font-semibold"
                    >
                      Export
                    </Link>
                    <Link
                      to="/audit-logs"
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-xs font-semibold"
                    >
                      Audit Trail
                    </Link>
                    <Link
                      to="/admin-settings"
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-xs font-semibold"
                    >
                      Settings
                    </Link>
                  </>
                )}

                <NotificationBell />

                <Link
                  to="/profile"
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-full text-xs font-semibold transition"
                >
                  <img
                    src={user?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                    alt="Avatar"
                    className="h-5 w-5 rounded-full object-cover"
                  />
                  <span>{role === 'Student' ? user?.fullName : user?.username}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-md text-xs font-semibold transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/student-login"
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-xs font-semibold"
                >
                  Student Login
                </Link>
                <Link
                  to="/student-register"
                  className="bg-primary-600 text-white hover:bg-primary-700 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Student Register
                </Link>
                <Link
                  to="/admin-login"
                  className="text-gray-500 hover:text-gray-800 px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1 border border-gray-200"
                >
                  <Shield className="h-3.5 w-3.5 text-gray-500" />
                  <span>Admin</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
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
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
          >
            Home
          </Link>
          {token ? (
            <>
              {role === 'Student' ? (
                <>
                  <Link
                    to="/student-dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Events
                  </Link>
                  <Link
                    to="/my-registrations"
                    onClick={() => setIsOpen(false)}
                    className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Registrations
                  </Link>
                  <Link
                    to="/certificates"
                    onClick={() => setIsOpen(false)}
                    className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Certificates
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/admin-dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Events
                  </Link>
                  <Link
                    to="/analytics-dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Analytics
                  </Link>
                  <Link
                    to="/attendance"
                    onClick={() => setIsOpen(false)}
                    className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Attendance
                  </Link>
                  <Link
                    to="/reports"
                    onClick={() => setIsOpen(false)}
                    className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Reports
                  </Link>
                  <Link
                    to="/export-reports"
                    onClick={() => setIsOpen(false)}
                    className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Export
                  </Link>
                  <Link
                    to="/audit-logs"
                    onClick={() => setIsOpen(false)}
                    className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Audit Trail
                  </Link>
                </>
              )}
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Notifications
              </Link>
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile Settings
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full text-left bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/student-login"
                onClick={() => setIsOpen(false)}
                className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Student Login
              </Link>
              <Link
                to="/student-register"
                onClick={() => setIsOpen(false)}
                className="block bg-primary-600 text-white text-center px-3 py-2 rounded-md text-sm font-bold"
              >
                Student Register
              </Link>
              <Link
                to="/admin-login"
                onClick={() => setIsOpen(false)}
                className="block text-gray-500 px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin Login
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
