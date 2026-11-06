/**
 * Test gpt-6-luna model via openAiRequest logic
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const assert = require('assert');

// In node test, load TS compiled or run direct test
async function run() {
  const apiKey = process.env.OPENAI_API_KEY || '';
  
  console.log('[TEST] Sending tax question to gpt-6-luna...');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-6-luna',
      messages: [
        { role: 'system', content: 'Bạn là chuyên viên tư vấn thuế hộ kinh doanh Việt Nam.' },
        { role: 'user', content: 'Hộ kinh doanh năm 2026 có doanh thu 300 triệu đồng thì nộp thuế như thế nào?' }
      ],
      max_completion_tokens: 4096,
      reasoning_effort: 'low'
    })
  });

  assert.strictEqual(res.ok, true, `Call failed: ${res.status}`);
  const data = await res.json();
  const answer = data.choices?.[0]?.message?.content;
  console.log('[ANSWER]:\n', answer);
  console.log('[USAGE]:', data.usage);
  assert.ok(answer && answer.length > 20, 'Answer must not be empty');
  console.log('✅ gpt-6-luna responded successfully!');
}

run().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
