# 📞 Twilio-Voicebox Integration Setup Guide

This guide will walk you through setting up the Twilio-Voicebox integration for OpenClaw, allowing you to receive voice calls and interact with your AI assistant via phone.

## 🎯 Overview

**Phone Number:** +447456423557

**Flow:**
1. Incoming call arrives → Twilio webhook triggers
2. Caller speaks → Audio is recorded
3. Recording sent to Google Cloud Speech-to-Text → Transcription (streaming)
4. Transcription sent to OpenClaw main session → AI processes
5. OpenClaw response → Twilio TTS (<Say> verb with Polly.Amy-Neural)
6. Caller hears response

## 📋 Prerequisites

- Node.js v16+ installed
- Twilio account with a phone number
- Google Cloud Platform account with Speech-to-Text API enabled
- Google OAuth2 credentials file (`google-credentials.json`)
- ngrok installed (for local testing)
- OpenClaw Gateway running

## 🔧 Setup Steps

### 1. Set Up Google Cloud Speech-to-Text

#### Enable the API:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** → **Library**
4. Search for "Cloud Speech-to-Text API"
5. Click **Enable**

#### Get OAuth2 Credentials:
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen
4. Choose **Desktop app** as application type
5. Download the JSON file
6. Rename it to `google-credentials.json`
7. Place it in the `openclaw-sandbox` directory

**⚠️ Important:** The `google-credentials.json` file is now in `.gitignore` and will not be committed to git. Keep this file secure!

### 2. Install Dependencies

```bash
cd ~/.openclaw/workspace/openclaw-sandbox
git checkout twilio-voicebox
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Get these from https://console.twilio.com
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# OpenClaw configuration
OPENCLAW_GATEWAY_URL=http://localhost:8080
OPENCLAW_SESSION_ID=agent:main
OPENCLAW_API_TOKEN=your_token_here

# Port for the webhook server
PORT=3000
```

**Note:** Google Cloud credentials are loaded from `google-credentials.json` file, not from environment variables.

### 4. Start the Server

```bash
npm run voicebox
```

You should see:
```
🚀 Twilio-Voicebox server running on port 3000
📞 Webhook URL: http://localhost:3000/voice
🌐 Use ngrok to expose this to Twilio: ngrok http 3000
```

### 5. Expose Your Local Server with ngrok

In a new terminal window:

```bash
ngrok http 3000
```

Copy the **https** forwarding URL (e.g., `https://abc123.ngrok.io`)

### 6. Configure Twilio Phone Number

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your number: **+447456423557**
4. Scroll to **Voice Configuration**
5. Under **A CALL COMES IN**, set:
   - **Webhook**: `https://your-ngrok-url.ngrok.io/voice`
   - **HTTP Method**: `POST`
6. Click **Save**

### 7. Test It!

Call **+447456423557** and speak your message. The system will:
1. Greet you with Amy Neural voice
2. Record your message
3. Transcribe it with Google Cloud Speech-to-Text (streaming)
4. Send to OpenClaw
5. Respond with TTS using Polly.Amy-Neural

## 🧪 Testing Locally

### Test the health endpoint:
```bash
curl http://localhost:3000/health
```

### Monitor logs:
The server logs all activity to console:
- 📞 Incoming calls
- 🎙️ Recordings received
- ⬇️ Audio download
- 🎯 Google Cloud Speech transcription
- 🤖 OpenClaw communication
- 💬 Responses

## 🔍 Troubleshooting

### Issue: "I'm sorry, I couldn't understand what you said"
- **Cause**: Google STT failed to transcribe or returned empty text
- **Fix**: 
  - Check that `google-credentials.json` is in the correct location
  - Verify Speech-to-Text API is enabled in Google Cloud Console
  - Check your Google Cloud project has billing enabled
  - Review console logs for specific error messages

### Issue: Error loading Google credentials
- **Cause**: `google-credentials.json` file missing or invalid
- **Fix**: 
  - Ensure the file exists in the project root directory
  - Verify it's a valid JSON file with OAuth2 client credentials
  - Check file permissions

### Issue: Error communicating with OpenClaw
- **Cause**: OpenClaw Gateway not responding
- **Fix**: Verify `OPENCLAW_GATEWAY_URL` is correct and Gateway is running

### Issue: Twilio webhook not triggering
- **Cause**: ngrok URL not configured or expired
- **Fix**: Update the Twilio console with your current ngrok URL

### Issue: Recording callback not working
- **Cause**: Twilio authentication failed
- **Fix**: Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct

### Issue: Poor transcription quality
- **Cause**: Audio quality or model configuration
- **Fix**: 
  - The code uses the enhanced phone call model for better accuracy
  - Check that the audio encoding matches (MP3)
  - Consider increasing `sampleRateHertz` if needed
  - Review Google's [best practices](https://cloud.google.com/speech-to-text/docs/best-practices)

## 🎨 Customization

### Change the Voice

In `twilio-voicebox.js`, modify the `voice` parameter:

```javascript
twiml.say({ voice: 'Polly.Amy-Neural' }, 'Your message here');
```

**Current voice:** Polly.Amy-Neural (British English, Neural)

Available voices: [Twilio TTS Voices](https://www.twilio.com/docs/voice/twiml/say#amazon-polly)

### Adjust Recording Length

Change `maxLength` in the `<Record>` verb:

```javascript
twiml.record({
  maxLength: 120, // 2 minutes instead of 60 seconds
  // ... other options
});
```

### Modify the Greeting

Edit the greeting message in the `/voice` endpoint:

```javascript
twiml.say({ voice: 'Polly.Amy-Neural' }, 
  'Your custom greeting here!');
```

### Adjust Google STT Settings

In the `transcribeWithGoogleSTT` function, you can modify:

```javascript
const request = {
  config: {
    encoding: 'MP3',
    sampleRateHertz: 16000, // Adjust based on audio quality
    languageCode: 'en-US',  // Change language
    enableAutomaticPunctuation: true,
    model: 'default', // or 'phone_call' for phone audio
    useEnhanced: true, // Enhanced models for better accuracy
  },
  interimResults: false, // Set to true for partial results
};
```

Available language codes: [Speech-to-Text Languages](https://cloud.google.com/speech-to-text/docs/languages)

## 📊 Monitoring

### View call logs in Twilio Console:
1. Go to [Monitor → Logs → Calls](https://console.twilio.com/us1/monitor/logs/calls)
2. Filter by your phone number
3. Click on a call to see detailed logs

### Monitor Google Cloud usage:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Dashboard**
3. Click on **Cloud Speech-to-Text API**
4. View usage metrics and quotas

### Server logs:
All activity is logged to the console where you ran `npm run voicebox`

## 🚀 Production Deployment

For production use, you'll want to:

1. **Deploy to a cloud service** (Heroku, Railway, Render, Google Cloud Run, etc.)
2. **Remove ngrok** and use your production URL
3. **Update Twilio webhook** to point to production URL
4. **Enable SSL/TLS** (required by Twilio)
5. **Secure Google credentials** (use environment variables or secret management)
6. **Add authentication** to webhook endpoints
7. **Implement rate limiting**
8. **Set up monitoring** (Sentry, LogDNA, Google Cloud Logging, etc.)

### Securing Google Credentials in Production:

Instead of using a credentials file, you can use environment variables:

```javascript
// Alternative: Use service account credentials from environment
const speechClient = new speech.SpeechClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  },
  projectId: process.env.GOOGLE_PROJECT_ID
});
```

Or use Google Cloud's Application Default Credentials when running on Google Cloud Platform.

### Example Heroku Deployment:

```bash
# Login to Heroku
heroku login

# Create app
heroku create openclaw-voicebox

# Set environment variables
heroku config:set TWILIO_ACCOUNT_SID=xxx
heroku config:set TWILIO_AUTH_TOKEN=xxx
heroku config:set OPENCLAW_GATEWAY_URL=https://your-gateway.com
heroku config:set OPENCLAW_API_TOKEN=xxx

# For Google credentials, either:
# 1. Commit a service account JSON (not OAuth2) to a private repo
# 2. Use environment variables (recommended):
heroku config:set GOOGLE_PROJECT_ID=xxx
heroku config:set GOOGLE_CLIENT_EMAIL=xxx
heroku config:set GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Deploy
git push heroku twilio-voicebox:main

# Your webhook URL will be:
# https://openclaw-voicebox.herokuapp.com/voice
```

## 🔐 Security Notes

- **Never commit credentials** to git
  - `.env.local` is in `.gitignore`
  - `google-credentials.json` is in `.gitignore`
- **Use environment variables** for all sensitive data in production
- **Enable Twilio request validation** in production
- **Implement rate limiting** to prevent abuse
- **Monitor usage** to detect unusual activity
- **Use service accounts** instead of OAuth2 credentials in production
- **Rotate credentials** regularly
- **Set up Google Cloud budget alerts** to monitor API costs

## 💰 Cost Considerations

### Google Cloud Speech-to-Text Pricing:
- Standard model: $0.006 per 15 seconds
- Enhanced model (used in this setup): $0.009 per 15 seconds
- First 60 minutes per month are free
- [Pricing details](https://cloud.google.com/speech-to-text/pricing)

### Twilio Pricing:
- Incoming calls: ~$0.0085/minute
- TTS (text-to-speech): Depends on voice and region
- [Twilio pricing](https://www.twilio.com/voice/pricing)

## 🔄 Changes from Previous Version

### What Changed:
- **Replaced OpenAI Whisper** with **Google Cloud Speech-to-Text**
- Now uses **streaming recognition** for real-time transcription
- Authentication via `google-credentials.json` (OAuth2 client)
- Removed OpenAI dependency

### What Stayed the Same:
- Twilio TTS using `<Say>` verb with `Polly.Amy-Neural` voice
- Same webhook endpoints and flow
- OpenClaw integration unchanged
- All the same features and capabilities

### Migration Notes:
If you're upgrading from the Whisper version:
1. Install `@google-cloud/speech`: `npm install @google-cloud/speech`
2. Remove OpenAI: `npm uninstall openai`
3. Set up Google Cloud credentials (see Setup Steps above)
4. Replace `twilio-voicebox.js` with the new version
5. Remove `OPENAI_API_KEY` from `.env.local`
6. Test thoroughly!

## 📞 Support

If you encounter issues:
1. Check server logs for errors
2. Verify all environment variables are set
3. Ensure `google-credentials.json` is in place
4. Test the health endpoint: `curl http://localhost:3000/health`
5. Check Twilio call logs
6. Review Google Cloud Speech-to-Text logs
7. Review OpenClaw Gateway logs

## 🎉 You're All Set!

Your Twilio-Voicebox integration with Google Cloud Speech-to-Text is now ready to receive calls!

Call **+447456423557** and start talking to Watson with Amy's lovely voice! 🤖✨
