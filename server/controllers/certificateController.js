const { Certificate, Event, Student, Registration } = require('../models');
const { generateCertificatePDF } = require('../utils/pdfGenerator');

// @desc    Get certificates for logged-in student
// @route   GET /api/certificates
// @access  Private/Student
const getCertificates = async (req, res) => {
  try {
    const studentId = req.user.id;

    const certificates = await Certificate.findAll({
      where: { studentId },
      include: [
        { model: Event, attributes: ['title', 'category', 'eventDate', 'organizer', 'venue'] },
        { model: Registration, attributes: ['id', 'registrationDate', 'qrCodeUrl'] },
      ],
      order: [['issueDate', 'DESC']],
    });

    const formatted = certificates.map((cert) => {
      const plain = cert.toJSON();
      plain._id = plain.id;
      if (plain.Event) plain.Event._id = plain.Event.id;
      return plain;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving certificates', error: error.message });
  }
};

// @desc    Download PDF Certificate
// @route   GET /api/certificates/:id/download
// @access  Private
const downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const cert = await Certificate.findByPk(id, {
      include: [
        { model: Student, attributes: ['fullName', 'rollNumber'] },
        { model: Event, attributes: ['title', 'organizer', 'eventDate'] },
        { model: Registration, attributes: ['qrCodeUrl'] },
      ],
    });

    if (!cert) {
      return res.status(404).json({ message: 'Certificate record not found' });
    }

    const pdfBuffer = await generateCertificatePDF({
      studentName: cert.Student?.fullName || 'Student Participant',
      rollNumber: cert.Student?.rollNumber,
      eventTitle: cert.Event?.title || 'Campus Event',
      eventDate: cert.Event?.eventDate,
      organizer: cert.Event?.organizer || 'College Event Committee',
      certificateId: cert.certificateId,
      issueDate: cert.issueDate,
      qrCodeUrl: cert.Registration?.qrCodeUrl || cert.qrVerificationCode,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${cert.certificateId}.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Server error generating PDF certificate', error: error.message });
  }
};

// @desc    Regenerate Certificate (Admin)
// @route   POST /api/certificates/:id/regenerate
// @access  Private/Admin
const regenerateCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const cert = await Certificate.findByPk(id, {
      include: [
        { model: Student, attributes: ['fullName', 'rollNumber', 'email'] },
        { model: Event, attributes: ['title'] },
      ],
    });

    if (!cert) {
      return res.status(404).json({ message: 'Certificate record not found' });
    }

    cert.issueDate = new Date();
    await cert.save();

    res.json({ message: 'Certificate regenerated successfully', certificate: cert });
  } catch (error) {
    res.status(500).json({ message: 'Server error regenerating certificate', error: error.message });
  }
};

// @desc    Public Certificate Verification
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
const verifyCertificatePublic = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const cert = await Certificate.findOne({
      where: { certificateId },
      include: [
        { model: Student, attributes: ['id', 'fullName', 'name', 'rollNumber', 'department'] },
        { model: Event, attributes: ['id', 'title', 'category', 'eventDate', 'organizer', 'venue'] },
      ],
    });

    if (!cert) {
      return res.status(404).json({ isValid: false, message: 'Certificate not found or invalid Certificate ID' });
    }

    res.json({
      isValid: true,
      certificateId: cert.certificateId,
      studentName: cert.Student?.fullName || cert.Student?.name || 'Verified Student',
      rollNumber: cert.Student?.rollNumber,
      department: cert.Student?.department,
      eventName: cert.Event?.title || 'Campus Event',
      eventCategory: cert.Event?.category,
      eventDate: cert.Event?.eventDate,
      organizer: cert.Event?.organizer,
      issueDate: cert.issueDate,
    });
  } catch (error) {
    res.status(500).json({ isValid: false, message: 'Server error verifying certificate', error: error.message });
  }
};

module.exports = {
  getCertificates,
  downloadCertificate,
  regenerateCertificate,
  verifyCertificatePublic,
};
