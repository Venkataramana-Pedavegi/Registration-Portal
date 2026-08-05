const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  markWinner,
} = require('../controllers/registrationController');
const { protect, studentOnly } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');

router.use(protect);

router.post('/', studentOnly, registerForEvent);
router.delete('/:id', studentOnly, cancelRegistration);
router.get('/my-events', studentOnly, getMyRegistrations);
router.put('/:id/winner', adminProtect, markWinner);

module.exports = router;
