// /outbound-voice — Handles Watson-initiated calls (same conversational loop)
const fetch = require('node-fetch');
const conversations = {};

async function callLLM(messages) {
  const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
  const chatMessages = messages.filter(m => m.role !== 'system');

  // Primary: Google Gemini 3 Pro Preview
  try {
    const geminiMessages = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const model = process.env.GEMINI_MODEL || 'gemini-3-pro-preview';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiMessages,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.7
          }
        })
      }
    );
    if (!response.ok) throw new Error(`Gemini ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
    throw new Error('Empty Gemini response');
  } catch (err) {
    console.log(`Gemini failed: ${err.message}, falling back to Anthropic`);
  }

  // Fallback: Anthropic Claude
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
        max_tokens: 200,
        system: systemPrompt,
        messages: chatMessages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });
    if (!response.ok) throw new Error(`Anthropic ${response.status}`);
    const data = await response.json();
    return data.content[0].text;
  } catch (err) {
    console.log(`Anthropic failed: ${err.message}`);
    return "I'm having trouble connecting to my systems right now. Please try again in a moment.";
  }
}

exports.handler = async function(context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  const callSid = event.CallSid;

  if (!conversations[callSid]) {
    conversations[callSid] = [
      {
        role: 'system',
        content: context.WATSON_SYSTEM_PROMPT || 'You are Watson, a helpful AI assistant on a phone call. Keep responses brief and conversational.'
      }
    ];
  }

  const speechResult = event.SpeechResult;

  if (speechResult) {
    conversations[callSid].push({ role: 'user', content: speechResult });
    const reply = await callLLM(conversations[callSid]);
    conversations[callSid].push({ role: 'assistant', content: reply });
    twiml.say({ voice: 'Polly.Amy', language: 'en-GB' }, reply);
  } else {
    // Custom outbound greeting — Watson is calling the user
    const greeting = "Hello James, this is Watson calling. I have something to discuss with you.";
    conversations[callSid].push({ role: 'assistant', content: greeting });
    twiml.say({ voice: 'Polly.Amy', language: 'en-GB' }, greeting);
  }

  const gather = twiml.gather({
    input: 'speech',
    speechTimeout: 'auto',
    speechModel: 'experimental_conversations',
    language: 'en-GB',
    action: '/outbound-voice',
    method: 'POST'
  });

  twiml.say({ voice: 'Polly.Amy', language: 'en-GB' }, "I didn't catch that. Are you still there?");
  twiml.redirect('/outbound-voice');

  return callback(null, twiml);
};
