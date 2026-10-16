const fs = require('fs');
const path = require('path');

const testCasesFile = path.join(__dirname, '../outputs/testcases/tax-hkd-130-20261016/tax_hkd_121_active.json');
const testData = JSON.parse(fs.readFileSync(testCasesFile, 'utf8'));

const targetIds = [
  // Group B
  'G008', 'G014', 'G032', 'G043', 'G078',
  // Group A sample
  'G009', 'G015', 'G016', 'G021', 'G022', 'G029', 'G049', 'G061', 'G066', 'G070', 'G071', 'G073', 'G075', 'G081', 'G086', 'G088', 'G095', 'G097', 'G100', 'G101', 'G102', 'G103'
];

const selectedCases = testData.cases.filter(c => targetIds.includes(c.id));
console.log(`Total selected test cases: ${selectedCases.length}`);

const API_URL = 'https://tax-agent-worker.ducviet-mta.workers.dev/api/chat';

async function runTest(c) {
  const payload = {
    message: c.input.message,
    history: c.input.history || []
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TaxQA-MCP-TestClient/1.0',
        'X-Internal-Caller': 'mcp'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      return { id: c.id, success: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const answer = data.response || data.answer || '';
    const isUnverified = answer.includes('chưa xác minh được') || answer.includes('UNVERIFIED');

    return {
      id: c.id,
      success: data.success,
      isUnverified,
      downgraded: answer.includes('trả lời tạm thời') || (data.metadata && data.metadata.downgraded),
      reviewStatus: data.metadata?.reviewStatus || 'unknown',
      answerPreview: answer.slice(0, 150).replace(/\n/g, ' ')
    };
  } catch (err) {
    return { id: c.id, success: false, error: err.message };
  }
}

async function main() {
  console.log('Testing cases against live Cloudflare Worker...');
  const results = [];
  
  // Run sequentially or in small concurrency to avoid rate limiting
  for (const c of selectedCases) {
    process.stdout.write(`Testing ${c.id}... `);
    const r = await runTest(c);
    results.push(r);
    console.log(`Unverified: ${r.isUnverified} | Status: ${r.reviewStatus} | Answer: ${r.answerPreview}`);
    // slight delay
    await new Promise(r => setTimeout(r, 600));
  }

  const blockedCount = results.filter(r => r.isUnverified).length;
  console.log('\n======================================');
  console.log(`SUMMARY: ${results.length} cases tested.`);
  console.log(`Blocked (UNVERIFIED): ${blockedCount} / ${results.length} (${(blockedCount/results.length*100).toFixed(1)}%)`);
  console.log('======================================');
}

main();
