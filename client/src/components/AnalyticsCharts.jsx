import React from 'react';
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart as ReLineChart,
  Line,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export const RegistrationsPerEventChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4">
      <h3 className="text-base font-extrabold text-gray-900">Registrations Per Event</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="eventTitle" tick={{ fontSize: 11, fill: '#6B7280' }} interval={0} angle={-15} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="registrationsCount" name="Signups" fill="#3B82F6" radius={[6, 6, 0, 0]} />
          </ReBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CategoryDistributionChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4">
      <h3 className="text-base font-extrabold text-gray-900">Category Distribution</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={90}
              paddingAngle={2}
              dataKey="count"
              nameKey="category"
              label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
          </RePieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const MonthlyRegistrationsChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4">
      <h3 className="text-base font-extrabold text-gray-900">Monthly Registration Trend</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
            <Line type="monotone" dataKey="count" name="Signups" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
          </ReLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const DepartmentDistributionChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4">
      <h3 className="text-base font-extrabold text-gray-900">Department-wise Registrations</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#6B7280' }} interval={0} angle={-15} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
            <Bar dataKey="count" name="Students" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
          </ReBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const StatusDistributionChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4">
      <h3 className="text-base font-extrabold text-gray-900">Event Status Breakdown</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={4}
              dataKey="count"
              nameKey="status"
              label={({ status, count }) => `${status} (${count})`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
          </RePieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
