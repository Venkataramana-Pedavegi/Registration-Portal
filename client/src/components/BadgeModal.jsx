import React from 'react';
import { Award, X } from 'lucide-react';

const BadgeModal = ({ badge, onClose }) => {
  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-gray-250 shadow-2xl text-center space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Decorative rays background */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-tr from-amber-300/10 to-amber-500/20 rounded-full blur-xl -z-10" />

        {/* Badge Icon circle */}
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-white p-5 rounded-full w-fit mx-auto border-4 border-amber-100 shadow-lg animate-bounce">
          <Award className="h-12 w-12" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">New Badge Unlocked</span>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{badge.name}</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">{badge.description}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 rounded-xl text-xs transition duration-150 shadow-md uppercase tracking-wider"
        >
          Awesome, Thanks!
        </button>

      </div>
    </div>
  );
};

export default BadgeModal;
