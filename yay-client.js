require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.YAY_API_KEY;
const BASE_URL = 'https://api.yay.com/v1'; // Confirm exact base from docs

async function sendSMS(to, message, from) {
  try {
    const response = await axios.post(`${BASE_URL}/sms/send`, { to, from, message }, {
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) { console.error('SMS Error:', error.response?.data); }
}

async function makeCall(to, audioUrl, from) { // audioUrl from OpenClaw tts (save as temp file, upload to public host if needed)
  try {
    const response = await axios.post(`${BASE_URL}/calls`, { to, from, url: audioUrl }, {
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }
    });
    return response.data.callId;
  } catch (error) { console.error('Call Error:', error.response?.data); }
}

// Export for OpenClaw tool use
module.exports = { sendSMS, makeCall };
