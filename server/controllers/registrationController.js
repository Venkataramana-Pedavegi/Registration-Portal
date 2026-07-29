const { Op } = require('sequelize');
const { sequelize, Registration, Event, Student, Admin } = require('../models');

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

    // Check if event status is active
    if (event.status === 'Cancelled') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cannot register for a cancelled event' });
    }
    if (event.status === 'Completed') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cannot register for a completed event' });
    }

    // Check registration deadline
    const currentDate = new Date();
    if (currentDate > new Date(event.registrationDeadline)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check duplicate registration (only check active 'Registered' state)
    const duplicate = await Registration.findOne({
      where: {
        studentId,
        eventId,
        status: 'Registered',
      },
      transaction,
    });

    if (duplicate) {
      await transaction.rollback();
      return res.status(400).json({ message: 'You are already registered for this event' });
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

    // Fetch full registration detail for response
    const fullRegistration = await Registration.findByPk(registration.id, {
      include: [
        { model: Event, attributes: ['title', 'venue', 'eventDate', 'startTime', 'endTime', 'organizer', 'image'] },
      ],
    });

    // Map id to _id for frontend compatibility
    const responseJson = fullRegistration.toJSON();
    responseJson._id = responseJson.id;

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

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getAdminRegistrationStats,
};
