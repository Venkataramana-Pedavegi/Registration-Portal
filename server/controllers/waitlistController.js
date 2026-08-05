const { Waitlist, Event, Student, Registration, Notification } = require('../models');
const sendEmail = require('../utils/sendEmail');
const { emitRealtimeNotification } = require('../utils/socket');

const joinWaitlist = async (req, res) => {
  try {
    const { eventId } = req.body;
    const studentId = req.user.id;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.availableSeats > 0) {
      return res.status(400).json({ message: 'Event still has available seats. Please register directly.' });
    }

    // Check existing registration
    const existingReg = await Registration.findOne({
      where: { eventId, studentId, status: 'Registered' },
    });
    if (existingReg) {
      return res.status(400).json({ message: 'You are already registered for this event.' });
    }

    // Check existing waitlist
    const existingWait = await Waitlist.findOne({
      where: { eventId, studentId, status: 'waiting' },
    });
    if (existingWait) {
      return res.status(400).json({
        message: 'You are already on the waitlist for this event.',
        position: existingWait.position,
      });
    }

    const currentCount = await Waitlist.count({
      where: { eventId, status: 'waiting' },
    });

    const position = currentCount + 1;

    const waitlistEntry = await Waitlist.create({
      eventId,
      studentId,
      position,
      status: 'waiting',
    });

    const { broadcastWaitlistUpdated } = require('../utils/socket');
    broadcastWaitlistUpdated(eventId, position);

    res.status(201).json({
      message: 'Successfully joined waitlist',
      waitlist: waitlistEntry,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWaitlistPosition = async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user.id;

    const entry = await Waitlist.findOne({
      where: { eventId, studentId, status: 'waiting' },
    });

    if (!entry) {
      return res.status(404).json({ message: 'Not found in waitlist' });
    }

    res.json({ position: entry.position, waitlist: entry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const entry = await Waitlist.findByPk(id);
    if (!entry) {
      return res.status(404).json({ message: 'Waitlist entry not found' });
    }

    if (entry.studentId !== studentId) {
      return res.status(403).json({ message: 'Unauthorized to cancel this waitlist entry' });
    }

    entry.status = 'cancelled';
    await entry.save();

    // Re-index position for remaining waiting items for event
    const remaining = await Waitlist.findAll({
      where: { eventId: entry.eventId, status: 'waiting' },
      order: [['createdAt', 'ASC']],
    });

    for (let i = 0; i < remaining.length; i++) {
      remaining[i].position = i + 1;
      await remaining[i].save();
    }

    const { broadcastWaitlistUpdated } = require('../utils/socket');
    broadcastWaitlistUpdated(entry.eventId, remaining.length);

    res.json({ message: 'Waitlist entry cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEventWaitlist = async (req, res) => {
  try {
    const { eventId } = req.params;

    const waitlist = await Waitlist.findAll({
      where: { eventId, status: 'waiting' },
      include: [{ model: Student, attributes: ['id', 'name', 'email', 'rollNumber', 'department'] }],
      order: [['position', 'ASC']],
    });

    res.json(waitlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyWaitlists = async (req, res) => {
  try {
    const studentId = req.user.id;

    const waitlists = await Waitlist.findAll({
      where: { studentId },
      include: [{ model: Event, attributes: ['id', 'title', 'eventDate', 'venue', 'availableSeats', 'capacity'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json(waitlists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const promoteNextWaitlistedStudent = async (eventId) => {
  try {
    const nextInLine = await Waitlist.findOne({
      where: { eventId, status: 'waiting' },
      order: [['position', 'ASC']],
      include: [{ model: Student }],
    });

    if (!nextInLine) return null;

    const event = await Event.findByPk(eventId);
    if (!event) return null;

    // Create Registration for promoted student
    const qrPayload = JSON.stringify({
      studentId: nextInLine.studentId,
      eventId: event.id,
      timestamp: Date.now(),
    });

    const QRCode = require('qrcode');
    const qrCodeUrl = await QRCode.toDataURL(qrPayload);

    const registration = await Registration.create({
      studentId: nextInLine.studentId,
      eventId: event.id,
      status: 'Registered',
      qrCodeUrl,
    });

    // Update waitlist entry status
    nextInLine.status = 'promoted';
    await nextInLine.save();

    // Re-index remaining waitlisted students
    const remaining = await Waitlist.findAll({
      where: { eventId, status: 'waiting' },
      order: [['createdAt', 'ASC']],
    });

    for (let i = 0; i < remaining.length; i++) {
      remaining[i].position = i + 1;
      await remaining[i].save();
    }

    // Create notification & send email
    const notification = await Notification.create({
      userId: nextInLine.studentId,
      userRole: 'Student',
      title: 'Waitlist Promoted!',
      message: `Great news! You have been promoted from the waitlist and registered for "${event.title}".`,
      type: 'Registration',
    });

    // Emit Socket.IO notification
    emitRealtimeNotification(`user_${nextInLine.studentId}`, {
      title: 'Waitlist Promoted!',
      message: `You are now registered for "${event.title}".`,
      type: 'Registration',
    });

    // Send email
    if (nextInLine.Student && nextInLine.Student.email) {
      await sendEmail({
        to: nextInLine.Student.email,
        subject: `Confirmed Registration for ${event.title}`,
        templateTitle: 'Waitlist Promotion Success',
        html: `<p>Congratulations! A seat became available and your waitlist entry for "<strong>${event.title}</strong>" has been promoted to a confirmed registration.</p>`,
      }).catch((err) => console.error('Error sending promotion email:', err.message));
    }

    // Emit registration creation event (this triggers live counter update automatically)
    const { broadcastRegistrationCreated } = require('../utils/socket');
    broadcastRegistrationCreated(registration);

    return registration;
  } catch (error) {
    console.error('Error promoting waitlisted student:', error);
    return null;
  }
};

module.exports = {
  joinWaitlist,
  getWaitlistPosition,
  cancelWaitlist,
  getEventWaitlist,
  getMyWaitlists,
  promoteNextWaitlistedStudent,
};
