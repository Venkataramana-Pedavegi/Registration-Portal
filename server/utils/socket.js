let io = null;

const initSocket = (serverInstance) => {
  const { Server } = require('socket.io');
  const allowedSocketOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000']
    : '*';

  io = new Server(serverInstance, {
    cors: {
      origin: allowedSocketOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('⚡ Socket client connected:', socket.id);

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log('⚡ Socket client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

const emitRealtimeNotification = (room, data) => {
  if (io) {
    if (room) {
      io.to(room).emit('notification', data);
    } else {
      io.emit('notification', data);
    }
  }
};

const emitLiveCounterForEvent = async (eventId) => {
  if (!io) return;
  try {
    const { Event, Registration, Waitlist } = require('../models');
    const eventObj = await Event.findByPk(eventId);
    if (!eventObj) return;

    const totalRegistrations = await Registration.count({
      where: { eventId, status: 'Registered' },
    });

    const waitlistCount = await Waitlist.count({
      where: { eventId, status: 'waiting' },
    });

    const payload = {
      eventId: Number(eventId),
      totalRegistrations,
      remainingSeats: eventObj.availableSeats,
      capacity: eventObj.capacity,
      waitlistCount,
    };

    // Emit both styles of counters for backward and frontend compatibility
    io.emit('live_counter_update', payload);
    io.emit('seatCountUpdated', payload);
    io.emit('seat:updated', payload);
    io.emit('waitlistUpdated', payload);
    io.emit('waitlist:updated', payload);
  } catch (err) {
    console.error('Error emitting live counter:', err.message);
  }
};

const broadcastEventCreated = (event) => {
  if (!io) return;
  const payload = typeof event.toJSON === 'function' ? event.toJSON() : event;
  payload._id = payload.id;
  io.to('admin-dashboard').emit('eventCreated', payload);
  io.to('admin-dashboard').emit('event:created', payload);
  io.to('students').emit('eventCreated', payload);
  io.to('students').emit('event:created', payload);
};

const broadcastEventUpdated = (event) => {
  if (!io) return;
  const payload = typeof event.toJSON === 'function' ? event.toJSON() : event;
  payload._id = payload.id;
  io.to('admin-dashboard').emit('eventUpdated', payload);
  io.to('admin-dashboard').emit('event:updated', payload);
  io.to('students').emit('eventUpdated', payload);
  io.to('students').emit('event:updated', payload);
  io.to(`event-${payload.id}`).emit('eventUpdated', payload);
  io.to(`event-${payload.id}`).emit('event:updated', payload);
};

const broadcastEventDeleted = (eventId) => {
  if (!io) return;
  const payload = { eventId: Number(eventId) };
  io.to('admin-dashboard').emit('eventDeleted', payload);
  io.to('admin-dashboard').emit('event:deleted', payload);
  io.to('students').emit('eventDeleted', payload);
  io.to('students').emit('event:deleted', payload);
  io.to(`event-${eventId}`).emit('eventDeleted', payload);
  io.to(`event-${eventId}`).emit('event:deleted', payload);
};

const broadcastRegistrationCreated = (registration) => {
  if (!io) return;
  const payload = typeof registration.toJSON === 'function' ? registration.toJSON() : registration;
  payload._id = payload.id;
  io.to('admin-dashboard').emit('registrationCreated', payload);
  io.to('admin-dashboard').emit('registration:created', payload);
  io.to(`event-${payload.eventId}`).emit('registrationCreated', payload);
  io.to(`event-${payload.eventId}`).emit('registration:created', payload);
  emitLiveCounterForEvent(payload.eventId);
};

const broadcastRegistrationCancelled = (registration) => {
  if (!io) return;
  const payload = typeof registration.toJSON === 'function' ? registration.toJSON() : registration;
  payload._id = payload.id;
  io.to('admin-dashboard').emit('registrationCancelled', payload);
  io.to('admin-dashboard').emit('registration:cancelled', payload);
  io.to(`event-${payload.eventId}`).emit('registrationCancelled', payload);
  io.to(`event-${payload.eventId}`).emit('registration:cancelled', payload);
  emitLiveCounterForEvent(payload.eventId);
};

const broadcastWaitlistUpdated = (eventId, waitlistCount) => {
  if (!io) return;
  const payload = { eventId: Number(eventId), waitlistCount };
  io.to('admin-dashboard').emit('waitlistUpdated', payload);
  io.to('admin-dashboard').emit('waitlist:updated', payload);
  io.to(`event-${eventId}`).emit('waitlistUpdated', payload);
  io.to(`event-${eventId}`).emit('waitlist:updated', payload);
  emitLiveCounterForEvent(eventId);
};

const broadcastAttendanceUpdated = (eventId, attendance) => {
  if (!io) return;
  const payload = typeof attendance.toJSON === 'function' ? attendance.toJSON() : attendance;
  payload._id = payload.id;
  io.to('admin-dashboard').emit('attendanceUpdated', payload);
  io.to('admin-dashboard').emit('attendance:updated', payload);
  io.to(`user_${payload.studentId}`).emit('attendanceUpdated', payload);
  io.to(`user_${payload.studentId}`).emit('attendance:updated', payload);
  io.to(`event-${eventId}`).emit('attendanceUpdated', payload);
  io.to(`event-${eventId}`).emit('attendance:updated', payload);
};

const broadcastCertificateGenerated = (userId, certificate) => {
  if (!io) return;
  const payload = typeof certificate.toJSON === 'function' ? certificate.toJSON() : certificate;
  payload._id = payload.id;
  io.to('admin-dashboard').emit('certificateGenerated', payload);
  io.to('admin-dashboard').emit('certificate:generated', payload);
  io.to(`user_${userId}`).emit('certificateGenerated', payload);
  io.to(`user_${userId}`).emit('certificate:generated', payload);
};

module.exports = {
  initSocket,
  getIO,
  emitRealtimeNotification,
  emitLiveCounterForEvent,
  broadcastEventCreated,
  broadcastEventUpdated,
  broadcastEventDeleted,
  broadcastRegistrationCreated,
  broadcastRegistrationCancelled,
  broadcastWaitlistUpdated,
  broadcastAttendanceUpdated,
  broadcastCertificateGenerated,
};
