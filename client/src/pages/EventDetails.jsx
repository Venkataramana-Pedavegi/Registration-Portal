import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import { AuthContext } from '../context/AuthContext';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { ArrowLeft, Calendar, MapPin, Users, Building, AlertCircle, Clock, CheckCircle } from 'lucide-react';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useContext(AuthContext);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Registration states for students
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [loadingReg, setLoadingReg] = useState(false);

  // Cancellation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchEventDetails = async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load event details.');
    }
  };

  const fetchRegistrationStatus = async () => {
    if (role === 'Student') {
      try {
        const { data } = await api.get('/registrations/my-events');
        const activeReg = data.find((r) => r.eventId === Number(id) && r.status === 'Registered');
        if (activeReg) {
          setIsRegistered(true);
          setRegistrationId(activeReg.id);
        } else {
          setIsRegistered(false);
          setRegistrationId(null);
        }
      } catch (err) {
        console.error('Failed to resolve registration status:', err);
      }
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await Promise.all([fetchEventDetails(), fetchRegistrationStatus()]);
      setLoading(false);
    };
    bootstrap();
  }, [id, role]);

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
        return 'bg-gray-50 text-gray-855';
    }
  };

  const handleRegister = async () => {
    setLoadingReg(true);
    try {
      const { data } = await api.post('/registrations', { eventId: id });
      setIsRegistered(true);
      setRegistrationId(data.id);
      alert('You have registered successfully!');
      await fetchEventDetails(); // Reload available seats
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to register for the event.');
    } finally {
      setLoadingReg(false);
    }
  };

  const handleCancelClick = () => {
    setIsConfirmOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!registrationId) return;
    setLoadingReg(true);
    try {
      await api.delete(`/registrations/${registrationId}`);
      setIsRegistered(false);
      setRegistrationId(null);
      setIsConfirmOpen(false);
      alert('Your registration has been cancelled.');
      await fetchEventDetails(); // Reload available seats
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to cancel registration.');
    } finally {
      setLoadingReg(false);
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

  const isSoldOut = event.availableSeats <= 0;
  const isCancelled = event.status === 'Cancelled';
  const isCompleted = event.status === 'Completed';
  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);

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
                  <AlertCircle className="h-5 w-5 text-red-650 shrink-0" />
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
                    <div className="w-full bg-gray-250 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${(event.availableSeats / event.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {role === 'Student' && (
                <div className="pt-4 border-t border-gray-250">
                  {isRegistered ? (
                    <div className="space-y-3">
                      <span className="w-full justify-center inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold py-2 rounded-lg">
                        <CheckCircle className="h-4.5 w-4.5" />
                        <span>Registered Successfully</span>
                      </span>
                      <button
                        onClick={handleCancelClick}
                        disabled={loadingReg}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2.5 rounded-lg text-xs transition duration-150 text-center"
                      >
                        Cancel Registration
                      </button>
                    </div>
                  ) : isCancelled || isCompleted || isDeadlinePassed ? (
                    <button
                      disabled
                      className="w-full bg-gray-200 text-gray-400 font-bold py-2.5 rounded-lg text-xs border border-gray-250 cursor-not-allowed text-center"
                    >
                      Registration Closed
                    </button>
                  ) : isSoldOut ? (
                    <button
                      disabled
                      className="w-full bg-red-50 text-red-400 font-bold py-2.5 rounded-lg text-xs border border-red-100 cursor-not-allowed text-center"
                    >
                      Sold Out
                    </button>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={loadingReg}
                      className="w-full bg-primary-600 hover:bg-primary-750 text-white font-bold py-2.5 rounded-lg text-xs transition duration-150 text-center"
                    >
                      Register for Event
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

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

export default EventDetails;
