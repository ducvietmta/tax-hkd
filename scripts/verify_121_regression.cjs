const fs = require('fs');
const path = require('path');

const testCasesFile = path.join(__dirname, '../outputs/testcases/tax-hkd-130-20261016/tax_hkd_121_active.json');
const testData = JSON.parse(fs.readFileSync(testCasesFile, 'utf8'));

const cases = testData.cases.filter(c => c.enabled !== false);
console.log(`Loaded ${cases.length} active test cases from suite 121.`);

const API_URL = 'https://tax-agent-worker.ducviet-mta.workers.dev/api/chat';

async function runCase(c) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Caller': 'mcp'
      },
      body: JSON.stringify({
        message: c.input.message,
        history: c.input.history || []
      })
    });
    if (!res.ok) return { id: c.id, ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    const ans = data.response || data.answer || '';
    const isUnverified = ans.includes('chưa xác minh được') || ans.includes('UNVERIFIED');
    return {
      id: c.id,
      ok: data.success && !isUnverified,
      ansLength: ans.length,
      ansPreview: ans.slice(0, 100).replace(/\n/g, ' ')
    };
  } catch (e) {
    return { id: c.id, ok: false, error: e.message };
  }
}

async function main() {
  console.log(`Running regression check on 121 cases against live worker...`);
  const failed = [];
  const BATCH_SIZE = 5;
  for (let i = 0; i < cases.length; i += BATCH_SIZE) {
    const batch = cases.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(runCase));
    for (const r of results) {
      if (!r.ok) {
        console.log(`❌ [FAIL] ${r.id}: ${r.error || 'Blocked/Unverified'} | ${r.ansPreview}`);
        failed.push(r);
      } else {
        process.stdout.write(`.` );
      }
    }
  }
  console.log(`\n================================`);
  console.log(`Total: ${cases.length}`);
  console.log(`Passed: ${cases.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);
  if (failed.length === 0) {
    console.log(`🎉 100% PASS on 121 suite! Zero regression!`);
  } else {
    console.log(`Failed IDs: ${failed.map(f => f.id).join(', ')}`);
  }
}

main();
