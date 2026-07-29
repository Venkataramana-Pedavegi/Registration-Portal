import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Calendar, MapPin, Users, Building, AlertCircle, Clock } from 'lucide-react';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useContext(AuthContext);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const { data } = await api.get(`/events/${id}`);
        setEvent(data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
  }, [id]);

  const handleBack = () => {
    if (role === 'Admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/student-dashboard');
    }
  };

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

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <Loader size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md w-full text-center">
          <p className="font-semibold mb-2">Error Loading Event</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800 focus:outline-none"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back navigation */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>Back to Dashboard</span>
        </button>

        {/* Main Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Cover image banner */}
          <div className="h-72 w-full bg-gray-100 relative">
            <img
              src={event.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800'}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wider block w-fit mb-3">
                {event.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{event.title}</h1>
            </div>
          </div>

          {/* Event Metadata Grid */}
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left side details */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Description</h2>
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">{event.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Venue</h3>
                    <p className="text-sm text-gray-900 font-semibold">{event.venue}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Building className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Organizer</h3>
                    <p className="text-sm text-gray-900 font-semibold">{event.organizer}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side constraints card */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-fit space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Event Status</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusClass(event.status)}`}>
                  {event.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-primary-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500">Date & Time</h4>
                    <p className="text-xs text-gray-900 font-bold mt-0.5">
                      {new Date(event.eventDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-650 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {event.startTime} - {event.endTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500">Reg. Deadline</h4>
                    <p className="text-xs text-red-700 font-bold mt-0.5">
                      {new Date(event.registrationDeadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-primary-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500">Available Slots</h4>
                    <p className="text-xs text-gray-900 font-bold mt-0.5">
                      {event.availableSeats} / {event.capacity} seats remaining
                    </p>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${(event.availableSeats / event.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {role === 'Student' && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    disabled
                    className="w-full bg-primary-100 text-primary-400 font-bold py-2.5 rounded-lg text-xs cursor-not-allowed text-center transition"
                  >
                    Register for Event
                  </button>
                  <p className="mt-2.5 text-[10px] text-center text-primary-600 font-bold bg-primary-50 px-2 py-1.5 rounded border border-primary-100 flex items-center gap-1 justify-center">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Registration will be available in Phase 3.</span>
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default EventDetails;
