const { Student, Admin, LoginHistory } = require('../models');
const { logAudit } = require('../middleware/auditLogger');
const bcrypt = require('bcryptjs');

// @desc    Update user profile (Student or Admin)
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const isStudent = req.role === 'Student';
    const role = isStudent ? 'Student' : 'Admin';
    const { fullName, username, department, year, profileImage } = req.body;

    if (isStudent) {
      const student = await Student.findByPk(userId);
      if (!student) return res.status(404).json({ message: 'Student profile not found' });

      if (fullName) student.fullName = fullName.trim();
      if (department) student.department = department.trim();
      if (year) student.year = year.trim();
      if (profileImage) student.profileImage = profileImage;

      await student.save();

      await logAudit({ req, userId, userRole: role, action: 'PROFILE_UPDATE', details: 'Student updated profile' });

      return res.json({
        id: student.id,
        _id: student.id,
        fullName: student.fullName,
        email: student.email,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
        profileImage: student.profileImage,
        role: 'Student',
        message: 'Profile updated successfully',
      });
    } else {
      const admin = await Admin.findByPk(userId);
      if (!admin) return res.status(404).json({ message: 'Admin profile not found' });

      if (username) admin.username = username.trim();
      if (profileImage) admin.profileImage = profileImage;

      await admin.save();

      await logAudit({ req, userId, userRole: role, action: 'PROFILE_UPDATE', details: 'Admin updated profile' });

      return res.json({
        _id: admin.id,
        username: admin.username,
        email: admin.email,
        profileImage: admin.profileImage,
        role: 'Admin',
        message: 'Profile updated successfully',
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

// @desc    Change user password (Student or Admin)
// @route   PUT /api/profile/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const isStudent = req.role === 'Student';
    const role = isStudent ? 'Student' : 'Admin';
    const { currentPassword, newPassword } = req.body;

    const isStrongPassword = (pass) => {
      return pass && pass.length >= 8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /\d/.test(pass) && /\W/.test(pass);
    };

    if (!newPassword || !isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    const UserClass = isStudent ? Student : Admin;
    const userObj = await UserClass.findByPk(userId);

    if (!userObj) return res.status(404).json({ message: 'User not found' });

    const isMatch = await userObj.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Prevent password reuse of last 5 passwords
    let history = [];
    try {
      history = JSON.parse(userObj.passwordHistory || '[]');
    } catch (e) {
      history = [];
    }

    const matchCurrent = await userObj.comparePassword(newPassword);
    let matchHistory = false;
    for (const oldHash of history) {
      if (await bcrypt.compare(newPassword, oldHash)) {
        matchHistory = true;
        break;
      }
    }

    if (matchCurrent || matchHistory) {
      return res.status(400).json({ message: 'You cannot reuse any of your last 5 passwords.' });
    }

    // Push current hash into history array
    history.unshift(userObj.password);
    if (history.length > 5) {
      history = history.slice(0, 5);
    }
    userObj.passwordHistory = JSON.stringify(history);

    userObj.password = newPassword;
    await userObj.save();

    await logAudit({ req, userId, userRole: role, action: 'PASSWORD_CHANGE', details: 'User changed password successfully' });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error changing password', error: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/profile/upload
// @access  Private
const uploadProfilePicture = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.user.id;
    const isStudent = req.role === 'Student';

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL or payload is required' });
    }

    const UserClass = isStudent ? Student : Admin;
    const userObj = await UserClass.findByPk(userId);

    if (!userObj) return res.status(404).json({ message: 'User not found' });

    userObj.profileImage = imageUrl;
    await userObj.save();

    res.json({ profileImage: userObj.profileImage, message: 'Profile image updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error uploading profile image', error: error.message });
  }
};

// @desc    Get login history for logged-in user
// @route   GET /api/profile/login-history
// @access  Private
const getLoginHistory = async (req, res) => {
  try {
    const history = await LoginHistory.findAll({
      where: { userId: req.user.id, userRole: req.role },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving login history', error: error.message });
  }
};

module.exports = {
  updateProfile,
  changePassword,
  uploadProfilePicture,
  getLoginHistory,
};
