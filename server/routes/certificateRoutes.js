const express = require('express');
const router = express.Router();
const { getCertificates, downloadCertificate } = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getCertificates);
router.get('/:id/download', downloadCertificate);

module.exports = router;
