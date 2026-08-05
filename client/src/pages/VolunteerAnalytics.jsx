import React from 'react';
import { Award, ShieldAlert, Clock, CheckCircle } from 'lucide-react';

const VolunteerAnalytics = ({ data }) => {
  if (!data) return null;

  const vols = data.volunteers || {};
  const topList = vols.topVolunteers || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Visual statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-purple-50 text-purple-650 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Active Volunteers</div>
            <div className="text-xl font-black text-gray-900">{vols.volunteerCount || 0} students</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Service Hours Logged</div>
            <div className="text-xl font-black text-gray-900">{data.volunteerCount * 12} hours</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Task Allocations Completed</div>
            <div className="text-xl font-black text-gray-900">{vols.totalTasksCompleted || 0} tasks</div>
          </div>
        </div>
      </div>

      {/* Top Volunteers Leaderboard */}
      <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider">Top Volunteer Service Leaders</h3>
        
        {topList.length === 0 ? (
          <p className="text-xs text-gray-450 font-bold text-center py-4 bg-gray-50 rounded-xl border border-dashed">No volunteer records available.</p>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-250 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Volunteer Name</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Roll Number</th>
                  <th className="px-6 py-3 text-right font-bold text-gray-500 uppercase tracking-wider">Verified Hours</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 font-semibold text-gray-700">
                {topList.map((vol) => (
                  <tr key={vol.id} className="hover:bg-gray-55">
                    <td className="px-6 py-3.5 text-gray-900 font-bold">{vol.name}</td>
                    <td className="px-6 py-3.5 font-mono text-gray-500 uppercase">{vol.rollNumber}</td>
                    <td className="px-6 py-3.5 text-right text-primary-650 font-black">{vol.hours} hrs</td>
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

export default VolunteerAnalytics;
