const { Op } = require('sequelize');
const { Event, Admin, Registration, Student } = require('../models');

// Helper to serialize event for frontend (_id and populated createdBy object)
const formatEvent = (eventInstance) => {
  if (!eventInstance) return null;
  const ev = eventInstance.get({ plain: true });
  ev._id = ev.id; // Map SQL id to Mongo _id for frontend compatibility
  
  // Format createdBy object to mirror MongoDB populate output
  if (ev.Admin) {
    ev.createdBy = {
      _id: ev.Admin.id,
      username: ev.Admin.username,
      email: ev.Admin.email,
    };
  } else {
    ev.createdBy = null;
  }
  delete ev.Admin;
  return ev;
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      venue,
      eventDate,
      startTime,
      endTime,
      registrationDeadline,
      organizer,
      capacity,
      image,
      status,
    } = req.body;

    // Check duplicate event with same title, venue, and date
    const duplicate = await Event.findOne({
      where: {
        title: title.trim(),
        venue: venue.trim(),
        eventDate: new Date(eventDate),
      },
    });

    if (duplicate) {
      return res.status(400).json({
        message: 'An event with the same title, venue, and date already exists',
      });
    }

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      venue: venue.trim(),
      eventDate: new Date(eventDate),
      startTime,
      endTime,
      registrationDeadline: new Date(registrationDeadline),
      organizer: organizer.trim(),
      capacity,
      availableSeats: capacity,
      image: image || undefined,
      status: status || 'Upcoming',
      createdBy: req.user.id,
    });

    // Fetch newly created event with relations for population matching
    const fullEvent = await Event.findByPk(event.id, {
      include: [{ model: Admin, attributes: ['id', 'username', 'email'] }],
    });

    res.status(201).json(formatEvent(fullEvent));
  } catch (error) {
    res.status(500).json({ message: 'Server error creating event', error: error.message });
  }
};

// @desc    Get all events with filters
// @route   GET /api/events
// @access  Private (Both student and admin)
const getEvents = async (req, res) => {
  try {
    const { search, category, status, sort } = req.query;
    let whereClause = {};

    // Search filter (title, venue, organizer)
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { venue: { [Op.like]: `%${search}%` } },
        { organizer: { [Op.like]: `%${search}%` } },
      ];
    }

    // Category filter
    if (category) {
      whereClause.category = category;
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Build sort options
    let order = [['eventDate', 'ASC']]; // Default: earliest first
    if (sort === 'date_desc') {
      order = [['eventDate', 'DESC']];
    } else if (sort === 'createdAt_desc') {
      order = [['createdAt', 'DESC']];
    }

    const events = await Event.findAll({
      where: whereClause,
      order,
      include: [{ model: Admin, attributes: ['id', 'username', 'email'] }],
    });

    const formattedEvents = events.map((event) => formatEvent(event));
    res.json(formattedEvents);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving events', error: error.message });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Private
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is numeric
    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ message: 'Invalid Event ID format' });
    }

    const event = await Event.findByPk(id, {
      include: [{ model: Admin, attributes: ['id', 'username', 'email'] }],
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(formatEvent(event));
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving event details', error: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is numeric
    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ message: 'Invalid Event ID format' });
    }

    const {
      title,
      description,
      category,
      venue,
      eventDate,
      startTime,
      endTime,
      registrationDeadline,
      organizer,
      capacity,
      image,
      status,
    } = req.body;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check duplicate event with same title, venue, and date (excluding current event)
    const duplicate = await Event.findOne({
      where: {
        title: title.trim(),
        venue: venue.trim(),
        eventDate: new Date(eventDate),
        id: { [Op.ne]: id },
      },
    });

    if (duplicate) {
      return res.status(400).json({
        message: 'Another event with the same title, venue, and date already exists',
      });
    }

    // Adjust availableSeats based on capacity change
    const bookedSeats = event.capacity - event.availableSeats;
    const newAvailableSeats = capacity - bookedSeats;
    if (newAvailableSeats < 0) {
      return res.status(400).json({
        message: 'Capacity cannot be reduced below the number of currently booked seats',
      });
    }

    // Update fields
    event.title = title.trim();
    event.description = description.trim();
    event.category = category.trim();
    event.venue = venue.trim();
    event.eventDate = new Date(eventDate);
    event.startTime = startTime;
    event.endTime = endTime;
    event.registrationDeadline = new Date(registrationDeadline);
    event.organizer = organizer.trim();
    event.capacity = capacity;
    event.availableSeats = newAvailableSeats;
    if (image) event.image = image;
    if (status) event.status = status;

    await event.save();

    // Fetch updated event with relations
    const fullEvent = await Event.findByPk(id, {
      include: [{ model: Admin, attributes: ['id', 'username', 'email'] }],
    });

    res.json(formatEvent(fullEvent));
  } catch (error) {
    res.status(500).json({ message: 'Server error updating event', error: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is numeric
    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ message: 'Invalid Event ID format' });
    }

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.destroy();
    res.json({ message: 'Event removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting event', error: error.message });
  }
};

// @desc    Get participants of a specific event
// @route   GET /api/events/:id/participants
// @access  Private/Admin
const getEventParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { search, department, year, status } = req.query;

    // Validate ID is numeric
    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ message: 'Invalid Event ID format' });
    }

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let regQuery = { eventId: id };
    let studentQuery = {};

    if (status) {
      regQuery.status = status;
    }
    if (department) {
      studentQuery.department = department;
    }
    if (year) {
      studentQuery.year = year;
    }
    if (search) {
      studentQuery[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { rollNumber: { [Op.like]: `%${search}%` } },
      ];
    }

    const participants = await Registration.findAll({
      where: regQuery,
      include: [
        {
          model: Student,
          where: studentQuery,
          attributes: { exclude: ['password'] },
        },
      ],
      order: [['registrationDate', 'DESC']],
    });

    const formatted = participants.map((p) => {
      const plain = p.toJSON();
      plain._id = plain.id;
      if (plain.Student) {
        plain.Student._id = plain.Student.id;
      }
      return plain;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving participants list', error: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventParticipants,
};
