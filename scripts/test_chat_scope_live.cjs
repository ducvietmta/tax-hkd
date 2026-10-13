// Opt-in production smoke test. No account, phone number or personal data is sent.
const assert = require('node:assert/strict');
const question = 'TikTok đã trừ 10% thuế trên tiền hoa hồng của em. Tổng năm chỉ được 30 triệu thì có được hoàn lại không? Có cần cộng tiền lương ở công ty vào không?';

async function main() {
  const response = await fetch('https://tax-hkd.pages.dev/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: question, stream: true }),
    signal: AbortSignal.timeout(120000),
  });
  assert.equal(response.status, 200);
  const wire = await response.text();
  let answer = '';
  let done = false;
  let period;
  for (const line of wire.split('\n')) {
    if (!line.startsWith('data: ') || line.trim() === 'data: [DONE]') continue;
    const event = JSON.parse(line.slice(6));
    if (event.type === 'delta') answer += event.delta;
    if (event.type === 'done') done = true;
    if (event.type === 'meta') period = event.retrieval?.period;
  }
  assert.ok(done && answer.length > 30, 'Stream must finish with an answer');
  const currentYear = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }).format(new Date()));
  assert.deepEqual(period, { years: [currentYear], source: 'current_default' });
  // Years in legal identifiers/dates/URLs are valid evidence, not hypothetical tax periods.
  const prose = answer.split(/Căn cứ pháp lý:/i)[0]
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\b\d{1,2}[/.\-]\d{1,2}[/.\-](?:19|20)\d{2}\b/g, '')
    .replace(/\b\d+[a-z]*\/(?:19|20)\d{2}(?:\/[a-z0-9-]+)?/gi, '');
  console.log(answer);
  assert.match(prose, new RegExp(`năm (?:hiện tại|${currentYear})|kỳ ${currentYear}`, 'i'), 'Answer must apply the current year');
  assert.doesNotMatch(prose, new RegExp(`\\b${currentYear - 1}\\b`), 'Answer must not open a prior-year branch');
  console.log('Live regression passed: completed stream, current-year default, no prior-year branch.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
