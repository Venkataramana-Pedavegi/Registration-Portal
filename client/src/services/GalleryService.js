import api from './api';

const GalleryService = {
  /**
   * Fetch all gallery items with search, filters, and pagination parameters
   */
  getGalleries: async (params = {}) => {
    const { data } = await api.get('/gallery', { params });
    return data;
  },

  /**
   * Fetch all gallery items for a specific event
   */
  getEventGallery: async (eventId) => {
    const { data } = await api.get(`/gallery/event/${eventId}`);
    return data;
  },

  /**
   * Add a new media item (Admin only)
   * data structure: { eventId, title, description, mediaType, isFeatured, mediaData, mediaUrl }
   */
  addGalleryMedia: async (mediaData) => {
    const { data } = await api.post('/gallery', mediaData);
    return data;
  },

  /**
   * Upload media files via multipart/form-data (Admin only)
   */
  uploadGalleryMedia: async (formData, onProgress) => {
    const { data } = await api.post('/gallery/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return data;
  },

  /**
   * Edit details of a gallery item (Admin only)
   * data structure: { title, description, isFeatured, displayOrder }
   */
  updateGalleryMedia: async (id, mediaData) => {
    const { data } = await api.put(`/gallery/${id}`, mediaData);
    return data;
  },

  /**
   * Delete a gallery media item (Admin only)
   */
  deleteGalleryMedia: async (id) => {
    const { data } = await api.delete(`/gallery/${id}`);
    return data;
  },

  /**
   * Reorder gallery media items (Admin only)
   * orderings: Array of { id, displayOrder }
   */
  reorderGalleryMedia: async (orderings) => {
    const { data } = await api.patch('/gallery/reorder', { orderings });
    return data;
  },

  /**
   * Record a view statistic for a media item
   */
  incrementMediaViews: async (id) => {
    const { data } = await api.post(`/gallery/${id}/view`);
    return data;
  },

  /**
   * Record a download statistic for a media item
   */
  incrementMediaDownloads: async (id) => {
    const { data } = await api.post(`/gallery/${id}/download`);
    return data;
  },

  /**
   * Fetch gallery statistics and dashboard details (Admin only)
   */
  getGalleryAnalytics: async () => {
    const { data } = await api.get('/gallery/analytics');
    return data;
  },
};

export default GalleryService;
