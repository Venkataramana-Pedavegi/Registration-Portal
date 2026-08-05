const express = require('express');
const router = express.Router();
const {
  getGalleries,
  getEventGallery,
  addGalleryMedia,
  uploadGalleryMedia,
  updateGalleryMedia,
  deleteGalleryMedia,
  reorderGalleryMedia,
  incrementMediaViews,
  incrementMediaDownloads,
  getGalleryAnalytics,
} = require('../controllers/galleryController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes for viewing
router.get('/', getGalleries);
router.get('/event/:eventId', getEventGallery);
router.post('/:id/view', incrementMediaViews);
router.post('/:id/download', incrementMediaDownloads);

// Admin-only management routes
router.get('/analytics', protect, adminProtect, getGalleryAnalytics);
router.post('/', protect, adminProtect, addGalleryMedia);
router.post('/upload', protect, adminProtect, upload.array('files'), uploadGalleryMedia);
router.put('/:id', protect, adminProtect, updateGalleryMedia);
router.delete('/:id', protect, adminProtect, deleteGalleryMedia);
router.patch('/reorder', protect, adminProtect, reorderGalleryMedia);

// Backward compatibility helper routes
router.get('/:eventId', getEventGallery); // Map GET /api/gallery/:eventId

module.exports = router;
