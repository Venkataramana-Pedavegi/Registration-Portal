const mongoose = require('mongoose');
const Event = require('../models/Event');

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
      title: title.trim(),
      venue: venue.trim(),
      eventDate: new Date(eventDate),
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
      availableSeats: capacity, // At creation, available seats equals total capacity
      image: image || undefined,
      status: status || 'Upcoming',
      createdBy: req.user._id,
    });

    res.status(201).json(event);
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
    let query = {};

    // Search filter (title, venue, organizer)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { venue: searchRegex },
        { organizer: searchRegex },
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Build sort options
    let sortOptions = { eventDate: 1 }; // Default: earliest events first
    if (sort === 'date_desc') {
      sortOptions = { eventDate: -1 };
    } else if (sort === 'createdAt_desc') {
      sortOptions = { createdAt: -1 };
    }

    const events = await Event.find(query).sort(sortOptions).populate('createdBy', 'username email');
    res.json(events);
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Event ID format' });
    }

    const event = await Event.findById(id).populate('createdBy', 'username email');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
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

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check duplicate event with same title, venue, and date (excluding current event)
    const duplicate = await Event.findOne({
      title: title.trim(),
      venue: venue.trim(),
      eventDate: new Date(eventDate),
      _id: { $ne: id },
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

    const updatedEvent = await event.save();
    res.json(updatedEvent);
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Event ID format' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await Event.findByIdAndDelete(id);
    res.json({ message: 'Event removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting event', error: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
