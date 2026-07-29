import React from 'react';

const RegistrationBadge = ({ status }) => {
  const badgeClasses = {
    Registered: 'bg-green-50 text-green-800 border-green-200',
    Cancelled: 'bg-red-50 text-red-800 border-red-200',
    Completed: 'bg-gray-100 text-gray-800 border-gray-250',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        badgeClasses[status] || 'bg-gray-50 text-gray-600 border-gray-200'
      }`}
    >
      {status}
    </span>
  );
};

export default RegistrationBadge;
