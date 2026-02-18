/**
 * Yay.com API Client — DEPRECATED, use yay-client.js instead
 * 
 * This file was the initial attempt. The correct API structure is documented
 * in yay-client.js. Key corrections from original:
 *   - Base URL: https://api.yay.com (NOT /v1)
 *   - Auth: X-Auth-Reseller/User/Password headers (NOT X-API-Key)
 *   - SMS endpoint: POST /voip/text-message (fields: source, destination, message_body)
 *   - Call endpoint: POST /voip/call (fields: targets, destination, caller_id)
 *   - Must include User-Agent header
 *
 * @deprecated Use yay-client.js
 */

// Re-export from the corrected client
module.exports = require('./yay-client');
