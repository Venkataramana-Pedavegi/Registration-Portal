const { AuditLog } = require('../models');
const { Op } = require('sequelize');

// @desc    Get audit logs (Admin only)
// @route   GET /api/auditlogs
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const roleFilter = req.query.role || '';
    const statusFilter = req.query.status || '';
    const actionFilter = req.query.action || '';
    const sortBy = req.query.sort || 'createdAt';
    const sortOrder = req.query.order || 'DESC';

    // Construct Sequelize query conditions
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { action: { [Op.like]: `%${search}%` } },
        { details: { [Op.like]: `%${search}%` } },
        { ipAddress: { [Op.like]: `%${search}%` } },
      ];
    }

    if (roleFilter) {
      whereClause.userRole = roleFilter;
    }

    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    if (actionFilter) {
      whereClause.action = actionFilter;
    }

    // Allowed sort fields for security
    const allowedSortFields = ['createdAt', 'action', 'userRole', 'userId', 'ipAddress', 'status'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const { count, rows } = await AuditLog.findAndCountAll({
      where: whereClause,
      order: [[finalSortBy, finalSortOrder]],
      limit,
      offset,
    });

    res.json({
      auditLogs: rows.map((log) => {
        const plain = log.toJSON();
        plain._id = plain.id;
        return plain;
      }),
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving audit logs', error: error.message });
  }
};

module.exports = { getAuditLogs };
