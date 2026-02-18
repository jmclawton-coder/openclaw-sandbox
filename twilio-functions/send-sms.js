// send-sms.js — Send SMS via Twilio
require('dotenv').config();
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMS(body) {
  try {
    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER || '+447456423557',
      to: process.env.MY_NUMBER || '+447930472512'
    });
    console.log(`SMS sent: ${message.sid}`);
    return message.sid;
  } catch (err) {
    console.error(`SMS failed: ${err.message}`);
    throw err;
  }
}

// Usage: node send-sms.js "Your message here"
const body = process.argv[2] || 'Message from Watson via OpenClaw';
sendSMS(body);
