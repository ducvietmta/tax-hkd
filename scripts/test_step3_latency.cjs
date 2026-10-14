/**
 * Benchmark Latency Bước 3: Performance & Reliability Testing
 */
async function measureLatency(endpoint) {
  console.log(`\n============================================================`);
  console.log(`⏱️ BENCHMARK LATENCY TRÊN ENDPOINT: ${endpoint}`);
  console.log(`============================================================\n`);

  const samples = [
    { name: '1. Câu ngắn', q: 'Ngưỡng thuế 2026 là bao nhiêu?' },
    { name: '2. Câu tính toán', q: 'Bán lẻ 1,2 tỷ năm 2026 nộp bao nhiêu thuế?' },
    { name: '3. Câu dài (hỗn hợp)', q: 'Tôi vừa bán Shopee 800tr vừa làm affiliate TikTok 350tr thì tính thuế thế nào?' },
    { name: '4. Câu ngoài phạm vi', q: 'Hôm nay trời có mưa không?' },
    { name: '5. Câu phức tạp (freelancer)', q: 'Freelancer lập trình 200tr năm 2026 tính thuế theo diện nào theo Nghị định 253?' }
  ];

  const latencies = [];

  for (const s of samples) {
    const start = Date.now();
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'ask_tax_ai', arguments: { question: s.q } }
        })
      });
      const elapsed = Date.now() - start;
      const data = await res.json();
      const text = data.result?.content?.[0]?.text || '';
      latencies.push(elapsed);
      console.log(`- ${s.name}: ${elapsed}ms | Status: ${res.status} | Trả lời: "${text.substring(0, 80).replace(/\n/g, ' ')}..."`);
    } catch (err) {
      const elapsed = Date.now() - start;
      console.error(`- ${s.name}: Lỗi ${err.message} (${elapsed}ms)`);
    }
  }

  if (latencies.length > 0) {
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    console.log(`\n📊 THỐNG KÊ LATENCY:`);
    console.log(`- Min: ${min}ms`);
    console.log(`- Max: ${max}ms`);
    console.log(`- Avg: ${avg}ms`);
  }
}

async function run() {
  await measureLatency('https://tax-hkd.pages.dev/mcp');
  await measureLatency('http://127.0.0.1:8787/mcp');
}

run().catch(console.error);
