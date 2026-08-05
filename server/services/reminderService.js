const { Op } = require('sequelize');
const { Event, Registration, Student } = require('../models');

const combineDateAndTime = (eventDate, startTime) => {
  const d = new Date(eventDate);
  const [hours, minutes] = (startTime || '00:00').split(':');
  d.setHours(Number(hours), Number(minutes), 0, 0);
  return d;
};

const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    
    // Find upcoming events starting in next 25 hours
    const events = await Event.findAll({
      where: {
        status: 'Upcoming',
        [Op.or]: [
          { reminderSent24h: false },
          { reminderSent1h: false }
        ]
      }
    });

    for (const event of events) {
      const eventStart = combineDateAndTime(event.eventDate, event.startTime);
      const diffMs = eventStart - now;
      const diffHrs = diffMs / (1000 * 60 * 60);

      // Check 24 hour reminder
      if (diffHrs > 0 && diffHrs <= 24 && !event.reminderSent24h) {
        console.log(`Sending 24h reminders for: ${event.title}`);
        await sendReminderToAll(event, 24);
        event.reminderSent24h = true;
        await event.save();
      }

      // Check 1 hour reminder
      if (diffHrs > 0 && diffHrs <= 1 && !event.reminderSent1h) {
        console.log(`Sending 1h reminders for: ${event.title}`);
        await sendReminderToAll(event, 1);
        event.reminderSent1h = true;
        await event.save();
      }
    }
  } catch (err) {
    console.error('Error running reminder service:', err.message);
  }
};

const sendReminderToAll = async (event, hoursLeft) => {
  try {
    const registrations = await Registration.findAll({
      where: { eventId: event.id, status: 'Registered' },
      include: [{ model: Student, attributes: ['fullName', 'email'] }]
    });

    if (registrations.length === 0) return;

    const sendEmail = require('../utils/sendEmail');
    const promises = registrations.map(reg => {
      if (reg.Student?.email) {
        return sendEmail({
          to: reg.Student.email,
          subject: `Event Reminder: ${event.title} starts in ${hoursLeft} hour(s)!`,
          templateTitle: 'Upcoming Event Reminder',
          html: `
            <p>Dear <strong>${reg.Student.fullName}</strong>,</p>
            <p>This is a friendly reminder that the event <strong>${event.title}</strong> starts in approximately ${hoursLeft} hour(s)!</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 15px 0;">
              <p style="margin: 3px 0;"><strong>Event:</strong> ${event.title}</p>
              <p style="margin: 3px 0;"><strong>Date:</strong> ${new Date(event.eventDate).toLocaleDateString()}</p>
              <p style="margin: 3px 0;"><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
              <p style="margin: 3px 0;"><strong>Venue:</strong> ${event.venue}</p>
              <p style="margin: 3px 0;"><strong>Registration ID:</strong> #${reg.id}</p>
            </div>
            <p>Make sure to carry your entry QR pass (attached to your signup confirmation or visible on your student portal) to the event venue.</p>
            <p>We look forward to seeing you there!</p>
          `
        });
      }
    });

    await Promise.all(promises);
    console.log(`Successfully sent ${promises.length} reminder emails.`);
  } catch (err) {
    console.error(`Failed to send reminders for event ${event.id}:`, err.message);
  }
};

const initReminderScheduler = () => {
  // Run on startup
  checkAndSendReminders();
  
  // Run every 15 minutes
  setInterval(checkAndSendReminders, 15 * 60 * 1000);
  console.log('⏰ Event reminders background scheduler initialized.');
};

module.exports = {
  initReminderScheduler
};
