const { Op } = require('sequelize');
const { Event, Admin, Registration } = require('../models');

// Helper to format event object mapping id to _id
const formatEvent = (eventInstance) => {
  const plain = eventInstance.toJSON();
  plain._id = plain.id;
  if (plain.Admin) {
    plain.Admin._id = plain.Admin.id;
  }
  return plain;
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
    } = req.body;

    const createdBy = req.user.id;

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

    const newEvent = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      venue: venue.trim(),
      eventDate: new Date(eventDate),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      registrationDeadline: new Date(registrationDeadline),
      organizer: organizer.trim(),
      capacity,
      availableSeats: capacity,
      image: image || undefined,
      createdBy,
    });

    const fullEvent = await Event.findByPk(newEvent.id, {
      include: [{ model: Admin, attributes: ['id', 'username', 'email'] }],
    });

    res.status(201).json(formatEvent(fullEvent));
  } catch (error) {
    res.status(500).json({ message: 'Server error creating event', error: error.message });
  }
};

// @desc    Get all events with optional filters, search, and pagination
// @route   GET /api/events
// @access  Public
const getAllEvents = async (req, res) => {
  try {
    const { category, status, search, sort } = req.query;

    const whereClause = {};

    if (category) {
      whereClause.category = category;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { venue: { [Op.like]: `%${search}%` } },
        { organizer: { [Op.like]: `%${search}%` } },
      ];
    }

    let order = [['eventDate', 'ASC']];
    if (sort === 'newest') {
      order = [['createdAt', 'DESC']];
    } else if (sort === 'oldest') {
      order = [['createdAt', 'ASC']];
    } else if (sort === 'date_asc') {
      order = [['eventDate', 'ASC']];
    } else if (sort === 'date_desc') {
      order = [['eventDate', 'DESC']];
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

    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ message: 'Invalid Event ID format' });
    }

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const newTitle = req.body.title !== undefined ? req.body.title.trim() : event.title;
    const newVenue = req.body.venue !== undefined ? req.body.venue.trim() : event.venue;
    const newEventDate = req.body.eventDate !== undefined ? new Date(req.body.eventDate) : event.eventDate;
    const newCapacity = req.body.capacity !== undefined ? req.body.capacity : event.capacity;

    // Check duplicate event
    const duplicate = await Event.findOne({
      where: {
        title: newTitle,
        venue: newVenue,
        eventDate: newEventDate,
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
    const newAvailableSeats = newCapacity - bookedSeats;
    if (newAvailableSeats < 0) {
      return res.status(400).json({
        message: 'Capacity cannot be reduced below the number of currently booked seats',
      });
    }

    // Update fields
    if (req.body.title !== undefined) event.title = newTitle;
    if (req.body.description !== undefined) event.description = req.body.description.trim();
    if (req.body.category !== undefined) event.category = req.body.category.trim();
    if (req.body.venue !== undefined) event.venue = newVenue;
    if (req.body.eventDate !== undefined) event.eventDate = newEventDate;
    if (req.body.startTime !== undefined) event.startTime = req.body.startTime.trim();
    if (req.body.endTime !== undefined) event.endTime = req.body.endTime.trim();
    if (req.body.registrationDeadline !== undefined) event.registrationDeadline = new Date(req.body.registrationDeadline);
    if (req.body.organizer !== undefined) event.organizer = req.body.organizer.trim();
    if (req.body.capacity !== undefined) {
      event.capacity = newCapacity;
      event.availableSeats = newAvailableSeats;
    }
    if (req.body.image !== undefined) event.image = req.body.image;
    if (req.body.status !== undefined) event.status = req.body.status;

    await event.save();

    const fullEvent = await Event.findByPk(event.id, {
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

    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ message: 'Invalid Event ID format' });
    }

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.destroy();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting event', error: error.message });
  }
};

// @desc    Get participants list for a specific event
// @route   GET /api/events/:id/participants
// @access  Private/Admin
const getEventParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { department, search } = req.query;

    if (isNaN(id) || !Number.isInteger(Number(id))) {
      return res.status(400).json({ message: 'Invalid Event ID format' });
    }

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const studentWhere = {};
    if (department) {
      studentWhere.department = department;
    }

    if (search) {
      studentWhere[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { rollNumber: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const registrations = await Registration.findAll({
      where: { eventId: id, status: 'Registered' },
      include: [
        {
          model: require('../models').Student,
          where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined,
          attributes: ['id', 'fullName', 'rollNumber', 'email', 'department', 'year'],
        },
      ],
      order: [['registrationDate', 'ASC']],
    });

    const formattedParticipants = registrations.map((reg) => {
      const plain = reg.toJSON();
      plain._id = plain.id;
      if (plain.Student) {
        plain.Student._id = plain.Student.id;
      }
      return plain;
    });

    res.json(formattedParticipants);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving participants', error: error.message });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEvents: getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventParticipants,
};
