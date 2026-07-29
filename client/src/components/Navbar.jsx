import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Menu, X, Calendar, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { token, role, user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-primary-600 font-bold text-xl">
              <Calendar className="h-6 w-6" />
              <span>CampusEvents</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </Link>

            {token ? (
              <>
                {role === 'Student' ? (
                  <Link
                    to="/student-dashboard"
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/admin-dashboard"
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin Panel
                  </Link>
                )}

                <div className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <User className="h-4.5 w-4.5 text-gray-500" />
                  <span>{role === 'Student' ? user?.fullName : user?.username}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/student-login"
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Student Login
                </Link>
                <Link
                  to="/student-register"
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Student Register
                </Link>
                <Link
                  to="/admin-login"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition duration-150 ease-in-out"
                >
                  Admin Portal
                </Link>
              </>
            )}
          </div>

          {/* Hamburger button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-100">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium"
            >
              Home
            </Link>

            {token ? (
              <>
                {role === 'Student' ? (
                  <Link
                    to="/student-dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/admin-dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium"
                  >
                    Admin Panel
                  </Link>
                )}

                <div className="flex items-center space-x-2 px-3 py-2 text-gray-600">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="font-semibold text-sm">
                    {role === 'Student' ? user?.fullName : user?.username} ({role})
                  </span>
                </div>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center space-x-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-md text-base font-medium"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/student-login"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Student Login
                </Link>
                <Link
                  to="/student-register"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Student Register
                </Link>
                <Link
                  to="/admin-login"
                  onClick={() => setIsOpen(false)}
                  className="block bg-primary-600 text-white px-3 py-2 rounded-md text-base font-medium text-center"
                >
                  Admin Portal
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
