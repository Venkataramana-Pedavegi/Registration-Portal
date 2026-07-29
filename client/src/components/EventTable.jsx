import React from 'react';
import { Eye, Edit2, Trash2, Calendar, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const EventTable = ({ events, onEdit, onDelete }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'Upcoming':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Ongoing':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'Completed':
        return 'bg-gray-100 text-gray-800 border-gray-250';
      case 'Cancelled':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-850';
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 p-8 text-gray-500">
        <p className="font-semibold text-gray-700">No events found matching filters.</p>
        <p className="text-sm mt-1">Try resetting your search query or dropdown criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm text-gray-900">
          <thead className="bg-gray-50 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Title & Organizer</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Venue & Date</th>
              <th className="px-6 py-4">Capacity</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {events.map((event) => (
              <tr key={event._id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-gray-950">{event.title}</div>
                  <div className="text-xs text-gray-500">{event.organizer}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {event.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-xs text-gray-700 gap-1 mb-0.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>
                      {new Date(event.eventDate).toLocaleDateString()} @ {event.startTime} - {event.endTime}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-750">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>
                      {event.availableSeats} / {event.capacity}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusClass(event.status)}`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center gap-2">
                    <Link
                      to={`/events/${event.id || event._id}/participants`}
                      className="text-gray-500 hover:text-green-650 p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                      title="View Participants"
                    >
                      <Users className="h-4.5 w-4.5" />
                    </Link>
                    <Link
                      to={`/events/${event.id || event._id}`}
                      className="text-gray-500 hover:text-primary-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                      title="View Details"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </Link>
                    <button
                      onClick={() => onEdit(event)}
                      className="text-gray-500 hover:text-yellow-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                      title="Edit Event"
                    >
                      <Edit2 className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => onDelete(event.id || event._id)}
                      className="text-gray-500 hover:text-red-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                      title="Delete Event"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventTable;
