const express = require('express');
const router = express.Router();
const {
  updateProfile,
  changePassword,
  uploadProfilePicture,
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.put('/', updateProfile);
router.put('/password', changePassword);
router.post('/upload', uploadProfilePicture);

module.exports = router;
