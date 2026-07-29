import React from 'react';
import { ArchiveX } from 'lucide-react';

const EmptyState = ({ title = 'No results found', message = 'Try modifying your search query or filters to find what you are looking for.' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-dashed border-gray-250 text-center">
      <div className="bg-gray-50 p-4 rounded-full text-gray-400 mb-4 border border-gray-100">
        <ArchiveX className="h-10 w-10" />
      </div>
      <h3 className="text-lg font-bold text-gray-950 mb-1">{title}</h3>
      <p className="text-sm text-gray-650 max-w-sm">{message}</p>
    </div>
  );
};

export default EmptyState;
