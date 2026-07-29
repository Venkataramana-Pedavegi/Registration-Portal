import React, { useEffect } from 'react';
const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const titleText = {
    success: 'Success',
    error: 'Error',
    info: 'Info',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce max-w-sm w-full">
      <div className={`${bgClasses[type]} border rounded-lg p-4 shadow-lg flex justify-between items-start`}>
        <div>
          <p className="font-bold text-sm">{titleText[type]}</p>
          <p className="text-xs mt-1">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 font-bold text-sm focus:outline-none"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default Toast;
