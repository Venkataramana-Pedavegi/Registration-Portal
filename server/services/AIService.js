const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Basic rate limiting helper (throttle consecutive calls)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateText = async (prompt, systemInstruction = '', fallbackText = null, retryCount = 0) => {
  try {
    if (!process.env.GEMINI_API_KEY || !genAI) {
      if (fallbackText) {
        return fallbackText;
      }
      return getFallbackText(prompt);
    }

    // Rate limiter throttle: sleep 200ms
    await delay(200);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction || 'You are an intelligent administrative assistant for Sri Vasavi Event Management Portal.'
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.trim();
  } catch (error) {
    console.error(`❌ [AI Service] Gemini Generation Error (Attempt ${retryCount + 1}):`, error.message);

    // Simple Retry with Exponential Backoff
    if (retryCount < 2) {
      const waitTime = Math.pow(2, retryCount) * 1000;
      await delay(waitTime);
      return generateText(prompt, systemInstruction, fallbackText, retryCount + 1);
    }

    if (fallbackText) {
      return fallbackText;
    }
    return getFallbackText(prompt);
  }
};

// Fallback logic for offline mode or missing API key
const getFallbackText = (prompt) => {
  const p = prompt.toLowerCase();
  if (p.includes('recommend') || p.includes('matching')) {
    return JSON.stringify([
      { eventId: 1, confidenceScore: 92, reason: 'Highly relevant based on your Department focus and achievements.' },
      { eventId: 2, confidenceScore: 85, reason: 'Aligned with your interest profile and similar student check-ins.' }
    ]);
  }
  if (p.includes('description') || p.includes('objectives')) {
    return JSON.stringify({
      description: 'This is an AI-generated event blueprint details catalog text.',
      objectives: 'Familiarize attendees with state-of-the-art engineering concepts.',
      benefits: 'Acquire practical training, earn participation points, and unlock achievements.',
      agenda: '09:00 AM - Registrations & Signups; 10:00 AM - Keynote Address; 02:00 PM - Coding Contest.',
      socialMediaCaption: 'Excited to announce our upcoming workshop! Register now to secure your seats! #SriVasaviEvents #Coding',
      keywords: 'Workshop, Coding, Learning, Sri Vasavi'
    });
  }
  if (p.includes('feedback') || p.includes('comment')) {
    return JSON.stringify({
      overallSentiment: 'Positive',
      topCompliments: ['Excellent coordination', 'Practical hands-on content'],
      topComplaints: ['Venue capacity restriction', 'Audio clarity at back rows'],
      suggestions: ['Move sessions to main seminar halls', 'Expose recorded lectures'],
      averageSatisfaction: 4.2
    });
  }
  if (p.includes('insight') || p.includes('bullet')) {
    return JSON.stringify([
      { metricName: 'Growth Rate', insightText: 'AI Workshop is the fastest growing event this month.', type: 'success' },
      { metricName: 'Department Signups', insightText: 'CSE department continues to demonstrate peak participation rates.', type: 'neutral' },
      { metricName: 'Volunteer Networks', insightText: 'Volunteer registrations projected to surge next week.', type: 'alert' }
    ]);
  }
  if (p.includes('attendance') || p.includes('predict')) {
    return JSON.stringify({
      expectedAttendanceRate: 85,
      expectedNoShowRate: 15,
      volunteerNeedEstimate: 12,
      capacityRecommendation: 120
    });
  }
  if (p.includes('email')) {
    return `Subject: College Event Portal - Verification Notice\n\nDear Student,\n\nThis is a notification update regarding your event enrollment status. Verify your details inside the student dashboard.\n\nRegards,\nSri Vasavi Events Team`;
  }
  
  return 'I can help with events, registrations, certificates, achievements, badges, attendance, volunteering, and other Sri Vasavi Events features. Try asking about one of these.';
};

module.exports = {
  generateText
};
