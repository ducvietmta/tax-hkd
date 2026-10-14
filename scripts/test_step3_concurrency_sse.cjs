/**
 * Bước 3: Concurrency (20 concurrent requests) và SSE streaming check
 */
async function testSSE(endpoint) {
  console.log(`\n============================================================`);
  console.log(`🌊 KIỂM TRA SSE STREAMING TRÊN: ${endpoint}`);
  console.log(`============================================================\n`);

  const start = Date.now();
  const res = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Năm 2026 ngưỡng doanh thu không phải nộp thuế là bao nhiêu?',
      stream: true
    })
  });

  console.log(`HTTP Status: ${res.status}`);
  console.log(`Content-Type: ${res.headers.get('content-type')}`);

  if (!res.body) {
    console.error('Không nhận được response body');
    return false;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const events = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') {
          events.push({ type: '[DONE]' });
        } else {
          try {
            events.push(JSON.parse(raw));
          } catch {}
        }
      }
    }
  }

  const elapsed = Date.now() - start;
  console.log(`Nhận được ${events.length} SSE events trong ${elapsed}ms:`);
  const eventTypes = events.map(e => e.type || e.status).filter(Boolean);
  console.log(`Các loại events: [${[...new Set(eventTypes)].join(', ')}]`);
  const hasMeta = events.some(e => e.type === 'meta');
  const hasDone = events.some(e => e.type === 'done' || e.type === '[DONE]');
  console.log(`Kết quả kiểm tra SSE: Meta event: ${hasMeta ? '✅' : '❌'} | Done event: ${hasDone ? '✅' : '❌'}`);
  return hasMeta && hasDone;
}

async function testConcurrency(endpoint, totalRequests = 20) {
  console.log(`\n============================================================`);
  console.log(`⚡ KIỂM TRA ĐỒNG THỜI (${totalRequests} CONCURRENT REQUESTS) TRÊN: ${endpoint}`);
  console.log(`============================================================\n`);

  const queries = [
    'Ngưỡng thuế 2026 là bao nhiêu?',
    'Bán lẻ 1,01 tỷ năm 2026 nộp bao nhiêu thuế?',
    'Cho thuê nhà 120 triệu nộp thuế gì?',
    'Xây dựng không bao thầu thuế suất bao nhiêu %?'
  ];

  const start = Date.now();
  const promises = [];

  for (let i = 0; i < totalRequests; i++) {
    const q = queries[i % queries.length];
    const p = fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Caller': 'mcp'
      },
      body: JSON.stringify({ message: q })
    }).then(async res => {
      const data = await res.json().catch(() => ({}));
      return { status: res.status, ok: res.ok, data };
    }).catch(err => ({ status: 0, ok: false, error: err.message }));

    promises.push(p);
  }

  const results = await Promise.all(promises);
  const elapsed = Date.now() - start;

  const successCount = results.filter(r => r.ok && r.status === 200).length;
  const failCount = totalRequests - successCount;

  console.log(`Thời gian hoàn thành 20 requests: ${elapsed}ms (trung bình ${(elapsed / totalRequests).toFixed(1)}ms/req)`);
  console.log(`Thành công (200 OK): ${successCount}/${totalRequests} (${((successCount / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Thất bại: ${failCount}`);

  return successCount === totalRequests;
}

async function main() {
  await testSSE('http://127.0.0.1:8787');
  await testConcurrency('http://127.0.0.1:8787', 20);
}

main().catch(console.error);
