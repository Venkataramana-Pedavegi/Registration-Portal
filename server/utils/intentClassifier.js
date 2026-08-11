/**
 * Intent Classifier & Knowledge Base Engine for Campus AI Assistant
 */

const INTENTS = {
  FEEDBACK: 'feedback',
  REGISTRATION: 'registration',
  LOGIN: 'login',
  EVENTS: 'events',
  CERTIFICATES: 'certificates',
  QR_CODE: 'qr_code',
  ATTENDANCE: 'attendance',
  NOTIFICATIONS: 'notifications',
  PROFILE: 'profile',
  PASSWORD_RESET: 'password_reset',
  CALENDAR: 'calendar',
  VOLUNTEERS: 'volunteers',
  LEADERBOARD: 'leaderboard',
  WAITLIST: 'waitlist',
  CONTACT: 'contact',
  GENERAL_HELP: 'general_help',
  CREATE_WORKSHOP: 'create_workshop',
  INACTIVE_STUDENTS: 'inactive_students',
  ATTENDANCE_SUMMARY: 'attendance_summary',
  SEND_REMINDERS: 'send_reminders',
  RECOMMENDATION: 'recommendation',
  UNKNOWN: 'unknown',
};

/**
 * Classify input query intent based on precise keyword & semantic rule matching
 */
const detectIntent = (text) => {
  if (!text) return INTENTS.UNKNOWN;
  const q = text.toLowerCase().trim();

  // 0. Admin Shortcuts & Specific Action Intents
  if (q.includes('create a workshop') || (q.includes('create') && q.includes('workshop'))) {
    return INTENTS.CREATE_WORKSHOP || 'create_workshop';
  }
  if (q.includes('inactive student') || q.includes('inactive students')) {
    return INTENTS.INACTIVE_STUDENTS || 'inactive_students';
  }
  if (q.includes('attendance summary') || (q.includes('attendance') && q.includes('rate'))) {
    return INTENTS.ATTENDANCE_SUMMARY || 'attendance_summary';
  }
  if (q.includes('send reminder') || q.includes('draft reminder') || q.includes('reminder email')) {
    return INTENTS.SEND_REMINDERS || 'send_reminders';
  }
  if (q.includes('what should i attend') || q.includes('recommendation') || q.includes('recommend')) {
    return INTENTS.RECOMMENDATION || 'recommendation';
  }

  // 1. Feedback
  if (
    q.includes('feedback') ||
    q.includes('rate') ||
    q.includes('rating') ||
    q.includes('review') ||
    q.includes('star') ||
    (q.includes('give') && q.includes('option'))
  ) {
    return INTENTS.FEEDBACK;
  }

  // 2. QR Code
  if (
    q.includes('qr') ||
    q.includes('entry pass') ||
    q.includes('entry code') ||
    q.includes('barcode') ||
    q.includes('ticket') ||
    /\bpass\b/.test(q)
  ) {
    return INTENTS.QR_CODE;
  }

  // 3. Certificates
  if (
    q.includes('certificate') ||
    q.includes('cert') ||
    q.includes('verify certificate') ||
    q.includes('download cert')
  ) {
    return INTENTS.CERTIFICATES;
  }

  // 4. Waitlist
  if (
    q.includes('waitlist') ||
    q.includes('queue') ||
    q.includes('seat full') ||
    q.includes('full capacity') ||
    q.includes('waiting list')
  ) {
    return INTENTS.WAITLIST;
  }


  // 6. Leaderboard / Badges / XP
  if (
    q.includes('leaderboard') ||
    q.includes('rank') ||
    q.includes('points') ||
    q.includes('badge') ||
    q.includes('xp') ||
    q.includes('achievement') ||
    q.includes('top participant') ||
    q.includes('score') ||
    q.includes('hall of fame')
  ) {
    return INTENTS.LEADERBOARD;
  }

  // 7. Volunteers / Volunteer Tasks
  if (
    q.includes('volunteer') ||
    q.includes('volunteering') ||
    q.includes('task assignment') ||
    q.includes('volunteer task') ||
    q.includes('volunteer hours')
  ) {
    return INTENTS.VOLUNTEERS;
  }

  // 8. Calendar
  if (
    q.includes('calendar') ||
    q.includes('schedule') ||
    q.includes('month') ||
    q.includes('week') ||
    q.includes('weekly') ||
    q.includes('holiday')
  ) {
    return INTENTS.CALENDAR;
  }

  // 9. Attendance
  if (
    q.includes('attendance') ||
    q.includes('present') ||
    q.includes('check-in') ||
    q.includes('mark attendance') ||
    q.includes('absent') ||
    q.includes('how many events did i attend') ||
    q.includes('events did i attend') ||
    q.includes('attended')
  ) {
    return INTENTS.ATTENDANCE;
  }

  // 10. Password Reset
  if (
    q.includes('forgot password') ||
    q.includes('reset password') ||
    q.includes('change password') ||
    q.includes('password')
  ) {
    return INTENTS.PASSWORD_RESET;
  }

  // 11. Profile
  if (
    q.includes('profile') ||
    q.includes('edit profile') ||
    q.includes('avatar') ||
    q.includes('my info') ||
    q.includes('personal info') ||
    q.includes('roll number') ||
    (q.includes('department') && !q.includes('event'))
  ) {
    return INTENTS.PROFILE;
  }

  // 12. Notifications
  if (
    q.includes('notification') ||
    q.includes('alert') ||
    q.includes('message') ||
    q.includes('bell')
  ) {
    return INTENTS.NOTIFICATIONS;
  }

  // 13. Registration
  if (
    q.includes('register') ||
    q.includes('registration') ||
    q.includes('sign up') ||
    q.includes('enroll') ||
    q.includes('cancel registration')
  ) {
    return INTENTS.REGISTRATION;
  }

  // 14. Login
  if (
    q.includes('login') ||
    q.includes('sign in') ||
    q.includes('log in') ||
    q.includes('auth') ||
    q.includes('credentials')
  ) {
    return INTENTS.LOGIN;
  }

  // 15. Contact
  if (
    q.includes('contact') ||
    q.includes('email') ||
    q.includes('phone') ||
    q.includes('support') ||
    q.includes('helpdesk') ||
    q.includes('located') ||
    q.includes('office')
  ) {
    return INTENTS.CONTACT;
  }

  // 16. Events
  if (
    (q.includes('event') && !q.includes('calendar')) ||
    q.includes('workshop') ||
    q.includes('fest') ||
    q.includes('seminar') ||
    q.includes('upcoming') ||
    q.includes('tomorrow')
  ) {
    return INTENTS.EVENTS;
  }

  // 17. General Help
  if (
    q.includes('help') ||
    q.includes('hi') ||
    q.includes('hello') ||
    q.includes('what can you do') ||
    q.includes('menu') ||
    q.includes('who are you')
  ) {
    return INTENTS.GENERAL_HELP;
  }

  return INTENTS.UNKNOWN;
};

/**
 * Get Context-Aware Knowledge Base Response
 */
const getKnowledgeBaseResponse = (intent, currentPage = '', userContext = {}) => {
  const isEventPage = currentPage && (currentPage.includes('/events/') || currentPage.includes('EventDetails'));
  const isRegPage = currentPage && currentPage.includes('/my-registrations');

  switch (intent) {
    case INTENTS.FEEDBACK:
      if (isEventPage) {
        return "The ⭐ Give Feedback button is available on this page below your registration status once you have registered for the event.";
      }
      return "You can submit feedback after registering for the event. Open the Event Details page or My Registrations and click the ⭐ Give Feedback button. Rate the event and submit your comments.";

    case INTENTS.QR_CODE:
      if (isRegPage) {
        return "Your QR Code passes are listed on this page next to each confirmed event registration.";
      }
      return "Go to My Registrations → Select your registered event → Click View QR Code to open your entry pass.";

    case INTENTS.CERTIFICATES:
      return "Go to Certificates → Select your completed event → Click Download Certificate. Anyone can also verify certificate authenticity at /verify-certificate.";

    case INTENTS.WAITLIST:
      if (isEventPage) {
        return "If this event is full, a 'Join Waitlist' button is displayed right here on this page. Clicking it places you in line, and if a registered student cancels, you will be automatically confirmed!";
      }
      return "When an event capacity is full, click 'Join Waitlist' on the Event Details page. If a confirmed student cancels, the first waitlisted student is automatically promoted and notified via email & live push notification.";


    case INTENTS.VOLUNTEERS:
      return "Go to Volunteers → Apply as Event Volunteer. Once approved by an admin, you can view your assigned tasks and log your volunteer hours!";

    case INTENTS.LEADERBOARD:
      return "Go to Leaderboard to view student rankings, top participants, top volunteers, earned badges, and department scores!";

    case INTENTS.CALENDAR:
      return "Go to Event Calendar to view monthly and weekly schedules of campus events, filter by department, or click any date to view scheduled activities.";

    case INTENTS.ATTENDANCE:
      return "Attendance is verified by event coordinators scanning your registration QR Code pass at the venue entrance. View your attendance history in your dashboard.";

    case INTENTS.PASSWORD_RESET:
      return "On the login page, click 'Forgot Password?'. Enter your registered email address to receive a secure password reset link.";

    case INTENTS.PROFILE:
      return "Go to Profile Settings from the top right user menu to update your personal details, academic department, and profile image.";

    case INTENTS.NOTIFICATIONS:
      return "Click the Notification Bell in the top navigation bar or go to Notifications to view real-time updates regarding registrations, waitlist promotions, and certificates.";

    case INTENTS.REGISTRATION:
      return "Browse events from the Home or Student Dashboard, select an event, and click 'Register for Event'.";

    case INTENTS.LOGIN:
      return "Students can log in via Student Login using their email and password. Admins/Coordinators use the Admin Login portal.";

    case INTENTS.EVENTS:
      return "Explore all campus events on the Student Dashboard or Event Calendar. Filter by category, department, or status (Upcoming, Ongoing).";

    case INTENTS.CONTACT:
      return "For queries, contact the Sri Vasavi Campus Event Committee at support@srivasaviengg.ac.in or visit the Student Affairs Office.";

    case INTENTS.CREATE_WORKSHOP:
      return "Instruct the assistant to draft a new workshop blueprint template or manage events on the Admin Dashboard.";

    case INTENTS.INACTIVE_STUDENTS:
      return "Query students with zero event registrations to compile an inactive student list.";

    case INTENTS.ATTENDANCE_SUMMARY:
      return "View check-in percentage rates, attendance totals, and completed event reports.";

    case INTENTS.SEND_REMINDERS:
      return "Draft and send event reminder emails to registered attendees for tomorrow's events.";

    case INTENTS.RECOMMENDATION:
      return "Get personalized event recommendations based on your department focus and academic background.";

    case INTENTS.GENERAL_HELP:
      return "Hello! I am your Campus Event AI Assistant. I can help with:\n1. 📅 Events & Calendar\n2. 🎟️ Registrations & QR Passes\n3. 🎓 Certificates & Verification\n4. ⭐ Event Feedback & Ratings\n5. ⏳ Waitlist\n6. 🏆 Leaderboards & Volunteers\n\nHow can I help you today?";

    default:
      return null;
  }
};

module.exports = {
  INTENTS,
  detectIntent,
  getKnowledgeBaseResponse,
};
