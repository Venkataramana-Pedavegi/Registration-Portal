const express = require('express');
const router = express.Router();
const {
  getCertificates,
  downloadCertificate,
  regenerateCertificate,
  verifyCertificatePublic,
} = require('../controllers/certificateController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public route for verification
router.get('/verify/:certificateId', verifyCertificatePublic);

// Protected routes
router.use(protect);

router.get('/', getCertificates);
router.get('/:id/download', downloadCertificate);
router.post('/:id/regenerate', adminOnly, regenerateCertificate);

module.exports = router;
