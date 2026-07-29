import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { Calendar, MapPin, Building, Eye, XCircle, Clock } from 'lucide-react';

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [cancelId, setCancelId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchRegistrations = async () => {
    try {
      const { data } = await api.get('/registrations/my-events');
      // Filter only active 'Registered' signups for MyRegistrations page
      setRegistrations(data.filter((r) => r.status === 'Registered'));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load your event registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancelClick = (id) => {
    setCancelId(id);
    setIsConfirmOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelId) return;
    try {
      await api.delete(`/registrations/${cancelId}`);
      setRegistrations(registrations.filter((r) => r.id !== cancelId));
      setIsConfirmOpen(false);
      setCancelId(null);
      alert('Registration cancelled successfully.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Event Registrations</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage your active college event entries.</p>
          </div>
          <Link
            to="/registration-history"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-2 rounded-lg border border-primary-200"
          >
            View Signup History
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {registrations.length === 0 ? (
          <EmptyState
            title="No Active Registrations"
            message="You haven't signed up for any upcoming events yet. Go to your dashboard to discover and register for events."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {registrations.map((reg) => {
              const event = reg.Event;
              if (!event) return null;

              return (
                <div
                  key={reg.id}
                  className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="bg-primary-50 text-primary-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          {event.category}
                        </span>
                        <h3 className="text-lg font-bold text-gray-950 mt-1.5 line-clamp-1">{event.title}</h3>
                      </div>
                      <span className="bg-green-50 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-200">
                        Active
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4.5 w-4.5 text-gray-400 shrink-0" />
                        <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4.5 w-4.5 text-gray-400 shrink-0" />
                        <span>
                          {event.startTime} - {event.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4.5 w-4.5 text-gray-400 shrink-0" />
                        <span className="line-clamp-1">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Building className="h-4 w-4 shrink-0" />
                        <span>Organized by {event.organizer}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex gap-2 justify-end">
                    <Link
                      to={`/events/${event.id}`}
                      className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold px-3.5 py-1.5 rounded-lg text-xs transition duration-150 flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Details</span>
                    </Link>
                    <button
                      onClick={() => handleCancelClick(reg.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-3.5 py-1.5 rounded-lg text-xs transition duration-150 flex items-center gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Confirm Event De-Registration"
        message="Are you sure you want to cancel your registration? This slot will be made available for other students immediately."
        onConfirm={handleCancelConfirm}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="Yes, Cancel Registration"
        cancelText="Keep Registration"
      />
    </div>
  );
};

export default MyRegistrations;
