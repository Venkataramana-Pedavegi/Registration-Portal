const { Event, Registration, Certificate, Attendance, Student, Volunteer, VolunteerTask, Feedback, Leaderboard, AIConversation, AIRecommendation, AIInsight } = require('../models');
const { generateText } = require('../services/AIService');
const { logAudit } = require('../middleware/auditLogger');
const { Op } = require('sequelize');

// 1. Chat with Assistant Chatbot (Module 1, 9, 10)
const chatWithAI = async (req, res) => {
  try {
    const { message, currentPage, sessionId } = req.body;
    const userId = req.user.id;
    const userRole = req.role || 'Student';

    if (!message) {
      return res.status(400).json({ message: 'Prompt message is required' });
    }

    const currentSessionId = sessionId || `session_${userId}_${Date.now()}`;

    // Gather Live Database Context depending on queries keywords
    let dbContext = '';
    const query = message.toLowerCase();

    if (userRole === 'Student') {
      if (query.includes('my registration') || query.includes('what am i registered for') || query.includes('what should i attend')) {
        const regs = await Registration.findAll({
          where: { studentId: userId, status: 'Registered' },
          include: [{ model: Event, attributes: ['title', 'eventDate', 'venue'] }]
        });
        dbContext = `User's active registrations: ${JSON.stringify(regs.map(r => ({ title: r.Event?.title, date: r.Event?.eventDate, venue: r.Event?.venue }))) || 'None'}`;
      } else if (query.includes('certificate')) {
        const certs = await Certificate.findAll({
          where: { studentId: userId },
          include: [{ model: Event, attributes: ['title'] }]
        });
        dbContext = `User's earned certificates: ${JSON.stringify(certs.map(c => ({ code: c.certificateId, event: c.Event?.title, date: c.issueDate }))) || 'None'}`;
      } else if (query.includes('volunteer')) {
        const volRecord = await Volunteer.findAll({
          where: { studentId: userId },
          include: [{ model: Event, attributes: ['title'] }]
        });
        dbContext = `User's volunteering positions: ${JSON.stringify(volRecord.map(v => ({ event: v.Event?.title, status: v.status, hours: v.hours }))) || 'None'}`;
      } else if (query.includes('events tomorrow') || query.includes('upcoming events') || query.includes('available events')) {
        const upcoming = await Event.findAll({
          where: { status: 'Upcoming', isTemplate: false },
          attributes: ['id', 'title', 'category', 'eventDate', 'venue'],
          limit: 5
        });
        dbContext = `Upcoming events: ${JSON.stringify(upcoming)}`;
      } else if (query.includes('badges') || query.includes('achievements') || query.includes('points')) {
        const lb = await Leaderboard.findOne({ where: { studentId: userId } });
        dbContext = `User's scores: Points: ${lb?.points || 0}, Attended: ${lb?.eventsAttended || 0}, Volunteer Hours: ${lb?.volunteerHours || 0}`;
      }
    } else {
      // Admin context queries
      if (query.includes('registration') || query.includes('today')) {
        const totalReg = await Registration.count();
        dbContext = `Total registrations count in system: ${totalReg}`;
      } else if (query.includes('attendance') || query.includes('no-show')) {
        const marked = await Attendance.count();
        const present = await Attendance.count({ where: { attendanceStatus: 'Present' } });
        dbContext = `Total attendance marked: ${marked}, Present count: ${present}, Attendance rate: ${marked > 0 ? Math.round((present / marked) * 100) : 0}%`;
      } else if (query.includes('popular')) {
        const events = await Event.findAll({
          attributes: ['title', 'capacity', 'availableSeats'],
          where: { isTemplate: false },
          limit: 5
        });
        dbContext = `Active events list: ${JSON.stringify(events)}`;
      } else if (query.includes('volunteer')) {
        const count = await Volunteer.count({ where: { status: 'approved' } });
        dbContext = `Total approved volunteers: ${count}`;
      }
    }

    const systemInstruction = `
      You are the Sri Vasavi College Events Assistant. User Role: ${userRole}.
      Current page: ${currentPage || 'General'}.
      Live database context to use: ${dbContext || 'None available'}.
      Provide a highly relevant, concise, and helpful answer.
    `;

    const reply = await generateText(message, systemInstruction);

    // Save history
    await AIConversation.create({
      userId,
      userRole,
      sessionId: currentSessionId,
      prompt: message,
      response: reply
    });

    res.json({ reply, sessionId: currentSessionId });
  } catch (error) {
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

// 8. AI Smart Search (Module 8)
const executeSmartSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const prompt = `
      Translate the natural language query: "${query}" into structured database parameters.
      Identify the target type ('events', 'students', 'volunteers') and match values.
      
      Return ONLY a JSON formatted structure:
      {
        "type": "events" | "students" | "volunteers",
        "searchVal": "matched_text_value",
        "category": "category_filter_if_any"
      }
    `;

    const responseText = await generateText(prompt, 'Translate intent and output strict JSON objects.');
    let parsedQuery = {};
    try {
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      parsedQuery = JSON.parse(cleanJson);
    } catch (e) {
      parsedQuery = { type: 'events', searchVal: query };
    }

    let results = [];

    if (parsedQuery.type === 'students') {
      results = await Student.findAll({
        where: {
          [Op.or]: [
            { fullName: { [Op.like]: `%${parsedQuery.searchVal}%` } },
            { rollNumber: { [Op.like]: `%${parsedQuery.searchVal}%` } }
          ]
        },
        limit: 10
      });
    } else if (parsedQuery.type === 'volunteers') {
      results = await Volunteer.findAll({
        include: [
          {
            model: Student,
            where: {
              fullName: { [Op.like]: `%${parsedQuery.searchVal}%` }
            }
          },
          { model: Event }
        ],
        limit: 10
      });
    } else {
      // Default match events
      const whereClause = {
        [Op.or]: [
          { title: { [Op.like]: `%${parsedQuery.searchVal}%` } },
          { venue: { [Op.like]: `%${parsedQuery.searchVal}%` } }
        ],
        isTemplate: false
      };
      if (parsedQuery.category) {
        whereClause.category = parsedQuery.category;
      }
      results = await Event.findAll({
        where: whereClause,
        limit: 10
      });
    }

    res.json({
      type: parsedQuery.type || 'events',
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
