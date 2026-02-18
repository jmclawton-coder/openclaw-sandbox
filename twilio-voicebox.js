const express = require('express');
const twilio = require('twilio');
const axios = require('axios');
const { Readable } = require('stream');
const speech = require('@google-cloud/speech');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Initialize Google Cloud Speech-to-Text client with OAuth2 credentials
const speechClient = new speech.SpeechClient({
  keyFilename: path.join(__dirname, 'google-credentials.json')
});

// OpenClaw Gateway configuration
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:8080';
const OPENCLAW_SESSION_ID = process.env.OPENCLAW_SESSION_ID || 'agent:main';

/**
 * Main webhook endpoint for incoming Twilio calls
 * This is what you'll configure in the Twilio console for your phone number
 */
app.post('/voice', (req, res) => {
  console.log('📞 Incoming call from:', req.body.From);
  
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Greet the caller
  twiml.say({ voice: 'Polly.Amy-Neural' }, 
    'Hello! This is Watson, your OpenClaw assistant. Please speak your message after the beep.');
  
  // Record the caller's message
  twiml.record({
    action: '/recording-callback',
    method: 'POST',
    maxLength: 60, // Max 60 seconds
    playBeep: true,
    transcribe: false, // We'll use Google Cloud Speech-to-Text instead
    recordingStatusCallback: '/recording-status',
    recordingStatusCallbackMethod: 'POST'
  });
  
  // Fallback message
  twiml.say({ voice: 'Polly.Amy-Neural' }, 
    'I didn\'t hear anything. Please call back and speak after the beep.');
  
  res.type('text/xml');
  res.send(twiml.toString());
});

/**
 * Callback endpoint that receives the recording URL from Twilio
 * This is where the main STT → OpenClaw → TTS flow happens
 */
app.post('/recording-callback', async (req, res) => {
  console.log('🎙️  Recording received from:', req.body.From);
  
  const recordingUrl = req.body.RecordingUrl;
  const callerNumber = req.body.From;
  const callSid = req.body.CallSid;
  
  const twiml = new twilio.twiml.VoiceResponse();
  
  try {
    // Step 1: Download the recording from Twilio
    console.log('⬇️  Downloading recording...');
    const audioResponse = await axios.get(recordingUrl + '.mp3', {
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN
      },
      responseType: 'arraybuffer'
    });
    
    // Step 2: Transcribe using Google Cloud Speech-to-Text
    console.log('🎯 Transcribing with Google Cloud Speech...');
    const transcription = await transcribeWithGoogleSTT(audioResponse.data);
    console.log('📝 Transcription:', transcription);
    
    if (!transcription || transcription.trim() === '') {
      twiml.say({ voice: 'Polly.Amy-Neural' }, 
        'I\'m sorry, I couldn\'t understand what you said. Please try again.');
      res.type('text/xml');
      return res.send(twiml.toString());
    }
    
    // Step 3: Send transcription to OpenClaw main session
    console.log('🤖 Sending to OpenClaw...');
    const openclawResponse = await sendToOpenClaw(transcription, callerNumber, callSid);
    console.log('💬 OpenClaw response:', openclawResponse);
    
    // Step 4: Respond with TTS using Twilio <Say>
    twiml.say({ voice: 'Polly.Amy-Neural' }, openclawResponse);
    
    // Option to leave another message
    twiml.say({ voice: 'Polly.Amy-Neural' }, 
      'If you\'d like to leave another message, please speak after the beep. Otherwise, hang up.');
    
    twiml.record({
      action: '/recording-callback',
      method: 'POST',
      maxLength: 60,
      playBeep: true,
      transcribe: false
    });
    
  } catch (error) {
    console.error('❌ Error processing recording:', error);
    twiml.say({ voice: 'Polly.Amy-Neural' }, 
      'I\'m sorry, there was an error processing your message. Please try again later.');
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

/**
 * Transcribe audio using Google Cloud Speech-to-Text streaming API
 * Provides real-time speech recognition capability
 */
async function transcribeWithGoogleSTT(audioBuffer) {
  try {
    // Create a readable stream from the audio buffer
    const audioStream = Readable.from(audioBuffer);
    
    // Configure the streaming recognition request
    const request = {
      config: {
        encoding: 'MP3',
        sampleRateHertz: 16000, // Twilio recordings are typically 8kHz, but we'll let Google auto-detect
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
        model: 'default', // Use 'phone_call' model for better phone audio recognition
        useEnhanced: true, // Use enhanced model for better accuracy
      },
      interimResults: false, // We only want final results
    };
    
    // Create a streaming recognition stream
    const recognizeStream = speechClient
      .streamingRecognize(request)
      .on('error', (error) => {
        console.error('Google STT stream error:', error);
        throw error;
      });
    
    // Collect transcription results
    let transcription = '';
    
    // Set up promise to handle the async streaming
    const transcriptionPromise = new Promise((resolve, reject) => {
      recognizeStream.on('data', (data) => {
        if (data.results[0] && data.results[0].alternatives[0]) {
          transcription += data.results[0].alternatives[0].transcript;
        }
      });
      
      recognizeStream.on('end', () => {
        resolve(transcription.trim());
      });
      
      recognizeStream.on('error', (error) => {
        reject(error);
      });
    });
    
    // Pipe the audio stream to the recognition stream
    audioStream.pipe(recognizeStream);
    
    // Wait for transcription to complete
    const result = await transcriptionPromise;
    return result;
    
  } catch (error) {
    console.error('Error transcribing with Google Speech-to-Text:', error);
    throw error;
  }
}

/**
 * Send transcription to OpenClaw main session and get response
 * This simulates sending a message to the main session and waiting for a response
 */
async function sendToOpenClaw(transcription, callerNumber, callSid) {
  try {
    // Format the message as a system event/message
    const message = {
      type: 'voice_message',
      content: transcription,
      metadata: {
        source: 'twilio',
        caller: callerNumber,
        callSid: callSid,
        timestamp: new Date().toISOString()
      }
    };
    
    // Send to OpenClaw Gateway
    // Note: This is a simplified version. You'll need to adapt this to your actual
    // OpenClaw API endpoint and authentication method
    const response = await axios.post(
      `${OPENCLAW_GATEWAY_URL}/api/v1/sessions/${OPENCLAW_SESSION_ID}/messages`,
      message,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENCLAW_API_TOKEN}`
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    // Extract the response text from OpenClaw
    if (response.data && response.data.response) {
      return response.data.response;
    }
    
    // Fallback response
    return `I received your message: "${transcription}". I'll process this and get back to you.`;
    
  } catch (error) {
    console.error('Error communicating with OpenClaw:', error.message);
    
    // Fallback response if OpenClaw is unavailable
    return `I received your message: "${transcription}". However, I'm currently unable to process it fully. Please try again later or send a text message.`;
  }
}

/**
 * Recording status callback (optional, for monitoring)
 */
app.post('/recording-status', (req, res) => {
  console.log('📊 Recording status:', req.body.RecordingStatus, 'for call:', req.body.CallSid);
  res.sendStatus(200);
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'twilio-voicebox',
    timestamp: new Date().toISOString()
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.send(`
    <h1>📞 Twilio-Voicebox Integration</h1>
    <p>This service handles voice calls for OpenClaw.</p>
    <ul>
      <li><strong>POST /voice</strong> - Main webhook for incoming calls</li>
      <li><strong>POST /recording-callback</strong> - Processes recordings</li>
      <li><strong>GET /health</strong> - Health check</li>
    </ul>
    <p>Status: <strong>Running</strong></p>
  `);
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Twilio-Voicebox server running on port ${port}`);
  console.log(`📞 Webhook URL: http://localhost:${port}/voice`);
  console.log(`🌐 Use ngrok to expose this to Twilio: ngrok http ${port}`);
});

module.exports = app;
