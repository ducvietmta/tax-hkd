/**
 * Test OpenAI request format and execution
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const assert = require('assert');

async function run() {
  const apiKey = process.env.OPENAI_API_KEY || '';
  
  console.log('[TEST] Checking OpenAI request building and live call...');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Bạn là chuyên viên tư vấn thuế hộ kinh doanh tại Việt Nam.' },
        { role: 'user', content: 'Doanh thu bao nhiêu một năm thì hộ kinh doanh phải nộp thuế GTGT và TNCN?' }
      ],
      max_tokens: 300,
      temperature: 0.1
    })
  });

  assert.strictEqual(res.ok, true, `OpenAI call failed with status ${res.status}`);
  const data = await res.json();
  const answer = data.choices?.[0]?.message?.content;
  console.log('[TEST ANSWER FROM OPENAI]:\n', answer);
  assert.ok(answer && answer.length > 20, 'Answer must not be empty');
  assert.ok(answer.includes('100 triệu') || answer.includes('100.000.000'), 'Must contain 100 million threshold');
  console.log('✅ OpenAI live test passed with model:', data.model);
}

run().catch(err => {
  console.error('❌ OpenAI test failed:', err);
  process.exit(1);
});
