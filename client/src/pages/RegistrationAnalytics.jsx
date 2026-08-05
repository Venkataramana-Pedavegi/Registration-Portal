import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

const RegistrationAnalytics = ({ data }) => {
  if (!data) return null;

  const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];

  const dailyData = data.dailyRegistrations || [];
  const categoryData = data.categoryDistribution || [];
  const deptData = data.departmentDistribution || [];
  const monthlyData = data.monthlyRegistrations || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Upper Grid: Daily Signups & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Registrations */}
        <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Daily Registration Volume</h3>
          <div className="h-72">
            {dailyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-gray-400">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="count" name="Registrations" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRegs)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category distribution */}
        <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Category-Wise Distribution</h3>
          <div className="h-72">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-gray-400">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="category"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Lower Grid: Department & Monthly trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Department Participation Count</h3>
          <div className="h-72">
            {deptData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-gray-400">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="department" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="count" name="Registrations" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Monthly Registration Volume</h3>
          <div className="h-72">
            {monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-gray-400">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="count" name="Registrations" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default RegistrationAnalytics;
