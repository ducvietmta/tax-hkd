const API_URL = 'https://tax-agent-worker.ducviet-mta.workers.dev/api/chat';

const cases = [
  {
    id: 'G139',
    title: 'Ranh giới và số học',
    msg: 'Năm 2026 cá nhân cư trú bán hàng có doanh thu 2.999.999.999 đồng, thu nhập tính thuế hợp lệ 400 triệu. Nếu chọn phương pháp thu nhập, TNCN sau giảm NQ43 là bao nhiêu? Có bị ép 17% không?',
    expected_points: ['15%', 'không bị ép 17%', '42 triệu', '400 triệu']
  },
  {
    id: 'G140',
    title: 'Ranh giới và số học',
    msg: 'Tôi là cá nhân cư trú, doanh thu 3.000.000.001 đồng; 400 triệu chỉ là tiền mặt còn trong tài khoản, chưa phải thu nhập tính thuế. Có tính ngay 47,6 triệu TNCN được không?',
    expected_points: ['Không', 'tiền mặt trong tài khoản không phải thu nhập tính thuế', 'chưa đối soát chi phí']
  },
  {
    id: 'G141',
    title: 'Ranh giới và số học',
    msg: 'Cá nhân cư trú có doanh thu 9,8 tỷ bán hàng và thêm 300 triệu hoa hồng kinh doanh độc lập của chính mình cùng năm 2026. Thu nhập tính thuế hợp lệ tổng 500 triệu. Tính TNCN, có giảm NQ43 không?',
    expected_points: ['10,1 tỷ', 'vượt 10 tỷ', 'không được giảm 30%', '17%', '85 triệu']
  },
  {
    id: 'G145',
    title: 'Ranh giới và số học',
    msg: 'Cá nhân cư trú có doanh thu 4 tỷ và thu nhập tính thuế hợp lệ 500 triệu. Đã nộp TNCN kinh doanh cùng kỳ 70 triệu có chứng từ. Sau NQ43 còn phải nộp hay nộp thừa bao nhiêu?',
    expected_points: ['59,5 triệu', '70 triệu', 'nộp thừa 10,5 triệu']
  },
  {
    id: 'G146',
    title: 'Ranh giới và số học',
    msg: 'Cá nhân cư trú doanh thu 4 tỷ, TNCN trước giảm đã được cơ quan thuế xác định là 0 do kết quả tính thuế hợp lệ. Tôi chưa nộp đồng thuế nào. Có nhận lại 30% doanh thu bằng tiền không?',
    expected_points: ['Không', 'thuế trước giảm là 0', '30% của 0 vẫn là 0', 'không nhận lại tiền']
  },
  {
    id: 'G149',
    title: 'GTGT và phạm vi câu hỏi',
    msg: 'Cùng một cá nhân có 1,2 tỷ bán hàng tỷ lệ GTGT 1% và 800 triệu dịch vụ tỷ lệ 5%; cả hai nhóm đã xác nhận đủ giảm. Tính GTGT từng nhóm và tổng.',
    expected_points: ['1,2 tỷ × 0,8% = 9,6 triệu', '800 triệu × 4% = 32 triệu', '41,6 triệu']
  },
  {
    id: 'G174',
    title: 'Chi phí và hồ sơ',
    msg: 'Doanh thu 4 tỷ, tôi báo tổng chi phí 3 tỷ, trong đó 500 triệu đã bị ghi hai lần. Các khoản còn lại còn chờ kiểm chứng từ. Có chốt thu nhập tính thuế 1 tỷ không?',
    expected_points: ['Không', 'loại trừ 500 triệu trùng', 'chờ kiểm chứng từ', 'chưa chốt']
  },
  {
    id: 'G196',
    title: 'Bao phủ nhiều yêu cầu',
    msg: 'Cá nhân cư trú sửa máy doanh thu 4 tỷ, thu nhập tính thuế hợp lệ 500 triệu, tỷ lệ GTGT gốc 5%, toàn bộ đủ giảm GTGT. Hãy tính riêng GTGT, TNCN trước/sau NQ43, và đừng lấy chi phí giảm doanh thu GTGT.',
    expected_points: ['GTGT', '4 tỷ × 4% = 160 triệu', 'TNCN 85 triệu', '59,5 triệu']
  },
  {
    id: 'G184',
    title: 'Thời kỳ và căn cứ',
    msg: 'Một bài đăng năm 2026 đang tóm tắt quyết toán 2025. Tôi hỏi nghĩa vụ 2025, có lấy ngày đăng bài để áp ngưỡng 2026 không?',
    expected_points: ['Không', 'ngày đăng bài', 'áp dụng kỳ 2025', '100 triệu']
  },
  {
    id: 'G195',
    title: 'Bao phủ nhiều yêu cầu',
    msg: 'Tôi chỉ affiliate, GMV 5 tỷ, hoa hồng 300 triệu, phí 20 triệu, tax 3 triệu chưa có chứng từ. Hãy trả lời ba ý: doanh thu tôi là gì; tax có chắc đã nộp TNCN không; ít doanh thu có tự miễn đăng ký hộ không?',
    expected_points: ['300 triệu', 'không lấy 5 tỷ', 'tax 3 triệu chưa chắc', 'không tự miễn đăng ký hộ']
  }
];

async function run() {
  console.log(`Starting focus test on ${cases.length} cases...`);
  for (const c of cases) {
    console.log(`\n=================== [${c.id}] ${c.title} ===================`);
    console.log(`Input: ${c.msg}`);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Caller': 'mcp' },
        body: JSON.stringify({ message: c.msg })
      });
      const data = await res.json();
      const ans = data.response || data.answer || '';
      console.log(`Response:\n${ans}`);
    } catch (e) {
      console.error(`Error on ${c.id}:`, e.message);
    }
  }
}

run();
