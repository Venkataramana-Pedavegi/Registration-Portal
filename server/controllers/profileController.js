const { Student, Admin } = require('../models');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Update user profile (Student or Admin)
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const isStudent = !req.user.username; // Students have rollNumber, Admins have username
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

      await logAudit({ req, userId, userRole: role, action: 'UPDATE_PROFILE', details: 'Student updated profile' });

      return res.json({
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

      await logAudit({ req, userId, userRole: role, action: 'UPDATE_PROFILE', details: 'Admin updated profile' });

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
    const isStudent = !req.user.username;
    const role = isStudent ? 'Student' : 'Admin';
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const UserClass = isStudent ? Student : Admin;
    const userObj = await UserClass.findByPk(userId);

    if (!userObj) return res.status(404).json({ message: 'User not found' });

    const isMatch = await userObj.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    userObj.password = newPassword;
    await userObj.save();

    await logAudit({ req, userId, userRole: role, action: 'CHANGE_PASSWORD', details: 'User changed password' });

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
    const isStudent = !req.user.username;

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

module.exports = {
  updateProfile,
  changePassword,
  uploadProfilePicture,
};
