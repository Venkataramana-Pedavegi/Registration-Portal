const { Event, Registration, Certificate, Attendance, Student, Volunteer, VolunteerTask, Feedback, Leaderboard, AIConversation, AIRecommendation, AIInsight, Badge, StudentBadge } = require('../models');
const { generateText } = require('../services/AIService');
const { getLevelForPoints, LEVEL_THRESHOLDS } = require('../services/GamificationService');
const { detectIntent, getKnowledgeBaseResponse, INTENTS } = require('../utils/intentClassifier');
const { logAudit } = require('../middleware/auditLogger');
const { Op } = require('sequelize');

// 1. Chat with Assistant Chatbot (Module 1, 9, 10)
const chatWithAI = async (req, res) => {
  try {
    const { message, currentPage, sessionId } = req.body;
    const userId = req.user.id;
    const userRole = req.role || 'Student';

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Prompt message is required' });
    }

    const currentSessionId = sessionId || `session_${userId}_${Date.now()}`;
    const rawQuery = String(message).trim();
    const query = rawQuery.toLowerCase();
    const intent = detectIntent(rawQuery);

    let directAnswer = '';
    const isAdmin = ['Admin', 'Super Admin', 'Event Coordinator', 'Faculty Coordinator', 'Coordinator', 'Volunteer Coordinator'].includes(userRole);

    // 1. Check for Admin Action Shortcuts
    if (intent === 'create_workshop' || query.includes('create a workshop') || (query.includes('create') && query.includes('workshop'))) {
      if (!isAdmin) {
        directAnswer = "This action requires Admin privileges.";
      } else {
        directAnswer = `Drafted Workshop Blueprint:\nTitle: Technical Workshop\nCategory: Technical\nScheduled: Next Friday at 10:00 AM\nVenue: Main Hall\nStatus: Template ready. You can finalize and publish this from the Admin Event Management page.`;
      }
    } else if (intent === 'inactive_students' || query.includes('inactive student') || query.includes('inactive students')) {
      if (!isAdmin) {
        directAnswer = "This action requires Admin privileges.";
      } else {
        const registeredStudentIds = (await Registration.findAll({ attributes: ['studentId'], raw: true })).map(r => r.studentId).filter(Boolean);
        const inactiveStudents = await Student.findAll({
          where: {
            id: { [Op.notIn]: registeredStudentIds.length > 0 ? registeredStudentIds : [0] },
            isActive: true
          },
          attributes: ['id', 'fullName', 'rollNumber', 'email', 'department'],
          limit: 10
        });

        if (inactiveStudents.length > 0) {
          const studentList = inactiveStudents.map((s, i) => `${i + 1}. Student Name: ${s.fullName}\n   Roll Number: ${s.rollNumber}\n   Department: ${s.department}`).join('\n\n');
          directAnswer = `Inactive Students:\n\n${studentList}`;
        } else {
          directAnswer = `All active students have registered for at least one event! Zero inactive students found.`;
        }
      }
    } else if (intent === 'attendance_summary' || query.includes('attendance summary')) {
      if (!isAdmin) {
        directAnswer = "This action requires Admin privileges.";
      } else {
        const totalAttendance = await Attendance.count();
        const presentCount = await Attendance.count({ where: { attendanceStatus: 'Present' } });
        const absentCount = await Attendance.count({ where: { attendanceStatus: 'Absent' } });
        const rate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
        
        const completedEvents = await Event.findAll({
          where: { isTemplate: false, status: 'Completed' },
          limit: 5
        });

        let eventBreakdown = '';
        if (completedEvents.length > 0) {
          const lines = [];
          for (const ev of completedEvents) {
            const evPresent = await Attendance.count({ where: { eventId: ev.id, attendanceStatus: 'Present' } });
            const evRegs = await Registration.count({ where: { eventId: ev.id, status: 'Registered' } });
            lines.push(`- ${ev.title}: ${evPresent} Present / ${evRegs} Registered`);
          }
          eventBreakdown = `\n\nRecent Completed Events:\n${lines.join('\n')}`;
        }

        directAnswer = `Attendance Summary Report:\nTotal Attendance Records Marked: ${totalAttendance}\nPresent Count: ${presentCount} (${rate}% check-in rate)\nAbsent/No-shows: ${absentCount}${eventBreakdown}`;
      }
    } else if (intent === 'send_reminders' || query.includes('send reminder') || query.includes('draft reminder')) {
      if (!isAdmin) {
        directAnswer = "This action requires Admin privileges.";
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStart = new Date(new Date(tomorrow).setHours(0,0,0,0));
        const tomorrowEnd = new Date(new Date(tomorrow).setHours(23,59,59,999));

        const upcomingTomorrow = await Event.findAll({
          where: { isTemplate: false, eventDate: { [Op.between]: [tomorrowStart, tomorrowEnd] } }
        });

        const eventTitles = upcomingTomorrow.map(e => e.title).join(', ') || "Tomorrow's Campus Event";
        directAnswer = `Draft Reminder Email for Tomorrow's Events:\n\nSubject: Reminder: Tomorrow's Campus Event - ${eventTitles}\n\nDear Student,\n\nThis is a friendly reminder that '${eventTitles}' is scheduled for tomorrow. Please ensure you arrive on time and present your QR Code entry pass at the venue entrance.\n\nRegards,\nSri Vasavi Events Team`;
      }
    }
    // 2. Student & General Data-Driven Queries
    else if (intent === INTENTS.LEADERBOARD || query.includes('badge') || query.includes('achievement') || query.includes('xp') || query.includes('point')) {
      const lb = await Leaderboard.findOne({ where: { studentId: userId } });
      const currentXP = lb?.points || 0;
      const currentLevel = getLevelForPoints(currentXP);

      const currentLvlIndex = LEVEL_THRESHOLDS.findIndex(l => l.name === currentLevel.name);
      const nextLevelObj = LEVEL_THRESHOLDS[currentLvlIndex + 1] || null;

      let levelText = '';
      if (nextLevelObj) {
        const remainingXP = nextLevelObj.minPoints - currentXP;
        levelText = `Your next available achievement level is ${nextLevelObj.name}.\nYou need ${remainingXP} more XP to reach the ${nextLevelObj.name} threshold.`;
      } else {
        levelText = `You have reached the maximum achievement level (${currentLevel.name})!`;
      }

      // Check badge progress
      const eventsAttendedCount = await Attendance.count({ where: { studentId: userId, attendanceStatus: 'Present' } });
      const certCount = await Certificate.count({ where: { studentId: userId } });
      const volunteerTasksCount = await VolunteerTask.count({
        where: { status: 'completed' },
        include: [{ model: Volunteer, where: { studentId: userId } }]
      });

      const earnedBadges = await StudentBadge.findAll({
        where: { studentId: userId },
        include: [{ model: Badge }]
      });
      const earnedBadgeNames = earnedBadges.map(b => b.Badge?.name).filter(Boolean);

      // Check next unlockable badge target
      const allBadges = await Badge.findAll();
      const earnedBadgeIds = new Set(earnedBadges.map(eb => eb.badgeId));
      const unearned = allBadges.filter(b => !earnedBadgeIds.has(b.id));

      let badgeTargets = [];
      for (const badge of unearned.slice(0, 3)) {
        if (badge.ruleType === 'certificates') {
          badgeTargets.push(`- ${badge.name}: Earn ${badge.ruleValue} certificates (Current: ${certCount}/${badge.ruleValue})`);
        } else if (badge.ruleType === 'events_attended') {
          badgeTargets.push(`- ${badge.name}: Attend ${badge.ruleValue} events (Current: ${eventsAttendedCount}/${badge.ruleValue})`);
        } else if (badge.ruleType === 'volunteer_tasks') {
          badgeTargets.push(`- ${badge.name}: Complete ${badge.ruleValue} volunteer tasks (Current: ${volunteerTasksCount}/${badge.ruleValue})`);
        } else if (badge.ruleType === 'points') {
          badgeTargets.push(`- ${badge.name}: Accumulate ${badge.ruleValue} XP (Current: ${currentXP}/${badge.ruleValue})`);
        } else {
          badgeTargets.push(`- ${badge.name}: ${badge.description}`);
        }
      }

      let targetsText = badgeTargets.length > 0 ? `\n\nNext available badges you can unlock:\n${badgeTargets.join('\n')}` : '';
      let earnedText = earnedBadgeNames.length > 0 ? `\nUnlocked Badges: ${earnedBadgeNames.join(', ')}` : '';

      directAnswer = `You currently have ${currentXP} XP and the ${currentLevel.name} badge.\n${levelText}${earnedText}${targetsText}`;
    }
    let searchTargetType = null;
    let searchResults = null;

    const isExplicitSearch = (
      query.startsWith('search') || query.startsWith('find') || query.startsWith('list') || query.startsWith('show cse') || query.startsWith('show ece') || query.startsWith('show student') || query.startsWith('show volunteer') ||
      query.includes('search events') || query.includes('search students') || query.includes('search volunteers') ||
      query.includes('find student') || query.includes('find volunteer') || query.includes('find event') ||
      (query.includes('technical') && query.includes('workshop')) ||
      (query.includes('list volunteers') || query.includes('list students'))
    );

    const isCopilotPersonalQuestion = (
      query.includes('my volunteer task') || query.includes('show my volunteer') || query.includes('my volunteer') ||
      query.includes('what events are tomorrow') || query.includes('my certificate') ||
      query.includes('my registration') || query.includes('how many xp') || query.includes('what badge') || query.includes('inactive student')
    );

    if (!directAnswer && isExplicitSearch && !isCopilotPersonalQuestion) {
      let targetType = 'events';
      if (/\b(student|students|roll|rollnumber)\b/i.test(query)) {
        targetType = 'students';
      } else if (/\b(volunteer|volunteers|helper|helpers)\b/i.test(query)) {
        targetType = 'volunteers';
      }

      if (targetType === 'students' && !isAdmin) {
        directAnswer = "Student directory search requires Admin privileges.";
      } else {
        const searchRes = await performInternalSearch(rawQuery);
        if (searchRes && searchRes.results) {
          searchTargetType = searchRes.targetType;
          searchResults = searchRes.results;
          directAnswer = searchRes.formattedReply;
        }
      }
    }

    if (!directAnswer) {
      if (intent === INTENTS.LEADERBOARD || query.includes('xp') || query.includes('badge') || query.includes('points')) {
        const lb = await Leaderboard.findOne({ where: { studentId: userId } });
        const currentXP = lb ? lb.points : 0;
        const currentLevel = getLevelForPoints(currentXP);

        const thresholds = LEVEL_THRESHOLDS;
        let nextLevel = null;
        let pointsNeeded = 0;

        for (const t of thresholds) {
          if (t.minPoints > currentXP) {
            nextLevel = t.name;
            pointsNeeded = t.minPoints - currentXP;
            break;
          }
        }

        const userBadges = await StudentBadge.findAll({
          where: { studentId: userId },
          include: [{ model: Badge }]
        });
        const allBadges = await Badge.findAll();
        const earnedIds = new Set(userBadges.map(ub => ub.badgeId));
        const nextBadges = allBadges.filter(b => !earnedIds.has(b.id)).slice(0, 3);

        let answer = `You currently have ${currentXP} XP and the ${currentLevel} badge.\n`;
        if (nextLevel) {
          answer += `Your next available achievement level is ${nextLevel}.\nYou need ${pointsNeeded} more XP to reach the ${nextLevel} threshold.\n\n`;
        } else {
          answer += `Congratulations! You have reached the maximum achievement level (${currentLevel})!\n\n`;
        }

        if (nextBadges.length > 0) {
          answer += `Next available badges you can unlock:\n` + nextBadges.map(b => `- ${b.name}: ${b.description}`).join('\n');
        }

        directAnswer = answer;
      } else if (intent === INTENTS.CERTIFICATES || query.includes('certificate')) {
        const certs = await Certificate.findAll({
          where: { studentId: userId },
          include: [{ model: Event, attributes: ['title', 'eventDate'] }]
        });

        if (certs.length === 0) {
          directAnswer = `I couldn't find any matching records in your account. You haven't earned any certificates yet. Participate in campus events to earn certificates.`;
        } else {
          const list = certs.map((c, i) => `${i + 1}. ${c.Event?.title || 'Event'} (Issued: ${new Date(c.issueDate).toLocaleDateString()}, ID: ${c.certificateId})`).join('\n');
          directAnswer = `You currently have ${certs.length} certificate(s) registered in your name:\n\n${list}\n\nYou can download your PDF certificates on the Certificates page.`;
        }
      } else if (query.includes('tomorrow') || (intent === INTENTS.EVENTS && query.includes('tomorrow'))) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);

        const events = await Event.findAll({
          where: {
            isTemplate: false,
            eventDate: {
              [Op.between]: [tomorrow, tomorrowEnd]
            }
          },
          order: [['startTime', 'ASC']]
        });

        if (events.length === 0) {
          directAnswer = `There are no campus events scheduled for tomorrow (${tomorrow.toLocaleDateString()}).`;
        } else {
          const list = events.map((e, i) => `${i + 1}. ${e.title} - Venue: ${e.venue}, Time: ${e.startTime || 'TBA'} (${e.category})`).join('\n');
          directAnswer = `Here are the campus events scheduled for tomorrow:\n\n${list}`;
        }
      } else if (intent === 'recommendation' || query.includes('what should i attend') || query.includes('recommend')) {
        const student = await Student.findByPk(userId);
        const userDept = student?.department || 'General';

        const upcoming = await Event.findAll({
          where: { status: 'Upcoming', isTemplate: false },
          order: [['eventDate', 'ASC']],
          limit: 5
        });

        if (upcoming.length === 0) {
          directAnswer = `There are currently no new upcoming events available for registration.`;
        } else {
          const list = upcoming.map((e, i) => `${i + 1}. ${e.title} (${e.category}) - ${new Date(e.eventDate).toLocaleDateString()} at ${e.venue}\n   Reason: Recommended for ${userDept} students (${e.availableSeats} seats remaining)`).join('\n');
          directAnswer = `Based on your ${userDept} background, here are recommended events for you:\n\n${list}`;
        }
      } else if (intent === INTENTS.ATTENDANCE || query.includes('attendance') || (query.includes('attend') && !query.includes('what should i attend') && !query.includes('recommend'))) {
        const attendances = await Attendance.findAll({
          where: { studentId: userId, attendanceStatus: 'Present' },
          include: [{ model: Event, attributes: ['title', 'eventDate', 'venue'] }]
        });

        if (attendances.length === 0) {
          directAnswer = `I couldn't find any matching records in your account. You have not attended any events yet.`;
        } else {
          const list = attendances.map((a, i) => `${i + 1}. ${a.Event?.title || 'Event'} (Date: ${a.Event?.eventDate ? new Date(a.Event.eventDate).toLocaleDateString() : 'N/A'}, Venue: ${a.Event?.venue || 'Campus'})`).join('\n');
          directAnswer = `You have attended ${attendances.length} event(s):\n\n${list}\n\nYour attendance is verified manually by event coordinators scanning your QR Code pass.`;
        }
      } else if (intent === INTENTS.VOLUNTEERS || query.includes('volunteer')) {
        const volRecords = await Volunteer.findAll({
          where: { studentId: userId },
          include: [{ model: Event, attributes: ['title', 'eventDate'] }]
        });

        const tasks = await VolunteerTask.findAll({
          include: [
            { model: Volunteer, where: { studentId: userId } },
            { model: Event, attributes: ['title'] }
          ]
        });

        if (volRecords.length === 0 && tasks.length === 0) {
          directAnswer = `I couldn't find any matching records in your account. You have not applied as a volunteer or have no assigned tasks yet. You can apply for volunteering on the Volunteer Portal page.`;
        } else {
          let text = `Your Volunteer Summary:\n`;
          if (volRecords.length > 0) {
            text += `Volunteering Registrations:\n` + volRecords.map(v => `- Event: ${v.Event?.title || 'Campus Event'} | Status: ${v.status} | Hours: ${v.hours || 0}`).join('\n');
          }
          if (tasks.length > 0) {
            text += `\n\nAssigned Tasks:\n` + tasks.map(t => `- Task: ${t.title} | Status: ${t.status} | Event: ${t.Event?.title || 'N/A'}`).join('\n');
          }
          directAnswer = text;
        }
      } else if (intent === INTENTS.EVENTS || query.includes('event')) {
        const upcoming = await Event.findAll({
          where: { status: 'Upcoming', isTemplate: false },
          order: [['eventDate', 'ASC']],
          limit: 5
        });

        if (upcoming.length === 0) {
          directAnswer = `There are currently no upcoming events listed in the portal.`;
        } else {
          const list = upcoming.map((e, i) => `${i + 1}. ${e.title} (${e.category}) - ${new Date(e.eventDate).toLocaleDateString()} at ${e.venue}`).join('\n');
          directAnswer = `Here are upcoming campus events:\n\n${list}`;
        }
      } else if (intent === INTENTS.REGISTRATION || query.includes('my registration') || query.includes('registered')) {
        const regs = await Registration.findAll({
          where: { studentId: userId, status: 'Registered' },
          include: [{ model: Event, attributes: ['title', 'eventDate', 'venue'] }]
        });

        if (regs.length === 0) {
          directAnswer = `I couldn't find any matching records in your account. You are not currently registered for any upcoming events.`;
        } else {
          const list = regs.map((r, i) => `${i + 1}. ${r.Event?.title} - ${new Date(r.Event?.eventDate).toLocaleDateString()} at ${r.Event?.venue}`).join('\n');
          directAnswer = `You have ${regs.length} active registration(s):\n\n${list}`;
        }
      }
    }

    // Secondary Search fallback ONLY for queries that look like search requests
    const isSearchFallbackQuery = (
      query.includes('search') || query.includes('find') || query.includes('list') ||
      query.includes('workshop') || query.includes('seminar') || query.includes('fest') ||
      query.includes('student') || query.includes('volunteer') ||
      /\b(cse|ece|eee|mech|civil|it)\b/i.test(query)
    );

    if (!directAnswer && isSearchFallbackQuery) {
      let targetType = 'events';
      if (/\b(student|students|roll|rollnumber)\b/i.test(query)) {
        targetType = 'students';
      } else if (/\b(volunteer|volunteers|helper|helpers)\b/i.test(query)) {
        targetType = 'volunteers';
      }

      if (targetType === 'students' && !isAdmin) {
        directAnswer = "Student directory search requires Admin privileges.";
      } else {
        const searchRes = await performInternalSearch(rawQuery);
        if (searchRes && searchRes.results && searchRes.results.length > 0) {
          searchTargetType = searchRes.targetType;
          searchResults = searchRes.results;
          directAnswer = searchRes.formattedReply;
        }
      }
    }

    // 3. Knowledge base fallback
    if (!directAnswer) {
      const kbAnswer = getKnowledgeBaseResponse(intent, currentPage);
      if (kbAnswer) {
        directAnswer = kbAnswer;
      }
    }

    // 4. Default unsupported fallback
    if (!directAnswer) {
      directAnswer = "I can help with events, registrations, certificates, achievements, badges, attendance, volunteering, and other Sri Vasavi Events features. Try asking about one of these.";
    }

    const systemInstruction = `
      You are the Sri Vasavi College Events Assistant. User Role: ${userRole}.
      Current page: ${currentPage || 'General'}.
      Answer context: ${directAnswer}.
      Provide a highly relevant, concise, and helpful answer.
    `;

    const reply = await generateText(message, systemInstruction, directAnswer);

    // Save history
    await AIConversation.create({
      userId,
      userRole,
      sessionId: currentSessionId,
      prompt: message,
      response: reply
    });

    res.json({
      reply,
      sessionId: currentSessionId,
      targetType: searchTargetType || undefined,
      results: searchResults || undefined
    });
  } catch (error) {
    console.error('❌ [AI COPILOT CONTROLLER ERROR]:', error);
    res.status(500).json({ message: 'Error in AI Chatbot assistant', error: error.message });
  }
};

// 2. AI Event Recommendation Engine (Module 2)
const getEventRecommendations = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findByPk(studentId);
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    // Gather history
    const regs = await Registration.findAll({ where: { studentId, status: 'Registered' } });
    const lb = await Leaderboard.findOne({ where: { studentId } });
    const upcoming = await Event.findAll({
      where: { status: 'Upcoming', isTemplate: false },
      attributes: ['id', 'title', 'category', 'description', 'venue'],
      limit: 6
    });

    if (upcoming.length === 0) {
      return res.json([]);
    }

    const studentContext = {
      department: student.department,
      year: student.year,
      completedRegistrationsCount: regs.length,
      leaderboardPoints: lb?.points || 0
    };

    const prompt = `
      Recommend events for a student with the profile: ${JSON.stringify(studentContext)}.
      Available upcoming events catalog: ${JSON.stringify(upcoming)}.
      
      Output ONLY a valid JSON array of matching recommended objects, with zero markdown format blocks.
      Format:
      [
        {"eventId": 1, "confidenceScore": 95, "reason": "Recommended because..."},
        ...
      ]
    `;

    const responseText = await generateText(prompt, 'You are an AI recommendation engine. Output strict JSON arrays only.');
    let recommendedList = [];
    try {
      // Sanitize response formatting if any markdown wrapper blocks exist
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      recommendedList = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Recommendation parsing error, falling back to dummy list:', e.message);
      recommendedList = upcoming.slice(0, 2).map((ev) => ({
        eventId: ev.id,
        confidenceScore: 85,
        reason: `Aligned with your ${student.department} interest profile.`
      }));
    }

    // Save recommendations in db
    await AIRecommendation.destroy({ where: { studentId } });
    for (const rec of recommendedList) {
      await AIRecommendation.create({
        studentId,
        eventId: rec.eventId,
        confidenceScore: rec.confidenceScore,
        reason: rec.reason
      });
    }

    // Combine event details with recommendation reasons
    const fullRecs = [];
    for (const rec of recommendedList) {
      const ev = await Event.findByPk(rec.eventId);
      if (ev) {
        fullRecs.push({
          event: ev,
          confidenceScore: rec.confidenceScore,
          reason: rec.reason
        });
      }
    }

    res.json(fullRecs);
  } catch (error) {
    res.status(500).json({ message: 'Error in recommendations generator', error: error.message });
  }
};

// 3. AI Event Description Generator (Module 3)
const generateEventDescription = async (req, res) => {
  try {
    const { title, category, venue } = req.body;
    if (!title || !category) {
      return res.status(400).json({ message: 'Event Title and Category are required' });
    }

    const prompt = `
      Write event blueprint details for:
      Title: "${title}"
      Category: "${category}"
      Venue: "${venue || 'TBD'}"
      
      Generate descriptions matching this JSON structure ONLY (no extra text):
      {
        "description": "...",
        "objectives": "...",
        "benefits": "...",
        "agenda": "...",
        "socialMediaCaption": "...",
        "keywords": "..."
      }
    `;

    const responseText = await generateText(prompt, 'You generate structured JSON templates for events. No markdown.');
    let resultObj = {};
    try {
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      resultObj = JSON.parse(cleanJson);
    } catch (e) {
      resultObj = {
        description: `Join us for an exciting session on ${title}.`,
        objectives: 'Familiarize students with coding principles.',
        benefits: 'Gain hands-on expertise and earn participation XP.',
        agenda: '09:00 AM Keynote; 11:00 AM Interactive Session; 02:00 PM Coding Contest.',
        socialMediaCaption: `Register for ${title} now! #SriVasaviEvents`,
        keywords: `${category}, Learning, Sri Vasavi`
      };
    }

    res.json(resultObj);
  } catch (error) {
    res.status(500).json({ message: 'Error generating event description', error: error.message });
  }
};

// 4. AI Feedback Sentiment Analysis (Module 4)
const analyzeEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const feedbacks = await Feedback.findAll({ where: { eventId } });

    if (feedbacks.length === 0) {
      return res.json({
        overallSentiment: 'Neutral (No feedback logs)',
        topCompliments: ['No comments logged'],
        topComplaints: ['No complaints logged'],
        suggestions: ['Awaiting attendee reviews'],
        averageSatisfaction: 5.0
      });
    }

    const comments = feedbacks.map((f) => `Rating: ${f.rating}, Comment: "${f.comment || ''}"`);

    const prompt = `
      Analyze the attendee reviews for event ID ${eventId}:
      ${JSON.stringify(comments)}
      
      Return ONLY a JSON formatted report like this:
      {
        "overallSentiment": "Positive" | "Neutral" | "Negative",
        "topCompliments": ["...", "..."],
        "topComplaints": ["...", "..."],
        "suggestions": ["...", "..."],
        "averageSatisfaction": 4.5
      }
    `;

    const responseText = await generateText(prompt, 'You analyze sentiments and return strictly formatted JSON.');
    let report = {};
    try {
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      report = JSON.parse(cleanJson);
    } catch (e) {
      const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
      report = {
        overallSentiment: 'Positive',
        topCompliments: ['Good content'],
        topComplaints: ['None'],
        suggestions: ['Keep up the work'],
        averageSatisfaction: parseFloat((sum / feedbacks.length).toFixed(1))
      };
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error performing feedback analysis', error: error.message });
  }
};

// 5. AI Email Composer (Module 5)
const generateAIEmail = async (req, res) => {
  try {
    const { type, details } = req.body; // type e.g. 'Reminder', 'Volunteer', details object
    if (!type || !details) {
      return res.status(400).json({ message: 'Email type and details are required' });
    }

    const prompt = `
      Write a professional email template for a college campus audience.
      Email category type: "${type}"
      Template Context: ${JSON.stringify(details)}
      
      Make it engaging and return the output with a clear Subject line and Body.
    `;

    const emailText = await generateText(prompt, 'You are an email copywriter. Return a subject and email body.');
    res.json({ email: emailText });
  } catch (error) {
    res.status(500).json({ message: 'Error compiling AI email templates', error: error.message });
  }
};

// 6. AI Analytics Insights (Module 6)
const getAIAnalyticsInsights = async (req, res) => {
  try {
    // Gather summary parameters to feed context
    const totalStudents = await Student.count();
    const totalEvents = await Event.count();
    const totalReg = await Registration.count();

    const prompt = `
      Generate 3 business intelligence insights bullets based on system parameters:
      Students: ${totalStudents}, Events: ${totalEvents}, Total Signups: ${totalReg}.
      
      Return ONLY a JSON list of insight items like:
      [
        {"metricName": "CSE Participation", "insightText": "CSE students continue to lead signup indexes.", "type": "success"},
        {"metricName": "No-Show Warning", "insightText": "Attendance rates dropped by 5% this week.", "type": "alert"}
      ]
    `;

    const responseText = await generateText(prompt, 'Output strict JSON arrays representing BI analytics bullets.');
    let insights = [];
    try {
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      insights = JSON.parse(cleanJson);
    } catch (e) {
      insights = [
        { metricName: 'Growth Rate', insightText: 'Event registrations continue to demonstrate positive growth rates.', type: 'success' },
        { metricName: 'Year Level', insightText: 'Third year students demonstrate the highest registration speeds.', type: 'neutral' }
      ];
    }

    // Cache insights
    await AIInsight.destroy({ where: {} });
    for (const ins of insights) {
      await AIInsight.create({
        metricName: ins.metricName,
        insightText: ins.insightText,
        type: ins.type
      });
    }

    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: 'Error compiling analytics insights', error: error.message });
  }
};

// 7. AI Attendance Predictor (Module 7)
const predictEventAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const totalRegs = await Registration.count({ where: { eventId, status: 'Registered' } });

    const prompt = `
      Predict check-in statistics for the event:
      Title: "${event.title}"
      Category: "${event.category}"
      Event Capacity: ${event.capacity}
      Current Registrations: ${totalRegs}
      
      Return ONLY a valid JSON object matching:
      {
        "expectedAttendanceRate": 80,
        "expectedNoShowRate": 20,
        "volunteerNeedEstimate": 8,
        "capacityRecommendation": 120
      }
    `;

    const responseText = await generateText(prompt, 'Predict attendance rates and return strict JSON objects.');
    let prediction = {};
    try {
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      prediction = JSON.parse(cleanJson);
    } catch (e) {
      prediction = {
        expectedAttendanceRate: 85,
        expectedNoShowRate: 15,
        volunteerNeedEstimate: Math.max(5, Math.ceil(totalRegs * 0.06)),
        capacityRecommendation: event.capacity
      };
    }

    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: 'Error generating predictive calculations', error: error.message });
  }
};

// Helper for internal smart search
const performInternalSearch = async (query) => {
  if (!query || !String(query).trim()) return { targetType: 'events', results: [], formattedReply: 'Please provide a search query.' };

  const rawQuery = String(query).trim();
  const lowerQuery = rawQuery.toLowerCase();

  let targetType = 'events';
  if (/\b(student|students|roll|rollnumber)\b/i.test(lowerQuery)) {
    targetType = 'students';
  } else if (/\b(volunteer|volunteers|helper|helpers)\b/i.test(lowerQuery)) {
    targetType = 'volunteers';
  }

  let statusFilter = null;
  let volStatusFilter = null;
  if (/\bupcoming\b/i.test(lowerQuery)) statusFilter = 'Upcoming';
  else if (/\bongoing\b/i.test(lowerQuery)) statusFilter = 'Ongoing';
  else if (/\bcompleted\b/i.test(lowerQuery)) statusFilter = 'Completed';
  else if (/\bcancelled\b/i.test(lowerQuery)) statusFilter = 'Cancelled';

  if (/\bapproved\b/i.test(lowerQuery)) volStatusFilter = 'approved';
  else if (/\bpending\b/i.test(lowerQuery)) volStatusFilter = 'pending';
  else if (/\brejected\b/i.test(lowerQuery)) volStatusFilter = 'rejected';

  const stopWords = new Set([
    'show', 'list', 'find', 'get', 'search', 'view', 'display', 'me',
    'the', 'a', 'an', 'for', 'in', 'at', 'of', 'on', 'to', 'with', 'all',
    'event', 'events', 'student', 'students', 'volunteer', 'volunteers',
    'upcoming', 'ongoing', 'completed', 'cancelled', 'approved', 'pending', 'rejected'
  ]);

  const tokens = lowerQuery
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && !stopWords.has(w));

  const keywords = tokens.map(t => {
    if (t.endsWith('s') && t.length > 3 && !t.endsWith('ss')) {
      return t.slice(0, -1);
    }
    return t;
  });

  let results = [];

  if (targetType === 'students') {
    const searchTerms = keywords.length > 0 ? keywords : [rawQuery.toLowerCase()];
    const studentWhere = searchTerms.map(term => ({
      [Op.or]: [
        { fullName: { [Op.like]: `%${term}%` } },
        { rollNumber: { [Op.like]: `%${term}%` } },
        { email: { [Op.like]: `%${term}%` } },
        { department: { [Op.like]: `%${term}%` } },
        { year: { [Op.like]: `%${term}%` } },
      ]
    }));

    results = await Student.findAll({
      where: studentWhere.length > 0 ? { [Op.and]: studentWhere } : {},
      attributes: ['id', 'fullName', 'rollNumber', 'email', 'department', 'year'],
      limit: 20,
    });

    if (results.length === 0 && searchTerms.length > 0) {
      const fallbackWhere = searchTerms.map(term => ({
        [Op.or]: [
          { fullName: { [Op.like]: `%${term}%` } },
          { rollNumber: { [Op.like]: `%${term}%` } },
          { department: { [Op.like]: `%${term}%` } },
        ]
      }));
      results = await Student.findAll({
        where: { [Op.or]: fallbackWhere },
        attributes: ['id', 'fullName', 'rollNumber', 'email', 'department', 'year'],
        limit: 20,
      });
    }
  } else if (targetType === 'volunteers') {
    const volWhere = {};
    if (volStatusFilter) volWhere.status = volStatusFilter;

    if (keywords.length === 0) {
      results = await Volunteer.findAll({
        where: volWhere,
        include: [
          { model: Student, attributes: ['id', 'fullName', 'email', 'rollNumber', 'department'] },
          { model: Event, attributes: ['id', 'title', 'eventDate', 'venue'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 30,
      });
    } else {
      const searchTerms = keywords;
      const orConditions = searchTerms.map(term => ({
        [Op.or]: [
          { department: { [Op.like]: `%${term}%` } },
          { skills: { [Op.like]: `%${term}%` } },
          { '$Student.fullName$': { [Op.like]: `%${term}%` } },
          { '$Student.rollNumber$': { [Op.like]: `%${term}%` } },
          { '$Student.department$': { [Op.like]: `%${term}%` } },
          { '$Event.title$': { [Op.like]: `%${term}%` } },
        ]
      }));

      volWhere[Op.and] = orConditions;

      results = await Volunteer.findAll({
        where: volWhere,
        include: [
          { model: Student, attributes: ['id', 'fullName', 'email', 'rollNumber', 'department'] },
          { model: Event, attributes: ['id', 'title', 'eventDate', 'venue'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 30,
      });

      if (results.length === 0 && searchTerms.length > 1) {
        const fallbackWhere = { ...volWhere };
        fallbackWhere[Op.and] = undefined;
        fallbackWhere[Op.or] = searchTerms.map(term => ({
          [Op.or]: [
            { department: { [Op.like]: `%${term}%` } },
            { skills: { [Op.like]: `%${term}%` } },
            { '$Student.fullName$': { [Op.like]: `%${term}%` } },
            { '$Student.rollNumber$': { [Op.like]: `%${term}%` } },
            { '$Student.department$': { [Op.like]: `%${term}%` } },
            { '$Event.title$': { [Op.like]: `%${term}%` } },
          ]
        }));

        results = await Volunteer.findAll({
          where: fallbackWhere,
          include: [
            { model: Student, attributes: ['id', 'fullName', 'email', 'rollNumber', 'department'] },
            { model: Event, attributes: ['id', 'title', 'eventDate', 'venue'] },
          ],
          order: [['createdAt', 'DESC']],
          limit: 30,
        });
      }
    }
  } else {
    // Events
    const searchTerms = keywords.length > 0 ? keywords : [rawQuery.toLowerCase()];
    const andConditions = searchTerms.map(term => ({
      [Op.or]: [
        { title: { [Op.like]: `%${term}%` } },
        { category: { [Op.like]: `%${term}%` } },
        { description: { [Op.like]: `%${term}%` } },
        { venue: { [Op.like]: `%${term}%` } },
        { organizer: { [Op.like]: `%${term}%` } },
        { department: { [Op.like]: `%${term}%` } },
      ]
    }));

    const baseWhere = { isTemplate: false };
    if (statusFilter) baseWhere.status = statusFilter;

    if (andConditions.length > 0) {
      results = await Event.findAll({
        where: { ...baseWhere, [Op.and]: andConditions },
        order: [['eventDate', 'ASC']],
        limit: 20,
      });
    }

    if (results.length === 0 && searchTerms.length > 0) {
      const orConditions = searchTerms.map(term => ({
        [Op.or]: [
          { title: { [Op.like]: `%${term}%` } },
          { category: { [Op.like]: `%${term}%` } },
          { description: { [Op.like]: `%${term}%` } },
          { venue: { [Op.like]: `%${term}%` } },
          { organizer: { [Op.like]: `%${term}%` } },
          { department: { [Op.like]: `%${term}%` } },
        ]
      }));

      results = await Event.findAll({
        where: { ...baseWhere, [Op.or]: orConditions },
        order: [['eventDate', 'ASC']],
        limit: 20,
      });
    }

    if (results.length === 0) {
      results = await Event.findAll({
        where: {
          ...baseWhere,
          [Op.or]: [
            { title: { [Op.like]: `%${rawQuery}%` } },
            { category: { [Op.like]: `%${rawQuery}%` } },
            { description: { [Op.like]: `%${rawQuery}%` } },
          ]
        },
        order: [['eventDate', 'ASC']],
        limit: 20,
      });
    }
  }

  let formattedReply = '';
  if (targetType === 'students') {
    if (results.length > 0) {
      const list = results.map((s, i) => `${i + 1}. Student Name: ${s.fullName}\n   Roll Number: ${s.rollNumber}\n   Department: ${s.department}`).join('\n\n');
      formattedReply = `Found ${results.length} matching student(s):\n\n${list}`;
    } else {
      formattedReply = `No student records matched your search query '${rawQuery}'.`;
    }
  } else if (targetType === 'volunteers') {
    if (results.length > 0) {
      const list = results.map((v, i) => `${i + 1}. ${v.Student?.fullName || 'Volunteer'} (${v.department || v.Student?.department || 'N/A'}) - Event: ${v.Event?.title || 'General'} (Status: ${v.status})`).join('\n');
      formattedReply = `Found ${results.length} volunteer record(s):\n\n${list}`;
    } else {
      formattedReply = `No volunteer records matched your search query '${rawQuery}'.`;
    }
  } else {
    if (results.length > 0) {
      const list = results.map((e, i) => `${i + 1}. ${e.title} (${e.category}) - ${new Date(e.eventDate).toLocaleDateString()} at ${e.venue}`).join('\n');
      formattedReply = `Found ${results.length} matching event(s):\n\n${list}`;
    } else {
      formattedReply = `No events matched your search query '${rawQuery}'.`;
    }
  }

  return { targetType, results, formattedReply };
};

// 8. AI Smart Search (Module 8)
const executeSmartSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || !String(query).trim()) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const { targetType, results } = await performInternalSearch(query);
    res.json({
      type: targetType,
      results
    });
  } catch (error) {
    res.status(500).json({ message: 'Error performing natural language search', error: error.message });
  }
};

module.exports = {
  chatWithAI,
  getEventRecommendations,
  generateEventDescription,
  analyzeEventFeedback,
  generateAIEmail,
  getAIAnalyticsInsights,
  predictEventAttendance,
  executeSmartSearch
};
