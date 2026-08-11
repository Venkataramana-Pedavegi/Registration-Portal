const { Op } = require('sequelize');
const { sequelize, Registration, Event, Student, Admin } = require('../models');
const { generateQRCode } = require('../utils/qrGenerator');

// @desc    Register a student for an event
// @route   POST /api/registrations
// @access  Private/Student
const registerForEvent = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { eventId } = req.body;
    const studentId = req.user.id;

    // Check if event exists
    const event = await Event.findByPk(eventId, { transaction });
    if (!event) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status === 'Cancelled' || event.status === 'Completed') {
      await transaction.rollback();
      return res.status(400).json({ message: `Cannot register. Event is currently ${event.status}.` });
    }

    // Check registration deadline
    const currentDate = new Date();
    if (currentDate > new Date(event.registrationDeadline)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Registration deadline has passed for this event.' });
    }

    // Check if student is already registered
    const existingReg = await Registration.findOne({
      where: { studentId, eventId, status: 'Registered' },
      transaction,
    });
    if (existingReg) {
      await transaction.rollback();
      return res.status(400).json({ message: 'You are already registered for this event.' });
    }

    // Check available seats
    if (event.availableSeats <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Event is full. No available seats remaining.' });
    }

    // Create registration record
    const registration = await Registration.create(
      {
        studentId,
        eventId,
        registrationDate: currentDate,
        status: 'Registered',
      },
      { transaction }
    );

    // Decrement available seats on event
    event.availableSeats = event.availableSeats - 1;
    await event.save({ transaction });

    await transaction.commit();

    try {
      const host = req.get('host') || 'localhost:5000';
      const frontendHost = host.includes('5000') ? host.replace('5000', '5173') : host;
      const verifyUrl = `${req.protocol}://${frontendHost}/verify-pass/${registration.id}`;
      const qrCodeUrl = await generateQRCode(verifyUrl);
      registration.qrCodeUrl = qrCodeUrl;
      await registration.save();
    } catch (qrErr) {
      console.error('Non-blocking error generating QR code on registration:', qrErr.message);
    }

    // Fetch full registration detail for response & email
    const fullRegistration = await Registration.findByPk(registration.id, {
      include: [
        { model: Event, attributes: ['title', 'venue', 'eventDate', 'startTime', 'endTime', 'organizer', 'image'] },
        { model: Student, attributes: ['fullName', 'email', 'rollNumber'] },
      ],
    });

    // Send Registration Success Email Notification
    if (fullRegistration.Student?.email) {
      const sendEmail = require('../utils/sendEmail');
      await sendEmail({
        to: fullRegistration.Student.email,
        subject: `Registration Confirmed - ${fullRegistration.Event?.title}`,
        templateTitle: 'Registration Successful',
        html: `
          <p>Dear <strong>${fullRegistration.Student.fullName}</strong>,</p>
          <p>Your registration for <strong>${fullRegistration.Event?.title}</strong> has been successfully confirmed!</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 15px 0;">
            <p style="margin: 3px 0;"><strong>Event:</strong> ${fullRegistration.Event?.title}</p>
            <p style="margin: 3px 0;"><strong>Date:</strong> ${new Date(fullRegistration.Event?.eventDate).toLocaleDateString()}</p>
            <p style="margin: 3px 0;"><strong>Time:</strong> ${fullRegistration.Event?.startTime} - ${fullRegistration.Event?.endTime}</p>
            <p style="margin: 3px 0;"><strong>Venue:</strong> ${fullRegistration.Event?.venue}</p>
            <p style="margin: 3px 0;"><strong>Registration ID:</strong> #${fullRegistration.id}</p>
          </div>
          <p>Your unique entry pass QR Code is attached to this email and is also available on your student dashboard.</p>
        `,
        attachments: [
          {
            filename: 'qrcode.png',
            content: registration.qrCodeUrl.split(';base64,').pop(),
            encoding: 'base64',
          }
        ]
      });
    }

    // Map id to _id for frontend compatibility
    const responseJson = fullRegistration.toJSON();
    responseJson._id = responseJson.id;

    // Emit live counter update to all clients
    const { broadcastRegistrationCreated } = require('../utils/socket');
    broadcastRegistrationCreated(fullRegistration);

    // Notify Admins of the new registration
    try {
      const { Notification, Admin: AdminModel } = require('../models');
      const adminsList = await AdminModel.findAll({ where: { isActive: true } });
      const studentName = fullRegistration.Student?.fullName || 'Student';
      const eventTitle = fullRegistration.Event?.title || 'Event';
      const adminPromises = adminsList.map(adm => {
        return Notification.create({
          userId: adm.id,
          userRole: 'Admin',
          title: 'New Event Registration',
          message: `${studentName} registered for ${eventTitle}.`,
          type: 'Registration',
          referenceId: eventId,
        }).catch(err => console.error('Error creating admin registration notification:', err.message));
      });
      await Promise.all(adminPromises);
    } catch (notifErr) {
      console.error('Failed to notify admins of new registration:', notifErr.message);
    }

    // Award event registration points (+10 XP)
    try {
      const { awardPoints } = require('../services/GamificationService');
      await awardPoints(
        studentId,
        10,
        'REGISTER_EVENT',
        `Registered for event: ${fullRegistration.Event?.title || 'Event'}`,
        eventId,
        req
      );
    } catch (gErr) {
      console.error('Non-blocking registration points allocation error:', gErr.message);
    }

    res.status(201).json(responseJson);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Cancel an event registration
// @route   DELETE /api/registrations/:id
// @access  Private/Student
const cancelRegistration = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    // Validate ID format
    if (isNaN(id) || !Number.isInteger(Number(id))) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Invalid registration ID format' });
    }

    const registration = await Registration.findByPk(id, { transaction });
    if (!registration) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Check ownership
    if (registration.studentId !== studentId) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Unauthorized to cancel this registration' });
    }

    // Check if already cancelled
    if (registration.status === 'Cancelled') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Registration is already cancelled' });
    }

    // Load event
    const event = await Event.findByPk(registration.eventId, { transaction });
    if (!event) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Associated event not found' });
    }

    // Cancel registration
    registration.status = 'Cancelled';
    await registration.save({ transaction });

    // Increment available seats on event (ensure it doesn't exceed total capacity)
    if (event.availableSeats < event.capacity) {
      event.availableSeats = event.availableSeats + 1;
      await event.save({ transaction });
    }

    await transaction.commit();

    // Automatically promote waitlisted student if any exist
    try {
      const { promoteNextWaitlistedStudent } = require('./waitlistController');
      await promoteNextWaitlistedStudent(event.id);
    } catch (waitlistErr) {
      console.error('Error promoting waitlist student:', waitlistErr.message);
    }

    // Send Cancellation Email Notification
    const fullReg = await Registration.findByPk(id, {
      include: [
        { model: Event, attributes: ['title'] },
        { model: Student, attributes: ['fullName', 'email'] },
      ],
    });
    if (fullReg && fullReg.Student?.email) {
      const sendEmail = require('../utils/sendEmail');
      await sendEmail({
        to: fullReg.Student.email,
        subject: `Registration Cancelled - ${fullReg.Event?.title}`,
        templateTitle: 'Registration Cancellation',
        html: `
          <p>Dear <strong>${fullReg.Student.fullName}</strong>,</p>
          <p>Your registration for <strong>${fullReg.Event?.title}</strong> (ID: #${id}) has been cancelled as requested.</p>
          <p>If this was done by mistake, you can re-register from the campus events dashboard before the deadline.</p>
        `,
      });
    }

    // Emit live counter update to all clients
    const { broadcastRegistrationCancelled } = require('../utils/socket');
    broadcastRegistrationCancelled(fullReg);

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Server error cancelling registration', error: error.message });
  }
};

// @desc    Get all registrations of the current student
// @route   GET /api/registrations/my-events
// @access  Private/Student
const getMyRegistrations = async (req, res) => {
  try {
    const studentId = req.user.id;

    const registrations = await Registration.findAll({
      where: { studentId },
      include: [
        {
          model: Event,
          attributes: ['id', 'title', 'description', 'category', 'venue', 'eventDate', 'startTime', 'endTime', 'organizer', 'capacity', 'availableSeats', 'image', 'status'],
        },
      ],
      order: [['registrationDate', 'DESC']],
    });

    // Map id -> _id for frontend compatibility
    const formatted = registrations.map((reg) => {
      const plain = reg.toJSON();
      plain._id = plain.id;
      if (plain.Event) {
        plain.Event._id = plain.Event.id;
      }
      return plain;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving registered events', error: error.message });
  }
};

// @desc    Get admin registration statistics
// @route   GET /api/registrations/admin/stats
// @access  Private/Admin
const getAdminRegistrationStats = async (req, res) => {
  try {
    // 1. Total registrations (all time active/completed)
    const totalRegistrations = await Registration.count({
      where: { status: { [Op.ne]: 'Cancelled' } },
    });

    // 2. Today's registrations
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todaysRegistrations = await Registration.count({
      where: {
        registrationDate: {
          [Op.gte]: startOfToday,
        },
        status: { [Op.ne]: 'Cancelled' },
      },
    });

    // 3. Seats Filled (Active registrations for upcoming/ongoing events)
    const activeEvents = await Event.findAll({
      where: { status: { [Op.in]: ['Upcoming', 'Ongoing'] } },
      attributes: ['id', 'capacity', 'availableSeats'],
    });

    let seatsFilled = 0;
    let totalCapacity = 0;
    let availableSeats = 0;

    activeEvents.forEach((ev) => {
      seatsFilled += (ev.capacity - ev.availableSeats);
      totalCapacity += ev.capacity;
      availableSeats += ev.availableSeats;
    });

    res.json({
      totalRegistrations,
      todaysRegistrations,
      seatsFilled,
      availableSeats,
      totalCapacity,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving registration stats', error: error.message });
  }
};

const markWinner = async (req, res) => {
  try {
    const { id } = req.params;
    const { isWinner } = req.body;

    const registration = await Registration.findByPk(id, {
      include: [
        { model: Student, attributes: ['id', 'fullName', 'email'] },
        { model: Event, attributes: ['id', 'title'] }
      ]
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration record not found' });
    }

    registration.isWinner = !!isWinner;
    await registration.save();

    if (registration.isWinner) {
      const { awardPoints } = require('../services/GamificationService');
      await awardPoints(
        registration.studentId,
        100,
        'COMPETITION_WIN',
        `Won competition for event: ${registration.Event?.title || 'Event'}`,
        registration.eventId,
        req
      );

      const Notification = require('../models/Notification');
      await Notification.create({
        userId: registration.studentId,
        userRole: 'Student',
        title: '🏆 Competition Winner!',
        message: `Congratulations! You've been declared the winner of the "${registration.Event?.title || 'Event'}" competition!`,
        type: 'Badge',
      });
    }

    res.json({ message: `Registration winner status updated to ${registration.isWinner}`, registration });
  } catch (error) {
    res.status(500).json({ message: 'Error updating winner status', error: error.message });
  }
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getAdminRegistrationStats,
  markWinner,
};
