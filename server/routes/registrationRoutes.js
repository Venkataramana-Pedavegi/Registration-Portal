const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
} = require('../controllers/registrationController');
const { protect, studentOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', studentOnly, registerForEvent);
router.delete('/:id', studentOnly, cancelRegistration);
router.get('/my-events', studentOnly, getMyRegistrations);

module.exports = router;
