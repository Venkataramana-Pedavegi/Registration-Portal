const { Volunteer, VolunteerTask, Event, Student, Leaderboard } = require('../models');

const applyVolunteer = async (req, res) => {
  try {
    const { eventId, department, skills } = req.body;
    const studentId = req.user.id;

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const existing = await Volunteer.findOne({ where: { eventId, studentId } });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied as a volunteer for this event' });
    }

    const volunteer = await Volunteer.create({
      studentId,
      eventId,
      department: department || req.user.department || 'General',
      skills: skills || '',
      status: 'pending',
    });

    res.status(201).json({ message: 'Volunteer application submitted successfully', volunteer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVolunteers = async (req, res) => {
  try {
    const { eventId, status } = req.query;
    const where = {};
    if (eventId) where.eventId = eventId;
    if (status) where.status = status;

    const volunteers = await Volunteer.findAll({
      where,
      include: [
        { model: Student, attributes: ['id', 'name', 'email', 'rollNumber', 'department', 'phone'] },
        { model: Event, attributes: ['id', 'title', 'eventDate'] },
        { model: VolunteerTask },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const volunteer = await Volunteer.findByPk(id, {
      include: [
        { model: Student, attributes: ['fullName', 'email'] },
        { model: Event, attributes: ['title'] },
      ],
    });
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer application not found' });
    }

    volunteer.status = status;
    await volunteer.save();

    if (status === 'approved') {
      try {
        const { awardPoints } = require('../services/GamificationService');
        await awardPoints(
          volunteer.studentId,
          30,
          'VOLUNTEER_APPROVE',
          `Approved as volunteer for event: ${volunteer.Event?.title || 'Event'}`,
          volunteer.eventId,
          req
        );
      } catch (gErr) {
        console.error('Non-blocking volunteer approval points allocation error:', gErr.message);
      }
    }

    if (volunteer.Student?.email) {
      const sendEmail = require('../utils/sendEmail');
      await sendEmail({
        to: volunteer.Student.email,
        subject: `Volunteer Application ${status === 'approved' ? 'Approved' : 'Rejected'} - ${volunteer.Event?.title}`,
        templateTitle: 'Volunteer Application Update',
        html: status === 'approved' ? `
          <p>Dear <strong>${volunteer.Student.fullName}</strong>,</p>
          <p>We are pleased to inform you that your application to volunteer for the event <strong>${volunteer.Event?.title}</strong> has been <strong>APPROVED</strong>!</p>
          <p>Thank you for volunteering. The event coordinators will assign tasks and reach out to you shortly.</p>
        ` : `
          <p>Dear <strong>${volunteer.Student.fullName}</strong>,</p>
          <p>Thank you for your interest in volunteering for the event <strong>${volunteer.Event?.title}</strong>.</p>
          <p>Unfortunately, we are unable to accept your application as a volunteer at this time due to slot limitations.</p>
          <p>We encourage you to participate in the event as an attendee and volunteer for future events!</p>
        `,
      }).catch((err) => console.error('Volunteer email status update failed:', err.message));
    }

    res.json({ message: `Volunteer application ${status}`, volunteer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignTask = async (req, res) => {
  try {
    const { volunteerId, eventId, title, description } = req.body;

    if (!volunteerId || !eventId || !title) {
      return res.status(400).json({ message: 'Volunteer ID, Event ID, and Task Title are required' });
    }

    const volunteer = await Volunteer.findByPk(volunteerId);
    if (!volunteer || volunteer.status !== 'approved') {
      return res.status(400).json({ message: 'Volunteer must be approved before assigning tasks' });
    }

    const task = await VolunteerTask.create({
      volunteerId,
      eventId,
      title,
      description: description || '',
      status: 'pending',
    });

    const vData = await Volunteer.findByPk(volunteerId, {
      include: [
        { model: Student, attributes: ['fullName', 'email'] },
        { model: Event, attributes: ['title'] },
      ],
    });

    if (vData && vData.Student?.email) {
      const sendEmail = require('../utils/sendEmail');
      await sendEmail({
        to: vData.Student.email,
        subject: `New Volunteer Task Assigned - ${vData.Event?.title}`,
        templateTitle: 'Volunteer Task Assignment',
        html: `
          <p>Dear <strong>${vData.Student.fullName}</strong>,</p>
          <p>A new volunteering task has been assigned to you for the event <strong>${vData.Event?.title}</strong>:</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 15px 0;">
            <p style="margin: 3px 0;"><strong>Task Title:</strong> ${title}</p>
            <p style="margin: 3px 0;"><strong>Description:</strong> ${description || 'No description provided'}</p>
            <p style="margin: 3px 0;"><strong>Task Status:</strong> Pending</p>
          </div>
          <p>Please check your student dashboard to review the task and mark its progress.</p>
        `,
      }).catch((err) => console.error('Volunteer task email notification failed:', err.message));
    }

    res.status(201).json({ message: 'Task assigned successfully', task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'pending', 'in_progress', 'completed'

    const task = await VolunteerTask.findByPk(id, {
      include: [{ model: Volunteer }],
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    await task.save();

    if (status === 'completed' && task.Volunteer) {
      task.Volunteer.hours += 2;
      await task.Volunteer.save();

      // Award points (+50 XP) and volunteer hours (+2)
      try {
        const { awardPoints } = require('../services/GamificationService');
        await awardPoints(
          task.Volunteer.studentId,
          50,
          'VOLUNTEER_TASK_COMPLETE',
          `Completed volunteer task: ${task.title}`,
          task.eventId,
          req
        );
        
        let leaderboard = await Leaderboard.findOne({ where: { studentId: task.Volunteer.studentId } });
        if (leaderboard) {
          leaderboard.volunteerHours += 2;
          await leaderboard.save();
        }
      } catch (gErr) {
        console.error('Non-blocking volunteer task points allocation error:', gErr.message);
      }
    }

    res.json({ message: 'Task status updated', task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVolunteerDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    const applications = await Volunteer.findAll({
      where: { studentId },
      include: [
        { model: Event, attributes: ['id', 'title', 'eventDate', 'venue'] },
        { model: VolunteerTask },
      ],
    });

    const totalHours = applications.reduce((acc, curr) => acc + (curr.hours || 0), 0);

    res.json({
      applications,
      totalHours,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyVolunteer,
  getVolunteers,
  approveVolunteer,
  assignTask,
  updateTaskStatus,
  getVolunteerDashboard,
};
