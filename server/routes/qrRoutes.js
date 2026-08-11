const express = require('express');
const router = express.Router();
const { getRegistrationQRCode, scanQRCode, getScannedRegistrationDetails } = require('../controllers/qrController');
const { protect, adminOrVolunteer } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');

// Pass verification route (accessible by Admin or Approved Volunteer)
router.get('/verify/:registrationId', protect, adminOrVolunteer, getScannedRegistrationDetails);

router.use(protect);

router.get('/:registrationId', getRegistrationQRCode);
router.post('/scan', adminProtect, scanQRCode);

module.exports = router;
