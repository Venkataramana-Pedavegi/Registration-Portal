const { Feedback, Event, Student } = require('../models');

const getEventDateString = (dateInput) => {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

const convertTo24Hour = (timeStr) => {
  if (!timeStr) return '00:00';
  const cleanStr = timeStr.trim().toUpperCase();
  const match = cleanStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return cleanStr;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3];
  
  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const submitFeedback = async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;
    const studentId = req.user.id;

    if (!eventId || !rating) {
      return res.status(400).json({ message: 'Event ID and rating (1-5) are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 1. Verify Student is registered for the event
    const { Registration } = require('../models');
    const registration = await Registration.findOne({
      where: {
        eventId,
        studentId,
        status: ['Registered', 'Completed']
      }
    });

    if (!registration) {
      return res.status(403).json({ message: 'You must be registered for this event to give feedback.' });
    }

    // 2. Verify Event has completed based on event date + end time
    const dateStr = getEventDateString(event.eventDate);
    const endTime24 = convertTo24Hour(event.endTime);
    const eventEnd = new Date(`${dateStr}T${endTime24}`);
    const now = new Date();

    if (now < eventEnd) {
      return res.status(400).json({
        success: false,
        message: 'Feedback is available only after the event is completed.'
      });
    }

    let existingFeedback = await Feedback.findOne({ where: { eventId, studentId } });
    if (existingFeedback) {
      existingFeedback.rating = rating;
      existingFeedback.comment = comment;
      await existingFeedback.save();
      return res.json({ message: 'Feedback updated successfully', feedback: existingFeedback });
    }

    const feedback = await Feedback.create({
      eventId,
      studentId,
      rating,
      comment,
    });

    // Notify Admins of the new feedback
    try {
      const { Notification, Admin: AdminModel } = require('../models');
      const adminsList = await AdminModel.findAll({ where: { isActive: true } });
      const studentName = req.user.fullName || 'Student';
      const eventTitle = event.title || 'Event';
      const adminPromises = adminsList.map(adm => {
        return Notification.create({
          userId: adm.id,
          userRole: 'Admin',
          title: 'New Event Feedback',
          message: `${studentName} submitted feedback for ${eventTitle}.`,
          type: 'System',
          referenceId: eventId,
        }).catch(err => console.error('Error creating admin feedback notification:', err.message));
      });
      await Promise.all(adminPromises);
    } catch (notifErr) {
      console.error('Failed to notify admins of new feedback:', notifErr.message);
    }

    // Award Feedback Submission points (+10 XP)
    try {
      const { awardPoints } = require('../services/GamificationService');
      await awardPoints(
        studentId,
        10,
        'FEEDBACK_SUBMIT',
        `Submitted feedback for event: ${event.title || 'Event'}`,
        eventId,
        req
      );
    } catch (gErr) {
      console.error('Non-blocking feedback points allocation error:', gErr.message);
    }

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during feedback submission' });
  }
};

const editFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const studentId = req.user.id;

    const feedback = await Feedback.findByPk(id, {
      include: [{ model: Event }]
    });
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.studentId !== studentId) {
      return res.status(403).json({ message: 'Unauthorized to edit this feedback' });
    }

    // Verify Event has completed
    if (feedback.Event) {
      const dateStr = getEventDateString(feedback.Event.eventDate);
      const endTime24 = convertTo24Hour(feedback.Event.endTime);
      const eventEnd = new Date(`${dateStr}T${endTime24}`);
      const now = new Date();

      if (now < eventEnd) {
        return res.status(400).json({
          success: false,
          message: 'Feedback is available only after the event is completed.'
        });
      }
    }

    if (rating) feedback.rating = rating;
    if (comment !== undefined) feedback.comment = comment;
    await feedback.save();

    res.json({ message: 'Feedback updated successfully', feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during feedback modification' });
  }
};

const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const feedbacks = await Feedback.findAll({
      where: { eventId },
      include: [{ model: Student, attributes: ['id', 'name', 'email', 'department'] }],
      order: [['createdAt', 'DESC']],
    });

    const totalRatings = feedbacks.length;
    const avgRating = totalRatings > 0 
      ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(1) 
      : 0;

    res.json({ eventId, avgRating, totalRatings, feedbacks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeedbackAnalytics = async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      include: [
        { model: Event, attributes: ['id', 'title', 'category'] },
        { model: Student, attributes: ['id', 'name', 'department'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const totalFeedbacks = feedbacks.length;
    const avgRating = totalFeedbacks > 0
      ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / totalFeedbacks).toFixed(1)
      : 0;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach((f) => {
      ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
    });

    res.json({
      totalFeedbacks,
      avgRating,
      ratingDistribution,
      feedbacks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyFeedback = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { eventId } = req.query;

    const where = { studentId };
    if (eventId) where.eventId = eventId;

    const feedbacks = await Feedback.findAll({
      where,
      include: [{ model: Event, attributes: ['id', 'title', 'eventDate'] }],
    });

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitFeedback,
  editFeedback,
  getEventFeedback,
  getFeedbackAnalytics,
  getMyFeedback,
};
