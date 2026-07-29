import React from 'react';

const StatisticsCard = ({ title, value, icon: Icon, color = 'blue', description }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5">
      <div className="space-y-1">
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">{title}</span>
        <div className="text-2xl font-black text-gray-950">{value}</div>
        {description && <p className="text-[11px] text-gray-400 font-medium">{description}</p>}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl border shrink-0 ${colorMap[color] || colorMap.blue}`}>
          <Icon className="h-6 w-6" />
        </div>
      )}
    </div>
  );
};

export default StatisticsCard;
