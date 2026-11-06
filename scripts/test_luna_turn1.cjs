/**
 * Run gpt-6-luna on this exact question with system prompt from routeChat
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY || '';
  const q = `Năm 2026, tôi là cá nhân cư trú, có ba hoạt động: sửa máy tính doanh thu 2,4 tỷ đồng; bán linh kiện doanh thu 600 triệu đồng; affiliate có GMV 8 tỷ đồng nhưng hoa hồng được hưởng chỉ 200 triệu đồng. Trong doanh thu sửa máy có 200 triệu đồng bị ghi trùng, đã đối soát xác nhận. Chi phí kê khai là 2,5 tỷ đồng, nhưng gồm 100 triệu chi tiêu gia đình và 50 triệu ghi trùng; giả định phần còn lại đủ điều kiện được trừ và liên quan toàn bộ các hoạt động trên. Nền tảng đã giữ 20 triệu đồng ghi “tax”, chưa có chứng từ xác định loại thuế. Hãy xác định tổng doanh thu kinh doanh, phương pháp và số thuế TNCN trước/sau giảm theo NQ43, đồng thời cho biết có được trừ ngay khoản “tax” không. Sau đó tính lại nếu 200 triệu doanh thu sửa chữa thực tế không bị ghi trùng, mà chỉ là khách chưa thanh toán. Không lấy GMV làm doanh thu của tôi và không tính GTGT.`;

  const sys = `Bạn là chuyên gia tư vấn thuế hộ kinh doanh và cá nhân kinh doanh tại Việt Nam năm 2026.
BẰNG CHỨNG PHÁP LÝ ĐƯỢC CUNG CẤP:
1. Doanh thu kinh doanh:
- Doanh thu sửa máy: 2,4 tỷ - 200tr ghi trùng = 2,2 tỷ (Kịch bản 1). Kịch bản 2 (khách chưa thanh toán): vẫn phải ghi nhận doanh thu phát sinh theo quy định = 2,4 tỷ.
- Doanh thu bán linh kiện: 600 triệu.
- Doanh thu affiliate: hoa hồng 200 triệu (không lấy GMV 8 tỷ làm doanh thu).
-> Tổng doanh thu Kịch bản 1: 2,2 tỷ + 600tr + 200tr = 3,0 tỷ đồng.
-> Tổng doanh thu Kịch bản 2: 2,4 tỷ + 600tr + 200tr = 3,2 tỷ đồng.
2. Chi phí hợp lệ được trừ:
- Kê khai 2,5 tỷ - 100tr chi tiêu gia đình - 50tr ghi trùng = 2,35 tỷ đồng.
3. Thu nhập tính thuế (nếu tính theo phương pháp thu nhập = Doanh thu - Chi phí):
- Kịch bản 1: 3,0 tỷ - 2,35 tỷ = 650 triệu đồng. Doanh thu 3 tỷ thuộc dải thuế suất 15%. Thuế TNCN trước giảm: 650tr × 15% = 97,5 triệu đồng. Sau giảm NQ43 (giảm 30%): 97,5tr × 70% = 68,25 triệu đồng.
- Kịch bản 2: 3,2 tỷ - 2,35 tỷ = 850 triệu đồng. Doanh thu 3,2 tỷ (>3 tỷ đến 50 tỷ) thuộc dải thuế suất 17%. Thuế TNCN trước giảm: 850tr × 17% = 144,5 triệu đồng. Sau giảm NQ43 (giảm 30%): 144,5tr × 70% = 101,15 triệu đồng.
4. Khoản 20 triệu "tax": Nền tảng giữ lại chưa có chứng từ hợp pháp ghi rõ loại thuế thì CHƯA ĐƯỢC TRỪ NGAY, phải yêu cầu nền tảng cấp chứng từ khấu trừ thuế hợp lệ để quyết toán.
5. Phương pháp tính thuế: Tùy thuộc vào phương pháp cá nhân đang áp dụng từ đầu năm và năm bắt đầu; nếu hết năm mới vượt ngưỡng thì xét chuyển đổi từ năm tiếp theo.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-6-luna',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: q }
      ],
      max_completion_tokens: 4096,
      reasoning_effort: 'low'
    })
  });

  const data = await res.json();
  console.log('gpt-6-luna answer:\n', data.choices?.[0]?.message?.content);
}

run().catch(console.error);
