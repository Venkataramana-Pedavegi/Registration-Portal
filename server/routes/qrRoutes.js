const express = require('express');
const router = express.Router();
const { getRegistrationQRCode, scanQRCode, getScannedRegistrationDetails } = require('../controllers/qrController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');

// Public pass verification route
router.get('/verify/:registrationId', getScannedRegistrationDetails);

router.use(protect);

router.get('/:registrationId', getRegistrationQRCode);
router.post('/scan', adminProtect, scanQRCode);

module.exports = router;
