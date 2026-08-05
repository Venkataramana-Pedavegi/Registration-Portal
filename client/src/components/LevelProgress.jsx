import React from 'react';
import { ArrowUpCircle } from 'lucide-react';

const LevelProgress = ({ level, nextLevel, progressPercentage, remainingPoints }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-250 p-6 shadow-xs space-y-4">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Engagement Standing</span>
          <h4 className="text-lg font-black text-gray-900 flex items-center gap-1.5">
            <span className="text-primary-600 font-extrabold">{level}</span>
            <span className="text-xs text-gray-450 font-normal">Level</span>
          </h4>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-gray-450 block uppercase tracking-wider">Next Level</span>
          <span className="text-xs font-bold text-gray-800">{nextLevel}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-3.5 bg-gray-150 rounded-full overflow-hidden p-0.5 border border-gray-200">
          <div
            style={{ width: `${progressPercentage}%` }}
            className="h-full bg-gradient-to-r from-primary-500 to-primary-650 rounded-full transition-all duration-500 ease-out shadow-inner"
          />
        </div>
        
        <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
          <span>{progressPercentage}% Completed</span>
          {remainingPoints > 0 ? (
            <span className="text-red-650 flex items-center gap-1">
              <ArrowUpCircle className="h-3 w-3" />
              <span>{remainingPoints} XP to Level Up</span>
            </span>
          ) : (
            <span className="text-green-600">Master Level Reached!</span>
          )}
        </div>
      </div>

    </div>
  );
};

export default LevelProgress;
