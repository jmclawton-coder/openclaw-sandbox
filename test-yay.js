const { sendSMS } = require('./yay-client');

async function testSMS() {
  try {
    const result = await sendSMS('+447930472512', 'Test SMS from Watson via OpenClaw.', '+441234567890');
    console.log('SMS Result:', result);
  } catch (err) {
    console.error('SMS Test Failed:', err);
  }
}

testSMS();