require('dotenv').config({ path: '.env.local' });
const { sendSMS, testAuth } = require('./yay-client');

async function testSMS() {
  // First verify auth
  console.log('--- Testing Authentication ---');
  await testAuth();

  // Then send SMS
  console.log('\n--- Sending Test SMS ---');
  try {
    const result = await sendSMS(
      '+447930472512',
      'Hello from Watson via OpenClaw 🤖 Test SMS from +447474701812',
      '+447474701812'
    );
    console.log('SMS Result:', result);
  } catch (err) {
    if (err.response?.status === 402 || err.response?.data?.result?.includes('credit')) {
      console.log('⚠️  SMS blocked: insufficient credit. Top up the Yay.com account.');
    } else {
      console.error('SMS Test Failed:', err.message);
    }
  }
}

testSMS();
