import React from 'react';

const SeatProgressBar = ({ availableSeats, capacity }) => {
  const percent = Math.min(100, Math.max(0, (availableSeats / capacity) * 100));
  const isLow = availableSeats <= 5 && availableSeats > 0;
  const isFull = availableSeats <= 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1">
        <span>Seats Remaining</span>
        <span className={isFull ? 'text-red-650' : isLow ? 'text-yellow-650' : 'text-primary-650'}>
          {isFull ? 'Sold Out' : `${availableSeats} / ${capacity} seats`}
        </span>
      </div>
      <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden border border-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFull ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-primary-500'
          }`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default SeatProgressBar;
