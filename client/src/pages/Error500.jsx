import React from 'react';
import { ServerCrash, RefreshCw } from 'lucide-react';

const Error500 = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex-grow bg-gray-50 flex items-center justify-center py-16 px-4">
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-250 shadow-xl max-w-md w-full text-center space-y-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-full w-fit mx-auto border border-red-100">
          <ServerCrash className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-950">500</h1>
          <h2 className="text-lg font-bold text-gray-800">Internal Server Error</h2>
          <p className="text-xs text-gray-500">The server encountered an unexpected error while processing your request.</p>
        </div>
        <button
          onClick={handleReload}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 shadow-xs"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Reloading</span>
        </button>
      </div>
    </div>
  );
};

export default Error500;
