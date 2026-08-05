import React from 'react';
import { Trophy, Star, Award, Clock } from 'lucide-react';

const StudentAnalytics = ({ data }) => {
  if (!data) return null;

  const topStudents = data.topStudents || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Student leaderboard list */}
      <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-150">
          <Trophy className="h-5 w-5 text-yellow-500 animate-pulse" />
          <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider">Top Achievers & Gamification Leaderboard</h3>
        </div>

        {topStudents.length === 0 ? (
          <p className="text-xs text-gray-450 font-bold text-center py-4 bg-gray-50 rounded-xl border border-dashed">No student leaderboard records available.</p>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-250 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left font-bold text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3.5 text-left font-bold text-gray-500 uppercase tracking-wider">Student Profile</th>
                  <th className="px-6 py-3.5 text-center font-bold text-gray-500 uppercase tracking-wider">Events Attended</th>
                  <th className="px-6 py-3.5 text-center font-bold text-gray-500 uppercase tracking-wider">Volunteer Hours</th>
                  <th className="px-6 py-3.5 text-right font-bold text-gray-500 uppercase tracking-wider">Total Score Points</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 font-semibold text-gray-700">
                {topStudents.map((ts, index) => (
                  <tr key={ts.rollNumber} className="hover:bg-gray-55">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-black">
                      <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-black ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-200 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-850' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-bold text-gray-900">{ts.name}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">{ts.rollNumber} • {ts.department}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600 font-bold">
                      {ts.eventsAttended} events
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600 font-bold">
                      {ts.volunteerHours} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-primary-650 font-black text-sm">
                      {ts.points} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentAnalytics;
