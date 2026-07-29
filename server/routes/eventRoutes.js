const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventParticipants,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');
const { validateEvent } = require('../middleware/validation');

// All event routes are protected by JWT authentication
router.use(protect);

router.post('/', adminProtect, validateEvent, createEvent);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.put('/:id', adminProtect, validateEvent, updateEvent);
router.delete('/:id', adminProtect, deleteEvent);
router.get('/:id/participants', adminProtect, getEventParticipants);

module.exports = router;
