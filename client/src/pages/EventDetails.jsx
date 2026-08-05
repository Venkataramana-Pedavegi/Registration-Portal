import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketProvider';
import Loader from '../components/Loader';
import { AuthContext } from '../context/AuthContext';
import ConfirmationDialog from '../components/ConfirmationDialog';
import FeedbackModal from '../components/FeedbackModal';
import QRCodeModal from '../components/QRCodeModal';
import EventGallerySection from '../components/EventGallerySection';
import { ArrowLeft, Calendar, MapPin, Users, Building, AlertCircle, Clock, CheckCircle, Star, CreditCard, UserPlus, QrCode } from 'lucide-react';
import { getEventImage } from '../utils/categoryImages';

const EventDetails = () => {
  const { id } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();
  const { role, user } = useContext(AuthContext);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Registration states for students
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [loadingReg, setLoadingReg] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Waitlist state
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState(null);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);

  // Feedback Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [eventFeedback, setEventFeedback] = useState(null);

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

  const fetchWaitlistStatus = async () => {
    if (role === 'Student') {
      try {
        const res = await api.get(`/waitlist/position/${id}`);
        if (res.data) {
          setIsWaitlisted(true);
          setWaitlistPosition(res.data.position);
        }
      } catch (err) {
        setIsWaitlisted(false);
        setWaitlistPosition(null);
      }
    }
  };

  const fetchFeedbackData = async () => {
    try {
      const res = await api.get(`/feedback/event/${id}`);
      setEventFeedback(res.data);
    } catch (err) {
      console.error('Error fetching event feedback:', err);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await Promise.all([
        fetchEventDetails(),
        fetchRegistrationStatus(),
        fetchWaitlistStatus(),
        fetchFeedbackData(),
      ]);
      setLoading(false);
    };
    bootstrap();
  }, [id, role]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join_room', `event-${id}`);

    const handleLiveUpdate = (update) => {
      if (Number(update.eventId) === Number(id)) {
        setEvent((prevEvent) =>
          prevEvent
            ? {
                ...prevEvent,
                availableSeats: update.remainingSeats,
                waitlistCount: update.waitlistCount,
              }
            : null
        );
      }
    };

    const handleEventUpdate = (updatedEvent) => {
      if (Number(updatedEvent.id) === Number(id)) {
        setEvent((prevEvent) => (prevEvent ? { ...prevEvent, ...updatedEvent } : prevEvent));
      }
    };

    socket.on('live_counter_update', handleLiveUpdate);
    socket.on('seatCountUpdated', handleLiveUpdate);
    socket.on('seat:updated', handleLiveUpdate);
    socket.on('waitlistUpdated', handleLiveUpdate);
    socket.on('waitlist:updated', handleLiveUpdate);
    
    socket.on('eventUpdated', handleEventUpdate);
    socket.on('event:updated', handleEventUpdate);

    return () => {
      socket.emit('leave_room', `event-${id}`);
      socket.off('live_counter_update', handleLiveUpdate);
      socket.off('seatCountUpdated', handleLiveUpdate);
      socket.off('seat:updated', handleLiveUpdate);
      socket.off('waitlistUpdated', handleLiveUpdate);
      socket.off('waitlist:updated', handleLiveUpdate);
      
      socket.off('eventUpdated', handleEventUpdate);
      socket.off('event:updated', handleEventUpdate);
    };
  }, [socket, id]);

  const handleBack = () => {
    if (role === 'Admin' || ['Super Admin', 'Event Coordinator', 'Faculty Coordinator'].includes(role)) {
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
      await fetchEventDetails();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to register for the event.');
    } finally {
      setLoadingReg(false);
    }
  };

  const handleJoinWaitlist = async () => {
    setLoadingWaitlist(true);
    try {
      const res = await api.post('/waitlist/join', { eventId: id });
      setIsWaitlisted(true);
      setWaitlistPosition(res.data.waitlist.position);
      alert(`Joined waitlist successfully! Your position is #${res.data.waitlist.position}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join waitlist');
    } finally {
      setLoadingWaitlist(false);
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
      await fetchEventDetails();
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
              src={getEventImage(event)}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white flex items-end justify-between">
              <div>
                <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wider inline-block mb-3">
                  {event.category}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{event.title}</h1>
              </div>

              {eventFeedback && (
                <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5 text-amber-300 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>{eventFeedback.avgRating} / 5</span>
                  <span className="text-white/70 text-xs font-normal">({eventFeedback.totalRatings})</span>
                </div>
              )}
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

              {/* Feedback Section */}
              {eventFeedback && eventFeedback.feedbacks?.length > 0 && (
                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Student Reviews</h3>
                    {role === 'Student' && (
                      <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500" /> Give Feedback
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {eventFeedback.feedbacks.map((f) => (
                      <div key={f.id} className="p-3 bg-gray-50 rounded-xl border text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{f.Student?.name || 'Student'}</span>
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-500" /> {f.rating}
                          </div>
                        </div>
                        <p className="text-gray-600">{f.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right side constraints card */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-fit space-y-6">
              <div className="flex justify-between items-center gap-4 border-b border-gray-200 pb-4">
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Event Status</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusClass(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                <div className="text-right">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registration Fee</h3>
                  <span className="text-sm font-extrabold text-primary-700 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-lg">
                    {event.registrationType === 'PAID' ? `₹${Number(event.price).toLocaleString()}` : 'FREE'}
                  </span>
                </div>
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
                    <div className="w-full bg-gray-255 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${(event.availableSeats / event.capacity) * 100}%` }}
                      ></div>
                    </div>
                    {event.waitlistCount > 0 && (
                      <p className="text-[11px] text-amber-600 font-bold mt-1.5 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>Waitlist: {event.waitlistCount} waiting</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {role === 'Student' && (
                <div className="pt-4 border-t border-gray-250 space-y-3">
                  {isRegistered ? (
                    <div className="space-y-3">
                      <span className="w-full justify-center inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold py-2 rounded-lg">
                        <CheckCircle className="h-4.5 w-4.5" />
                        <span>Registered Successfully</span>
                      </span>

                      <button
                        onClick={() => setShowQRModal(true)}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <QrCode className="w-4 h-4" /> View Entry QR Code
                      </button>

                      <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" /> Give Feedback
                      </button>

                      <button
                        onClick={handleCancelClick}
                        disabled={loadingReg}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 rounded-lg text-xs transition text-center"
                      >
                        Cancel Registration
                      </button>
                    </div>
                  ) : isWaitlisted ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold text-center">
                      Waitlisted (Position #{waitlistPosition})
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
                      onClick={handleJoinWaitlist}
                      disabled={loadingWaitlist}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-1"
                    >
                      <UserPlus className="w-4 h-4" /> Join Waitlist
                    </button>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={loadingReg}
                      className="w-full bg-primary-600 hover:bg-primary-750 text-white font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-1"
                    >
                      {event.registrationType === 'PAID' ? (
                        <>
                          <CreditCard className="w-4 h-4" /> Pay ₹{event.price} & Register
                        </>
                      ) : (
                        'Register for Event'
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {(event.status === 'Completed' || role === 'Admin' || ['Super Admin', 'Event Coordinator', 'Faculty Coordinator'].includes(role)) && (
            <EventGallerySection
              eventId={id}
              isAdmin={role === 'Admin' || ['Super Admin', 'Event Coordinator', 'Faculty Coordinator'].includes(role)}
              eventStatus={event.status}
            />
          )}
        </div>
      </div>

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        registrationId={registrationId}
      />

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Confirm Event De-Registration"
        message="Are you sure you want to cancel your registration? This slot will be made available for other students immediately."
        onConfirm={handleCancelConfirm}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="Yes, Cancel Registration"
        cancelText="Keep Registration"
      />

      {showFeedbackModal && (
        <FeedbackModal
          eventId={id}
          eventTitle={event?.title}
          onClose={() => setShowFeedbackModal(false)}
          onSuccess={() => {
            fetchFeedbackData();
            alert('Feedback submitted successfully!');
          }}
        />
      )}
    </div>
  );
};

export default EventDetails;
