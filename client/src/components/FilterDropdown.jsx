import React from 'react';

const FilterDropdown = ({ value, setValue, options, label, allLabel = 'All' }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-2">
      {label && <span className="text-sm font-semibold text-gray-700">{label}:</span>}
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="block w-full sm:w-auto py-2 pl-3 pr-8 border border-gray-300 rounded-lg text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterDropdown;
