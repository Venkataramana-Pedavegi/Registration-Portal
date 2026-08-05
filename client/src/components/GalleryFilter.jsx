import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';

const GalleryFilter = ({
  search,
  setSearch,
  category,
  setCategory,
  year,
  setYear,
  mediaType,
  setMediaType,
  onClear,
}) => {
  const categories = ['Technical', 'Cultural', 'Sports', 'Symposium', 'Workshop', 'Seminar'];
  
  // Dynamically range years from 2024 to current year + 1
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2024 + 2 }, (_, i) => 2024 + i).reverse();

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-grow relative">
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by event title, category, or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-250 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
          />
        </div>

        {/* Media Type Filter */}
        <div className="w-full md:w-48 shrink-0">
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
            className="w-full bg-gray-50 border border-gray-250 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
          >
            <option value="">All Media Types</option>
            <option value="IMAGE">Photos Only</option>
            <option value="VIDEO">Videos Only</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter by
          </span>

          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-gray-100 hover:bg-gray-150 border border-transparent rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:border-gray-300 transition"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="bg-gray-100 hover:bg-gray-150 border border-transparent rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:border-gray-300 transition"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {(search || category || year || mediaType) && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition"
          >
            <RefreshCw className="w-3 h-3" /> Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default GalleryFilter;
