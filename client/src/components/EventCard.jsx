import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Building } from 'lucide-react';

const EventCard = ({ event }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'Upcoming':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Ongoing':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'Completed':
        return 'bg-gray-150 text-gray-800 border-gray-250';
      case 'Cancelled':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800';
    }
  };

  const isSoldOut = event.availableSeats <= 0;
  const isCancelled = event.status === 'Cancelled';
  const isCompleted = event.status === 'Completed';

  return (
    <div className="bg-white rounded-xl shadow-xs hover:shadow-md border border-gray-250 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1">
      {/* Event Image */}
      <div className="h-48 w-full bg-gray-100 relative overflow-hidden shrink-0">
        <img
          src={event.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800'}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-xs text-gray-850 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wider">
            {event.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border bg-white/95 backdrop-blur-xs ${getStatusClass(event.status)}`}>
            {event.status}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-950 line-clamp-1 mb-1">{event.title}</h3>
          <p className="text-xs text-gray-500 mb-4 flex items-center gap-1 font-medium">
            <Building className="h-3.5 w-3.5" />
            <span>Organized by {event.organizer}</span>
          </p>

          <div className="space-y-2 text-sm text-gray-700 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-primary-500 shrink-0" />
              <span>{new Date(event.eventDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-primary-500 shrink-0" />
              <span className="line-clamp-1">{event.venue}</span>
            </div>
          </div>
        </div>

        <div>
          {/* Seat details bar */}
          <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-800 mb-1.5">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4 text-gray-400" />
                <span>Available Seats</span>
              </span>
              <span>
                {event.availableSeats} / {event.capacity}
              </span>
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isSoldOut ? 'bg-red-500' : 'bg-primary-500'}`}
                style={{ width: `${Math.max(0, (event.availableSeats / event.capacity) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/events/${event._id}`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-center font-bold py-2 rounded-lg text-xs transition duration-150 ease-in-out flex items-center justify-center"
            >
              View Details
            </Link>
            <button
              disabled
              title="Registration will be available in Phase 3"
              className="bg-primary-100 text-primary-400 font-bold py-2 rounded-lg text-xs transition duration-150 cursor-not-allowed flex flex-col justify-center items-center relative group"
            >
              <span>Register</span>
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover:block bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                Phase 3 feature
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
