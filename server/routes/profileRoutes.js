const express = require('express');
const router = express.Router();
const {
  updateProfile,
  changePassword,
  uploadProfilePicture,
  getLoginHistory,
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.put('/', updateProfile);
router.put('/password', changePassword);
router.post('/upload', uploadProfilePicture);
router.get('/login-history', getLoginHistory);

module.exports = router;
