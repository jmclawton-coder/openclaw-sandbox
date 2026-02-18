# Twilio Voice Integration (Serverless Functions)

**Status**: 🔧 Sandbox Testing  
**Architecture**: Twilio Functions (Serverless)  
**Date**: 2026-02-18

## Overview

This implements bidirectional voice calling with Watson using **Twilio Functions** (serverless). No local server, no ngrok, no infrastructure needed.

## Architecture

```
INBOUND CALL FLOW:
User dials +447456423557
  → Twilio receives call
  → Twilio Function /voice handles it
  → <Gather> captures user speech (Twilio STT, speech model: enhanced)
  → Transcribed text sent to LLM API (Gemini 3 Pro primary, Claude fallback)
  → LLM response returned
  → <Say> reads response back to user (Twilio TTS, voice: Polly.Amy en-GB)
  → Loop continues until caller hangs up

OUTBOUND CALL FLOW:
Watson triggers call via Twilio REST API
  → Twilio dials user's number
  → On answer, Twilio fetches TwiML from /outbound-voice Function
  → Same conversational loop as inbound
```

## Files

- `voice.js` — Inbound call handler (Twilio Function `/voice`)
- `outbound-voice.js` — Outbound call handler (Twilio Function `/outbound-voice`)
- `make-call.js` — Script to initiate outbound calls from OpenClaw
- `send-sms.js` — Script to send SMS from OpenClaw
- `.env.local` — Environment variables (credentials)

## Deployment Steps

### 1. Create Twilio Functions Service

**Via Twilio Console** (Preferred):

1. Log in to https://console.twilio.com
2. Navigate: Explore Products → Developer Tools → Functions and Assets → Services
3. Click "Create Service", name it `watson-voice`
4. This creates a serverless environment with a URL like: `https://watson-voice-XXXX.twil.io`

**Via Twilio CLI** (Alternative):

```bash
npm install -g twilio-cli
twilio login --account-sid $TWILIO_ACCOUNT_SID --auth-token $TWILIO_AUTH_TOKEN
twilio serverless:init watson-voice --template=blank
cd watson-voice
```

### 2. Set Environment Variables in Twilio Functions

In the Twilio Console, go to Functions > Services > watson-voice > Settings > Environment Variables.

Add these:

| Key | Value | Notes |
|-----|-------|-------|
| `GEMINI_API_KEY` | (your Google AI API key) | Primary LLM — get from https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | `gemini-3-pro-preview` | Primary model |
| `ANTHROPIC_API_KEY` | (your Anthropic API key) | Fallback LLM |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-5-20250929` | Fallback model |
| `WATSON_SYSTEM_PROMPT` | See below | Watson's voice persona |
| `MY_NUMBER` | `+447930472512` | James's mobile |

**Watson System Prompt:**
```
You are Watson, an AI executive assistant for James Lawton, Director of Lawton Company Investments Ltd. You are speaking on a phone call. Keep responses concise and conversational — ideally under 3 sentences. You are professional but warm. If James asks you to do something you cannot do on a phone call (e.g. send an email, look something up), acknowledge the request and tell him you will handle it when back on the main system. Do not use markdown, lists, or any formatting — this is spoken conversation.
```

**Also add the `node-fetch` dependency:**
- Settings > Dependencies > add `node-fetch` version `2.6.7` (use v2, not v3 — Twilio Functions use CommonJS)

### 3. Upload Function Code

In the Twilio Console Functions editor:

1. Add a new function at path: `/voice`
   - Set visibility to **Public**
   - Paste contents of `voice.js`

2. Add another function at path: `/outbound-voice`
   - Set visibility to **Public**
   - Paste contents of `outbound-voice.js`

3. Click **Deploy All**

### 4. Configure the Phone Number

1. Go to: Phone Numbers → Manage → Active Numbers → +447456423557
2. Under **Voice Configuration**:
   - "A call comes in" → **Function**
   - Service: `watson-voice`
   - Environment: `ui` (default)
   - Function Path: `/voice`
3. Click **Save configuration**

That's it. Inbound calls to +447456423557 now route to Watson.

### 5. Set Up Local Scripts (Optional)

For Watson to initiate calls/SMS from OpenClaw:

```bash
cd ~/.openclaw/workspace/integrations/twilio
npm install twilio dotenv

# Create .env.local with credentials
cat > .env.local << EOF
TWILIO_ACCOUNT_SID=(your Twilio account SID)
TWILIO_AUTH_TOKEN=(your Twilio auth token)
TWILIO_PHONE_NUMBER=+447456423557
MY_NUMBER=+447930472512
EOF

# Copy scripts
cp ~/.openclaw/workspace/openclaw-sandbox/twilio-functions/make-call.js .
cp ~/.openclaw/workspace/openclaw-sandbox/twilio-functions/send-sms.js .
```

## Testing Checklist

### Test 1: SMS (Sanity Check)
```bash
node send-sms.js "Watson Twilio integration live. Voice coming next."
```
✅ Expected: SMS arrives at +447930472512

### Test 2: Inbound Call
- Call +447456423557 from +447930472512
- ✅ Expected: Watson answers with "Hello, this is Watson. How can I help you?"
- Speak a question
- ✅ Expected: Watson responds with LLM-generated answer via TTS
- Continue conversation for 2-3 turns
- ✅ Expected: Watson maintains context across turns

### Test 3: Outbound Announcement Call
```bash
node make-call.js "This is Watson with a test announcement. Voice integration is now live."
```
✅ Expected: Phone rings, plays the announcement

### Test 4: Outbound Conversational Call
**NOTE:** Update `make-call.js` with actual Twilio Functions service URL first!

```bash
node make-call.js
```
✅ Expected: Phone rings, Watson greets, full conversation possible

### Test 5: LLM Failover
- Temporarily set `GEMINI_API_KEY` to an invalid value in Twilio Functions environment variables
- Call +447456423557
- ✅ Expected: Watson still responds (using Anthropic fallback)
- Restore `GEMINI_API_KEY` after test

## Key Design Decisions

- **`speechModel: 'experimental_conversations'`** — Twilio's best STT model for natural conversation. Falls back to `phone_call` if unavailable on your account.
- **`speechTimeout: 'auto'`** — Twilio auto-detects when the caller stops speaking. No fixed timeout.
- **`language: 'en-GB'`** — UK English for both STT and TTS.
- **`Polly.Amy`** — Natural-sounding British female voice via Amazon Polly (included in Twilio). Alternatives: `Polly.Brian` (British male), `Polly.Emma` (British female).
- **Conversation memory** — Maintained per call via `conversations[callSid]`. Resets when call ends.
- **LLM failover** — Gemini 3 Pro primary → Anthropic Claude fallback → hardcoded error message.

## Cost Estimates

| Component | Cost |
|-----------|------|
| Twilio UK number | ~£1/month |
| Inbound calls | ~£0.01/min |
| Outbound calls (UK mobile) | ~£0.08/min |
| SMS (UK) | ~£0.04/message |
| Twilio Functions | Free (included) |
| Gemini 3 Pro API | ~$2-4/M tokens (preview may be free) |
| Anthropic fallback | Per your current plan |

Typical 5-minute conversational call ≈ £0.40-£0.50 (Twilio) + LLM costs.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Application error has occurred" on inbound call | No voice webhook configured on phone number | Step 4: set Voice URL to `/voice` function |
| Call connects but no speech recognition | `speechModel` not available on account | Change to `phone_call` instead of `experimental_conversations` |
| LLM timeout / no response | Function timeout (default 10s) | Increase timeout in Twilio Functions settings to 30s (max) |
| TTS sounds robotic | Using default `alice` voice | Ensure `Polly.Amy` is specified (Amazon Polly voices are higher quality) |
| "Could not find function" error | Function not deployed | Click Deploy All in Twilio Functions console |
| Outbound call doesn't connect | Number not verified / not enough Twilio credit | Check Twilio console for call logs and errors |
| Node-fetch import error | Missing dependency | Add `node-fetch` v2.6.7 in Functions > Settings > Dependencies |

## Future Enhancements

- **ElevenLabs TTS upgrade**: Replace Polly.Amy with ElevenLabs for more natural voice. Requires streaming audio via `<Play>` TwiML verb instead of `<Say>`. Architecture: LLM response → ElevenLabs API → hosted audio URL → `<Play>`.
- **Voicemail/missed call handling**: Add `<Record>` fallback if no speech detected; transcribe and process via OpenClaw.
- **Call logging to Discord**: POST call summaries to Watson's Discord channel after each call ends (use Twilio status callback webhook).
- **Gemini STT upgrade**: Use Google Cloud Speech-to-Text or Gemini Live API via `<Record>` + post-processing for higher accuracy STT (leverages existing Google Workspace API allowance).
- **Multi-turn memory across calls**: Store conversation summaries in OpenClaw memory between calls.

## Security Notes

- **Never hardcode credentials in function code** — always use Twilio Function environment variables.
- **Monitor usage** — Set up Twilio usage triggers (console → Billing → Usage Triggers) to alert on unexpected spend.
- **Function visibility** — Set `/voice` and `/outbound-voice` to Public (required for Twilio to reach them). All other functions should be Protected or Private.

## Production Deployment

**Current Status**: Sandbox testing complete  
**Next Step**: Deploy Twilio Functions service to production

Once testing is complete in sandbox:
1. Deploy Twilio Functions via console (already serverless, no additional infra needed)
2. Configure production phone number webhook
3. Update `make-call.js` with production service URL
4. Move scripts to `~/.openclaw/workspace/integrations/twilio/`
5. Document in TOOLS.md

---

**Sandbox Branch**: `twilio-voice-functions`  
**Production Ready**: After testing checklist completion  
**Last Updated**: 2026-02-18
