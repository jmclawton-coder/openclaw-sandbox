# Twilio Voice Integration - Deployment Guide for James

**Status**: 🔧 Ready for Deployment  
**Date**: 2026-02-18  
**Location**: Sandbox `twilio-functions/`

## What This Does

Gives Watson full bidirectional voice capability:
- **Inbound**: You call +447456423557 and have spoken conversations with Watson
- **Outbound**: Watson can call you (announcements or full conversations)
- **Architecture**: Serverless (Twilio Functions) — no local server, no ngrok needed

## Deployment Steps

Follow these in order. I've prepared everything in sandbox; you just need to deploy to Twilio.

### Step 1: Create Twilio Functions Service

1. Log in to https://console.twilio.com
2. Navigate: **Explore Products → Developer Tools → Functions and Assets → Services**
3. Click **"Create Service"**, name it: `watson-voice`
4. Note the service URL (e.g., `https://watson-voice-XXXX.twil.io`)

### Step 2: Configure Environment Variables

In Twilio Console: **Functions > Services > watson-voice > Settings > Environment Variables**

Add these (click "Add" for each):

| Variable Name | Value | Where to Get It |
|---------------|-------|-----------------|
| `GEMINI_API_KEY` | (your Google AI key) | https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | `gemini-3-pro-preview` | (type exactly as shown) |
| `ANTHROPIC_API_KEY` | (your Anthropic key) | Your account |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-5-20250929` | (type exactly as shown) |
| `WATSON_SYSTEM_PROMPT` | (see below) | Copy/paste from below |
| `MY_NUMBER` | `+447930472512` | (your mobile) |

**Watson System Prompt (copy this):**
```
You are Watson, an AI executive assistant for James Lawton, Director of Lawton Company Investments Ltd. You are speaking on a phone call. Keep responses concise and conversational — ideally under 3 sentences. You are professional but warm. If James asks you to do something you cannot do on a phone call (e.g. send an email, look something up), acknowledge the request and tell him you will handle it when back on the main system. Do not use markdown, lists, or any formatting — this is spoken conversation.
```

**Add Dependency:**
- Go to: **Functions > Services > watson-voice > Settings > Dependencies**
- Click "Add", enter: `node-fetch` version `2.6.7`

### Step 3: Upload Function Code

In the Twilio Console Functions editor (Functions > Services > watson-voice):

**Function 1: `/voice` (inbound calls)**
1. Click "Add +" → "Add Function"
2. Path: `/voice`
3. Visibility: **Public**
4. Paste contents of `voice.js` (from sandbox)
5. Save

**Function 2: `/outbound-voice` (outbound calls)**
1. Click "Add +" → "Add Function"
2. Path: `/outbound-voice`
3. Visibility: **Public**
4. Paste contents of `outbound-voice.js` (from sandbox)
5. Save

**Deploy:**
Click **"Deploy All"** (top right)

### Step 4: Configure Phone Number

1. Go to: **Phone Numbers → Manage → Active Numbers → +447456423557**
2. Under **Voice Configuration**:
   - "A call comes in" → **Function**
   - Service: `watson-voice`
   - Environment: `ui`
   - Function Path: `/voice`
3. Click **Save configuration**

### Step 5: Test Inbound Call

**Simple test**: Call +447456423557 from your mobile

Expected:
- Watson answers: "Hello, this is Watson. How can I help you?"
- Speak a question
- Watson responds conversationally
- Continue for 2-3 turns to test memory

If it works, **you're done!** The inbound side is live.

### Step 6: Set Up Outbound Calling (Optional)

If you want Watson to be able to call you:

1. Create production directory:
```bash
mkdir -p ~/.openclaw/workspace/integrations/twilio
cd ~/.openclaw/workspace/integrations/twilio
```

2. Copy scripts from sandbox:
```bash
cp ~/.openclaw/workspace/openclaw-sandbox/twilio-functions/make-call.js .
cp ~/.openclaw/workspace/openclaw-sandbox/twilio-functions/send-sms.js .
cp ~/.openclaw/workspace/openclaw-sandbox/twilio-functions/package.json .
```

3. Install dependencies:
```bash
npm install
```

4. Create `.env.local`:
```bash
cat > .env.local << EOF
TWILIO_ACCOUNT_SID=(your Twilio account SID)
TWILIO_AUTH_TOKEN=(your Twilio auth token)
TWILIO_PHONE_NUMBER=+447456423557
MY_NUMBER=+447930472512
EOF
```

5. Update `make-call.js` line 23 with your actual Twilio Functions service URL:
```javascript
callOptions.url = 'https://watson-voice-XXXX.twil.io/outbound-voice';
```

6. Test SMS:
```bash
node send-sms.js "Test message from Watson"
```

7. Test outbound call announcement:
```bash
node make-call.js "This is Watson calling to test voice integration."
```

8. Test outbound conversational call:
```bash
node make-call.js
```

## What to Tell Watson

Once deployed and tested:

1. **For inbound calls**: "Voice integration is live. People can call +447456423557 and speak with you."

2. **For outbound calls** (if set up): "You can now call me using the scripts in integrations/twilio/"

3. **Update TOOLS.md**:
```markdown
**Twilio Voice:** Bidirectional voice calling active
- Inbound: +447456423557 (direct calls to Watson)
- Outbound: `node ~/.openclaw/workspace/integrations/twilio/make-call.js "message"`
- SMS: `node ~/.openclaw/workspace/integrations/twilio/send-sms.js "message"`
- Service: https://watson-voice-XXXX.twil.io
```

## Troubleshooting

**Call connects but no response:**
- Check environment variables are set correctly in Twilio Functions
- Increase function timeout: Functions > Settings > Timeout → 30 seconds

**"Application error" message:**
- Check function is deployed: Functions > Services > watson-voice → should show green "Deployed"
- Check function visibility is "Public" (not "Protected")
- Check phone number webhook is configured correctly (Step 4)

**Speech not recognized:**
- Try changing `speechModel` in `voice.js` from `experimental_conversations` to `phone_call`
- Redeploy after changes

**LLM not responding:**
- Check API keys are valid
- View function logs: Functions > Services > watson-voice → Logs

**For detailed troubleshooting**, see `README.md` in this directory.

## Cost Estimates

Per call (5 minutes):
- Twilio: ~£0.40-0.50
- Gemini API: Negligible (or free during preview)
- Total: <£1 per 5-minute call

Monthly (assuming 20 calls/month):
- £10-15 total

## Questions?

Ask Watson to check:
- `README.md` — Full technical documentation
- Twilio console logs — Real-time function execution logs
- Sandbox test files — Reference implementations

---

**Next Step**: Deploy to Twilio (Steps 1-4), then test (Step 5).

**Sandbox Location**: `~/.openclaw/workspace/openclaw-sandbox/twilio-functions/`  
**Production Location** (after deployment): `~/.openclaw/workspace/integrations/twilio/`
