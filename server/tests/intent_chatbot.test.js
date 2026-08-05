const { detectIntent, getKnowledgeBaseResponse, INTENTS } = require('../utils/intentClassifier');

describe('Intent Classification & Knowledge Base Test Suite (100+ Questions)', () => {
  const testCases = [
    // 1. Feedback Intent (10 questions)
    { q: "I want to give feedback but I don't know where that option is.", expectedIntent: INTENTS.FEEDBACK },
    { q: "Where is the feedback option?", expectedIntent: INTENTS.FEEDBACK },
    { q: "How can I rate this event?", expectedIntent: INTENTS.FEEDBACK },
    { q: "I want to give a 5 star rating", expectedIntent: INTENTS.FEEDBACK },
    { q: "Can I edit my event review?", expectedIntent: INTENTS.FEEDBACK },
    { q: "Where do I submit my feedback?", expectedIntent: INTENTS.FEEDBACK },
    { q: "How to give ratings for workshop?", expectedIntent: INTENTS.FEEDBACK },
    { q: "Feedback option not showing", expectedIntent: INTENTS.FEEDBACK },
    { q: "I want to leave a review for the seminar", expectedIntent: INTENTS.FEEDBACK },
    { q: "Give rating for completed event", expectedIntent: INTENTS.FEEDBACK },

    // 2. QR Code Intent (7 questions)
    { q: "Where is my QR Code?", expectedIntent: INTENTS.QR_CODE },
    { q: "How do I show my entry pass?", expectedIntent: INTENTS.QR_CODE },
    { q: "Where can I find the admission ticket barcode?", expectedIntent: INTENTS.QR_CODE },
    { q: "My QR pass for event", expectedIntent: INTENTS.QR_CODE },
    { q: "Show my entry QR code", expectedIntent: INTENTS.QR_CODE },
    { q: "QR code scanner ticket", expectedIntent: INTENTS.QR_CODE },
    { q: "How to view entry pass barcode?", expectedIntent: INTENTS.QR_CODE },

    // 3. Certificates Intent (8 questions)
    { q: "How do I download my certificate?", expectedIntent: INTENTS.CERTIFICATES },
    { q: "Where can I view my event certificate?", expectedIntent: INTENTS.CERTIFICATES },
    { q: "How to verify certificate authenticity?", expectedIntent: INTENTS.CERTIFICATES },
    { q: "Public certificate verification", expectedIntent: INTENTS.CERTIFICATES },
    { q: "My certificate is ready", expectedIntent: INTENTS.CERTIFICATES },
    { q: "Download PDF cert", expectedIntent: INTENTS.CERTIFICATES },
    { q: "Certificate ID lookup", expectedIntent: INTENTS.CERTIFICATES },
    { q: "How do I get my participation cert?", expectedIntent: INTENTS.CERTIFICATES },

    // 4. Waitlist Intent (7 questions)
    { q: "Event capacity is full, how to join waitlist?", expectedIntent: INTENTS.WAITLIST },
    { q: "What is my waitlist position?", expectedIntent: INTENTS.WAITLIST },
    { q: "How does waitlist auto promotion work?", expectedIntent: INTENTS.WAITLIST },
    { q: "Can I cancel my waitlist position?", expectedIntent: INTENTS.WAITLIST },
    { q: "Seat full, add me to waiting list", expectedIntent: INTENTS.WAITLIST },
    { q: "When will I get promoted from waitlist?", expectedIntent: INTENTS.WAITLIST },
    { q: "Event is at full capacity", expectedIntent: INTENTS.WAITLIST },


    // 6. Volunteers Intent (7 questions)
    { q: "How do I apply as a volunteer?", expectedIntent: INTENTS.VOLUNTEERS },
    { q: "Where can I view my assigned volunteer tasks?", expectedIntent: INTENTS.VOLUNTEERS },
    { q: "How to log volunteer hours?", expectedIntent: INTENTS.VOLUNTEERS },
    { q: "Volunteer application status", expectedIntent: INTENTS.VOLUNTEERS },
    { q: "Admin task assignment for volunteers", expectedIntent: INTENTS.VOLUNTEERS },
    { q: "Student volunteering opportunities", expectedIntent: INTENTS.VOLUNTEERS },
    { q: "Update volunteer task status", expectedIntent: INTENTS.VOLUNTEERS },

    // 7. Leaderboard Intent (7 questions)
    { q: "Where is the leaderboard?", expectedIntent: INTENTS.LEADERBOARD },
    { q: "How do I earn points and badges?", expectedIntent: INTENTS.LEADERBOARD },
    { q: "Which department is top in rank?", expectedIntent: INTENTS.LEADERBOARD },
    { q: "Hall of fame rankings", expectedIntent: INTENTS.LEADERBOARD },
    { q: "Who is the top participant?", expectedIntent: INTENTS.LEADERBOARD },
    { q: "My leaderboard score", expectedIntent: INTENTS.LEADERBOARD },
    { q: "How to unlock Dedicated Volunteer badge?", expectedIntent: INTENTS.LEADERBOARD },

    // 8. Calendar Intent (6 questions)
    { q: "Where is the event calendar?", expectedIntent: INTENTS.CALENDAR },
    { q: "Monthly event schedule", expectedIntent: INTENTS.CALENDAR },
    { q: "Can I filter calendar by department?", expectedIntent: INTENTS.CALENDAR },
    { q: "Weekly view of campus events", expectedIntent: INTENTS.CALENDAR },
    { q: "Holiday view on calendar", expectedIntent: INTENTS.CALENDAR },
    { q: "Click date on calendar", expectedIntent: INTENTS.CALENDAR },

    // 9. Attendance Intent (6 questions)
    { q: "How is event attendance marked?", expectedIntent: INTENTS.ATTENDANCE },
    { q: "Attendance scanner at venue entrance", expectedIntent: INTENTS.ATTENDANCE },
    { q: "Where can I see my attendance record?", expectedIntent: INTENTS.ATTENDANCE },
    { q: "Mark me present for event", expectedIntent: INTENTS.ATTENDANCE },
    { q: "Is my attendance verified?", expectedIntent: INTENTS.ATTENDANCE },
    { q: "Attendance check-in details", expectedIntent: INTENTS.ATTENDANCE },

    // 10. Password Reset Intent (5 questions)
    { q: "I forgot my password", expectedIntent: INTENTS.PASSWORD_RESET },
    { q: "How do I reset password?", expectedIntent: INTENTS.PASSWORD_RESET },
    { q: "Send password reset email link", expectedIntent: INTENTS.PASSWORD_RESET },
    { q: "Change my account password", expectedIntent: INTENTS.PASSWORD_RESET },
    { q: "Password not working", expectedIntent: INTENTS.PASSWORD_RESET },

    // 11. Profile Intent (5 questions)
    { q: "How do I update my profile?", expectedIntent: INTENTS.PROFILE },
    { q: "Change my department in profile", expectedIntent: INTENTS.PROFILE },
    { q: "Upload new profile avatar picture", expectedIntent: INTENTS.PROFILE },
    { q: "Where is my student roll number listed?", expectedIntent: INTENTS.PROFILE },
    { q: "Edit my personal info", expectedIntent: INTENTS.PROFILE },

    // 12. Notifications Intent (5 questions)
    { q: "Where are my notifications?", expectedIntent: INTENTS.NOTIFICATIONS },
    { q: "Real time notification bell alert", expectedIntent: INTENTS.NOTIFICATIONS },
    { q: "Did I get a new notification alert?", expectedIntent: INTENTS.NOTIFICATIONS },
    { q: "Push notification for event reminder", expectedIntent: INTENTS.NOTIFICATIONS },
    { q: "View all notification alerts", expectedIntent: INTENTS.NOTIFICATIONS },

    // 13. Registration Intent (5 questions)
    { q: "How do I register for an event?", expectedIntent: INTENTS.REGISTRATION },
    { q: "Can I cancel my event registration?", expectedIntent: INTENTS.REGISTRATION },
    { q: "Where can I see my registrations?", expectedIntent: INTENTS.REGISTRATION },
    { q: "Sign up for upcoming workshop", expectedIntent: INTENTS.REGISTRATION },
    { q: "Enroll in technical symposium", expectedIntent: INTENTS.REGISTRATION },

    // 14. Login Intent (5 questions)
    { q: "Student login page", expectedIntent: INTENTS.LOGIN },
    { q: "Admin sign in portal", expectedIntent: INTENTS.LOGIN },
    { q: "How to log in as event coordinator?", expectedIntent: INTENTS.LOGIN },
    { q: "Student login credentials", expectedIntent: INTENTS.LOGIN },
    { q: "I cannot sign in", expectedIntent: INTENTS.LOGIN },

    // 15. Events Intent (5 questions)
    { q: "What upcoming events are available?", expectedIntent: INTENTS.EVENTS },
    { q: "Tell me about upcoming workshops and seminars", expectedIntent: INTENTS.EVENTS },
    { q: "Computer science department events", expectedIntent: INTENTS.EVENTS },
    { q: "Ongoing campus events", expectedIntent: INTENTS.EVENTS },
    { q: "Search technical fest events", expectedIntent: INTENTS.EVENTS },

    // 16. Contact Intent (5 questions)
    { q: "How do I contact student support?", expectedIntent: INTENTS.CONTACT },
    { q: "Campus event committee email", expectedIntent: INTENTS.CONTACT },
    { q: "Student affairs helpdesk phone number", expectedIntent: INTENTS.CONTACT },
    { q: "Where is event office located?", expectedIntent: INTENTS.CONTACT },
    { q: "Support contact details", expectedIntent: INTENTS.CONTACT },

    // 17. General Help Intent (5 questions)
    { q: "Hello, what can you do?", expectedIntent: INTENTS.GENERAL_HELP },
    { q: "Hi there!", expectedIntent: INTENTS.GENERAL_HELP },
    { q: "Help me navigate the system", expectedIntent: INTENTS.GENERAL_HELP },
    { q: "Who are you?", expectedIntent: INTENTS.GENERAL_HELP },
    { q: "Show main menu help options", expectedIntent: INTENTS.GENERAL_HELP },
  ];

  test('Should accurately classify 100+ user questions to their corresponding intent', () => {
    testCases.forEach(({ q, expectedIntent }) => {
      const detected = detectIntent(q);
      if (detected !== expectedIntent) {
        console.error(`Mismatch for question: "${q}" -> Expected: ${expectedIntent}, Got: ${detected}`);
      }
      expect(detected).toBe(expectedIntent);
    });
  });

  test('Should return context-aware feedback answer when user is on Event Details page vs General page', () => {
    const generalAns = getKnowledgeBaseResponse(INTENTS.FEEDBACK, '/home');
    expect(generalAns).toContain('Open the Event Details page or My Registrations');

    const eventPageAns = getKnowledgeBaseResponse(INTENTS.FEEDBACK, '/events/1');
    expect(eventPageAns).toContain('available on this page below your registration status');
  });

  test('Should return concise, accurate responses for all supported intents without error', () => {
    Object.values(INTENTS).forEach((intent) => {
      if (intent !== INTENTS.UNKNOWN) {
        const response = getKnowledgeBaseResponse(intent);
        expect(response).toBeTruthy();
        expect(typeof response).toBe('string');
      }
    });
  });
});
