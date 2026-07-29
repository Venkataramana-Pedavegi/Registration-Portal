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

    const whereClause = search
      ? {
          [Op.or]: [
            { action: { [Op.like]: `%${search}%` } },
            { details: { [Op.like]: `%${search}%` } },
            { ipAddress: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows } = await AuditLog.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
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
