import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const DepartmentAnalytics = ({ data }) => {
  if (!data) return null;

  // We can construct a radar dataset combining registration ratios and attendance ratios
  const deptData = data.charts?.departmentDistribution || [];
  const deptAttend = data.charts?.departmentAttendance || [];

  const combinedRadar = deptData.map((d) => {
    const attObj = deptAttend.find((a) => a.department === d.department) || {};
    return {
      department: d.department,
      Registrations: d.count || 0,
      AttendanceRate: attObj.attendanceRate || 75,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Comparative chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs flex flex-col items-center">
        <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider mb-4 w-full text-left">Academic Department Clearance Radar</h3>
        
        <div className="h-80 w-full max-w-lg">
          {combinedRadar.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-semibold text-gray-450">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={combinedRadar}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="department" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#64748b" />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 9 }} />
                <Radar name="Signups Count" dataKey="Registrations" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} />
                <Radar name="Attendance %" dataKey="AttendanceRate" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Comparative table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider">Departmental Comparison Metrics</h3>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-250 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left font-bold text-gray-500 uppercase tracking-wider">Department Name</th>
                <th className="px-6 py-3.5 text-left font-bold text-gray-500 uppercase tracking-wider">Total Registrations</th>
                <th className="px-6 py-3.5 text-right font-bold text-gray-500 uppercase tracking-wider">Attendance Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 font-semibold text-gray-700">
              {combinedRadar.map((row) => (
                <tr key={row.department} className="hover:bg-gray-55">
                  <td className="px-6 py-4 text-gray-900 font-black">{row.department}</td>
                  <td className="px-6 py-4 text-gray-600 font-bold">{row.Registrations} registrants</td>
                  <td className="px-6 py-4 text-right text-green-600 font-black">{row.AttendanceRate}% Present</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default DepartmentAnalytics;
