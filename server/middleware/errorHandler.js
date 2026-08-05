const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  const statusCode = err.statusCode || err.status || 500;
  
  // Format Sequelize validation or unique constraint errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: err.errors ? err.errors[0].message : err.message,
      errors: err.errors ? err.errors.map(e => e.message) : [err.message]
    });
  }

  // Handle Token Blacklisted or Auth Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authorization token expired'
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
