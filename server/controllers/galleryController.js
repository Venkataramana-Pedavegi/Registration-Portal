const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { sequelize, EventGallery, Event, Admin } = require('../models');
const { storeBase64File } = require('../services/galleryService');

// @desc    Get paginated, searchable, and filterable gallery items
// @route   GET /api/gallery
// @access  Public
const getGalleries = async (req, res) => {
  try {
    const { search, category, year, mediaType, isFeatured, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (mediaType) {
      // support case insensitive and backward compatibility
      where.mediaType = { [Op.in]: [mediaType.toUpperCase(), mediaType.toLowerCase()] };
    }
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true';
    }

    const eventWhere = {};
    if (category) {
      eventWhere.category = category;
    }
    if (search) {
      eventWhere[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
        { venue: { [Op.like]: `%${search}%` } },
      ];
    }
    if (year) {
      eventWhere.eventDate = sequelize.where(
        sequelize.fn('YEAR', sequelize.col('eventDate')),
        year
      );
    }

    const { count, rows } = await EventGallery.findAndCountAll({
      where,
      include: [
        {
          model: Event,
          where: Object.keys(eventWhere).length > 0 ? eventWhere : undefined,
          required: Object.keys(eventWhere).length > 0 || !!year,
          attributes: ['title', 'category', 'eventDate', 'venue', 'description'],
        },
        {
          model: Admin,
          as: 'uploader',
          attributes: ['username'],
        }
      ],
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      media: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving gallery items', error: error.message });
  }
};

// @desc    Get gallery media for a specific event
// @route   GET /api/gallery/event/:eventId
// @access  Public
const getEventGallery = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid Event ID' });
    }

    const gallery = await EventGallery.findAll({
      where: { eventId },
      include: [
        { model: Event, attributes: ['title', 'category', 'eventDate', 'description'] }
      ],
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']],
    });

    res.json(gallery);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving event gallery', error: error.message });
  }
};

// @desc    Add media item to an event gallery
// @route   POST /api/gallery
// @access  Private/Admin
const addGalleryMedia = async (req, res) => {
  try {
    const { eventId, title, description, mediaType, isFeatured, mediaData, mediaUrl } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let finalMediaUrl = mediaUrl;
    if (mediaData) {
      try {
        finalMediaUrl = storeBase64File(mediaData);
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
    }

    if (!finalMediaUrl) {
      return res.status(400).json({ message: 'Media data (base64) or media URL is required' });
    }

    // Get current max displayOrder
    const maxOrder = await EventGallery.max('displayOrder', { where: { eventId } }) || 0;

    const media = await EventGallery.create({
      eventId,
      title: title || '',
      description: description || '',
      mediaType: mediaType || 'IMAGE',
      mediaUrl: finalMediaUrl,
      thumbnailUrl: null,
      uploadedBy: req.user.id,
      displayOrder: maxOrder + 1,
      isFeatured: isFeatured || false,
    });

    res.status(201).json({ message: 'Media item added to gallery successfully', media });
  } catch (error) {
    res.status(500).json({ message: 'Server error adding gallery media', error: error.message });
  }
};

// @desc    Upload multiple media files using multer
// @route   POST /api/gallery/upload
// @access  Private/Admin
const uploadGalleryMedia = async (req, res) => {
  try {
    const { eventId, title, description, mediaType, isFeatured } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedItems = [];
    const maxOrder = await EventGallery.max('displayOrder', { where: { eventId } }) || 0;

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const relativeUrl = `/uploads/gallery/${file.filename}`;
      
      const itemType = file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';

      const media = await EventGallery.create({
        eventId,
        title: title || file.originalname.substring(0, file.originalname.lastIndexOf('.')) || 'Gallery Media',
        description: description || '',
        mediaType: mediaType || itemType,
        mediaUrl: relativeUrl,
        thumbnailUrl: null,
        uploadedBy: req.user.id,
        displayOrder: maxOrder + i + 1,
        isFeatured: isFeatured === 'true' || isFeatured === true,
      });

      uploadedItems.push(media);
    }

    res.status(201).json({
      message: `${uploadedItems.length} media items uploaded successfully`,
      media: uploadedItems
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error uploading gallery media', error: error.message });
  }
};

// @desc    Edit details of a gallery item
// @route   PUT /api/gallery/:id
// @access  Private/Admin
const updateGalleryMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isFeatured, displayOrder } = req.body;

    const media = await EventGallery.findByPk(id);
    if (!media) {
      return res.status(404).json({ message: 'Gallery media item not found' });
    }

    if (title !== undefined) media.title = title;
    if (description !== undefined) media.description = description;
    if (isFeatured !== undefined) media.isFeatured = isFeatured;
    if (displayOrder !== undefined) media.displayOrder = displayOrder;

    await media.save();
    res.json({ message: 'Gallery media item updated successfully', media });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating gallery media', error: error.message });
  }
};

// @desc    Delete media item from gallery
// @route   DELETE /api/gallery/:id
// @access  Private/Admin
const deleteGalleryMedia = async (req, res) => {
  try {
    const { id } = req.params;

    const media = await EventGallery.findByPk(id);
    if (!media) {
      return res.status(404).json({ message: 'Gallery media item not found' });
    }

    // If local file, delete it
    if (media.mediaUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', media.mediaUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await media.destroy();
    res.json({ message: 'Gallery media item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting gallery media', error: error.message });
  }
};

// @desc    Reorder gallery media items
// @route   PATCH /api/gallery/reorder
// @access  Private/Admin
const reorderGalleryMedia = async (req, res) => {
  try {
    const { orderings } = req.body; // Array of { id, displayOrder }

    if (!Array.isArray(orderings)) {
      return res.status(400).json({ message: 'Orderings array is required' });
    }

    for (const item of orderings) {
      if (item.id && item.displayOrder !== undefined) {
        await EventGallery.update(
          { displayOrder: item.displayOrder },
          { where: { id: item.id } }
        );
      }
    }

    res.json({ message: 'Gallery order updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error reordering gallery media', error: error.message });
  }
};

// @desc    Increment media view count
// @route   POST /api/gallery/:id/view
// @access  Public
const incrementMediaViews = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await EventGallery.findByPk(id);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    media.views += 1;
    await media.save();
    res.json({ success: true, views: media.views });
  } catch (error) {
    res.status(500).json({ message: 'Error incrementing views', error: error.message });
  }
};

// @desc    Increment media download count
// @route   POST /api/gallery/:id/download
// @access  Public
const incrementMediaDownloads = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await EventGallery.findByPk(id);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    media.downloads += 1;
    await media.save();
    res.json({ success: true, downloads: media.downloads });
  } catch (error) {
    res.status(500).json({ message: 'Error incrementing downloads', error: error.message });
  }
};

// @desc    Get dashboard analytics for the gallery
// @route   GET /api/gallery/analytics
// @access  Private/Admin
const getGalleryAnalytics = async (req, res) => {
  try {
    const totalImages = await EventGallery.count({
      where: { mediaType: { [Op.in]: ['IMAGE', 'image'] } }
    });

    const totalVideos = await EventGallery.count({
      where: { mediaType: { [Op.in]: ['VIDEO', 'video'] } }
    });

    // Grouping sum of views by Event to find the most viewed gallery
    const mostViewed = await EventGallery.findAll({
      attributes: [
        'eventId',
        [sequelize.fn('SUM', sequelize.col('views')), 'totalViews']
      ],
      group: ['eventId'],
      order: [[sequelize.literal('totalViews'), 'DESC']],
      limit: 1,
      include: [{ model: Event, attributes: ['title', 'category'] }]
    });

    // Grouping sum of downloads by Event to find the most downloaded gallery
    const mostDownloaded = await EventGallery.findAll({
      attributes: [
        'eventId',
        [sequelize.fn('SUM', sequelize.col('downloads')), 'totalDownloads']
      ],
      group: ['eventId'],
      order: [[sequelize.literal('totalDownloads'), 'DESC']],
      limit: 1,
      include: [{ model: Event, attributes: ['title', 'category'] }]
    });

    // 5 Recently uploaded media items
    const recentlyUploaded = await EventGallery.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{ model: Event, attributes: ['title'] }]
    });

    res.json({
      totalImages,
      totalVideos,
      mostViewedGallery: mostViewed[0] ? {
        eventId: mostViewed[0].eventId,
        title: mostViewed[0].Event?.title || 'Unknown Event',
        category: mostViewed[0].Event?.category || 'N/A',
        totalViews: parseInt(mostViewed[0].getDataValue('totalViews')) || 0
      } : null,
      mostDownloadedGallery: mostDownloaded[0] ? {
        eventId: mostDownloaded[0].eventId,
        title: mostDownloaded[0].Event?.title || 'Unknown Event',
        category: mostDownloaded[0].Event?.category || 'N/A',
        totalDownloads: parseInt(mostDownloaded[0].getDataValue('totalDownloads')) || 0
      } : null,
      recentlyUploaded
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving gallery analytics', error: error.message });
  }
};

module.exports = {
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
};
