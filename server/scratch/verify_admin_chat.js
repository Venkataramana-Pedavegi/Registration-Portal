const axios = require('axios');

async function testAdminChat() {
  try {
    console.log('1. Logging in as Admin...');
    const loginRes = await axios.post('http://localhost:5000/api/admin/login', {
      email: 'admin@college.edu',
      password: 'adminpassword'
    });

    const token = loginRes.data.token;
    console.log('✅ Admin login successful!');

    console.log('\n2. Testing Admin AI Copilot prompt: "Show inactive students who have not registered for any events."');
    const chatRes = await axios.post(
      'http://localhost:5000/api/ai/chat',
      {
        message: 'Show inactive students who have not registered for any events.',
        currentPage: 'AIAssistant'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Response HTTP Status:', chatRes.status);
    console.log('✅ Response Reply Content:\n---\n' + chatRes.data.reply + '\n---');

  } catch (err) {
    console.error('❌ Error during API test:', err.response?.status, err.response?.data || err.message);
  }
}

testAdminChat();
