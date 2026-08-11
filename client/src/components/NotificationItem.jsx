import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, CheckCircle2, Clock, Calendar, ShieldCheck, Award, MessageSquare } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const NotificationItem = ({ item, onRead, onDelete }) => {
  const isRead = item.isRead;
  const { role } = useContext(AuthContext);

  const getDestinationPath = () => {
    const isAdmin = ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator'].includes(role);
    if (isAdmin) {
      switch (item.title) {
        case 'New Event Registration':
          return item.referenceId ? `/events/${item.referenceId}/participants` : '/admin-dashboard';
        case 'New Volunteer Application':
          return '/volunteers';
        case 'New Event Feedback':
          return '/analytics-dashboard';
        case 'Event Created':
        case 'Event Updated':
          return item.referenceId ? `/events/${item.referenceId}` : '/admin-dashboard';
        case 'Event Cancelled':
          return '/admin-dashboard';
        case 'Certificates Generated':
          return '/attendance';
        case 'Event Entry Verified':
          return '/admin/entry-verification';
        default:
          return item.referenceId ? `/events/${item.referenceId}` : '/admin-dashboard';
      }
    } else {
      // Student routing
      return item.referenceId ? `/events/${item.referenceId}` : '/student-dashboard';
    }
  };

  const destination = getDestinationPath();

  const getTypeIcon = () => {
    switch (item.type) {
      case 'Registration':
        return <CheckCircle2 className="h-4.5 w-4.5 text-blue-600" />;
      case 'Certificate':
        return <Award className="h-4.5 w-4.5 text-green-600" />;
      case 'Attendance':
        return <ShieldCheck className="h-4.5 w-4.5 text-purple-600" />;
      case 'Event':
        return <Calendar className="h-4.5 w-4.5 text-amber-600" />;
      default:
        return <MessageSquare className="h-4.5 w-4.5 text-gray-500" />;
    }
  };

  const getTypeStyle = () => {
    switch (item.type) {
      case 'Registration':
        return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'Certificate':
        return 'bg-green-50 text-green-800 border-green-100';
      case 'Attendance':
        return 'bg-purple-50 text-purple-800 border-purple-100';
      case 'Event':
        return 'bg-amber-50 text-amber-800 border-amber-100';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-100';
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 flex items-start gap-3.5 relative overflow-hidden group select-none ${
        isRead ? 'bg-white border-gray-150' : 'bg-primary-50/30 border-primary-150/80 shadow-xs'
      }`}
    >
      {/* Visual Accent */}
      {!isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600" />}

      {/* Icon Area */}
      <div className={`p-2 rounded-lg border shrink-0 ${getTypeStyle()}`}>
        {getTypeIcon()}
      </div>

      {/* Main Text Content */}
      <Link
        to={destination}
        onClick={() => !isRead && onRead(item.id || item._id)}
        className="flex-grow space-y-1 block hover:opacity-80 cursor-pointer"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-gray-900 leading-snug">{item.title}</span>
          <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-[11px] text-gray-550 leading-relaxed font-medium">{item.message}</p>
      </Link>

      {/* Actions Layer */}
      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity pl-2">
        {!isRead && (
          <button
            onClick={() => onRead(item.id || item._id)}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition"
            title="Mark as Read"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(item.id || item._id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Delete Notification"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
