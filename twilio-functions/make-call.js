// make-call.js — Watson initiates outbound voice call
require('dotenv').config();
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function callUser(message) {
  // If a custom message is provided, use inline TwiML
  // Otherwise, use the /outbound-voice Function for full conversation
  const callOptions = {
    to: process.env.MY_NUMBER || '+447930472512',
    from: process.env.TWILIO_PHONE_NUMBER || '+447456423557',
  };

  if (message) {
    // Simple one-way TTS message (no conversation)
    callOptions.twiml = `<Response><Say voice="Polly.Amy" language="en-GB">${message}</Say></Response>`;
  } else {
    // Full conversational call via Twilio Function
    // TODO: Update with actual Twilio Functions service URL after deployment
    callOptions.url = 'https://watson-voice-XXXX.twil.io/outbound-voice';
  }

  try {
    const call = await client.calls.create(callOptions);
    console.log(`Call initiated: ${call.sid}`);
    return call.sid;
  } catch (err) {
    console.error(`Call failed: ${err.message}`);
    throw err;
  }
}

// Usage examples:
// Quick announcement: node make-call.js "James, your 3pm meeting starts in 10 minutes."
// Full conversation: node make-call.js

const message = process.argv[2] || null;
callUser(message);
