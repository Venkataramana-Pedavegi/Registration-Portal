import React from 'react';
import { Award, Compass, Star } from 'lucide-react';

const StudentRankCard = ({ student, points, level, rank }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-250 p-6 shadow-xs flex flex-col sm:flex-row items-center gap-6">
      
      {/* Avatar Container */}
      <div className="relative shrink-0">
        <div className="w-[84px] h-[84px] rounded-full overflow-hidden border-2 border-primary-100 shadow-xs bg-gray-50">
          <img
            src={student?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
            alt={student?.fullName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-400 to-amber-500 text-white font-black text-xs px-2 py-0.5 rounded-full border border-white shadow-xs">
          #{rank}
        </div>
      </div>

      {/* Info details */}
      <div className="text-center sm:text-left flex-grow space-y-1">
        <h3 className="text-xl font-black text-gray-900 tracking-tight">{student?.fullName}</h3>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{student?.department} • {student?.year}</p>
        
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1.5">
          <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-primary-100">
            <Compass className="h-3.5 w-3.5" />
            <span>{level} Class</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-amber-100">
            <Star className="h-3.5 w-3.5 fill-amber-500" />
            <span>{points} XP Total</span>
          </span>
        </div>
      </div>

    </div>
  );
};

export default StudentRankCard;
