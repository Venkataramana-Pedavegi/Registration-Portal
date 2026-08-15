import React from 'react';
import { Filter, Calendar, RefreshCw } from 'lucide-react';

const AnalyticsFilters = ({ filters, setFilters, onApply, onReset }) => {
  const departments = [
    'Computer Science and Artificial Intelligence (CAI)',
    'Artificial Intelligence and Machine Learning (AIML)',
    'Information Technology (IT)',
    'Computer Science and Technology (CST)'
  ];
  const years = ['1', '2', '3', '4'];
  const categories = ['Technical', 'Cultural', 'Sports', 'Seminar', 'Workshop', 'Other'];
  const statuses = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

  const handleChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
      <div className="flex justify-between items-center pb-2.5 border-b border-gray-150">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-950 uppercase tracking-wider">
          <Filter className="h-4.5 w-4.5 text-primary-600" />
          <span>Interactive BI Filters</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-655 font-bold transition focus:outline-none"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Start Date</label>
          <div className="relative">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">End Date</label>
          <div className="relative">
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Department</label>
          <select
            value={filters.department}
            onChange={(e) => handleChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 focus:ring-primary-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Study Year</label>
          <select
            value={filters.year}
            onChange={(e) => handleChange('year', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 focus:ring-primary-500"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y} Year</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Event Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Event Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={onApply}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-6 rounded-xl text-xs shadow-xs transition"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default AnalyticsFilters;
