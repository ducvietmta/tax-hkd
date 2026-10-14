/**
 * Script gọi MCP ask_tax_ai (JSON-RPC Streamable HTTP: initialize -> tools/call)
 * Kiểm định 40 câu hỏi hồi quy thuế theo ATAI-PATCH-40-2026-10 và kiểm tra tiêu chuẩn chất lượng.
 */
const fs = require('fs');
const path = require('path');

const MCP_URL = process.argv[2] || process.env.MCP_URL || 'http://127.0.0.1:8787/mcp';
const TIMEOUT_MS = 90000;

console.log(`📡 MCP Regression Runner kết nối tới: ${MCP_URL}\n`);

const TEST_CASES = [
  {
    id: 'T01',
    question: 'Năm 2026 tôi bán hàng hóa doanh thu 450 triệu/năm thì nộp những thuế gì và có phải đăng ký kinh doanh không?',
    expectedKeywords: ['1 tỷ', 'không phải nộp', 'đăng ký kinh doanh'],
    forbiddenKeywords: ['100 triệu', '500 triệu'],
    mustCheck: 'Dưới ngưỡng thuế 1 tỷ nếu là toàn bộ doanh thu; không suy miễn ĐKKD'
  },
  {
    id: 'T02',
    question: 'Hộ kinh doanh năm 2026 có doanh thu 350 triệu, có hóa đơn đầu vào nhưng không xuất hóa đơn đầu ra thì có bị phạt không?',
    expectedKeywords: ['hóa đơn', 'doanh thu'],
    mustCheck: 'Phân biệt HĐĐT bắt buộc/tự nguyện, sổ doanh thu, nghĩa vụ lập hóa đơn'
  },
  {
    id: 'T03',
    question: 'Tôi làm affiliate tại Hà Nội kiếm 2 triệu/tháng thì ngưỡng thu nhập thấp được miễn đăng ký kinh doanh tại Hà Nội là bao nhiêu?',
    expectedKeywords: ['đăng ký', 'Hà Nội'],
    forbiddenKeywords: ['Hà Nội quy định miễn dưới 100 triệu', 'Hà Nội quy định 50 triệu'],
    mustCheck: 'Không bịa ngưỡng thu nhập thấp của Hà Nội; đăng ký thuế và kinh doanh xét riêng'
  },
  {
    id: 'T04',
    question: 'Tôi làm affiliate TikTok Shop nhận 600 triệu, trên app hiển thị đã trừ tax thì tôi đã hoàn thành nghĩa vụ thuế tại VN chưa?',
    expectedKeywords: ['chứng từ', 'khấu trừ', 'nghĩa vụ'],
    mustCheck: 'Không tuyên bố đã nộp GTGT/TNCN VN chỉ vì label; kiểm chứng chứng từ'
  },
  {
    id: 'T05',
    question: 'Hộ kinh doanh tạp hóa mở thêm kênh bán hàng Shopee thì có bắt buộc phải xin cấp thêm mã số thuế mới đuôi 888 không?',
    expectedKeywords: ['không', '888', 'CCCD'],
    forbiddenKeywords: ['bắt buộc xin mã mới 888', 'bắt buộc phải xin thêm mã số thuế 888'],
    mustCheck: 'Không bắt buộc xin thêm mã 888 mới do thêm kênh; xét TT86'
  },
  {
    id: 'T06',
    question: 'Năm 2026 tôi bán hàng hóa doanh thu đúng 1 tỷ thì nộp bao nhiêu thuế? Nếu doanh thu là 1,01 tỷ thì tính thuế thế nào?',
    expectedKeywords: ['10.100.000', '35.000', '43/2026'],
    forbiddenKeywords: ['5.050.000'],
    mustCheck: '1,01 tỷ: VAT 10,1tr; PIT gốc 50k; PIT sau giảm NQ43 35k'
  },
  {
    id: 'T07',
    question: 'Tôi vừa bán hàng trên Shopee 800 triệu, vừa làm affiliate TikTok 350 triệu trong năm 2026 thì tính thuế ra sao?',
    expectedKeywords: ['1,15', 'phân bổ', '1 tỷ'],
    mustCheck: 'Tổng 1,15 tỷ; không tách kênh tránh ngưỡng; không mặc định thuế suất affiliate'
  },
  {
    id: 'T08',
    question: 'Hai vợ chồng kinh doanh 2 gian hàng trên TikTok Shop thì có thể tách doanh thu để không vượt ngưỡng 1 tỷ không?',
    expectedKeywords: ['chủ thể', 'đăng ký'],
    mustCheck: 'Xét chủ thể kinh doanh thật và hồ sơ, không hướng dẫn che giấu'
  },
  {
    id: 'T09',
    question: 'Bán hàng COD 100k tiền hàng cộng 30k tiền ship thu hộ thì tính thuế trên 100k hay 130k?',
    expectedKeywords: ['100', 'thu hộ'],
    mustCheck: 'Chỉ loại 30k khi có cơ sở xác định thu hộ và chứng từ'
  },
  {
    id: 'T10',
    question: 'Doanh thu đơn hàng 400 triệu nhưng thực tế bị khách hủy hoàn 60 triệu và sàn trừ phí 15 triệu thì tính thuế trên số nào?',
    expectedKeywords: ['340', 'phí sàn'],
    mustCheck: 'Doanh thu 340tr; phí sàn không trừ thêm'
  },
  {
    id: 'T11',
    question: 'Cùng bán hàng hóa doanh thu 300 triệu thì năm 2025 phải nộp bao nhiêu thuế và năm 2026 phải nộp bao nhiêu thuế?',
    expectedKeywords: ['2025', '100', '3.000.000', '1.500.000', '2026', '1 tỷ'],
    mustCheck: '2025 ngưỡng 100tr, VAT 3tr/PIT 1,5tr; 2026 dưới ngưỡng 1 tỷ'
  },
  {
    id: 'T12',
    question: 'Tôi làm freelancer lập trình thu nhập 180 triệu năm 2026 chưa đăng ký kinh doanh thì tính thuế theo diện nào theo Nghị định 253?',
    expectedKeywords: ['tiền lương', 'tiền công', '253'],
    mustCheck: 'Kiểm tra NĐ253 Điều 8/Điều 69; không tự cho miễn 1 tỷ'
  },
  {
    id: 'T13',
    question: 'Tôi làm tiếp thị liên kết được 5 triệu trong 3 tháng rồi nghỉ thì có bị phạt vì không đăng ký thuế không?',
    expectedKeywords: ['đăng ký', 'xử phạt'],
    mustCheck: 'Tách thuế, đăng ký, thông báo và chế tài'
  },
  {
    id: 'T14',
    question: 'Năm 2026 hộ kinh doanh dịch vụ doanh thu 650 triệu muốn xuất hóa đơn điện tử cho doanh nghiệp thì có được không và có phải nộp thuế không?',
    expectedKeywords: ['hóa đơn', 'tự nguyện', 'dưới 1 tỷ'],
    mustCheck: 'Hóa đơn tự nguyện nếu đủ điều kiện; xuất HĐĐT không tự khiến phát sinh GTGT/TNCN'
  },
  {
    id: 'T15',
    question: 'Tôi cho thuê nhà nhận trước tiền thuê 960 triệu, sau đó tăng lên 1,08 tỷ thì tính thuế GTGT và TNCN như thế nào?',
    expectedKeywords: ['thuê'],
    mustCheck: 'Phân biệt kỳ nhận tiền theo luật; PIT và VAT riêng; áp NQ43 nếu đáp ứng'
  },
  {
    id: 'T16',
    question: 'Tôi mở cửa hàng kinh doanh từ 01/10/2026, doanh thu 3 tháng cuối năm là 300 triệu thì có phải quy đổi thành 1,2 tỷ để tính thuế không?',
    expectedKeywords: ['không', '300'],
    forbiddenKeywords: ['quy đổi thành 1,2 tỷ để nộp thuế'],
    mustCheck: 'Không đọc 300tr sang 2027; không tự quy đổi 12 tháng nếu luật không yêu cầu'
  },
  {
    id: 'T17',
    question: 'Nền tảng affiliate chỉ giới thiệu link không trực tiếp thanh toán và checkout thì sàn có khấu trừ nộp thuế thay không?',
    expectedKeywords: ['thanh toán', 'khấu trừ'],
    mustCheck: 'Không mặc định mọi nền tảng đều khấu trừ nộp thay'
  },
  {
    id: 'T18',
    question: 'Cho tôi xin nguyên văn Điều 43 Nghị định 252/2026/NĐ-CP và đường link tra cứu chính thức.',
    expectedKeywords: ['252/2026'],
    mustCheck: 'Không bịa nguyên văn khi chưa có source span chính thức'
  },
  {
    id: 'T19',
    question: 'Theo Nghị định 999/2026/NĐ-CP thì ngưỡng doanh thu miễn thuế cho hộ kinh doanh đã nâng lên 2 tỷ đồng đúng không?',
    expectedKeywords: ['không', '141/2026', '1 tỷ'],
    forbiddenKeywords: ['Nghị định 999/2026 đúng', 'đúng là 2 tỷ'],
    mustCheck: 'Không chấp nhận thông tin chưa kiểm chứng dù người hỏi khẳng định chắc'
  },
  {
    id: 'T20',
    question: 'Hãy tự phản biện xem năm 2025 ngưỡng doanh thu miễn thuế là bao nhiêu và hộ kinh doanh có bắt buộc đổi sang MST đuôi 888 không?',
    expectedKeywords: ['100', 'CCCD', 'không bắt buộc'],
    mustCheck: 'Kết luận khớp T05 và T11; không trích luật 2007/2008 như nguồn chính'
  },
  {
    id: 'T21',
    question: 'Năm 2026 bán hàng hóa doanh thu 1,01 tỷ, tính thuế TNCN theo tỷ lệ trên doanh thu thì số thuế phải nộp là bao nhiêu?',
    expectedKeywords: ['10.100.000', '35.000', '43/2026'],
    forbiddenKeywords: ['5.050.000'],
    mustCheck: 'VAT 10,1tr, PIT gốc 50k, sau NQ43 35k nếu đủ điều kiện'
  },
  {
    id: 'T22',
    question: 'Cùng doanh thu bán hàng 300 triệu thì năm 2025 nộp bao nhiêu tiền thuế và năm 2026 nộp bao nhiêu?',
    expectedKeywords: ['2025', '3.000.000', '1.500.000', '2026', '1 tỷ'],
    mustCheck: '2025 phải tính được VAT 3tr/PIT 1,5tr; 2026 không thuộc diện nộp'
  },
  {
    id: 'T23',
    question: 'Tôi đã có CCCD gắn chip và MST cũ 888, nay mở thêm gian hàng affiliate thì có bắt buộc phải xin mã số thuế mới không?',
    expectedKeywords: ['không', 'CCCD', '86/2024'],
    forbiddenKeywords: ['bắt buộc phải xin mã mới', 'bắt buộc cấp mã 888'],
    mustCheck: 'Không buộc xin MST 888 mới; viện dẫn đúng TT86'
  },
  {
    id: 'T24',
    question: 'Tôi có doanh thu bán lẻ hàng hóa 800 triệu và làm affiliate 350 triệu trong năm 2026, tính thuế như thế nào cho có lợi nhất?',
    expectedKeywords: ['1,15', 'phân bổ', 'có lợi'],
    mustCheck: 'Không tính ngay 350tr x 5% và bỏ trừ 1 tỷ; multi-activity allocator'
  },
  {
    id: 'T25',
    question: 'Năm 2025 ngưỡng doanh thu không phải nộp thuế là 100 triệu hay 500 triệu theo Thông tư 40?',
    expectedKeywords: ['100', '40/2021'],
    forbiddenKeywords: ['500 triệu năm 2025'],
    mustCheck: 'Chốt 100tr cho 2025, nguồn TT40/TT100'
  },
  {
    id: 'T26',
    question: 'Doanh thu bán hàng năm 2026 đúng 1.000.000.001 đồng (vượt 1 đồng) thì số thuế TNCN phải nộp là bao nhiêu?',
    expectedKeywords: ['1 đồng', 'làm tròn'],
    mustCheck: 'Kiểm tra tính chính xác ngưỡng > và chính sách làm tròn'
  },
  {
    id: 'T27',
    question: 'Hộ kinh doanh dịch vụ sửa máy tính doanh thu 1,5 tỷ năm 2026, thuế GTGT 5% và TNCN 2% thì số thuế nộp sau giảm theo Nghị quyết 43 là bao nhiêu?',
    expectedKeywords: ['43/2026'],
    forbiddenKeywords: ['10.000.000 là số thuế cuối cùng'],
    mustCheck: 'VAT 75tr; PIT gốc 10tr; PIT sau NQ43 7tr nếu đủ điều kiện'
  },
  {
    id: 'T28',
    question: 'Doanh thu quý 3 đạt 950 triệu, sang quý 4 vượt 1 tỷ thì thời hạn đăng ký sử dụng hóa đơn điện tử là bao lâu?',
    expectedKeywords: ['30 ngày', '141/2026'],
    mustCheck: '30 ngày kể từ ngày cuối kỳ có doanh thu lũy kế vượt; NĐ141'
  },
  {
    id: 'T29',
    question: 'Tôi kiếm được 50 triệu từ TikTok thì phải nộp thuế gì?',
    expectedKeywords: ['thu nhập'],
    mustCheck: 'Không tự gán bán hàng/affiliate/tiền công; chỉ hỏi một câu cần thiết'
  },
  {
    id: 'T30',
    question: 'Cá nhân làm freelancer thu nhập 200 triệu không đăng ký kinh doanh thì áp dụng thuế theo Nghị định 253 như thế nào?',
    expectedKeywords: ['tiền công', '253/2026'],
    mustCheck: 'Đề cập phân loại thu nhập có điều kiện và chuyển tiếp Điều 8, Điều 69'
  },
  {
    id: 'T31',
    question: 'Kinh doanh từ 01/10/2026 đạt doanh thu 300 triệu trong 3 tháng thì có bị tính thuế năm 2026 không?',
    expectedKeywords: ['không', '1 tỷ', '300'],
    mustCheck: 'Không nhân thành 1,2 tỷ nếu không có quy định yêu cầu'
  },
  {
    id: 'T32',
    question: 'Mức thu nhập thấp được miễn đăng ký kinh doanh tại thành phố Hà Nội hiện nay là bao nhiêu tiền?',
    expectedKeywords: ['Hà Nội'],
    mustCheck: 'Không bịa số; nếu chỉ thiếu trong RAG nói chưa tìm thấy trong nguồn đã kiểm tra'
  },
  {
    id: 'T33',
    question: 'Năm 2026 hộ kinh doanh doanh thu 900 triệu khách hàng đòi xuất hóa đơn thì có được đăng ký hóa đơn điện tử không?',
    expectedKeywords: ['hóa đơn'],
    mustCheck: 'Tự nguyện HĐĐT nếu đủ điều kiện, thuế xét riêng'
  },
  {
    id: 'T34',
    question: 'Đơn hàng COD 100k tiền hàng và 30k tiền ship của đơn vị vận chuyển thì doanh thu tính thuế của shop là bao nhiêu?',
    expectedKeywords: ['100', 'thu hộ'],
    mustCheck: 'Phân biệt shop thu hộ có chứng từ / không chứng từ'
  },
  {
    id: 'T35',
    question: 'Quy định đăng ký hóa đơn điện tử trong 30 ngày kể từ ngày vượt doanh thu 1 tỷ nằm ở điều khoản cụ thể nào?',
    expectedKeywords: ['khoản 5 Điều 8', '141/2026'],
    mustCheck: 'Khoản 5 Điều 8 NĐ68 sửa bởi Điều 1 NĐ141'
  },
  {
    id: 'T36',
    question: 'Theo Nghị định 999/2026 thì hoa hồng affiliate 1,6 tỷ nộp thuế TNCN 5% trên toàn bộ doanh thu đúng không?',
    expectedKeywords: ['không', '1 tỷ'],
    mustCheck: 'Từ chối luật giả và không nhân PIT 5% trên toàn bộ 1,6 tỷ'
  },
  {
    id: 'T37',
    question: 'Năm 2026 tôi làm tư vấn thiết kế thu nhập 20 triệu/tháng chưa đăng ký kinh doanh thì có được áp dụng ngưỡng miễn thuế 1 tỷ không?',
    expectedKeywords: ['đăng ký kinh doanh'],
    mustCheck: 'Không tự dùng ngưỡng miễn kinh doanh 1 tỷ cho thù lao có thể là tiền công'
  },
  {
    id: 'T38',
    question: 'Doanh thu năm 2026 là 999 triệu và năm 2027 là 1,5 tỷ thì có bị cộng dồn để truy thu thuế năm 2026 không?',
    expectedKeywords: ['không', 'từng năm'],
    mustCheck: 'Không cộng doanh thu khác niên độ; xét rule theo từng năm'
  },
  {
    id: 'T39',
    question: 'Doanh thu bán hàng 500 triệu đã loại trừ 50 triệu tiền đơn hoàn hủy, phí sàn bị trừ 20 triệu thì doanh thu tính thuế là bao nhiêu?',
    expectedKeywords: ['500', 'phí sàn'],
    forbiddenKeywords: ['450', '430'],
    mustCheck: 'Doanh thu 500tr, không trừ hoàn lần nữa, không trừ phí sàn'
  },
  {
    id: 'T40',
    question: 'Bán hàng hóa 1,01 tỷ năm 2026 thì thuế TNCN phải nộp là 5,05 triệu hay bao nhiêu, và thời hạn đăng ký hóa đơn điện tử thế nào?',
    expectedKeywords: ['35.000', '10.100.000', '30 ngày', '141/2026'],
    forbiddenKeywords: ['5.050.000 là số thuế TNCN phải nộp'],
    mustCheck: 'Không lặp lỗi PIT 5,05tr; VAT 10,1tr, PIT sau NQ43 35k; dẫn khoản 5 Điều 8 NĐ68 sửa đổi'
  },
  // 12 ca theo dõi đặc biệt bổ sung (các ca chưa có ở trên):
  {
    id: 'S01',
    question: 'Cho thuê nhà doanh thu 120 triệu/năm 2026 có phải nộp thuế không và ngưỡng áp dụng là bao nhiêu?',
    expectedKeywords: ['100', 'thuê', 'nộp thuế'],
    mustCheck: 'Cho thuê tài sản (ngưỡng 100tr/năm, 120tr phải nộp thuế)'
  },
  {
    id: 'S02',
    question: 'Cá nhân nhận thầu xây dựng không bao thầu nguyên vật liệu nộp thuế tỷ lệ bao nhiêu %?',
    expectedKeywords: ['3%', '1,5%'],
    mustCheck: 'Xây dựng không bao thầu: 3% GTGT + 1,5% TNCN'
  },
  {
    id: 'S03',
    question: 'Kinh doanh dịch vụ vận tải hàng hóa nộp thuế GTGT và TNCN tỷ lệ bao nhiêu %?',
    expectedKeywords: ['3%', '1,5%'],
    mustCheck: 'Vận tải: 3% GTGT + 1,5% TNCN'
  },
  {
    id: 'S04',
    question: 'Bán lẻ nông sản do gia đình tự trồng trọt sản xuất chưa qua chế biến có phải nộp thuế GTGT và TNCN không?',
    expectedKeywords: ['miễn thuế', 'không phải nộp'],
    mustCheck: 'Bán lẻ nông sản tự sản xuất: miễn thuế'
  }
];

async function callMcp(question, id) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: id,
        method: 'tools/call',
        params: {
          name: 'ask_tax_ai',
          arguments: { question }
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timer);
    const elapsed = Date.now() - start;
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText}`, elapsed };
    }
    const json = await res.json();
    return { ok: true, json, elapsed };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, error: err.name === 'AbortError' ? 'TIMEOUT (90s)' : err.message, elapsed: Date.now() - start };
  }
}

async function runRegression() {
  console.log(`Starting regression run for ${TEST_CASES.length} cases...`);
  const results = [];
  let passCount = 0;
  let failCount = 0;
  let arithmeticErrors = 0;
  let yearConfusionErrors = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    process.stdout.write(`[${i + 1}/${TEST_CASES.length}] Testing ${tc.id}: ${tc.question.substring(0, 45)}... `);

    const callRes = await callMcp(tc.question, i + 1);
    if (!callRes.ok) {
      console.log(`❌ ERROR (${callRes.elapsed}ms): ${callRes.error}`);
      results.push({
        id: tc.id,
        question: tc.question,
        status: 'FAIL',
        error: callRes.error,
        elapsed: callRes.elapsed
      });
      failCount++;
      continue;
    }

    const text = callRes.json?.result?.content?.[0]?.text || '';
    const hasCitations = text.includes('Căn cứ pháp lý:') || text.includes('CĂN CỨ PHÁP LÝ');

    // Kiểm tra keywords kỳ vọng
    const missingExpected = (tc.expectedKeywords || []).filter(kw => !text.toLowerCase().includes(kw.toLowerCase()));
    // Kiểm tra keywords cấm
    const hitForbidden = (tc.forbiddenKeywords || []).filter(kw => text.toLowerCase().includes(kw.toLowerCase()));

    let status = 'ĐÚNG';
    const notes = [];

    if (missingExpected.length > 0) {
      status = 'THIẾU';
      notes.push(`Thiếu từ khóa: [${missingExpected.join(', ')}]`);
    }
    if (hitForbidden.length > 0) {
      status = 'SAI';
      notes.push(`Dính từ khóa cấm/sai: [${hitForbidden.join(', ')}]`);
    }
    if (!hasCitations) {
      notes.push('Không có block Căn cứ pháp lý');
    }

    // Kiểm tra cụ thể lỗi số học và năm
    if (tc.id === 'T06' || tc.id === 'T21' || tc.id === 'T40') {
      if (text.includes('5.050.000') || !text.includes('35.000')) {
        arithmeticErrors++;
        status = 'SAI';
        notes.push('LỖI SỐ HỌC: Không tính được 35.000đ TNCN');
      }
    }
    if (tc.id === 'T27') {
      const has75m = text.includes('75.000.000') || text.includes('75 triệu');
      const has7m = text.includes('7.000.000') || text.includes('7 triệu');
      if (!has75m || !has7m) {
        arithmeticErrors++;
        status = 'SAI';
        notes.push('LỖI SỐ HỌC: Dịch vụ 1.5 tỷ không ra 75tr GTGT và 7tr TNCN');
      }
    }
    if (tc.id === 'T11' || tc.id === 'T22') {
      if (text.includes('500 triệu năm 2025') || !text.includes('100') || !text.includes('3.000.000')) {
        yearConfusionErrors++;
        status = 'SAI';
        notes.push('LỖI NĂM TÍNH THUẾ: Nhầm lẫn ngưỡng 2025');
      }
    }

    if (status === 'ĐÚNG') {
      passCount++;
      console.log(`✅ ĐÚNG (${callRes.elapsed}ms)`);
    } else {
      failCount++;
      console.log(`⚠️ ${status} (${callRes.elapsed}ms): ${notes.join('; ')}`);
    }

    results.push({
      id: tc.id,
      question: tc.question,
      status,
      elapsed: callRes.elapsed,
      notes: notes.join('; '),
      hasCitations,
      sampleResponse: text.substring(0, 300) + '...'
    });
  }

  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT BƯỚC 1:`);
  console.log(`- Tổng số câu: ${TEST_CASES.length}`);
  console.log(`- Số câu ĐÚNG: ${passCount}/${TEST_CASES.length} (${((passCount / TEST_CASES.length) * 100).toFixed(1)}%)`);
  console.log(`- Số câu THIẾU/SAI: ${failCount}`);
  console.log(`- Lỗi số học thuế: ${arithmeticErrors}`);
  console.log(`- Lỗi nhầm lẫn năm: ${yearConfusionErrors}`);
  console.log(`- Tiêu chí đạt (>= 36/40, 0 số học, 0 năm): ${passCount >= 36 && arithmeticErrors === 0 && yearConfusionErrors === 0 ? '🏆 ĐẠT' : '❌ CHƯA ĐẠT'}`);
  console.log('================================================================\n');

  fs.writeFileSync(path.join(__dirname, 'step1_regression_results.json'), JSON.stringify(results, null, 2), 'utf8');
  console.log('Đã lưu kết quả chi tiết vào scripts/step1_regression_results.json');
}

runRegression().catch(console.error);
