# Yay.com Integration Guide

## Overview
Yay.com provides VoIP services with REST API for SMS, voice calls, and number management. SIP trunking for PBX. Integration focuses on outbound calls (TTS-generated audio) and SMS, with potential for inbound webhooks.

## Setup
1. Purchase account/number at yay.com.
2. Generate API key: Dashboard > Account > API.
3. For SIP: Create trunk, note credentials (host: sip.yay.com, port 5060).

## Code
See `yay-client.js` for API wrappers (sendSMS, makeCall). Uses axios, requires `YAY_API_KEY` in .env.

### Usage Example
```js
const { makeCall } = require('./yay-client');
const callId = await makeCall('+447930472512', 'https://example.com/audio.wav', '+441234567890');
```

For TTS: Generate audio via OpenClaw tts tool, host publicly (e.g., temp upload), pass URL to makeCall.

## Testing
- Set .env: `YAY_API_KEY=your_key`
- Run: `node -e "require('./yay-client').sendSMS('+447930472512', 'Test', '+441234567890')"`
- Verify in Yay dashboard logs.

## OpenClaw Integration
- Call via exec: `node /path/to/yay-client.js sendSMS ...`
- For voice: Chain tts → makeCall.
- Webhooks: Run Express server in sandbox to receive/forward events.

## SIP (Advanced)
- Docker Asterisk: `docker run -d --name asterisk -p 5060:5060/udp -v $(pwd)/asterisk-config:/etc/asterisk registry.gitlab.com/sipwise/asterisk:21.0.0`
- Config sip.conf with Yay trunk details.
- Test: `docker exec asterisk asterisk -rx "sip show peers"`

## Costs
UK SMS ~£0.03, calls ~£0.01/min. Starter plan £5-20/month.

## Next Steps
- Add to OpenClaw TOOLS.md as custom exec.
- Monitor via cron for usage/logs.
