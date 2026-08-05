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
      registrationType,
      price,
      isTemplate,
    } = req.body;

    const createdBy = req.user.id;

    // Check duplicate event with same title, venue, and date (skip check for templates)
    if (!isTemplate) {
      const duplicate = await Event.findOne({
        where: {
          title: title.trim(),
          venue: venue.trim(),
          eventDate: new Date(eventDate),
          isTemplate: false,
        },
      });

      if (duplicate) {
        return res.status(400).json({
          message: 'An event with the same title, venue, and date already exists',
        });
      }
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
      registrationType: registrationType || 'FREE',
      price: price !== undefined ? Number(price) : 0,
      fee: price !== undefined ? Number(price) : 0,
      isPaid: registrationType === 'PAID',
      isTemplate: !!isTemplate,
    });

    const fullEvent = await Event.findByPk(newEvent.id, {
      include: [{ model: Admin, attributes: ['id', 'username', 'email'] }],
    });

    const { logAudit } = require('../middleware/auditLogger');
    await logAudit({ req, userId: createdBy, userRole: req.role || 'Admin', action: 'EVENT_CREATION', details: `Event "${newEvent.title}" created (ID: ${newEvent.id})` });

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
    const { category, status, search, sort, isTemplate } = req.query;

    const whereClause = {};

    if (isTemplate === 'true' || isTemplate === '1') {
      whereClause.isTemplate = true;
    } else if (isTemplate === 'all') {
      // Do nothing, include both templates and normal events
    } else {
      whereClause.isTemplate = false;
    }

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

    const { Waitlist } = require('../models');
    const waitlistCount = await Waitlist.count({
      where: { eventId: id, status: 'waiting' },
    });

    const formatted = formatEvent(event);
    formatted.waitlistCount = waitlistCount;

    res.json(formatted);
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
    if (req.body.registrationType !== undefined) {
      event.registrationType = req.body.registrationType;
      event.isPaid = req.body.registrationType === 'PAID';
    }
    if (req.body.price !== undefined) {
      event.price = Number(req.body.price);
      event.fee = Number(req.body.price);
    }

    if (req.body.isTemplate !== undefined) {
      event.isTemplate = !!req.body.isTemplate;
    }

    await event.save();

    const fullEvent = await Event.findByPk(event.id, {
      include: [{ model: Admin, attributes: ['id', 'username', 'email'] }],
    });

    // Fetch registrations and send update/cancellation emails
    try {
      const { Student } = require('../models');
      const registrations = await Registration.findAll({
        where: { eventId: id, status: 'Registered' },
        include: [{ model: Student, attributes: ['fullName', 'email'] }],
      });
      if (registrations.length > 0) {
        const sendEmail = require('../utils/sendEmail');
        const isCancelled = req.body.status === 'Cancelled';
        const subject = isCancelled ? `Event Cancelled - ${event.title}` : `Event Updated - ${event.title}`;
        const templateTitle = isCancelled ? 'Event Cancelled' : 'Event Details Updated';
        const htmlBody = isCancelled
          ? `<p>Dear Student,</p><p>We regret to inform you that the event <strong>${event.title}</strong> has been cancelled by the coordinators.</p>`
          : `
            <p>Dear Student,</p>
            <p>Please note that the details for the event <strong>${event.title}</strong> have been updated by the administrator:</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 15px 0;">
              <p style="margin: 3px 0;"><strong>Event Title:</strong> ${event.title}</p>
              <p style="margin: 3px 0;"><strong>New Date:</strong> ${new Date(event.eventDate).toLocaleDateString()}</p>
              <p style="margin: 3px 0;"><strong>New Time:</strong> ${event.startTime} - ${event.endTime}</p>
              <p style="margin: 3px 0;"><strong>New Venue:</strong> ${event.venue}</p>
            </div>
            <p>Please update your calendar accordingly.</p>
          `;

        registrations.forEach((reg) => {
          if (reg.Student?.email) {
            sendEmail({
              to: reg.Student.email,
              subject,
              templateTitle,
              html: htmlBody.replace('Dear Student,', `Dear <strong>${reg.Student.fullName}</strong>,`),
            }).catch((err) => console.error('Error sending event update email:', err.message));
          }
        });
      }
    } catch (err) {
      console.error('Error processing event update notifications:', err.message);
    }

    const { broadcastEventUpdated } = require('../utils/socket');
    broadcastEventUpdated(fullEvent);

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

    // Send cancellation emails before destroying
    try {
      const { Student } = require('../models');
      const registrations = await Registration.findAll({
        where: { eventId: id, status: 'Registered' },
        include: [{ model: Student, attributes: ['fullName', 'email'] }],
      });
      if (registrations.length > 0) {
        const sendEmail = require('../utils/sendEmail');
        registrations.forEach((reg) => {
          if (reg.Student?.email) {
            sendEmail({
              to: reg.Student.email,
              subject: `Event Cancelled - ${event.title}`,
              templateTitle: 'Event Cancelled',
              html: `
                <p>Dear <strong>${reg.Student.fullName}</strong>,</p>
                <p>We regret to inform you that the event <strong>${event.title}</strong> has been cancelled by the coordinators and removed from the portal.</p>
              `,
            }).catch((err) => console.error('Error sending event cancellation email:', err.message));
          }
        });
      }
    } catch (err) {
      console.error('Error processing event delete notifications:', err.message);
    }

    const { logAudit } = require('../middleware/auditLogger');
    await logAudit({ req, userId: req.user.id, userRole: req.role || 'Admin', action: 'EVENT_DELETION', details: `Event "${event.title}" deleted (ID: ${id})` });

    await event.destroy();

    const { broadcastEventDeleted } = require('../utils/socket');
    broadcastEventDeleted(id);

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

const duplicateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const duplicated = await Event.create({
      title: `${event.title} (Copy)`,
      description: event.description,
      category: event.category,
      venue: event.venue,
      eventDate: event.eventDate,
      registrationDeadline: event.registrationDeadline,
      startTime: event.startTime,
      endTime: event.endTime,
      capacity: event.capacity,
      availableSeats: event.capacity,
      price: event.price,
      fee: event.fee,
      registrationType: event.registrationType,
      isPaid: event.isPaid,
      createdBy: req.user.id,
      status: 'Upcoming',
    });

    const { logAudit } = require('../middleware/auditLogger');
    await logAudit({ req, userId: req.user.id, userRole: 'Admin', action: 'EVENT_DUPLICATE', details: `Duplicated Event ID ${id} as Event ID ${duplicated.id}` });

    res.status(201).json(formatEvent(duplicated));
  } catch (error) {
    res.status(500).json({ message: 'Server error duplicating event', error: error.message });
  }
};

const bulkEmailParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message body are required' });
    }

    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const { Student } = require('../models');
    const registrations = await Registration.findAll({
      where: { eventId: id, status: 'Registered' },
      include: [{ model: Student, attributes: ['fullName', 'email'] }],
    });

    if (registrations.length === 0) {
      return res.status(400).json({ message: 'No active participants registered for this event.' });
    }

    const sendEmail = require('../utils/sendEmail');
    let successCount = 0;

    await Promise.all(
      registrations.map(async (reg) => {
        if (reg.Student?.email) {
          try {
            await sendEmail({
              to: reg.Student.email,
              subject: `${subject} - ${event.title}`,
              templateTitle: `Announcement: ${event.title}`,
              html: `
                <p>Dear <strong>${reg.Student.fullName}</strong>,</p>
                <p>${message.replace(/\n/g, '<br />')}</p>
                <p style="margin-top: 20px; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px;">This email was sent by the event coordinator.</p>
              `,
            });
            successCount++;
          } catch (err) {
            console.error('Error sending bulk email to student:', reg.Student.email, err.message);
          }
        }
      })
    );

    const { logAudit } = require('../middleware/auditLogger');
    await logAudit({ req, userId: req.user.id, userRole: 'Admin', action: 'BULK_EMAIL', details: `Bulk email sent to ${successCount} participants of Event ID ${id}` });

    res.json({ message: `Bulk email processed successfully. Sent to ${successCount} of ${registrations.length} participants.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error sending bulk emails', error: error.message });
  }
};

const bulkAttendanceAndCertificates = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Present' or 'Absent'

    if (!status || !['Present', 'Absent'].includes(status)) {
      return res.status(400).json({ message: 'Valid attendance status (Present or Absent) is required' });
    }

    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const { Student, Certificate, Notification, Attendance } = require('../models');
    const registrations = await Registration.findAll({
      where: { eventId: id, status: 'Registered' },
      include: [{ model: Student, attributes: ['fullName', 'email'] }],
    });

    if (registrations.length === 0) {
      return res.status(400).json({ message: 'No active participants registered for this event.' });
    }

    const sendEmail = require('../utils/sendEmail');
    let markedCount = 0;

    for (const reg of registrations) {
      const [attendance, created] = await Attendance.findOrCreate({
        where: { registrationId: reg.id },
        defaults: {
          registrationId: reg.id,
          eventId: reg.eventId,
          studentId: reg.studentId,
          attendanceStatus: status,
          markedAt: new Date(),
        },
      });

      if (!created) {
        attendance.attendanceStatus = status;
        attendance.markedAt = new Date();
        await attendance.save();
      }

      markedCount++;

      const { broadcastAttendanceUpdated } = require('../utils/socket');
      broadcastAttendanceUpdated(id, attendance);

      if (status === 'Present') {
        const certCode = `CERT-2026-${reg.id.toString().padStart(4, '0')}`;
        const [certificate, certCreated] = await Certificate.findOrCreate({
          where: { registrationId: reg.id },
          defaults: {
            registrationId: reg.id,
            studentId: reg.studentId,
            eventId: reg.eventId,
            certificateId: certCode,
            issueDate: new Date(),
            qrVerificationCode: certCode,
          },
        });

        const { broadcastCertificateGenerated } = require('../utils/socket');
        broadcastCertificateGenerated(reg.studentId, certificate);

        await Notification.create({
          userId: reg.studentId,
          userRole: 'Student',
          title: 'Certificate Issued',
          message: `Your participation certificate for "${event.title}" is ready!`,
          type: 'Certificate',
        }).catch(err => console.error(err));

        if (reg.Student?.email) {
          sendEmail({
            to: reg.Student.email,
            subject: `Attendance Confirmed & Certificate Issued - ${event.title}`,
            templateTitle: 'Attendance & Certificate Confirmed',
            html: `
              <p>Dear <strong>${reg.Student.fullName}</strong>,</p>
              <p>Your attendance for <strong>${event.title}</strong> has been marked <strong>PRESENT</strong>!</p>
              <p>Your Certificate of Participation (Certificate ID: <strong>${certCode}</strong>) is now generated and ready in your portal.</p>
            `,
          }).catch((err) => console.error('Error sending attendance email:', err.message));
        }
      }
    }

    const { logAudit } = require('../middleware/auditLogger');
    await logAudit({ req, userId: req.user.id, userRole: 'Admin', action: 'BULK_ATTENDANCE', details: `Bulk attendance marked as ${status} for ${markedCount} students of Event ID ${id}` });

    res.json({ message: `Bulk attendance marked as ${status} for ${markedCount} registrations.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error marking bulk attendance', error: error.message });
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
  duplicateEvent,
  bulkEmailParticipants,
  bulkAttendanceAndCertificates,
};
