/**
 * TEST SUITE & BENCHMARK CHO 3 NHÓM CÂU HỎI MỚI A / B / C
 * - Nhóm (A): Thủ tục đăng ký trên hệ thống (SYSTEM_REGISTRATION / REGISTRATION / TAX_ID_888)
 * - Nhóm (B): Gỡ lỗi khi dùng hệ thống web/app thuế (PORTAL_TROUBLESHOOTING)
 * - Nhóm (C): Giải đáp thắc mắc về phần mềm/hệ thống của cơ quan thuế (TAX_SOFTWARE_SYSTEM)
 *
 * Kiểm định:
 * 1. Tập 36 câu hỏi mẫu nhóm A/B/C kèm đáp án kỳ vọng (12 câu A + 12 câu B + 12 câu C) + 12 câu đối chứng luật thuế.
 * 2. Confusion Matrix trước và sau nâng cấp ở tầng Scope & Classify.
 * 3. Retrieval Hit Rate (Route + BM25 + RRF) & bảo toàn chuỗi bước thao tác trong snippet().
 * 4. Bug fix validateLegalCitations (252/2026, 253/2026, 254/2026, 296/2026...) & Validator theo loại tài liệu.
 * 5. Verified Templates nhóm A (Rules Engine) & Nới lỏng có kiểm soát + Ranh giới đỏ + Telemetry.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const modules = new Map();
function load(relativePath) {
  const file = path.resolve(__dirname, '..', relativePath);
  if (modules.has(file)) return modules.get(file);
  if (file.endsWith('.json')) {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { default: parsed, ...parsed };
  }
  const source = fs.readFileSync(file, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'setTimeout', compiled)(
    id => load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(file), id.endsWith('.json') ? id : id + '.ts'))),
    mod,
    mod.exports,
    (callback, ms) => setTimeout(callback, ms).unref(),
  );
  modules.set(file, mod.exports);
  return mod.exports;
}

const { isOutOfScope } = load('shared/taxScope.ts');
const { resolveAnswerScope } = load('worker/src/answerScope.ts');
const { understandQuery, understandClassifiedQuery } = load('worker/src/decision/understandQuery.ts');
const { resolveAbcCategory } = load('worker/src/decision/labels.ts');
const { buildRetrievalPlan } = load('worker/src/decision/retrievalPlan.ts');
const { retrieve, snippet, buildContext } = load('worker/src/retriever.ts');
const { validateLegalCitations } = load('worker/src/answerValidation.ts');
const { answerPriorityTax } = load('worker/src/priorityTaxAnswer.ts');
const { CANONICAL_CHUNKS } = load('worker/src/ragEngine.ts');
const quyetFixture = require('./fixtures/quyet_native.cjs');

const now = new Date('2026-10-17T04:00:00Z');
const scopeFor = (q, history = []) => resolveAnswerScope(history, q, now);

// ============================================================================
// 1. TẬP 36 CÂU HỎI MẪU NHÓM A / B / C KÈM ĐÁP ÁN KỲ VỌNG
// ============================================================================
const ABC_SAMPLE_QUESTIONS = [
  // --- NHÓM A: THỦ TỤC ĐĂNG KÝ TRÊN HỆ THỐNG (12 CÂU) ---
  {
    id: 'A01',
    group: 'A',
    question: 'Cách đăng ký mã số thuế đuôi 888 để bán hàng trên Shopee, TikTok Shop như thế nào?',
    expectedRefs: ['16.100', '16.96'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: '3 bước trên Cổng thông tin TMĐT cho HKD (https://canhantmdt.gdt.gov.vn): Bước 1 truy cập cổng; Bước 2 đăng nhập bằng VNeID mức độ 2; Bước 3 hệ thống kiểm tra và hướng dẫn cấp/bổ sung mã số thuế đuôi 888 theo Công văn 311/TCT-DNNCN và Thông tư 86/2024/TT-BTC.',
  },
  {
    id: 'A02',
    group: 'A',
    question: 'Hướng dẫn các bước đăng ký người phụ thuộc giảm trừ gia cảnh trên app eTax Mobile?',
    expectedRefs: ['16.12'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Quy trình 4 bước trên eTax Mobile (Mã TTHC 1.008499, Mẫu 20-ĐK-TH-TCT theo TT 86/2024/TT-BTC): B1 Đăng nhập eTax Mobile bằng VNeID mức 2; B2 Chọn Đăng ký thuế -> Đăng ký người phụ thuộc; B3 Nhập thông tin (CMND/CCCD nếu >=14 tuổi, giấy khai sinh nếu <14 tuổi); B4 Xác nhận OTP.',
  },
  {
    id: 'A03',
    group: 'A',
    question: 'Làm thế nào để thông báo số tài khoản ngân hàng phục vụ kinh doanh trên eTax Mobile?',
    expectedRefs: ['16.9'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Thực hiện cập nhật/thông báo tài khoản ngân hàng phục vụ hoạt động kinh doanh theo Điều 13 Nghị định 68/2026/NĐ-CP và mẫu biểu của Thông tư 86/2024/TT-BTC trên ứng dụng eTax Mobile hoặc hệ thống thuế điện tử.',
  },
  {
    id: 'A04',
    group: 'A',
    question: 'Bán hàng online trên Facebook chưa có cửa hàng cố định thì đăng ký thuế lần đầu bằng mẫu nào và ở đâu?',
    expectedRefs: ['16.108', '16.64', '16.100', '16.107'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Kê khai đăng ký thuế theo Mẫu 03-ĐK-TCT (Thông tư 86/2024/TT-BTC) hoặc thực hiện trực tuyến bằng VNeID mức 2 trên Cổng thông tin TMĐT https://canhantmdt.gdt.gov.vn để cấp mã số thuế 888.',
  },
  {
    id: 'A05',
    group: 'A',
    question: 'Thủ tục đăng ký hộ kinh doanh mới năm 2026 cần chuẩn bị giấy tờ gì và nộp trong bao lâu?',
    expectedRefs: ['16.7', '16.8', '16.64', '16.108', '16.107'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Nộp Giấy đề nghị đăng ký hộ kinh doanh tại Cơ quan đăng ký kinh doanh cấp xã nơi đặt trụ sở (liên thông một cửa cấp MST theo NĐ 168/2025/NĐ-CP); thời hạn đăng ký thuế lần đầu theo Điều 6 Nghị định 252/2026/NĐ-CP.',
  },
  {
    id: 'A06',
    group: 'A',
    question: 'Hộ kinh doanh mở thêm kho hàng và cửa hàng thứ 2 khác quận thì thủ tục đăng ký địa điểm kinh doanh thế nào?',
    expectedRefs: ['16.7', '16.8', '16.108', '16.64'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Một HKD được mở nhiều địa điểm kinh doanh trên toàn quốc; phải thông báo với cơ quan thuế quản lý nơi đặt địa điểm kinh doanh theo mẫu quy định tại Thông tư 86/2024/TT-BTC và Nghị định 68/2026/NĐ-CP.',
  },
  {
    id: 'A07',
    group: 'A',
    question: 'Hộ kinh doanh doanh thu 1,2 tỷ đồng/năm đăng ký sử dụng hóa đơn điện tử theo mẫu nào?',
    expectedRefs: ['16.41', '16.105', '16.38'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Doanh thu từ 1 tỷ đồng/năm trở lên bắt buộc đăng ký sử dụng hóa đơn điện tử (có mã của cơ quan thuế hoặc khởi tạo từ máy tính tiền) theo Mẫu 01/ĐKTĐ-HĐĐT Phụ lục IA Nghị định 123/2020/NĐ-CP (sửa đổi bởi Nghị định 70/2025/NĐ-CP).',
  },
  {
    id: 'A08',
    group: 'A',
    question: 'Muốn tạm ngừng kinh doanh hộ kinh doanh 6 tháng thì phải gửi thông báo trước mấy ngày?',
    expectedRefs: ['16.25', '16.64', '16.108'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Phải thông báo bằng văn bản cho cơ quan đăng ký kinh doanh/cơ quan thuế trước ngày tạm ngừng kinh doanh theo Nghị định 168/2025/NĐ-CP, Luật Quản lý thuế 108/2025/QH15 và Thông tư 86/2024/TT-BTC.',
  },
  {
    id: 'A09',
    group: 'A',
    question: 'Thủ tục chấm dứt hiệu lực mã số thuế (đóng mã số thuế trạng thái 03) của hộ kinh doanh cần hoàn thành những gì?',
    expectedRefs: ['16.25', '16.64'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Trước khi chấm dứt hiệu lực MST (trạng thái 03), HKD phải hoàn thành nghĩa vụ nộp tờ khai, thanh toán hết nợ thuế và làm thủ tục hủy/ngừng sử dụng hóa đơn điện tử theo Luật Quản lý thuế 108/2025/QH15 và Thông tư 86/2024/TT-BTC.',
  },
  {
    id: 'A10',
    group: 'A',
    question: 'Mã số thuế hộ kinh doanh đang ở trạng thái 06 (không hoạt động tại địa chỉ đã đăng ký) muốn khôi phục lại thì làm thế nào?',
    expectedRefs: ['16.25', '16.64'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Nộp hồ sơ đề nghị khôi phục mã số thuế theo Thông tư 86/2024/TT-BTC, khắc phục các tờ khai còn thiếu và nộp đủ số tiền thuế/tiền phạt vi phạm hành chính trước khi được chuyển lại trạng thái hoạt động.',
  },
  {
    id: 'A11',
    group: 'A',
    question: 'Cá nhân cho thuê nhà muốn đăng ký mã số thuế để tự kê khai trực tiếp trên cổng thuế điện tử thì làm sao?',
    expectedRefs: ['16.108', '16.64', '16.29', '16.91'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Cá nhân cho thuê bất động sản thực hiện đăng ký thuế/sử dụng mã định danh cá nhân (CCCD 12 số) và nộp hồ sơ khai thuế cho thuê tài sản tại cơ quan thuế nơi có bất động sản cho thuê.',
  },
  {
    id: 'A12',
    group: 'A',
    question: 'Hướng dẫn chi tiết từng bước bấm nút đăng ký tài khoản giao dịch thuế điện tử lần đầu trên trang thuedientu.gdt.gov.vn?',
    expectedRefs: ['16.100', '16.12', '16.9', '16.64'],
    coverageStatus: 'PARTIAL',
    expectedAnswerSummary: 'Nêu nguyên tắc sử dụng tài khoản định danh điện tử VNeID mức độ 2 để đăng nhập hệ thống thuế điện tử; đồng thời gắn nhãn rõ phần thao tác chi tiết từng màn hình đăng ký tài khoản riêng trên thuedientu.gdt.gov.vn cần đối chiếu tài liệu hướng dẫn trên cổng thuế.',
  },

  // --- NHÓM B: GỠ LỖI KHI DÙNG HỆ THỐNG WEB/APP THUẾ (12 CÂU) ---
  {
    id: 'B01',
    group: 'B',
    question: 'Ngày cuối hạn nộp tờ khai mà cổng thuế điện tử và hệ thống hóa đơn điện tử bị lỗi sập mạng không nộp được thì xử lý thế nào để không bị phạt?',
    expectedRefs: ['16.105', '16.24', '16.41'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Theo quy định về sự cố vận hành cổng thuế ngày cuối hạn, người nộp thuế cần lưu lại bằng chứng kỹ thuật có dấu thời gian (ảnh chụp màn hình thông báo lỗi, lịch sử gửi hồ sơ) và hoàn tất ngay khi hệ thống khôi phục.',
  },
  {
    id: 'B02',
    group: 'B',
    question: 'Tờ khai trên cổng thuế điện tử tự nhảy số thuế phải nộp trong khi doanh thu cả năm dưới 1 tỷ đồng được miễn thuế thì xử lý thế nào?',
    expectedRefs: ['16.55', '16.24'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Theo mục 16.55, số tiền phần mềm HTKK/eTax tự động tính chỉ phản ánh dữ liệu đã nhập vào biểu mẫu, không tự tạo nghĩa vụ thuế nếu hộ thuộc diện không chịu GTGT/không nộp TNCN (<= 1 tỷ đồng); cần kiểm tra lại chỉ tiêu kê khai hoặc nộp tờ khai điều chỉnh.',
  },
  {
    id: 'B03',
    group: 'B',
    question: 'Tôi đã nộp tiền thuế trên eTax Mobile rồi nhưng hệ thống vẫn báo nợ thuế do chọn nhầm kỳ thuế hoặc nhầm tiểu mục thì khắc phục ra sao?',
    expectedRefs: ['16.59', '16.55', '16.24'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Theo mục 16.59, giữ nguyên ranh giới kỳ tính thuế; trường hợp đã nộp sai kỳ hoặc trùng kỳ thì thực hiện tra soát, điều chỉnh/bù trừ hoặc hoàn nộp thừa theo quy định thay vì tự ý bỏ tờ khai kỳ đúng.',
  },
  {
    id: 'B04',
    group: 'B',
    question: 'Khi đăng ký người phụ thuộc trên eTax Mobile mà nhập sai số định danh cá nhân hoặc con dưới 14 tuổi chưa có CCCD báo lỗi thì sửa thế nào?',
    expectedRefs: ['16.12'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Theo hướng dẫn eTax Mobile (Mã TTHC 1.008499, mục 16.12): người phụ thuộc từ đủ 14 tuổi trở lên bắt buộc kê khai số CMND/CCCD; trẻ dưới 14 tuổi kê khai theo thông tin Giấy khai sinh. Nếu sai thông tin thì nộp hồ sơ thay đổi thông tin đăng ký thuế của NPT trên eTax Mobile.',
  },
  {
    id: 'B05',
    group: 'B',
    question: 'Xuất hóa đơn điện tử bị sai mã số thuế người mua hoặc sai tiền thuế trên hệ thống hóa đơn điện tử thì xử lý lỗi thế nào?',
    expectedRefs: ['16.103', '16.106', '16.21'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Theo Điều 19 Nghị định 123/2020/NĐ-CP (sửa đổi bởi Nghị định 70/2025/NĐ-CP) và Điều 10 Thông tư 91/2026/TT-BTC: nếu chỉ sai tên/địa chỉ thì thông báo cho người mua và gửi Mẫu 04/SS-HĐĐT; nếu sai MST, số tiền, thuế suất thì lập hóa đơn điều chỉnh hoặc hóa đơn thay thế.',
  },
  {
    id: 'B06',
    group: 'B',
    question: 'Đã nộp tờ khai trên cổng thuế điện tử nhưng trạng thái báo Không chấp nhận hồ sơ khai thuế thì phải làm gì?',
    expectedRefs: ['16.24', '16.55'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Theo mục 16.24, phân biệt thông báo "đã gửi/ghi nhận" (Bước 1) với thông báo "chấp nhận/không chấp nhận hồ sơ khai thuế" (Bước 2); khi nhận thông báo không chấp nhận, cần kiểm tra lý do lỗi trong thông báo và nộp lại hồ sơ hợp lệ.',
  },
  {
    id: 'B07',
    group: 'B',
    question: 'Cắm USB Token chữ ký số vào máy tính nhưng trang thuedientu.gdt.gov.vn báo lỗi chưa cài đặt công cụ ký điện tử eSigner hoặc không nhận chứng thư số?',
    expectedRefs: ['16.24', '16.105', '16.55'],
    coverageStatus: 'PARTIAL',
    expectedAnswerSummary: 'Gắn nhãn rõ kho tri thức hiện chưa có bảng mã lỗi kỹ thuật chi tiết của bộ cài eSigner/USB Token; hướng dẫn người dùng kiểm tra driver USB Token/bộ cài ký số trên cổng thuedientu.gdt.gov.vn, liên hệ nhà cung cấp chữ ký số và lưu ảnh chụp màn hình nếu sát hạn nộp hồ sơ.',
  },
  {
    id: 'B08',
    group: 'B',
    question: 'Đăng nhập eTax Mobile bằng tài khoản VNeID bị lỗi xác thực hoặc báo tài khoản định danh chưa đồng bộ với mã số thuế thì xử lý sao?',
    expectedRefs: ['16.12', '16.100', '16.96', '16.24'],
    coverageStatus: 'PARTIAL',
    expectedAnswerSummary: 'Kiểm tra tài khoản VNeID đã đạt mức độ 2 chưa và thông tin CCCD 12 số đã được đồng bộ làm mã số thuế theo Thông tư 86/2024/TT-BTC chưa; gắn nhãn rõ phần lỗi xác thực kỹ thuật kết nối VNeID cần đối chiếu thêm hoặc liên hệ cơ quan thuế để rà soát chuẩn hóa dữ liệu định danh.',
  },
  {
    id: 'B09',
    group: 'B',
    question: 'Kết xuất tờ khai XML từ phần mềm HTKK tải lên cổng thuế điện tử báo lỗi cấu trúc tệp hồ sơ không đúng định dạng XSD?',
    expectedRefs: ['16.55', '16.24'],
    coverageStatus: 'PARTIAL',
    expectedAnswerSummary: 'Nêu rõ nguyên tắc tiếp nhận hồ sơ thuế điện tử hợp lệ (16.24) và lưu ý về phần mềm HTKK (16.55); gắn nhãn rõ lỗi kỹ thuật XSD trên HTKK cần kiểm tra phiên bản phần mềm HTKK mới nhất trên cổng thuế hoặc kê khai trực tuyến trực tiếp trên cổng thuế điện tử.',
  },
  {
    id: 'B10',
    group: 'B',
    question: 'Trên ứng dụng eTax Mobile liên kết ngân hàng để nộp thuế nhưng không nhận được mã OTP hoặc báo lỗi kết nối ngân hàng?',
    expectedRefs: ['16.9', '16.12', '16.24', '16.55'],
    coverageStatus: 'PARTIAL',
    expectedAnswerSummary: 'Gắn nhãn rõ kho tri thức chưa có tài liệu kỹ thuật cổng thanh toán ngân hàng trên eTax Mobile; hướng dẫn kiểm tra thông tin số điện thoại/tài khoản ngân hàng liên kết (16.9), lưu ảnh chụp màn hình nếu lỗi xảy ra vào ngày cuối hạn nộp thuế và liên hệ ngân hàng hoặc bộ phận hỗ trợ eTax Mobile.',
  },
  {
    id: 'B11',
    group: 'B',
    question: 'Máy tính tiền POS bị mất kết nối internet không truyền được dữ liệu hóa đơn điện tử lên cơ quan thuế thì xử lý thế nào?',
    expectedRefs: ['16.105', '16.24', '16.41'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Khi gặp sự cố kỹ thuật/đường truyền trong quá trình đăng ký hoặc truyền dữ liệu hóa đơn điện tử khởi tạo từ máy tính tiền, cần lưu lại log sự cố/ảnh chụp màn hình có dấu thời gian và thực hiện truyền/hoàn tất ngay khi kết nối được khôi phục.',
  },
  {
    id: 'B12',
    group: 'B',
    question: 'Bị khóa mã số thuế trạng thái 06 nên hệ thống chặn không cho xuất hóa đơn điện tử và không nộp được tờ khai trên cổng thuế?',
    expectedRefs: ['16.25'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Theo mục 16.25, trạng thái MST 06 (không hoạt động tại địa chỉ đã đăng ký) làm phát sinh hệ quả bị khóa/ngừng sử dụng hóa đơn điện tử và rủi ro cưỡng chế; người nộp thuế phải làm thủ tục khôi phục MST theo Thông tư 86/2024/TT-BTC và hoàn thành các nghĩa vụ thuế còn thiếu.',
  },

  // --- NHÓM C: PHẦN MỀM / HỆ THỐNG CỦA CƠ QUAN THUẾ (12 CÂU) ---
  {
    id: 'C01',
    group: 'C',
    question: 'Ứng dụng eTax Mobile có những chức năng gì cho hộ kinh doanh và cá nhân kinh doanh?',
    expectedRefs: ['16.12', '16.9', '16.55', '16.100'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Ứng dụng eTax Mobile trên điện thoại hỗ trợ cá nhân/hộ kinh doanh đăng nhập bằng VNeID mức 2 để đăng ký thuế (như đăng ký người phụ thuộc Mã TTHC 1.008499 tại mục 16.12), thông báo tài khoản ngân hàng (16.9), tra cứu và nộp thuế điện tử.',
  },
  {
    id: 'C02',
    group: 'C',
    question: 'Cổng thông tin thương mại điện tử canhantmdt.gdt.gov.vn dùng để làm gì và ai bắt buộc phải dùng?',
    expectedRefs: ['16.100', '16.96'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Cổng https://canhantmdt.gdt.gov.vn là Cổng thông tin thương mại điện tử dành cho hộ, cá nhân kinh doanh trên sàn TMĐT và nền tảng số để thực hiện đăng ký thuế (cấp MST đuôi 888), kê khai và nộp thuế theo Công văn 311/TCT-DNNCN.',
  },
  {
    id: 'C03',
    group: 'C',
    question: 'Phân biệt trang thuedientu.gdt.gov.vn, canhan.gdt.gov.vn và canhantmdt.gdt.gov.vn của cơ quan thuế?',
    expectedRefs: ['16.100', '16.12', '16.9', '16.55'],
    coverageStatus: 'PARTIAL',
    expectedAnswerSummary: 'Giải thích rõ vai trò của cổng canhantmdt.gdt.gov.vn (chuyên cho HKD thương mại điện tử, mã 888) và hệ thống thuế điện tử/eTax Mobile cho cá nhân & HKD truyền thống; gắn nhãn rõ phần so sánh chi tiết giao diện phân hệ thuedientu.gdt.gov.vn và canhan.gdt.gov.vn nếu ngoài phạm vi tài liệu hiện có.',
  },
  {
    id: 'C04',
    group: 'C',
    question: 'Hộ kinh doanh lập sổ kế toán trên phần mềm hoặc file Excel trên máy tính có phải in ra giấy đóng thành quyển cuối năm không?',
    expectedRefs: ['16.52', '16.71'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Theo Thông tư 152/2025/TT-BTC (mục 16.52), hộ kinh doanh được lựa chọn lưu trữ sổ kế toán trên phương tiện điện tử (phần mềm, file Excel...) và KHÔNG bắt buộc phải mua sổ in sẵn hay in sổ điện tử ra giấy đóng thành quyển.',
  },
  {
    id: 'C05',
    group: 'C',
    question: 'Hệ thống hóa đơn điện tử khởi tạo từ máy tính tiền kết nối với cơ quan thuế hoạt động theo nguyên tắc nào?',
    expectedRefs: ['16.41', '16.38', '16.105', '16.24'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Giải pháp hóa đơn điện tử khởi tạo từ máy tính tiền (POS) có kết nối chuyển dữ liệu điện tử với cơ quan thuế theo Nghị định 123/2020/NĐ-CP (sửa đổi bởi Nghị định 70/2025/NĐ-CP).',
  },
  {
    id: 'C06',
    group: 'C',
    question: 'Hộ kinh doanh có bắt buộc phải mua phần mềm kế toán riêng của cơ quan thuế hay được dùng phần mềm miễn phí / Excel?',
    expectedRefs: ['16.52', '16.71'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Theo mục 16.52, pháp luật không bắt buộc HKD phải mua sổ in sẵn hay phần mềm kế toán thương mại cố định; HKD được phép tự ghi chép hoặc dùng bảng tính Excel/phần mềm theo đúng biểu mẫu sổ của Thông tư 152/2025/TT-BTC.',
  },
  {
    id: 'C07',
    group: 'C',
    question: 'Trên hệ thống kê khai thuế điện tử năm 2026, hộ kinh doanh dùng những mẫu tờ khai nào?',
    expectedRefs: ['16.40', '16.51', '16.55'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Hệ thống mẫu biểu tờ khai của HKD gồm Mẫu 01/CNKD (với Chỉ tiêu [14] chọn ngành/địa điểm áp mức trừ 1 tỷ có lợi nhất), Mẫu 01/TKN-CNKD / thông báo doanh thu và các mẫu hoàn nộp thừa theo quy định.',
  },
  {
    id: 'C08',
    group: 'C',
    question: 'Phần mềm HTKK và phần mềm đọc hồ sơ thuế iTaxViewer dùng để làm gì đối với hộ kinh doanh?',
    expectedRefs: ['16.55', '16.24'],
    coverageStatus: 'PARTIAL',
    expectedAnswerSummary: 'Giải thích vai trò công cụ hỗ trợ kê khai HTKK và nguyên tắc phần mềm tự tính số thuế không thay thế điều kiện pháp lý (16.55); đồng thời gắn nhãn rõ kho tri thức chưa có tài liệu hướng dẫn cài đặt chi tiết HTKK/iTaxViewer.',
  },
  {
    id: 'C09',
    group: 'C',
    question: 'Cổng thông tin hóa đơn điện tử hoadondientu.gdt.gov.vn dùng để tra cứu hóa đơn như thế nào?',
    expectedRefs: ['16.41', '16.105', '16.24', '16.100'],
    coverageStatus: 'PARTIAL',
    expectedAnswerSummary: 'Nêu quy định về quản lý, đăng ký và xử lý hóa đơn điện tử theo Nghị định 123/2020/NĐ-CP và Nghị định 70/2025/NĐ-CP; gắn nhãn rõ các bước thao tác giao diện tra cứu trên hoadondientu.gdt.gov.vn cần đối chiếu hướng dẫn trực tiếp trên cổng.',
  },
  {
    id: 'C10',
    group: 'C',
    question: 'Từ ngày 01/07/2025 hệ thống quản lý thuế chuyển sang dùng số CCCD 12 số thay cho mã số thuế cá nhân như thế nào?',
    expectedRefs: ['16.96', '16.100'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Theo Thông tư 86/2024/TT-BTC và Luật Quản lý thuế (mục 16.96, 16.100), từ ngày 01/07/2025 số định danh cá nhân (CCCD 12 chữ số) được sử dụng thay cho mã số thuế của cá nhân, người đại diện hộ kinh doanh; riêng hoạt động TMĐT vẫn dùng hậu tố 888 để phân loại quản lý.',
  },
  {
    id: 'C11',
    group: 'C',
    question: 'Hệ thống sổ kế toán điện tử của hộ kinh doanh năm 2026 gồm mấy loại sổ từ S1a đến S2e?',
    expectedRefs: ['16.52'],
    coverageStatus: 'COVERED',
    expectedAnswerSummary: 'Theo Thông tư 152/2025/TT-BTC (mục 16.52), hệ thống sổ kế toán của HKD được thiết kế riêng cho từng nhóm đối tượng (không chịu thuế / nộp theo tỷ lệ % doanh thu / nộp theo thu nhập tính thuế) với các mẫu sổ S1a-HKD, S2a-HKD, S2b-HKD, S2c-HKD, S2d-HKD, S2e-HKD.',
  },
  {
    id: 'C12',
    group: 'C',
    question: 'Cổng Dịch vụ công của Tổng cục Thuế dichvucong.gdt.gov.vn tiếp nhận những thủ tục hành chính thuế nào?',
    expectedRefs: ['16.12', '16.100', '16.24'],
    coverageStatus: 'PARTIAL',
    expectedAnswerSummary: 'Nêu việc tiếp nhận thủ tục hành chính thuế điện tử (như Mã TTHC 1.008499 đăng ký người phụ thuộc tại mục 16.12 và nguyên tắc tiếp nhận hồ sơ thuế điện tử tại mục 16.24); gắn nhãn rõ danh mục đầy đủ toàn bộ TTHC trên dichvucong.gdt.gov.vn cần tra cứu trực tiếp trên Cổng Dịch vụ công.',
  },
];

// 12 câu đối chứng thuộc nhóm Pháp luật & Tính thuế truyền thống (LEGAL)
const LEGAL_CONTROL_QUESTIONS = [
  'Bán hàng tạp hóa doanh thu 1,2 tỷ năm 2026 nộp thuế GTGT và TNCN bao nhiêu?',
  'Làm dịch vụ sửa chữa máy tính doanh thu 800 triệu năm 2026 có phải nộp thuế không?',
  'Doanh thu bán hàng online 2,5 tỷ đồng năm 2026 được giảm 30% thuế TNCN theo Nghị quyết 43 như thế nào?',
  'Hộ kinh doanh doanh thu 4 tỷ đồng/năm, chi phí hợp lệ 3 tỷ đồng thì tính thuế TNCN theo thuế suất mấy %?',
  'Năm 2026 hộ kinh doanh có còn phải nộp lệ phí môn bài không?',
  'Tiền lương trả cho vợ hoặc con ruột làm tại cửa hàng hộ kinh doanh có được tính vào chi phí được trừ không?',
  'Cho thuê nhà doanh thu 900 triệu đồng/năm thì tính thuế GTGT và TNCN như thế nào?',
  'Sàn Shopee đã khấu trừ thuế tại nguồn thì cuối năm hộ kinh doanh đối trừ số thuế đã nộp ra sao?',
  'Vừa bán hàng tạp hóa 800 triệu vừa làm dịch vụ vận tải 500 triệu trong năm 2026 thì trừ ngưỡng 1 tỷ như thế nào?',
  'Doanh thu trên 50 tỷ đồng/năm thì áp dụng mức thuế suất thuế TNCN bao nhiêu phần trăm?',
  'Hàng hóa thuộc diện giảm thuế GTGT theo Nghị quyết 204/2025/QH15 thì tỷ lệ GTGT của hộ kinh doanh giảm mấy %?',
  'Bán hàng hóa xuất khẩu hoặc dịch vụ tiêu dùng ở nước ngoài có được miễn thuế GTGT không?',
];

console.log('========================================================================');
console.log('🧪 KIỂM ĐỊNH TOÀN DIỆN MỞ RỘNG 3 NHÓM CÂU HỎI A / B / C (36 CÂU MẪU)');
console.log('========================================================================\n');

// ============================================================================
// 2. ĐO CONFUSION MATRIX TRƯỚC VÀ SAU Ở TẦNG SCOPE & CLASSIFY (MỤC 4.1)
// ============================================================================
// Мо phỏng logic phân loại TRƯỚC khi nâng cấp (chỉ có REGISTRATION chung, chưa có B/C và thiếu từ khóa cổng thuế/lỗi kỹ thuật)
function legacyClassifyAbc(question) {
  const norm = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const legacyHasScope = /thue|gtgt|tncn|ho kinh doanh|hkd|hoa don|ke khai|doanh thu|ma so thue|mst|888|mon bai|khau tru/i.test(norm);
  if (!legacyHasScope) return 'OUT_OF_SCOPE';
  if (/dang ky|ma so thue|mst|888|tam ngung|cham dut/i.test(norm) && !/etax|vneid|chu ky so|token|htkk|xml|esigner/i.test(norm)) {
    return 'A';
  }
  return 'LEGAL';
}

function upgradedClassifyAbc(question) {
  if (isOutOfScope(question)) return 'OUT_OF_SCOPE';
  const scope = scopeFor(question);
  const l1Frame = understandQuery(question, scope, []);
  const mockQuyet = quyetFixture({
    state: { question, original_question: question },
    questions: {
      taxpayer: {},
      primary_intent: {},
      income_type: {},
      business_registration: {},
    },
  }, 'IN_SCOPE', {
    taxpayer: l1Frame.taxpayer_type.value,
    primaryIntent: l1Frame.tax_intent.primary.value,
    secondaryIntents: l1Frame.tax_intent.secondary,
    incomeTypes: l1Frame.income_type.map(x => x.value),
    topic: l1Frame.semantic?.topic,
  });
  const rawTopic = mockQuyet.answers.business_registration?.choice;
  const topicChoice = rawTopic && rawTopic !== 'NOT_APPLICABLE' && rawTopic !== 'NONE' ? rawTopic : l1Frame.semantic?.topic;
  const primaryChoice = mockQuyet.answers.primary_intent?.choice || l1Frame.tax_intent.primary.value;
  const l2Frame = understandClassifiedQuery(question, scope, [], {
    taxpayer: mockQuyet.answers.taxpayer?.choice || 'UNKNOWN',
    primaryIntent: primaryChoice,
    secondaryIntents: l1Frame.tax_intent.secondary,
    incomeTypes: [mockQuyet.answers.income_type?.choice || 'UNKNOWN'],
    topic: topicChoice,
  });
  const cat = resolveAbcCategory(
    topicChoice,
    l2Frame.tax_intent.primary.value,
    l2Frame.tax_intent.secondary,
  );
  return cat || 'LEGAL';
}

const labels = ['A', 'B', 'C', 'LEGAL', 'OUT_OF_SCOPE'];
const matrixBefore = Object.fromEntries(labels.map(r => [r, Object.fromEntries(labels.map(c => [c, 0]))]));
const matrixAfter = Object.fromEntries(labels.map(r => [r, Object.fromEntries(labels.map(c => [c, 0]))]));

const allEvalCases = [
  ...ABC_SAMPLE_QUESTIONS.map(x => ({ id: x.id, actual: x.group, question: x.question })),
  ...LEGAL_CONTROL_QUESTIONS.map((q, idx) => ({ id: `L${String(idx + 1).padStart(2, '0')}`, actual: 'LEGAL', question: q })),
];

let correctBefore = 0;
let correctAfter = 0;

for (const item of allEvalCases) {
  const predBefore = legacyClassifyAbc(item.question);
  const predAfter = upgradedClassifyAbc(item.question);
  matrixBefore[item.actual][predBefore]++;
  matrixAfter[item.actual][predAfter]++;
  if (predBefore === item.actual) correctBefore++;
  if (predAfter === item.actual) correctAfter++;
  assert.equal(
    predAfter,
    item.actual,
    `[Classify Misroute] Case ${item.id} ("${item.question}") expected ${item.actual} but got ${predAfter}`,
  );
}

console.log('--- 1. CONFUSION MATRIX TRƯỚC NÂNG CẤP (48 câu: 12A + 12B + 12C + 12 LEGAL) ---');
console.table(matrixBefore);
console.log(`Độ chính xác TRƯỚC nâng cấp: ${correctBefore}/${allEvalCases.length} (${((correctBefore / allEvalCases.length) * 100).toFixed(1)}%)\n`);

console.log('--- 2. CONFUSION MATRIX SAU NÂNG CẤP (48 câu: 12A + 12B + 12C + 12 LEGAL) ---');
console.table(matrixAfter);
console.log(`Độ chính xác SAU nâng cấp: ${correctAfter}/${allEvalCases.length} (${((correctAfter / allEvalCases.length) * 100).toFixed(1)}%)\n`);
assert.equal(correctAfter, allEvalCases.length, '100% câu hỏi mẫu A/B/C và câu đối chứng LEGAL phải được phân loại đúng!');

// ============================================================================
// 3. KIỂM ĐỊNH RETRIEVAL & BẢO TOÀN CHUỖI BƯỚC THAO TÁC (MỤC 3.2)
// ============================================================================
console.log('--- 3. KIỂM ĐỊNH RETRIEVAL HIT RATE TRÊN 36 CÂU MẪU NHÓM A / B / C ---');
let retrievalHitCount = 0;
for (const sample of ABC_SAMPLE_QUESTIONS) {
  const scope = scopeFor(sample.question);
  const l1Frame = understandQuery(sample.question, scope, []);
  const mockQuyet = quyetFixture({
    state: { question: sample.question, original_question: sample.question },
    questions: { taxpayer: {}, primary_intent: {}, income_type: {}, business_registration: {} },
  }, 'IN_SCOPE', {
    taxpayer: l1Frame.taxpayer_type.value,
    primaryIntent: l1Frame.tax_intent.primary.value,
    secondaryIntents: l1Frame.tax_intent.secondary,
    incomeTypes: l1Frame.income_type.map(x => x.value),
    topic: l1Frame.semantic?.topic,
  });
  const rawTopic = mockQuyet.answers.business_registration?.choice;
  const topic = rawTopic && rawTopic !== 'NOT_APPLICABLE' && rawTopic !== 'NONE' ? rawTopic : l1Frame.semantic?.topic;
  const frame = understandClassifiedQuery(sample.question, scope, [], {
    taxpayer: mockQuyet.answers.taxpayer?.choice || 'UNKNOWN',
    primaryIntent: mockQuyet.answers.primary_intent?.choice || l1Frame.tax_intent.primary.value,
    secondaryIntents: l1Frame.tax_intent.secondary,
    incomeTypes: [mockQuyet.answers.income_type?.choice || 'UNKNOWN'],
    topic,
  });
  const plan = buildRetrievalPlan(frame);
  const retrieved = retrieve(sample.question, 5, scope, plan);
  const gotRefs = retrieved.results.map(r => r.chunk.ref_id);
  const hit = sample.expectedRefs.some(ref => gotRefs.includes(ref));
  if (hit) retrievalHitCount++;
  assert.ok(
    hit,
    `[Retrieval Miss] ${sample.id} ("${sample.question}") expected one of [${sample.expectedRefs.join(', ')}] but got [${gotRefs.join(', ')}]`,
  );
}
console.log(`✅ Retrieval Hit Rate trên 36 câu mẫu A/B/C: ${retrievalHitCount}/${ABC_SAMPLE_QUESTIONS.length} (100%)\n`);

// Kiểm tra snippet() không xé lẻ chuỗi các bước thao tác (1..5 trong 16.12 và Bước 1..3 trong 16.100)
{
  const chunk16_12 = CANONICAL_CHUNKS.find(c => c.ref_id === '16.12');
  assert.ok(chunk16_12, 'Phải tồn tại chunk 16.12 (Đăng ký/thay đổi người phụ thuộc trên eTax Mobile)');
  const snip12 = snippet(chunk16_12, 'đăng ký người phụ thuộc etax mobile', 450);
  assert.match(snip12, /1\.\s*`Đăng ký thuế`/, 'Snippet 16.12 phải giữ được bước 1');
  assert.match(snip12, /2\.\s*`Kê khai hồ sơ đăng ký thuế`/, 'Snippet 16.12 phải giữ được bước 2');
  assert.match(snip12, /5\.\s*Xác nhận OTP/, 'Snippet 16.12 phải giữ được bước 5');

  const chunk16_100 = CANONICAL_CHUNKS.find(c => c.ref_id === '16.100');
  assert.ok(chunk16_100, 'Phải tồn tại chunk 16.100 (Đăng ký thuế TMĐT quy trình CV311)');
  const snip100 = snippet(chunk16_100, 'đăng ký thuế thương mại điện tử mã 888', 550);
  assert.match(snip100, /canhantmdt\.gdt\.gov\.vn/i, 'Snippet 16.100 phải giữ được cổng canhantmdt.gdt.gov.vn');
  assert.match(snip100, /VNeID/i, 'Snippet 16.100 phải giữ được bước đăng nhập VNeID');

  const multiStepChunk = {
    id: 'test_proc_steps',
    ref_id: '16.999',
    section: 'Hướng dẫn thao tác từng bước trên cổng thuế',
    text: `## Hướng dẫn thao tác từng bước trên cổng thuế\n${'Mô tả bối cảnh chung về hệ thống thuế điện tử. '.repeat(12)}\n- Bước 1: Truy cập cổng thông tin điện tử của cơ quan thuế.\n- Bước 2: Đăng nhập bằng tài khoản định danh điện tử VNeID mức độ 2.\n- Bước 3: Chọn thủ tục đăng ký thuế và điền biểu mẫu điện tử.\n- Bước 4: Xác nhận mã OTP để hoàn tất gửi hồ sơ.\n${'Ghi chú bổ sung về lưu trữ hồ sơ. '.repeat(12)}`,
  };
  const snipMulti = snippet(multiStepChunk, 'hướng dẫn thao tác đăng ký thuế', 600);
  assert.match(snipMulti, /Bước 1[\s\S]*Bước 2[\s\S]*Bước 3[\s\S]*Bước 4/, 'Snippet phải bảo toàn trọn vẹn chuỗi Bước 1 -> Bước 4 không bị xé lẻ');
  console.log('✅ Kiểm định snippet() bảo toàn chuỗi bước thao tác của tài liệu hướng dẫn (1..5 & Bước 1..4): PASS\n');
}

// ============================================================================
// 4. KIỂM ĐỊNH BUG FIX validateLegalCitations & VALIDATOR THEO LOẠI TÀI LIỆU (MỤC 3.3)
// ============================================================================
console.log('--- 4. KIỂM ĐỊNH BUG FIX validateLegalCitations & VALIDATOR THEO LOẠI TÀI LIỆU ---');
{
  const scope2026 = scopeFor('Năm 2026');
  const sampleChunks = CANONICAL_CHUNKS.filter(c => ['16.9', '16.12', '16.96', '16.100', '16.107'].includes(c.ref_id));

  // 4.1. Bug đã biết: NĐ 252/2026/NĐ-CP, 253/2026, 254/2026, 296/2026 không bị xóa âm thầm
  const draftWith252 = `Theo quy định hiện hành, hộ kinh doanh thực hiện nghĩa vụ thuế đúng hạn.\n\nCăn cứ pháp lý:\n- Điều 5 Nghị định 252/2026/NĐ-CP\n- Điều 3 Nghị định 253/2026/NĐ-CP\n- Điều 4 Nghị định 254/2026/NĐ-CP\n- Điều 6 Nghị định 296/2026/NĐ-CP\n- khoản 3 Điều 82 Nghị định 168/2025/NĐ-CP`;
  const check252 = validateLegalCitations(
    'Quy định đăng ký và quản lý năm 2026?',
    draftWith252,
    ['Nghị định 252/2026/NĐ-CP', 'Nghị định 168/2025/NĐ-CP'],
    scope2026,
    [...sampleChunks,{text:'Điều 3 Nghị định 253/2026/NĐ-CP; Điều 4 Nghị định 254/2026/NĐ-CP; Điều 6 Nghị định 296/2026/NĐ-CP.'}],
  );
  assert.match(check252.answer, /252\/2026\/NĐ-CP/, 'Không được xóa âm thầm Nghị định 252/2026/NĐ-CP');
  assert.match(check252.answer, /253\/2026\/NĐ-CP/, 'Không được xóa âm thầm Nghị định 253/2026/NĐ-CP');
  const absent=validateLegalCitations('Năm 2026?',draftWith252,[],scope2026,[{text:'Nghị định 252/2026/NĐ-CP'}]);
  assert.doesNotMatch(absent.answer,/253\/2026|254\/2026|296\/2026/,'A known document absent from retrieved evidence must not be certified by a whitelist');
  assert.match(check252.answer, /254\/2026\/NĐ-CP/, 'Không được xóa âm thầm Nghị định 254/2026/NĐ-CP');
  assert.match(check252.answer, /296\/2026\/NĐ-CP/, 'Không được xóa âm thầm Nghị định 296/2026/NĐ-CP');
  assert.match(check252.answer, /168\/2025\/NĐ-CP/, 'Không được xóa âm thầm Nghị định 168/2025/NĐ-CP');
  console.log('✅ Bug fix 252/2026, 253/2026, 254/2026, 296/2026, 168/2025 trong validateLegalCitations: PASS');

  // 4.2. Cho phép nhóm A/B/C viện dẫn Công văn / Tài liệu hướng dẫn / Cổng thuế có trong corpus
  const draftManual = `Bạn thực hiện đăng ký người phụ thuộc trên ứng dụng eTax Mobile theo 4 bước và đăng ký mã 888 trên cổng TMĐT.\n\nCăn cứ pháp lý:\n- Hướng dẫn sử dụng eTax Mobile (Mã TTHC 1.008499 - Đăng ký người phụ thuộc)\n- Công văn 311/TCT-DNNCN\n- Cổng thông tin TMĐT canhantmdt.gdt.gov.vn\n- Thông tư 86/2024/TT-BTC`;
  const checkManual = validateLegalCitations(
    'Hướng dẫn đăng ký người phụ thuộc trên eTax Mobile và mã 888?',
    draftManual,
    ['Hướng dẫn sử dụng eTax Mobile (Mã TTHC 1.008499)', 'Công văn 311/TCT-DNNCN', 'Thông tư 86/2024/TT-BTC'],
    scope2026,
    sampleChunks,
    { topic: 'SYSTEM_REGISTRATION', primaryIntent: 'SYSTEM_REGISTRATION' },
  );
  assert.match(checkManual.answer, /1\.008499/, 'Phải giữ lại viện dẫn tài liệu hướng dẫn eTax Mobile Mã TTHC 1.008499');
  assert.match(checkManual.answer, /311\/TCT-DNNCN/, 'Phải giữ lại viện dẫn Công văn 311/TCT-DNNCN');
  assert.match(checkManual.answer, /canhantmdt\.gdt\.gov\.vn/, 'Phải giữ lại viện dẫn Cổng thông tin TMĐT canhantmdt.gdt.gov.vn');
  console.log('✅ Validator cho phép nhóm A/B/C viện dẫn Tài liệu hướng dẫn / Công văn / Cổng thuế trong corpus: PASS');

  // 4.3. Ranh giới đỏ: Chặn tuyệt đối tài liệu hướng dẫn bịa hoặc văn bản giả không có trong corpus
  const draftInvented = `Bạn bấm nút Reset Token theo tài liệu dưới đây.\n\nCăn cứ pháp lý:\n- Sổ tay gỡ lỗi hệ thống nội bộ số 9999/CNTT-TCT\n- Nghị định 888/2026/NĐ-CP\n- Thông tư 86/2024/TT-BTC`;
  const checkInvented = validateLegalCitations(
    'Lỗi không nhận USB Token?',
    draftInvented,
    ['Thông tư 86/2024/TT-BTC'],
    scope2026,
    sampleChunks,
    { topic: 'PORTAL_TROUBLESHOOTING', primaryIntent: 'PORTAL_TROUBLESHOOTING' },
  );
  assert.doesNotMatch(checkInvented.answer, /9999\/CNTT-TCT/, 'Phải xóa tài liệu hướng dẫn bịa không có trong corpus');
  assert.doesNotMatch(checkInvented.answer, /888\/2026\/NĐ-CP/, 'Phải xóa Nghị định bịa không tồn tại');
  assert.match(checkInvented.answer, /86\/2024\/TT-BTC/, 'Phải giữ lại văn bản thật có trong corpus');
  console.log('✅ Ranh giới đỏ chống bịa tài liệu hướng dẫn / văn bản giả: PASS\n');
}

// ============================================================================
// 5. KIỂM ĐỊNH VERIFIED TEMPLATES NHÓM A TRONG RULES ENGINE (MỤC 4.2)
// ============================================================================
console.log('--- 5. KIỂM ĐỊNH VERIFIED PROCEDURAL TEMPLATES NHÓM A (priorityTaxAnswer.ts) ---');
{
  const scope2026 = scopeFor('Năm 2026');

  const tpl888 = answerPriorityTax('Hướng dẫn các bước đăng ký mã số thuế 888 trên cổng thương mại điện tử?', scope2026);
  assert.ok(tpl888 && tpl888.ruleIds.includes('PROC_REG_TAX_ID_888'), 'Phải khớp template PROC_REG_TAX_ID_888');
  assert.match(tpl888.response, /canhantmdt\.gdt\.gov\.vn/);
  assert.match(tpl888.response, /VNeID mức độ 2/i);
  assert.match(tpl888.response, /311\/TCT-DNNCN/);

  const tplDep = answerPriorityTax('Cách đăng ký người phụ thuộc giảm trừ gia cảnh trên eTax Mobile như thế nào?', scope2026);
  assert.ok(tplDep && tplDep.ruleIds.includes('PROC_REG_DEPENDENT_ETAX'), 'Phải khớp template PROC_REG_DEPENDENT_ETAX');
  assert.match(tplDep.response, /1\.008499/);
  assert.match(tplDep.response, /20-ĐKT/);
  assert.match(tplDep.response, /Bước 1[\s\S]*Bước 2[\s\S]*Bước 3[\s\S]*Bước 4/);

  const tplBank = answerPriorityTax('Hướng dẫn thông báo số tài khoản ngân hàng của hộ kinh doanh trên eTax Mobile?', scope2026);
  assert.ok(tplBank && tplBank.ruleIds.includes('PROC_REG_BANK_ACCOUNT_ETAX'), 'Phải khớp template PROC_REG_BANK_ACCOUNT_ETAX');
  assert.match(tplBank.response, /68\/2026\/NĐ-CP/);
  assert.match(tplBank.response, /89\/2026\/TT-BTC|01\/BK-STK/);

  const tplFirst = answerPriorityTax('Bán hàng online chưa có cửa hàng cố định thì đăng ký thuế lần đầu ở đâu?', scope2026);
  assert.ok(tplFirst && tplFirst.ruleIds.includes('PROC_REG_FIRST_TIME_TAX'), 'Phải khớp template PROC_REG_FIRST_TIME_TAX');
  assert.match(tplFirst.response, /03-ĐKT/);
  assert.match(tplFirst.response, /canhantmdt\.gdt\.gov\.vn/);

  const tplC02 = answerPriorityTax('Cổng thông tin thương mại điện tử canhantmdt.gdt.gov.vn dùng để làm gì và ai bắt buộc phải dùng?', scope2026);
  assert.ok(tplC02 && tplC02.ruleIds.includes('PROC_PORTAL_CANHANTMDT_USAGE'), 'Phải khớp template PROC_PORTAL_CANHANTMDT_USAGE');
  assert.match(tplC02.response, /canhantmdt\.gdt\.gov\.vn/);
  assert.match(tplC02.response, /khấu trừ và nộp thuế thay/);
  assert.match(tplC02.response, /KHÔNG phải là kênh duy nhất/);
  assert.doesNotMatch(tplC02.response, /Bạn bán online thì bắt buộc phải dùng/);
  assert.doesNotMatch(tplC02.response, /bắt buộc chỉ dùng cổng này/);

  console.log('✅ Cả 5 Verified Procedural Templates nhóm A/C (PROC_REG_TAX_ID_888, PROC_REG_DEPENDENT_ETAX, PROC_REG_BANK_ACCOUNT_ETAX, PROC_REG_FIRST_TIME_TAX, PROC_PORTAL_CANHANTMDT_USAGE): PASS\n');
}

// ============================================================================
// 6. KIỂM ĐỊNH CHỐNG HỒI QUY 25 CÂU LỖI TRONG BÁO CÁO 96 CÂU (17 OUT_OF_SCOPE + 8 NỘI DUNG/TÍNH TOÁN)
// ============================================================================
console.log('--- 6. KIỂM ĐỊNH 25 CÂU TỪNG LỖI TRONG BÁO CÁO 96 CÂU (17 OUT_OF_SCOPE + 8 NỘI DUNG) ---');
{
  const scope2026 = scopeFor('Năm 2026');

  // 6.1. 17 câu từng bị từ chối OUT_OF_SCOPE phải được nhận diện IN_SCOPE (isOutOfScope === false)
  const previouslyBlocked17 = [
    { id: 'A12', q: 'Con tôi mới 2 tuổi chỉ có Giấy khai sinh đã có số định danh cá nhân 12 số, chưa có thẻ căn cước thì có đăng ký người phụ thuộc ngay được không hay phải đợi đủ 14 tuổi?' },
    { id: 'A20', q: 'Tôi vừa ủy quyền cho công ty đăng ký người phụ thuộc, vừa tự vào eTax Mobile bấm đăng ký mới lần nữa cho chắc thì có bị trùng hồ sơ không?' },
    { id: 'A21', q: 'Trên eTax Mobile tôi thấy có mục "Liên kết tài khoản ngân hàng", bấm liên kết xong thì đã coi là hoàn thành thủ tục thông báo tài khoản ngân hàng kinh doanh với cơ quan thuế chưa?' },
    { id: 'B07', q: 'Cổng thuế điện tử báo lỗi "Không tìm thấy chứng thư số hoặc chữ ký số chưa được đăng ký với cơ quan thuế" khi tôi cắm USB Token vào máy tính thì kiểm tra theo thứ tự nào?' },
    { id: 'B08', q: 'Tôi mới đóng tiền gia hạn chữ ký số với nhà cung cấp hôm qua nhưng vào thuedientu bấm ký tờ khai vẫn báo "Chữ ký số hết hạn hoặc không hợp lệ" thì thiếu bước gì?' },
    { id: 'B10', q: 'Tôi nộp tiền thuế trên eTax Mobile, tài khoản ngân hàng đã báo trừ tiền thành công nhưng mục tra cứu nghĩa vụ thuế trên app vẫn hiện còn nợ thì tôi có nên bấm nộp lại ngay không?' },
    { id: 'B11', q: 'Tôi đổi sim điện thoại mới nên không nhận được mã OTP của eTax Mobile và cổng thuế điện tử nữa thì làm sao cập nhật lại số điện thoại?' },
    { id: 'B13', q: 'Tôi nhập số CCCD 12 số để đăng ký hoặc tra cứu trên cổng thuế nhưng hệ thống báo "Số định danh cá nhân không tồn tại hoặc thông tin ngày cấp không khớp" thì xử lý thế nào?' },
    { id: 'B14', q: 'Tối ngày cuối cùng của hạn nộp tờ khai quý (30/4), cổng thuế điện tử bị quay vòng không đăng nhập được do quá tải thì tôi cần lưu bằng chứng gì và nộp vào ngày hôm sau có bị phạt không?' },
    { id: 'B18', q: 'Nếu cửa hàng đang bán hàng mà máy tính tiền POS bị mất mạng internet hoặc phần mềm hóa đơn lỗi không truyền dữ liệu ngay lên cơ quan thuế được thì xử lý thế nào?' },
    { id: 'B21', q: 'Tôi vừa nhận được "Thông báo tiếp nhận hồ sơ đăng ký sử dụng hóa đơn điện tử" trên cổng thuế và xuất hóa đơn ngay cho khách thì hệ thống báo lỗi chưa được phép phát hành, vì sao?' },
    { id: 'B24', q: 'Tôi gửi tờ khai lúc 23h50 ngày cuối hạn nộp, sáng hôm sau hệ thống trả về "Thông báo không tiếp nhận hồ sơ thuế điện tử" do lỗi định dạng, tôi sửa và nộp lại vào ngày hôm sau thì tính ngày nộp là ngày nào?' },
    { id: 'C01', q: 'Hiện nay hộ kinh doanh và cá nhân kinh doanh có thể giao dịch điện tử với cơ quan thuế qua những cổng hoặc ứng dụng chính thức nào, dùng cái nào cho việc gì?' },
    { id: 'C02', q: 'Tài khoản định danh điện tử VNeID mức 1 có dùng để đăng nhập các cổng thuế điện tử (eTax Mobile, Cổng TMĐT HKD) được không hay bắt buộc phải VNeID mức 2?' },
    { id: 'C03', q: 'Khi đã đăng nhập cổng thuế bằng tài khoản VNeID mức 2 của cá nhân thì có cần mua chữ ký số (USB Token) nữa không, hay VNeID thay thế hoàn toàn chữ ký số trong mọi trường hợp?' },
    { id: 'C18', q: 'Đã bấm xác thực OTP thành công trên eTax Mobile khi nộp tờ khai hoặc hồ sơ hoàn thuế thì có đồng nghĩa hồ sơ đã được cơ quan thuế chấp nhận và chắc chắn được hoàn thuế không?' },
    { id: 'C20', q: 'Tôi đổi sang điện thoại mới, tải lại eTax Mobile nhưng không thấy lịch sử tờ khai cũ hiển thị trên máy mới thì có phải tờ khai đã bị mất trên hệ thống thuế không? Khi nhờ người khác hỗ trợ lỗi cần lưu ý bảo mật gì?' },
  ];

  for (const item of previouslyBlocked17) {
    assert.equal(isOutOfScope(item.q), false, `[${item.id}] không được bị chặn OUT_OF_SCOPE: "${item.q}"`);
  }
  console.log('✅ 17/17 câu từng bị chặn OUT_OF_SCOPE nay đều qua cổng isOutOfScope = false: PASS');

  // 6.2. Kiểm tra kho tri thức và truy xuất cho 6 câu nội dung ABC (A05, A06, A07, A08, A22, C11)
  const chunk16_7 = CANONICAL_CHUNKS.find(c => c.ref_id === '16.7');
  const chunk16_105 = CANONICAL_CHUNKS.find(c => c.ref_id === '16.105');
  const chunk16_108 = CANONICAL_CHUNKS.find(c => c.ref_id === '16.108');
  const householdProcedures = CANONICAL_CHUNKS.find(c => c.ref_id === '16.155');
  const chunk16_71 = CANONICAL_CHUNKS.find(c => c.ref_id === '16.71');

  assert.match(chunk16_7.text, /03 ngày làm việc/, '[A05] Chunk 16.7 phải có thời hạn 03 ngày làm việc theo Điều 99 NĐ 168/2025');
  assert.match(householdProcedures.text, /03 ngày làm việc/, '[A05] Thủ tục hộ đã tách vẫn phải giữ thời hạn theo Điều 99 NĐ 168/2025');
  assert(!chunk16_108.text.includes('[HỒ SƠ VÀ THỜI HẠN ĐĂNG KÝ HỘ KINH DOANH]'),'Không ghép thủ tục riêng của hộ vào định nghĩa cá nhân');
  assert.match(chunk16_7.text, /10 ngày làm việc[\s\S]*điểm đ khoản 2 Điều 8 Nghị định 68\/2026/, '[A06] Chunk 16.7 phải có quy định 10 ngày làm việc điểm đ khoản 2 Điều 8 NĐ 68/2026');
  assert.match(chunk16_105.text, /01\/ĐKTĐ-HĐĐT[\s\S]*Phụ lục III Thông tư 91\/2026\/TT-BTC/, '[A07] Chunk 16.105 phải có Mẫu số 01/ĐKTĐ-HĐĐT Phụ lục III TT 91/2026');
  assert.match(chunk16_7.text, /khoản 1 Điều 103 NĐ 168\/2025[\s\S]*chậm nhất 03 ngày làm việc trước ngày tạm ngừng/, '[A08] Chunk 16.7 phải có hạn báo trước 03 ngày làm việc khoản 1 Điều 103 NĐ 168/2025');
  assert.match(chunk16_7.text, /không quá 01 năm \(12 tháng\)[\s\S]*14 tháng/, '[A22] Chunk 16.7 phải có giới hạn tối đa 01 năm (12 tháng) mỗi lần tạm ngừng');
  const chunk16_52 = CANONICAL_CHUNKS.find(c => c.ref_id === '16.52');
  assert.match(chunk16_52.text, /Điều 4, Điều 5 và Điều 6 Thông tư 152\/2025\/TT-BTC[\s\S]*tổng cộng 6 mẫu sổ thuộc 3 nhánh/, '[C11] Chunk 16.52 phải chốt 6 mẫu sổ thuộc 3 nhánh theo Điều 4-6 TT 152/2025');
  assert.match(chunk16_71.text, /Điều 4–6 TT 152\/2025\/TT-BTC[\s\S]*tổng cộng 6 mẫu sổ chia theo 3 nhánh/, '[C11] Chunk 16.71 phải chốt 6 mẫu sổ chia theo 3 nhánh theo Điều 4-6 TT 152/2025');
  console.log('✅ 6/6 câu thiếu ý ABC (A05, A06, A07, A08, A22, C11) đã có đầy đủ căn cứ pháp lý chuẩn xác trong KB: PASS');

  // 6.3. Kiểm tra 2 câu tính toán pháp luật thuế (L04, L09) trong priorityTaxAnswer.ts
  const ansL04 = answerPriorityTax(
    'Năm 2026 hộ kinh doanh có doanh thu 4 tỷ đồng/năm, chi phí hợp lệ 3 tỷ đồng thì tính thuế TNCN theo phương pháp nào, thuế suất bao nhiêu và số thuế TNCN phải nộp là bao nhiêu?',
    scope2026,
  );
  assert.ok(ansL04 && ansL04.ruleIds.includes('PIT_METHOD_3B'), '[L04] Phải khớp rule PIT_METHOD_3B');
  assert.match(ansL04.response, /170\.000\.000 đồng/, '[L04] Phải tính ra 170.000.000 đồng trước giảm');
  assert.match(ansL04.response, /119\.000\.000 đồng/, '[L04] Phải tính ra 119.000.000 đồng sau giảm 30% NQ 43');
  assert.match(ansL04.response, /điểm d khoản 5 Điều 4 Nghị định 68\/2026\/NĐ-CP/, '[L04] Phải nêu quy tắc ổn định 02 năm liên tiếp tại điểm d khoản 5 Điều 4 NĐ 68/2026');

  const ansL09 = answerPriorityTax(
    'Năm 2026 tôi vừa bán tạp hóa doanh thu 800 triệu đồng, vừa chạy xe tải vận chuyển hàng hóa doanh thu 500 triệu đồng (tổng 1,3 tỷ đồng) thì mức trừ 1 tỷ đồng khi tính thuế TNCN được phân bổ vào ngành nào trước, số thuế TNCN phải nộp là bao nhiêu?',
    scope2026,
  );
  assert.ok(ansL09 && ansL09.ruleIds.includes('MULTI_SECTOR_1B_DEDUCTION_CALC'), '[L09] Phải khớp rule MULTI_SECTOR_1B_DEDUCTION_CALC');
  assert.match(ansL09.response, /ưu tiên trừ vào ngành có tỷ lệ thuế TNCN cao hơn trước/i, '[L09] Phải nêu nguyên tắc ưu tiên trừ ngành có tỷ lệ TNCN cao hơn trước');
  assert.match(ansL09.response, /1\.500\.000 đồng/, '[L09] Phải tính ra 300 triệu × 0,5% = 1.500.000 đồng trước giảm');
  assert.match(ansL09.response, /1\.050\.000 đồng/, '[L09] Phải tính ra 1.050.000 đồng sau giảm 30% NQ 43');
  console.log('✅ 2/2 câu tính toán L04 (4 tỷ - 3 tỷ × 17% = 170tr / 119tr + điểm d khoản 5 Điều 4 NĐ 68) và L09 (ưu tiên trừ 500tr vận tải + 500tr tạp hóa -> còn 300tr × 0,5% = 1,5tr / 1,05tr): PASS\n');
}

console.log('🎉 TẤT CẢ CÁC BÀI KIỂM ĐỊNH NHÓM A / B / C VÀ 25 CÂU SỬA LỖI ĐỀU ĐẠT 100%!');

