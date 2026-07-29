import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Building, CheckCircle, XCircle } from 'lucide-react';

const EventCard = ({ event, isRegistered, registrationId, onRegister, onCancel, userRole }) => {
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
  
  // Registration deadline check
  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);

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
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-950 line-clamp-1">{event.title}</h3>
            {isRegistered && (
              <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                <CheckCircle className="h-3 w-3" />
                <span>Registered</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-550 mb-4 flex items-center gap-1 font-medium">
            <Building className="h-3.5 w-3.5 text-gray-400" />
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
              <span className={isSoldOut ? 'text-red-650' : 'text-gray-800'}>
                {isSoldOut ? 'Sold Out' : `${event.availableSeats} / ${event.capacity}`}
              </span>
            </div>
            <div className="w-full bg-gray-250 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isSoldOut ? 'bg-red-500' : 'bg-primary-500'}`}
                style={{ width: `${Math.max(0, (event.availableSeats / event.capacity) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/events/${event.id}`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-center font-bold py-2 rounded-lg text-xs transition duration-150 ease-in-out flex items-center justify-center border border-gray-250"
            >
              View Details
            </Link>

            {userRole === 'Admin' ? (
              <Link
                to={`/events/${event.id}/participants`}
                className="bg-primary-50 hover:bg-primary-100 text-primary-700 text-center font-bold py-2 rounded-lg text-xs transition duration-150 ease-in-out flex items-center justify-center border border-primary-200"
              >
                Participants
              </Link>
            ) : isRegistered ? (
              <button
                onClick={() => onCancel(registrationId)}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 rounded-lg text-xs transition duration-155 flex items-center justify-center gap-1"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
            ) : isCancelled || isCompleted || isDeadlinePassed ? (
              <button
                disabled
                className="bg-gray-100 text-gray-400 font-bold py-2 rounded-lg text-xs border border-gray-200 cursor-not-allowed flex items-center justify-center"
              >
                Locked
              </button>
            ) : isSoldOut ? (
              <button
                disabled
                className="bg-red-50 text-red-400 font-bold py-2 rounded-lg text-xs border border-red-100 cursor-not-allowed flex items-center justify-center"
              >
                Sold Out
              </button>
            ) : (
              <button
                onClick={() => onRegister(event.id)}
                className="bg-primary-600 hover:bg-primary-750 text-white font-bold py-2 rounded-lg text-xs transition duration-150 flex items-center justify-center"
              >
                Register
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
