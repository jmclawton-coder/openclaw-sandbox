# 📞 Twilio-Voicebox Integration Setup Guide

This guide will walk you through setting up the Twilio-Voicebox integration for OpenClaw, allowing you to receive voice calls and interact with your AI assistant via phone.

## 🎯 Overview

**Phone Number:** +447456423557

**Flow:**
1. Incoming call arrives → Twilio webhook triggers
2. Caller speaks → Audio is recorded
3. Recording sent to OpenAI Whisper → Transcription
4. Transcription sent to OpenClaw main session → AI processes
5. OpenClaw response → Twilio TTS (<Say> verb)
6. Caller hears response

## 📋 Prerequisites

- Node.js v16+ installed
- Twilio account with a phone number
- OpenAI API key (for Whisper STT)
- ngrok installed (for local testing)
- OpenClaw Gateway running

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
cd ~/.openclaw/workspace/openclaw-sandbox
git checkout twilio-voicebox
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Get these from https://console.twilio.com
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenClaw configuration
OPENCLAW_GATEWAY_URL=http://localhost:8080
OPENCLAW_SESSION_ID=agent:main
OPENCLAW_API_TOKEN=your_token_here

# Port for the webhook server
PORT=3000
```

### 3. Start the Server

```bash
npm run voicebox
```

You should see:
```
🚀 Twilio-Voicebox server running on port 3000
📞 Webhook URL: http://localhost:3000/voice
🌐 Use ngrok to expose this to Twilio: ngrok http 3000
```

### 4. Expose Your Local Server with ngrok

In a new terminal window:

```bash
ngrok http 3000
```

Copy the **https** forwarding URL (e.g., `https://abc123.ngrok.io`)

### 5. Configure Twilio Phone Number

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your number: **+447456423557**
4. Scroll to **Voice Configuration**
5. Under **A CALL COMES IN**, set:
   - **Webhook**: `https://your-ngrok-url.ngrok.io/voice`
   - **HTTP Method**: `POST`
6. Click **Save**

### 6. Test It!

Call **+447456423557** and speak your message. The system will:
1. Greet you
2. Record your message
3. Transcribe it with Whisper
4. Send to OpenClaw
5. Respond with TTS

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
- 🎯 Whisper transcription
- 🤖 OpenClaw communication
- 💬 Responses

## 🔍 Troubleshooting

### Issue: "I'm sorry, I couldn't understand what you said"
- **Cause**: Whisper failed to transcribe or returned empty text
- **Fix**: Check your OpenAI API key and account credits

### Issue: Error communicating with OpenClaw
- **Cause**: OpenClaw Gateway not responding
- **Fix**: Verify `OPENCLAW_GATEWAY_URL` is correct and Gateway is running

### Issue: Twilio webhook not triggering
- **Cause**: ngrok URL not configured or expired
- **Fix**: Update the Twilio console with your current ngrok URL

### Issue: Recording callback not working
- **Cause**: Twilio authentication failed
- **Fix**: Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct

## 🎨 Customization

### Change the Voice

In `twilio-voicebox.js`, modify the `voice` parameter:

```javascript
twiml.say({ voice: 'Polly.Amy-Neural' }, 'Your message here');
```

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

## 📊 Monitoring

### View call logs in Twilio Console:
1. Go to [Monitor → Logs → Calls](https://console.twilio.com/us1/monitor/logs/calls)
2. Filter by your phone number
3. Click on a call to see detailed logs

### Server logs:
All activity is logged to the console where you ran `npm run voicebox`

## 🚀 Production Deployment

For production use, you'll want to:

1. **Deploy to a cloud service** (Heroku, Railway, Render, etc.)
2. **Remove ngrok** and use your production URL
3. **Update Twilio webhook** to point to production URL
4. **Enable SSL/TLS** (required by Twilio)
5. **Add authentication** to webhook endpoints
6. **Implement rate limiting**
7. **Set up monitoring** (Sentry, LogDNA, etc.)

### Example Heroku Deployment:

```bash
# Login to Heroku
heroku login

# Create app
heroku create openclaw-voicebox

# Set environment variables
heroku config:set TWILIO_ACCOUNT_SID=xxx
heroku config:set TWILIO_AUTH_TOKEN=xxx
heroku config:set OPENAI_API_KEY=xxx
heroku config:set OPENCLAW_GATEWAY_URL=https://your-gateway.com
heroku config:set OPENCLAW_API_TOKEN=xxx

# Deploy
git push heroku twilio-voicebox:main

# Your webhook URL will be:
# https://openclaw-voicebox.herokuapp.com/voice
```

## 🔐 Security Notes

- **Never commit `.env.local`** to git (already in .gitignore)
- **Use environment variables** for all sensitive data
- **Enable Twilio request validation** in production
- **Implement rate limiting** to prevent abuse
- **Monitor usage** to detect unusual activity

## 📞 Support

If you encounter issues:
1. Check server logs for errors
2. Verify all environment variables are set
3. Test the health endpoint: `curl http://localhost:3000/health`
4. Check Twilio call logs
5. Review OpenClaw Gateway logs

## 🎉 You're All Set!

Your Twilio-Voicebox integration is now ready to receive calls!

Call **+447456423557** and start talking to Watson! 🤖✨
