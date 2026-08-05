import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const TrendAnalysis = ({ data }) => {
  if (!data) return null;

  const monthlyData = data.charts?.monthlyRegistrations || [];

  // Derive simple cumulative growth for registrations
  let runningSum = 0;
  const growthData = monthlyData.map((m) => {
    runningSum += m.count;
    return {
      month: m.month,
      Signups: m.count,
      CumulativeGrowth: runningSum,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Growth Line chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs">
        <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider mb-4">Registration Cumulative Growth Profile</h3>
        
        <div className="h-80">
          {growthData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-semibold text-gray-450">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="CumulativeGrowth" name="Total Audience" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Seasonality Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs">
        <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider mb-4">Month-Over-Month Signups Speed Chart</h3>
        
        <div className="h-72">
          {growthData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-semibold text-gray-455">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Line type="monotone" dataKey="Signups" name="New registrations" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
};

export default TrendAnalysis;
