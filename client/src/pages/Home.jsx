import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Shield, Award, Users } from 'lucide-react';

const Home = () => {
  const { token, role } = useContext(AuthContext);

  return (
    <div className="bg-gray-50 flex-grow">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/sri_vasavi_logo.png"
              alt="Sri Vasavi Engineering College Emblem"
              className="h-24 w-24 object-contain rounded-full shadow-lg border-2 border-white/80 bg-white p-1"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
            Sri Vasavi Engineering College
          </h1>
          <p className="text-xl md:text-2xl font-bold mb-6 text-primary-200">
            Event Registration & Management Portal
          </p>

          {!token ? (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/student-register"
                className="w-full sm:w-auto bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 rounded-lg font-bold shadow-md transition duration-150 ease-in-out text-center"
              >
                Register as Student
              </Link>
              <Link
                to="/student-login"
                className="w-full sm:w-auto bg-primary-700 text-white border border-primary-500 hover:bg-primary-800 px-8 py-3 rounded-lg font-bold shadow-md transition duration-150 ease-in-out text-center"
              >
                Student Login
              </Link>
            </div>
          ) : (
            <Link
              to={role === 'Student' ? '/student-dashboard' : '/admin-dashboard'}
              className="inline-block bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 rounded-lg font-bold shadow-md transition duration-150 ease-in-out"
            >
              Go to Your Dashboard ({role})
            </Link>
          )}
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Why Use Our Portal?</h2>
          <p className="text-gray-600">Built to ensure smooth event registration and coordination.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="bg-primary-50 p-4 rounded-full text-primary-600 mb-6">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Explore Events</h3>
            <p className="text-gray-600">
              Browse through departmental activities, sports meets, technical seminars, and cultural festivals.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="bg-primary-50 p-4 rounded-full text-primary-600 mb-6">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Sign Up</h3>
            <p className="text-gray-600">
              Register for events in one click using your pre-verified student profile details.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="bg-primary-50 p-4 rounded-full text-primary-600 mb-6">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Coordinator Access</h3>
            <p className="text-gray-600">
              Dedicated administrator portal for tracking user registrations and managing attendance.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
