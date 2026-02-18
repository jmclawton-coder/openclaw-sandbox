# Deploy Twilio Voice Integration - Quick Guide

**Time Required**: 15-20 minutes  
**What You Need**: Twilio Console access, API keys ready

---

## Step 1: Create Twilio Functions Service (5 min)

1. **Log in**: https://console.twilio.com
2. **Navigate**: Explore Products → Developer Tools → Functions and Assets → **Services**
3. **Create Service**:
   - Click "**Create Service**"
   - Name: `watson-voice`
   - Click "**Create**"
4. **Note the URL**: You'll see something like `https://watson-voice-XXXX.twil.io`

---

## Step 2: Add Environment Variables (10 min)

Still in the service, go to: **Settings → Environment Variables**

Click "**Add**" for each of these:

### API Keys (Get these ready first!)

**Gemini API Key:**
- Go to: https://aistudio.google.com/apikey
- Create or copy your key
- Add in Twilio:
  - Key: `GEMINI_API_KEY`
  - Value: (paste your key)

**Anthropic API Key:**
- From your Anthropic account
- Add in Twilio:
  - Key: `ANTHROPIC_API_KEY`
  - Value: (paste your key)

### Model Names (Just type these exactly)

| Key | Value |
|-----|-------|
| `GEMINI_MODEL` | `gemini-3-pro-preview` |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-5-20250929` |
| `MY_NUMBER` | `+447930472512` |

### System Prompt (Copy/paste this)

Key: `WATSON_SYSTEM_PROMPT`

Value:
```
You are Watson, an AI executive assistant for James Lawton, Director of Lawton Company Investments Ltd. You are speaking on a phone call. Keep responses concise and conversational — ideally under 3 sentences. You are professional but warm. If James asks you to do something you cannot do on a phone call (e.g. send an email, look something up), acknowledge the request and tell him you will handle it when back on the main system. Do not use markdown, lists, or any formatting — this is spoken conversation.
```

### Add Dependency

Still in **Settings**, go to **Dependencies**:
- Click "**Add**"
- Package: `node-fetch`
- Version: `2.6.7`
- Click "**Add**"

**Click "Save" at the bottom**

---

## Step 3: Upload Functions (5 min)

Go back to the main service page.

### Function 1: /voice

1. Click "**Add +**" → "**Add Function**"
2. Path: `/voice`
3. Visibility: **Public**
4. Copy the code from: `~/.openclaw/workspace/openclaw-sandbox/twilio-functions/voice.js`
5. Paste into the editor
6. Click "**Save**"

### Function 2: /outbound-voice

1. Click "**Add +**" → "**Add Function**"
2. Path: `/outbound-voice`
3. Visibility: **Public**
4. Copy the code from: `~/.openclaw/workspace/openclaw-sandbox/twilio-functions/outbound-voice.js`
5. Paste into the editor
6. Click "**Save**"

### Deploy

Click "**Deploy All**" (top right corner)

Wait for deployment to complete (~30 seconds)

---

## Step 4: Configure Phone Number (2 min)

1. **Navigate**: Phone Numbers → Manage → Active Numbers
2. **Click**: +447456423557
3. **Voice Configuration**:
   - "A call comes in" → Select **Function**
   - Service: `watson-voice`
   - Environment: `ui`
   - Function Path: `/voice`
4. **Click**: "**Save configuration**"

---

## Step 5: Test! (1 min)

**Call +447456423557 from your mobile**

Expected:
- Watson answers: "Hello, this is Watson. How can I help you?"
- Speak naturally
- Watson responds conversationally
- Continue for a few turns

If it works: **Continue to Step 6!**

---

## Step 6: Enable Outbound Calling (5 min)

### Update Service URL

1. **Note your service URL** from Step 1 (e.g., `https://watson-voice-XXXX.twil.io`)
2. **Open file**: `~/.openclaw/workspace/integrations/twilio/make-call.js`
3. **Find line 23**: `callOptions.url = 'https://watson-voice-XXXX.twil.io/outbound-voice';`
4. **Replace** `watson-voice-XXXX.twil.io` with your actual service URL
5. **Save**

### Test Outbound SMS

```bash
~/.openclaw/workspace/integrations/twilio/watson-sms.sh "Test message from Watson"
```

Expected: SMS arrives on your mobile

### Test Outbound Announcement

```bash
~/.openclaw/workspace/integrations/twilio/watson-call.sh "This is Watson testing outbound calling"
```

Expected: Phone rings, announcement plays

Cost: ~£0.40 per call

If it works: **You're done!** ✅

---

## Troubleshooting

**"Application error has occurred":**
- Check Step 4: webhook must point to `/voice` function
- Check deployment completed (green "Deployed" badge in Functions)

**No response to speech:**
- Check environment variables are saved correctly
- Check `node-fetch` dependency is added
- View logs: Functions → Services → watson-voice → **Logs**

**Voice sounds robotic:**
- Should be using Polly.Amy — check the code wasn't modified

---

## After Deployment

Update Watson:
- "Voice integration is live. Call +447456423557 to speak with me."

Cost: ~4p per 5-minute call + £1/month for the number

---

**Questions?** Check `README.md` or ask Watson for help with Twilio console navigation.

**Code Location**: `~/.openclaw/workspace/openclaw-sandbox/twilio-functions/`
