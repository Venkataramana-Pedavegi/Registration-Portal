import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 py-16 px-4">
      <div className="text-center max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-100 flex flex-col items-center">
        <div className="bg-gray-100 p-4 rounded-full text-gray-500 mb-6">
          <MapPinOff className="h-12 w-12" />
        </div>
        <h1 className="text-6xl font-extrabold text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link
          to="/"
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition duration-150 ease-in-out"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
