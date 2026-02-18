/**
 * Yay.com VoIP API Client
 * 
 * Correct API endpoints (discovered Feb 2026):
 *   - Auth:     GET  /authenticated
 *   - Users:    GET  /voip/user
 *   - Numbers:  GET  /voip/number
 *   - SMS:      POST /voip/text-message  { source, destination, message_body }
 *   - Call:     POST /voip/call  { targets: [{type, uuid}], destination, caller_id }
 *   - CallerID: GET  /voip/caller-id
 *   - Trunk:    GET  /voip/trunk
 *
 * Auth headers: X-Auth-Reseller, X-Auth-User, X-Auth-Password
 * Must include User-Agent header.
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const BASE_URL = 'https://api.yay.com';

const headers = {
  'X-Auth-Reseller': process.env.YAY_RESELLER,
  'X-Auth-User': process.env.YAY_USER,
  'X-Auth-Password': process.env.YAY_PASSWORD,
  'Content-Type': 'application/json',
  'User-Agent': 'WatsonEcosystem/1.0'
};

/**
 * Send an SMS message
 * @param {string} to - Destination number (E.164 format, e.g. +447930472512)
 * @param {string} messageBody - Message text
 * @param {string} from - Source number (E.164 format, e.g. +447474701812)
 */
async function sendSMS(to, messageBody, from) {
  try {
    const response = await axios.post(`${BASE_URL}/voip/text-message`, {
      source: from || process.env.YAY_PHONE_NUMBER,
      destination: to,
      message_body: messageBody
    }, { headers });
    console.log('SMS sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('SMS Failed:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Make an outbound call (click-to-call: rings SIP user first, then dials destination)
 * @param {string} to - Destination number (E.164 format)
 * @param {object} options - Optional: { callerIdUuid, userUuid, callFlowUuid }
 */
async function makeCall(to, options = {}) {
  const userUuid = options.userUuid || process.env.YAY_USER_UUID;
  const callerIdUuid = options.callerIdUuid || process.env.YAY_CALLER_ID_UUID;
  const targetType = options.callFlowUuid ? 'callflow' : 'sipuser';
  const targetUuid = options.callFlowUuid || userUuid;

  try {
    const payload = {
      targets: [{ type: targetType, uuid: targetUuid }],
      destination: to
    };
    if (callerIdUuid) payload.caller_id = callerIdUuid;

    const response = await axios.post(`${BASE_URL}/voip/call`, payload, { headers });
    console.log('Call initiated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Call Failed:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test authentication
 */
async function testAuth() {
  try {
    const response = await axios.get(`${BASE_URL}/voip/user`, { headers });
    console.log('Auth OK:', response.status);
    return response.data;
  } catch (error) {
    console.error('Auth Failed:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

/**
 * List numbers on the account
 */
async function listNumbers() {
  try {
    const response = await axios.get(`${BASE_URL}/voip/number`, { headers });
    return response.data;
  } catch (error) {
    console.error('List numbers failed:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

/**
 * List caller IDs
 */
async function listCallerIds() {
  try {
    const response = await axios.get(`${BASE_URL}/voip/caller-id`, { headers });
    return response.data;
  } catch (error) {
    console.error('List caller IDs failed:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

module.exports = { sendSMS, makeCall, testAuth, listNumbers, listCallerIds };
