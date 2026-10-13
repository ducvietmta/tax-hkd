#!/usr/bin/env node
/**
 * CLI Test Hỏi Đáp Thuế 2026
 * Dùng để test trực tiếp câu hỏi thuế qua terminal hoặc script
 * Ví dụ chạy:
 *   node tools/test_tax_cli.js "Bán hàng TikTok shop 300 triệu/năm có phải nộp thuế không?"
 */

const question = process.argv.slice(2).join(' ').trim() || 'Bán hàng trên TikTok Shop doanh thu 500 triệu/năm thì nộp những thuế gì và bao nhiêu %?';

console.log(`\n🔍 Đang gửi câu hỏi kiểm thử: "${question}"...`);
console.log('⏳ Đang phân tích qua RAG Knowledge Engine & AI...\n');

const startTime = Date.now();

fetch('https://tax-hkd.pages.dev/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'TaxQA-CLI-TestClient/1.0'
  },
  body: JSON.stringify({
    message: question,
    history: []
  })
})
  .then(async res => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    return res.json();
  })
  .then(data => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Kết quả trả về sau ${elapsed}s:\n`);
    console.log('================================================================');
    console.log(data.response || 'Không có câu trả lời');
    console.log('================================================================\n');

    console.log('📌 THÔNG TIN HỆ THỐNG ĐỐI SOÁT:');
    console.log(`• Model xử lý: ${data.source || 'N/A'}`);
    console.log(`• Căn cứ trích dẫn: ${(data.citations || []).join(', ') || 'Không có'}`);
    if (data.retrieval?.evidence?.length) {
      console.log('• Trích lục RAG liên quan:');
      data.retrieval.evidence.forEach(e => {
        console.log(`  - ${e.title} (${e.conditional ? 'Có điều kiện' : 'Áp dụng chung'})`);
      });
    }
    console.log('\n');
  })
  .catch(err => {
    console.error('❌ Lỗi:', err.message);
  });
