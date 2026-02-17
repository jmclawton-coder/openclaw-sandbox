require('dotenv').config({ path: '.env.local' });
const { makeCall } = require('./yay-client');
const fs = require('fs');
const path = require('path');

// Placeholder for audio URL - need to host TTS audio publicly
const audioUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'; // Temp test sound; replace with TTS URL

async function testCall() {
  try {
    const callId = await makeCall('+447930472512', audioUrl, '+447474701812');
    console.log('Call ID:', callId);
  } catch (err) {
    console.error('Call Test Failed:', err);
  }
}

testCall();