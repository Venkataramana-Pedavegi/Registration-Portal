const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testAllIntents() {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeychangethisinproduction';
    const adminToken = jwt.sign({ id: 1, role: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });
    const studentToken = jwt.sign({ id: 2, role: 'Student' }, JWT_SECRET, { expiresIn: '1h' });

    const queries = [
      { name: '1. What badge can I unlock next?', token: studentToken, msg: 'What badge can I unlock next?' },
      { name: '2. How many XP do I have?', token: studentToken, msg: 'How many XP do I have?' },
      { name: '3. Show my certificates', token: studentToken, msg: 'Show my certificates' },
      { name: '4. What events are tomorrow?', token: studentToken, msg: 'What events are tomorrow?' },
      { name: '5. How many events did I attend?', token: studentToken, msg: 'How many events did I attend?' },
      { name: '6. Show my volunteer tasks', token: studentToken, msg: 'Show my volunteer tasks' },
      { name: '7. What should I attend?', token: studentToken, msg: 'What should I attend?' },
      { name: '8. Inactive students (Admin)', token: adminToken, msg: 'Show inactive students who have not registered for any events.' },
      { name: '9. Attendance summary (Admin)', token: adminToken, msg: 'Show attendance summary rates of completed events.' },
      { name: '10. Send reminders (Admin)', token: adminToken, msg: 'Draft reminder emails for tomorrow\'s events.' },
      { name: '11. Create a workshop (Admin)', token: adminToken, msg: 'Create a technical workshop next Friday at 10 AM in Main Hall.' }
    ];

    console.log('Testing all 11 Copilot intents against live running backend:\n');
    for (const q of queries) {
      const res = await axios.post(
        'http://localhost:5000/api/ai/chat',
        { message: q.msg, currentPage: 'AIAssistant' },
        { headers: { Authorization: `Bearer ${q.token}` } }
      );
      console.log(`✅ [${q.name}] -> Status: ${res.status}`);
      console.log(`   Reply Preview: ${res.data.reply.split('\n')[0]}\n`);
    }

  } catch (err) {
    console.error('❌ Error during intent testing:', err.response?.status, err.response?.data || err.message);
  }
}

testAllIntents();
