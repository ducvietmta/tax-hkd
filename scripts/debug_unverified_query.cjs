/**
 * Debug why the query resulted in UNVERIFIED_ANSWER
 */
const { execSync } = require('child_process');

const question = `Năm 2026, tôi là cá nhân cư trú, có ba hoạt động: sửa máy tính doanh thu 2,4 tỷ đồng; bán linh kiện doanh thu 600 triệu đồng; affiliate có GMV 8 tỷ đồng nhưng hoa hồng được hưởng chỉ 200 triệu đồng. Trong doanh thu sửa máy có 200 triệu đồng bị ghi trùng, đã đối soát xác nhận. Chi phí kê khai là 2,5 tỷ đồng, nhưng gồm 100 triệu chi tiêu gia đình và 50 triệu ghi trùng; giả định phần còn lại đủ điều kiện được trừ và liên quan toàn bộ các hoạt động trên. Nền tảng đã giữ 20 triệu đồng ghi “tax”, chưa có chứng từ xác định loại thuế. Hãy xác định tổng doanh thu kinh doanh, phương pháp và số thuế TNCN trước/sau giảm theo NQ43, đồng thời cho biết có được trừ ngay khoản “tax” không. Sau đó tính lại nếu 200 triệu doanh thu sửa chữa thực tế không bị ghi trùng, mà chỉ là khách chưa thanh toán. Không lấy GMV làm doanh thu của tôi và không tính GTGT.`;

console.log('Testing question length:', question.length);

async function testWorker() {
  const url = 'https://tax-agent-worker.ducviet-mta.workers.dev/api/chatgpt/tax-qa';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: question,
      stream: false
    })
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response body:', JSON.stringify(data, null, 2));
}

testWorker().catch(console.error);
