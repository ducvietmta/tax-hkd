/**
 * Test parallel race logic simulating Muse and OpenAI concurrent requests
 */
const assert = require('assert');

async function simulateRace(museDelay, openAiDelay, museFail = false, openAiFail = false) {
  const fetchMuse = async () => {
    await new Promise(r => setTimeout(r, museDelay));
    if (museFail) throw new Error('MUSE_ERROR');
    return { provider: 'meta', model: 'muse-spark-1.3-contributor', text: 'Trả lời từ Meta Muse Spark' };
  };

  const fetchOpenAI = async () => {
    await new Promise(r => setTimeout(r, openAiDelay));
    if (openAiFail) throw new Error('OPENAI_ERROR');
    return { provider: 'openai', model: 'gpt-4o', text: 'Trả lời từ OpenAI GPT-4o' };
  };

  const candidatesToRun = [fetchMuse, fetchOpenAI];

  let winner = null;
  await new Promise((resolve) => {
    let finishedCount = 0;
    const total = candidatesToRun.length;

    candidatesToRun.forEach(task => {
      task()
        .then(res => {
          if (!winner) {
            winner = res;
            resolve();
          }
        })
        .catch(() => {})
        .finally(() => {
          finishedCount++;
          if (finishedCount >= total && !winner) {
            resolve();
          }
        });
    });
  });

  return winner;
}

async function run() {
  console.log('[TEST] Case 1: OpenAI faster than Muse');
  const w1 = await simulateRace(200, 50);
  assert.strictEqual(w1.provider, 'openai');
  console.log('  -> Winner:', w1.provider);

  console.log('[TEST] Case 2: Muse faster than OpenAI');
  const w2 = await simulateRace(40, 150);
  assert.strictEqual(w2.provider, 'meta');
  console.log('  -> Winner:', w2.provider);

  console.log('[TEST] Case 3: Muse fails (e.g. rate limit / timeout), OpenAI succeeds');
  const w3 = await simulateRace(30, 80, true, false);
  assert.strictEqual(w3.provider, 'openai');
  console.log('  -> Winner:', w3.provider);

  console.log('[TEST] Case 4: OpenAI fails, Muse succeeds');
  const w4 = await simulateRace(80, 30, false, true);
  assert.strictEqual(w4.provider, 'meta');
  console.log('  -> Winner:', w4.provider);

  console.log('✅ All parallel race test cases passed!');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
