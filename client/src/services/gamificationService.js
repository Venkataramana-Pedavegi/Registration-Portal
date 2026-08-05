import api from './api';

const gamificationService = {
  getProfileStats: async () => {
    const { data } = await api.get('/gamification/profile-stats');
    return data;
  },

  getTimeline: async () => {
    const { data } = await api.get('/gamification/timeline');
    return data;
  },

  getBadges: async () => {
    const { data } = await api.get('/gamification/badges');
    return data;
  },

  getAchievements: async () => {
    const { data } = await api.get('/gamification/achievements');
    return data;
  },

  // Admin Actions
  adjustPoints: async (studentId, points, description) => {
    const { data } = await api.post('/gamification/admin/adjust-points', { studentId, points, description });
    return data;
  },

  createCustomBadge: async (badgeData) => {
    const { data } = await api.post('/gamification/admin/badge', badgeData);
    return data;
  },

  resetMonthlyRankings: async () => {
    const { data } = await api.post('/gamification/admin/reset-monthly');
    return data;
  },

  getAnalytics: async () => {
    const { data } = await api.get('/gamification/admin/analytics');
    return data;
  }
};

export default gamificationService;
