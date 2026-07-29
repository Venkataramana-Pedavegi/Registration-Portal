const { Student } = require('../models');
const generateToken = require('../utils/generateToken');

// @desc    Register a new student
// @route   POST /api/student/register
// @access  Public
const registerStudent = async (req, res) => {
  try {
    const { fullName, rollNumber, email, department, year, password } = req.body;

    // Check if email already exists
    const emailExists = await Student.findOne({ where: { email: email.toLowerCase() } });
    if (emailExists) {
      return res.status(400).json({ message: 'A student with this email already exists' });
    }

    // Check if roll number already exists
    const rollExists = await Student.findOne({ where: { rollNumber: rollNumber.toUpperCase() } });
    if (rollExists) {
      return res.status(400).json({ message: 'A student with this roll number already exists' });
    }

    // Create student
    const student = await Student.create({
      fullName,
      rollNumber: rollNumber.toUpperCase(),
      email: email.toLowerCase(),
      department,
      year,
      password,
    });

    if (student) {
      res.status(201).json({
        _id: student.id,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        email: student.email,
        department: student.department,
        year: student.year,
        role: 'Student',
        token: generateToken(student.id, 'Student'),
      });
    } else {
      res.status(400).json({ message: 'Invalid student data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Auth student & get token
// @route   POST /api/student/login
// @access  Public
const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ where: { email: email.toLowerCase() } });

    if (student && (await student.comparePassword(password))) {
      res.json({
        _id: student.id,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        email: student.email,
        department: student.department,
        year: student.year,
        role: 'Student',
        token: generateToken(student.id, 'Student'),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private
const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findByPk(req.user.id);

    if (student) {
      res.json({
        _id: student.id,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        email: student.email,
        department: student.department,
        year: student.year,
        role: 'Student',
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      });
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  getStudentProfile,
};
