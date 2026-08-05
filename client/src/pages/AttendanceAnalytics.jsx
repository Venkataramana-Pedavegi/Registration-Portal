import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle2, AlertTriangle, TrendingDown } from 'lucide-react';

const AttendanceAnalytics = ({ data, eventPerformance }) => {
  if (!data) return null;

  const deptAttendance = data.departmentAttendance || [];
  const yearAttendance = data.yearAttendance || [];

  // Derive top & lowest attended events from eventPerformance
  const sortedByAttendance = [...(eventPerformance || [])]
    .filter((e) => e.status === 'Completed' || e.registrations > 0)
    .sort((a, b) => b.attendancePct - a.attendancePct);

  const topEvents = sortedByAttendance.slice(0, 3);
  const lowestEvents = sortedByAttendance.slice(-3).reverse();

  const COLORS = ['#10b981', '#2563eb', '#8b5cf6', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Attendance specific KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Present Count</div>
            <div className="text-xl font-black text-gray-900">{data.registrationsToday * 0 + (data.attendancePercentage ? Math.round((data.totalStudents * data.attendancePercentage) / 100) : 0)} students</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">No-Show Rate</div>
            <div className="text-xl font-black text-gray-900 text-red-650">{data.noShowRate || 0}%</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-450 uppercase tracking-wider">Overall Attendance %</div>
            <div className="text-xl font-black text-gray-900">{data.attendancePercentage || 0}%</div>
          </div>
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Department-Wise Attendance Rate (%)</h3>
          <div className="h-72">
            {deptAttendance.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-gray-450">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptAttendance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="department" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="attendanceRate" name="Attendance Rate %" fill="#2563eb" radius={[4, 4, 0, 0]}>
                    {deptAttendance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Year-wise Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Year-Wise Attendance Rate (%)</h3>
          <div className="h-72">
            {yearAttendance.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-gray-450">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearAttendance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="attendanceRate" name="Attendance Rate %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Top/Lowest Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top events list */}
        <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs">
          <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-3">Top Attended Events</h3>
          <div className="divide-y text-xs">
            {topEvents.length === 0 ? (
              <p className="p-3 text-center text-gray-400 font-semibold">No data available</p>
            ) : (
              topEvents.map((ev, i) => (
                <div key={ev.id} className="py-3 flex justify-between items-center">
                  <div className="font-semibold text-gray-900">#{i + 1} {ev.title}</div>
                  <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">{ev.attendancePct}% Present</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lowest events list */}
        <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs">
          <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-3">Lowest Attendance Events</h3>
          <div className="divide-y text-xs">
            {lowestEvents.length === 0 ? (
              <p className="p-3 text-center text-gray-400 font-semibold">No data available</p>
            ) : (
              lowestEvents.map((ev, i) => (
                <div key={ev.id} className="py-3 flex justify-between items-center">
                  <div className="font-semibold text-gray-900">#{i + 1} {ev.title}</div>
                  <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">{ev.attendancePct}% Present</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AttendanceAnalytics;
