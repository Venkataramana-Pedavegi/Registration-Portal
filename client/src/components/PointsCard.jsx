import React from 'react';
import { Award, Star, Trophy, Clock } from 'lucide-react';

const PointsCard = ({ points, rank, volunteerHours, badgesCount, certsCount }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-250 p-6 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      
      {/* Points */}
      <div className="space-y-1">
        <div className="bg-amber-50 text-amber-600 p-2.5 rounded-full w-fit mx-auto border border-amber-100 mb-1">
          <Star className="h-5 w-5 fill-amber-500" />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Points</span>
        <span className="text-2xl font-black text-gray-900">{points} <span className="text-xs text-amber-500 font-bold">XP</span></span>
      </div>

      {/* Rank */}
      <div className="space-y-1">
        <div className="bg-primary-50 text-primary-600 p-2.5 rounded-full w-fit mx-auto border border-primary-100 mb-1">
          <Trophy className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Current Rank</span>
        <span className="text-2xl font-black text-gray-900">#{rank}</span>
      </div>

      {/* Volunteer Hours */}
      <div className="space-y-1">
        <div className="bg-purple-50 text-purple-600 p-2.5 rounded-full w-fit mx-auto border border-purple-100 mb-1">
          <Clock className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Volunteer Hours</span>
        <span className="text-2xl font-black text-gray-900">{volunteerHours} <span className="text-xs font-bold text-purple-500">Hrs</span></span>
      </div>

      {/* Badges/Certs */}
      <div className="space-y-1">
        <div className="bg-green-50 text-green-600 p-2.5 rounded-full w-fit mx-auto border border-green-100 mb-1">
          <Award className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Awards Earned</span>
        <span className="text-2xl font-black text-gray-900">{badgesCount} <span className="text-xs font-bold text-gray-450">🏅</span> / {certsCount} <span className="text-xs font-bold text-gray-450">📜</span></span>
      </div>

    </div>
  );
};

export default PointsCard;
