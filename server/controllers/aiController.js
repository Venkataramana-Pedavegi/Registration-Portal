const { Event, Registration, Certificate, Attendance, Student, Payment } = require('../models');
const { detectIntent, getKnowledgeBaseResponse, INTENTS } = require('../utils/intentClassifier');

const chatWithAI = async (req, res) => {
  try {
    const { message, currentPage } = req.body;
    const userId = req.user.id;
    const userRole = req.role || 'Student';

    if (!message) {
      return res.status(400).json({ message: 'Message prompt is required' });
    }

    // Step 1: Detect intent
    const intent = detectIntent(message);

    // Step 2: Check Predefined Knowledge Base first for matched intent
    if (intent !== INTENTS.UNKNOWN) {
      const kbResponse = getKnowledgeBaseResponse(intent, currentPage, { userRole, userId });
      if (kbResponse) {
        return res.json({
          reply: kbResponse,
          intent,
          source: 'knowledge_base',
        });
      }
    }

    // Step 3: AI Fallback (Gemini / OpenAI API call if no predefined intent matched)
    const totalEvents = await Event.count();
    const upcomingEvents = await Event.findAll({
      where: { status: 'Upcoming' },
      attributes: ['title', 'category', 'eventDate', 'venue', 'availableSeats'],
      limit: 5,
    });

    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const promptContext = `
You are the AI Assistant for the College Event Registration Management System.
User Role: ${userRole}. Current Page Context: ${currentPage || 'General'}.
System Context: Total Events: ${totalEvents}, Upcoming Events: ${JSON.stringify(upcomingEvents)}.

Instructions:
- Provide a short, direct, accurate answer specific strictly to the user's question.
- Do NOT answer about payments if user asked about feedback or QR codes.
- Do NOT answer about certificates if user asked about QR codes.

User Question: "${message}"
`;
        const result = await model.generateContent(promptContext);
        const responseText = result.response.text();
        return res.json({ reply: responseText, intent, source: 'gemini' });
      } catch (geminiError) {
        console.warn('Gemini API call warning/fallback:', geminiError.message);
      }
    }

    // Default Fallback
    const fallbackResponse = getKnowledgeBaseResponse(INTENTS.GENERAL_HELP);
    res.json({ reply: fallbackResponse, intent: INTENTS.GENERAL_HELP, source: 'fallback' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { chatWithAI };
