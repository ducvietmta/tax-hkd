const API_URL = 'https://tax-agent-worker.ducviet-mta.workers.dev/api/chat';

async function test() {
  const cases = [
    { id: 'G032', msg: 'Tháng 10/2026 tôi hỏi “năm nay” có doanh thu 950 triệu. Năm tính thuế nào?' },
    { id: 'G043', msg: 'Cùng một cá nhân đăng ký hai hoạt động khác ngành, dịch vụ 800 triệu và hàng hóa 500 triệu. Ngưỡng doanh thu tính ra sao?' }
  ];
  for (const c of cases) {
    console.log(`\n=================== ${c.id} ===================`);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Caller': 'mcp' },
      body: JSON.stringify({ message: c.msg })
    });
    const json = await res.json();
    console.log(json.response);
  }
}
test();
