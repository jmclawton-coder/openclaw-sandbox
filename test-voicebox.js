#!/usr/bin/env node
/**
 * Quick test script for Twilio-Voicebox integration
 * Tests environment variables and basic connectivity
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

console.log('🧪 Testing Twilio-Voicebox Setup\n');

// Check environment variables
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'OPENAI_API_KEY'
];

const optionalEnvVars = [
  'OPENCLAW_GATEWAY_URL',
  'OPENCLAW_SESSION_ID',
  'OPENCLAW_API_TOKEN'
];

let missingVars = [];

console.log('📋 Checking required environment variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const masked = value.substring(0, 8) + '...';
    console.log(`  ✅ ${varName}: ${masked}`);
  } else {
    console.log(`  ❌ ${varName}: MISSING`);
    missingVars.push(varName);
  }
});

console.log('\n📋 Checking optional environment variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`);
  } else {
    console.log(`  ⚠️  ${varName}: not set (using default)`);
  }
});

if (missingVars.length > 0) {
  console.log('\n❌ Missing required environment variables:', missingVars.join(', '));
  console.log('\nPlease copy .env.example to .env.local and fill in your credentials.');
  process.exit(1);
}

// Test OpenAI API connectivity (optional)
async function testOpenAI() {
  try {
    console.log('\n🔍 Testing OpenAI API connectivity...');
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Just check if we can create the client - actual API call would cost credits
    console.log('  ✅ OpenAI client initialized successfully');
    console.log('  ℹ️  Skipping actual API call to save credits');
    
  } catch (error) {
    console.log('  ❌ OpenAI client error:', error.message);
  }
}

// Test Twilio credentials format
function testTwilioCredentials() {
  console.log('\n🔍 Validating Twilio credentials format...');
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (accountSid.startsWith('AC') && accountSid.length === 34) {
    console.log('  ✅ Account SID format looks valid');
  } else {
    console.log('  ⚠️  Account SID format may be incorrect (should start with AC and be 34 chars)');
  }
  
  if (authToken.length === 32) {
    console.log('  ✅ Auth Token format looks valid');
  } else {
    console.log('  ⚠️  Auth Token format may be incorrect (should be 32 chars)');
  }
}

// Test OpenClaw Gateway connectivity (optional)
async function testOpenClawGateway() {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:8080';
  
  console.log(`\n🔍 Testing OpenClaw Gateway at ${gatewayUrl}...`);
  try {
    const response = await axios.get(`${gatewayUrl}/health`, { timeout: 5000 });
    console.log('  ✅ OpenClaw Gateway is reachable');
  } catch (error) {
    console.log('  ⚠️  OpenClaw Gateway not reachable:', error.message);
    console.log('  ℹ️  This is OK for testing - it will use fallback responses');
  }
}

// Run tests
async function runTests() {
  testTwilioCredentials();
  await testOpenAI();
  await testOpenClawGateway();
  
  console.log('\n✅ Setup test complete!');
  console.log('\n📞 Next steps:');
  console.log('  1. Run: npm run voicebox');
  console.log('  2. In another terminal: ngrok http 3000');
  console.log('  3. Configure Twilio webhook with your ngrok URL');
  console.log('  4. Call +447456423557 and test!');
  console.log('\nSee TWILIO-VOICEBOX-SETUP.md for detailed instructions.\n');
}

runTests().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
