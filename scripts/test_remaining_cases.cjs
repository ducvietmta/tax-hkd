const API_URL = 'https://tax-agent-worker.ducviet-mta.workers.dev/api/chat';

async function run() {
  const cases = [
    { id: 'G008', msg: 'Hàng đủ điều kiện giảm GTGT nhưng doanh thu gồm hai nhóm hàng: 900 triệu đủ điều kiện, 600 triệu loại trừ.' },
    { id: 'G032', msg: 'Tháng 10/2026 tôi hỏi “năm nay” có doanh thu 950 triệu. Năm tính thuế nào?' },
    { id: 'G043', msg: 'Cùng một cá nhân đăng ký hai hoạt động khác ngành, dịch vụ 800 triệu và hàng hóa 500 triệu. Ngưỡng doanh thu tính ra sao?' },
    { id: 'G075', msg: 'Doanh thu vượt 3 tỷ nhưng thu nhập tính thuế âm; TNCN kinh doanh được xử lý thế nào?' },
    { id: 'G097', msg: 'Nền tảng đã khấu trừ TNCN trước khi tính giảm NQ43; thứ tự quyết toán và đối trừ thế nào?' }
  ];

  for (const c of cases) {
    console.log(`\n=================== [${c.id}] ===================`);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Caller': 'mcp' },
        body: JSON.stringify({ message: c.msg })
      });
      const data = await res.json();
      console.log('Status:', res.status);
      console.log('Success:', data.success);
      console.log('Response:\n', data.response || data.answer);
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

run();
