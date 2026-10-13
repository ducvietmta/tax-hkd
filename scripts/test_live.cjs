const qs = [
  'Doanh thu 800 triệu bán Shopee có phải nộp thuế không?',
  'Doanh thu 1.5 tỷ bán hàng online tính thuế thế nào?',
  'làm affiliate tiktok bị trừ bao nhiêu phần trăm',
];
(async () => {
  for (const message of qs) {
    const t = Date.now();
    const r = await (await fetch('https://tax-agent-worker.ducviet-mta.workers.dev/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }),
    })).json();
    console.log(`\n=== ${message}\n[${((Date.now() - t) / 1000).toFixed(1)}s | ${r.source} | cached=${r.cached}]\n${r.response || r.error}`);
  }
})();
