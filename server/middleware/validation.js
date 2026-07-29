const { check, validationResult } = require('express-validator');

const validateRegister = [
  check('fullName', 'Full name is required').notEmpty().trim(),
  check('rollNumber', 'Roll number is required').notEmpty().trim(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
  check('department', 'Department is required').notEmpty().trim(),
  check('year', 'Year is required').notEmpty().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateStudentLogin = [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateAdminLogin = [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateEvent = [
  check('title', 'Title is required').notEmpty().trim(),
  check('description', 'Description is required').notEmpty().trim(),
  check('category', 'Category is required').notEmpty().trim(),
  check('venue', 'Venue is required').notEmpty().trim(),
  check('eventDate', 'Event date is required').notEmpty(),
  check('registrationDeadline', 'Registration deadline is required').notEmpty(),
  check('startTime', 'Start time is required').notEmpty().trim(),
  check('endTime', 'End time is required').notEmpty().trim(),
  check('capacity', 'Capacity must be greater than zero').isInt({ min: 1 }),
  // Custom validators
  check('registrationDeadline').custom((val, { req }) => {
    if (new Date(val) > new Date(req.body.eventDate)) {
      throw new Error('Registration deadline cannot be after the event date');
    }
    return true;
  }),
  check('endTime').custom((val, { req }) => {
    const start = req.body.startTime;
    if (start && val) {
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = val.split(':').map(Number);
      
      if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
        throw new Error('Invalid start or end time format');
      }

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      if (startMinutes >= endMinutes) {
        throw new Error('Start time must be before end time');
      }
    }
    return true;
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateRegister,
  validateStudentLogin,
  validateAdminLogin,
  validateEvent,
};
