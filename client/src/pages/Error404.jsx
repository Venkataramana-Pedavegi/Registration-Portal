import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';

const Error404 = () => {
  return (
    <div className="flex-grow bg-gray-50 flex items-center justify-center py-16 px-4">
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-250 shadow-xl max-w-md w-full text-center space-y-6">
        <div className="bg-blue-50 text-primary-600 p-4 rounded-full w-fit mx-auto border border-blue-100">
          <HelpCircle className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-950">404</h1>
          <h2 className="text-lg font-bold text-gray-800">Page Not Found</h2>
          <p className="text-xs text-gray-500">The requested resource or page URL could not be located on the server.</p>
        </div>
        <Link
          to="/"
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 inline-flex items-center justify-center gap-2 shadow-xs"
        >
          <Home className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};

export default Error404;
