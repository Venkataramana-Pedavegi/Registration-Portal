const { GoogleGenerativeAI } = require('@google/generative-ai');

const getClient = () => {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null;
  return new GoogleGenerativeAI(apiKey);
};

// Basic rate limiting helper (throttle consecutive calls)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateText = async (prompt, systemInstruction = '', fallbackText = null, retryCount = 0) => {
  try {
    const client = getClient();
    if (!client) {
      if (fallbackText) {
        return fallbackText;
      }
      return getFallbackText(prompt);
    }

    // Rate limiter throttle: sleep 200ms
    await delay(200);

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const model = client.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction || 'You are an intelligent administrative assistant for Sri Vasavi Event Management Portal.'
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.trim();
  } catch (error) {
    const errorMsg = error?.message || '';
    const isAuthOrQuotaError =
      errorMsg.includes('API_KEY_INVALID') ||
      errorMsg.includes('API key not valid') ||
      errorMsg.includes('API_KEY_SERVICE_BLOCKED') ||
      errorMsg.includes('RESOURCE_EXHAUSTED') ||
      errorMsg.includes('429') ||
      errorMsg.includes('503') ||
      errorMsg.includes('Quota exceeded') ||
      errorMsg.includes('quota') ||
      errorMsg.includes('high demand');

    // Sanitize error message to avoid printing any sensitive key in URLs
    const sanitizedError = errorMsg.replace(/key=[^&\s]+/gi, 'key=[REDACTED]');
    console.error(`⚠️ [AI Service] Gemini Generation Issue (Attempt ${retryCount + 1}):`, sanitizedError);

    // Simple Retry with Exponential Backoff (skip retrying if key is invalid, quota exhausted, or service unavailable)
    if (!isAuthOrQuotaError && retryCount < 2) {
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
