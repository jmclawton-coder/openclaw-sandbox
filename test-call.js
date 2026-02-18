require('dotenv').config({ path: '.env.local' });
const { makeCall } = require('./yay-client');

/**
 * Test outbound call via Yay.com API
 * 
 * This uses click-to-call: it first rings the SIP user's phone (James's mobile),
 * and when answered, dials out to the destination number.
 * 
 * For TTS playback ("Hello from Watson, test call"), a call route/flow
 * with TTS or audio playback would need to be configured in Yay.com dashboard.
 * The API itself doesn't support inline TTS - audio must be pre-hosted.
 */
async function testCall() {
  console.log('--- Testing Outbound Call ---');
  console.log('This will ring your SIP phone first, then dial +447930472512');
  
  try {
    const result = await makeCall('+447930472512');
    console.log('Call Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    if (err.response?.data?.result?.includes('credit')) {
      console.log('⚠️  Call blocked: insufficient credit. Top up the Yay.com account.');
    } else {
      console.error('Call Test Failed:', err.message);
    }
  }
}

testCall();
