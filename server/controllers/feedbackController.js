const { Feedback, Event, Student } = require('../models');

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
    res.status(500).json({ message: error.message });
  }
};

const editFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const studentId = req.user.id;

    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.studentId !== studentId) {
      return res.status(403).json({ message: 'Unauthorized to edit this feedback' });
    }

    if (rating) feedback.rating = rating;
    if (comment !== undefined) feedback.comment = comment;
    await feedback.save();

    res.json({ message: 'Feedback updated successfully', feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
