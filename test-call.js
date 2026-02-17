const { makeCall } = require('./yay-client');
const fs = require('fs');
const path = require('path');

// Placeholder: Need public URL for audio. For now, use a test audio URL (e.g., public sound).
const audioUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'; // Placeholder public audio

async function testCall() {
  try {
    const callId = await makeCall('+447930472512', audioUrl, '+441234567890');
    console.log('Call ID:', callId);
  } catch (err) {
    console.error('Call Test Failed:', err);
  }
}

testCall();