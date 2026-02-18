# Yay.com VoIP Integration — Watson/OpenClaw

## Status (Updated 2026-02-18)
- ✅ **API Authentication** — Working (new API password set)
- ✅ **Number +447474701812** — Fully configured (call flow, message flow, emergency address, caller ID with SMS support)
- ✅ **SMS Endpoint** — Working (blocked only by £-0.09 credit balance)
- ✅ **Outbound Call Endpoint** — Working (click-to-call initiated successfully)
- ⚠️ **SIP Trunk** — Creation fails with 500 error (both UI and API). May be a Yay.com platform issue. Not strictly needed for API-based SMS/calls.
- ⚠️ **Account Credit** — £-0.09 balance. SMS and calls blocked until topped up.

## API Credentials
```
Base URL:       https://api.yay.com
X-Auth-Reseller: f74c35bbd07a4f9e842be35cd9987893
X-Auth-User:     admin
X-Auth-Password: (in .env.local - reset 2026-02-18)
Allowed IP:      217.39.55.4
```

## Phone Numbers
| Number | UUID | SMS | Caller ID UUID |
|--------|------|-----|----------------|
| +442045842868 | cd74e569-2097-4ba5-a913-a5ca16185f53 | No | 57556367-b2f9-4b3e-bf83-1c1885cc1281 |
| +447400766584 | fefe8a7d-093c-49bb-8427-79ca53e9b4e1 | Yes | 2001bf4b-1388-48a3-b0de-f0cea19fe1e3 |
| +447474701812 | e94b6b4c-770a-4255-bccb-2691162b9c9c | Yes | b4148c98-dc4b-4128-959c-a57019e2d90f |

## API Endpoints (Confirmed Working)

### Authentication
```
GET /authenticated
GET /voip/user
```

### Send SMS
```
POST /voip/text-message
{
  "source": "+447474701812",
  "destination": "+447930472512",
  "message_body": "Hello from Watson"
}
```

### Outbound Call (Click-to-Call)
```
POST /voip/call
{
  "targets": [{ "type": "sipuser", "uuid": "<user-uuid>" }],
  "destination": "+447930472512",
  "caller_id": "<caller-id-uuid>"
}
```
Target types: `sipuser`, `huntgroup`, `callflow`

### Other Endpoints
```
GET  /voip/number          — List phone numbers
GET  /voip/caller-id       — List caller IDs
GET  /voip/trunk           — List SIP trunks
GET  /voip/emergency-address — List emergency addresses
GET  /voip/message-flow    — List SMS routing flows
PUT  /voip/number/<uuid>   — Update number config
```

### Required Headers
```
X-Auth-Reseller: <reseller-id>
X-Auth-User: admin
X-Auth-Password: <api-password>
Content-Type: application/json
User-Agent: WatsonEcosystem/1.0
```

## SIP User (James)
```
Extension:  1001
UUID:       3eaa6e7d-9d0a-4008-8bf7-13b905f8709e
Username:   hwc1GKGg9Wd4xNP1Z499
```

## Key UUIDs
```
Call Flow:     0b20fc03-17b2-4255-8b91-44da7f06c4f8
SMS Flow:      0c55b9d0-b6d3-4ce6-bf5f-2be60f76d79d (routes to jmclawton@gmail.com)
Emergency Addr: ae5e563b-6199-496c-9ba8-35671ee9fec0 (3 Fitzwilliam Road, CM0 8GJ)
```

## Next Steps
1. **Top up account credit** — SMS and outbound calls need positive balance
2. **SIP Trunk** — Retry creation after credit top-up (may be related)
3. **TTS Call Flow** — Create a call flow with TTS/audio playback for automated messages
4. **Webhook** — Set up inbound SMS/call webhooks to forward to OpenClaw
