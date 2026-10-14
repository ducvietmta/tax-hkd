import type { RegStep } from '../types';

export const REG_STEPS: Record<string, RegStep> = {
  // =========================================================================
  // PATH A: CÁ NHÂN KINH DOANH TRỰC TIẾP
  // =========================================================================
  'ind-check-eligibility': {
    id: 'ind-check-eligibility',
    title: 'Xác định diện miễn ĐKKD & Nghĩa vụ đăng ký thuế trực tiếp',
    summary:
      'Kiểm tra xem hoạt động của bạn có thuộc trường hợp kinh doanh lưu động, buôn chuyến, không có địa điểm cố định được miễn đăng ký Hộ kinh doanh tại UBND nhưng vẫn phải đăng ký mã số thuế.',
    actions: [
      'Đối chiếu ngành nghề: Bán hàng rong, quà vặt, buôn chuyến, làm dịch vụ cá nhân tại chỗ hoặc tại địa chỉ khách hàng.',
      'Xác nhận không sử dụng địa điểm kinh doanh cố định, không treo biển hiệu cửa hàng thường trực.',
      'Lưu ý quan trọng: Dù được miễn lập Hộ kinh doanh tại UBND, bạn vẫn bắt buộc phải đăng ký thuế với Cơ quan Thuế trước khi bắt đầu hoạt động.',
    ],
    documents: [
      { id: 'doc-cccd', label: 'Thẻ Căn cước công dân (CCCD gắn chip 12 số) bản gốc' },
      { id: 'doc-vneid', label: 'Tài khoản Định danh điện tử VNeID đã kích hoạt Mức độ 2' },
    ],
    where: {
      label: 'Cổng Dịch vụ công Quốc gia (DVC)',
      url: 'https://dichvucong.gov.vn',
      note: 'Nộp hồ sơ trực tuyến 24/7 không cần đến trực tiếp Chi cục Thuế',
    },
    fee: '0 VNĐ (Miễn hoàn toàn lệ phí đăng ký và bãi bỏ lệ phí môn bài từ 01/01/2026)',
    duration: 'Xác nhận tức thì',
    warnings: [
      'Kinh doanh không đăng ký thuế trực tiếp có thể bị xử phạt vi phạm hành chính từ 1.000.000đ đến 10.000.000đ theo Nghị định 125/2020/NĐ-CP.',
      'Nếu sau này bạn mở cửa hiệu hoặc thuê mặt bằng cố định, bạn phải chuyển đổi sang đăng ký Hộ kinh doanh tại UBND cấp huyện/xã.',
    ],
    legalRefs: [
      {
        label: 'Nghị định 168/2025/NĐ-CP',
        docId: 'ND-168-2025-ND-CP',
        note: 'Quy định các trường hợp kinh doanh lưu động không phải đăng ký HKD',
      },
      {
        label: 'Nghị định 125/2020/NĐ-CP',
        docId: 'ND-125-2020-ND-CP',
        note: 'Điều 10: Xử phạt hành vi vi phạm thời hạn đăng ký thuế',
      },
    ],
    aiPrompt:
      'Tôi muốn bán hàng rong / làm dịch vụ lưu động không có cửa hàng cố định, tôi có bắt buộc phải đăng ký hộ kinh doanh không và thủ tục đăng ký thuế thế nào?',
    verifiedAt: '2026-10-14',
  },

  'ind-prepare-vneid': {
    id: 'ind-prepare-vneid',
    title: 'Chuẩn bị CCCD gắn chip & Định danh VNeID Mức 2',
    summary:
      'Từ ngày 01/07/2025 theo Thông tư 86/2024/TT-BTC, số định danh cá nhân (CCCD 12 số) chính thức thay thế mã số thuế cá nhân. Mọi thủ tục thuế đều xác thực qua VNeID Mức 2.',
    actions: [
      'Kiểm tra tình trạng tài khoản VNeID trên điện thoại xem đã đạt mức độ 2 (đã đăng ký tại Công an xã/phường) chưa.',
      'Nếu chưa kích hoạt Mức 2, mang CCCD gắn chip đến Công an xã/phường gần nhất để làm thủ tục kích hoạt miễn phí.',
      'Chuẩn bị số điện thoại chính chủ trùng khớp với số điện thoại đã đăng ký tài khoản VNeID.',
    ],
    documents: [
      { id: 'doc-cccd-front-back', label: 'Hình chụp 2 mặt Căn cước công dân gắn chip (rõ nét)' },
      { id: 'doc-phone', label: 'Số điện thoại chính chủ nhận mã OTP xác thực' },
    ],
    where: {
      label: 'Ứng dụng VNeID (Bộ Công an)',
      url: 'https://vneid.gov.vn',
      note: 'Tải ứng dụng trên App Store hoặc Google Play',
    },
    fee: '0 VNĐ (Kích hoạt VNeID hoàn toàn miễn phí)',
    duration: '10 - 15 phút tại Công an xã/phường nếu chưa có',
    warnings: [
      'Số điện thoại đăng ký VNeID phải là số điện thoại chính chủ đăng ký thông tin thuê bao với nhà mạng.',
      'Không chia sẻ mã OTP hoặc mật khẩu VNeID cho bất kỳ bên thứ ba nào.',
    ],
    legalRefs: [
      {
        label: 'Thông tư 86/2024/TT-BTC',
        docId: 'TT-86-2024-TT-BTC',
        note: 'Sử dụng số định danh cá nhân (CCCD 12 số) thay thế mã số thuế',
      },
    ],
    aiPrompt:
      'Quy định sử dụng số định danh cá nhân (CCCD 12 số) thay thế mã số thuế theo Thông tư 86/2024/TT-BTC áp dụng cho cá nhân kinh doanh như thế nào?',
    verifiedAt: '2026-10-14',
  },

  'ind-submit-tax-reg': {
    id: 'ind-submit-tax-reg',
    title: 'Kê khai Tờ khai Đăng ký thuế (Mẫu 03-ĐK-TCT) Trực tuyến',
    summary:
      'Nộp hồ sơ đăng ký thuế trực tiếp tới Chi cục Thuế quản lý nơi cư trú qua Cổng Thuế điện tử hoặc Cổng Dịch vụ công Quốc gia.',
    actions: [
      'Đăng nhập vào Cổng Thuế điện tử (thuedientu.gdt.gov.vn) bằng tài khoản VNeID Mức 2.',
      'Chọn mục "Đăng ký thuế" -> "Đăng ký thuế lần đầu" -> Chọn Tờ khai Mẫu 03-ĐK-TCT (Tờ khai đăng ký thuế dùng cho cá nhân kinh doanh).',
      'Điền thông tin địa bàn kinh doanh, ngành nghề hoạt động chính và dự kiến doanh thu/vốn.',
      'Kiểm tra lại toàn bộ thông tin và nhấn "Gửi hồ sơ" kèm mã OTP.',
    ],
    documents: [
      { id: 'doc-form-03', label: 'Tờ khai đăng ký thuế Mẫu 03-ĐK-TCT (điền trực tuyến)' },
      { id: 'doc-cccd-scan', label: 'Bản scan/ảnh chụp CCCD 12 số (hệ thống tự lấy nếu qua VNeID)' },
    ],
    where: {
      label: 'Cổng Thuế điện tử - Phân hệ Cá nhân',
      url: 'https://thuedientu.gdt.gov.vn',
      note: 'Chọn đăng nhập bằng tài khoản VNeID',
    },
    fee: '0 VNĐ',
    duration: '03 ngày làm việc để Cơ quan Thuế xử lý và phản hồi',
    warnings: [
      'Cần chọn đúng Chi cục Thuế nơi bạn đăng ký thường trú hoặc tạm trú để hồ sơ được phê duyệt nhanh nhất.',
      'Lưu lại Mã giao dịch điện tử để tra cứu tiến độ xử lý hồ sơ.',
    ],
    legalRefs: [
      {
        label: 'Luật Quản lý thuế số 38/2019/QH14',
        docId: 'Luat-38-2019-QH14',
        note: 'Điều 30 - 33: Đăng ký thuế và thời hạn đăng ký',
      },
      {
        label: 'Thông tư 86/2024/TT-BTC',
        docId: 'TT-86-2024-TT-BTC',
        note: 'Quy trình giải quyết hồ sơ đăng ký thuế trực tiếp bằng CCCD',
      },
    ],
    aiPrompt:
      'Hướng dẫn tôi cách điền Tờ khai 03-ĐK-TCT đăng ký thuế cho cá nhân kinh doanh trực tiếp online qua Cổng Thuế điện tử.',
    verifiedAt: '2026-10-14',
  },

  'ind-receive-tax-code': {
    id: 'ind-receive-tax-code',
    title: 'Nhận Thông báo Mã số thuế & Kích hoạt eTax Mobile',
    summary:
      'Cơ quan Thuế gửi thông báo chấp thuận hồ sơ và mã số thuế (chính là số CCCD 12 số của bạn) qua email và tin nhắn SMS.',
    actions: [
      'Kiểm tra email và tin nhắn thông báo kết quả từ Tổng cục Thuế trong vòng 03 ngày làm việc.',
      'Tải và cài đặt ứng dụng eTax Mobile trên điện thoại di động.',
      'Đăng nhập eTax Mobile bằng tài khoản VNeID Mức 2 hoặc tài khoản Thuế điện tử được cấp.',
      'Tra cứu trạng thái mã số thuế cá nhân kinh doanh trên eTax Mobile để xác nhận hoạt động bình thường.',
    ],
    documents: [
      { id: 'doc-tax-notice', label: 'Thông báo kết quả đăng ký thuế điện tử của Cơ quan Thuế' },
    ],
    where: {
      label: 'Ứng dụng eTax Mobile (Tổng cục Thuế)',
      url: 'https://canhan.gdt.gov.vn',
      note: 'Dùng để nộp thuế, tra cứu nghĩa vụ thuế trên điện thoại di động',
    },
    fee: '0 VNĐ',
    duration: 'Có kết quả trong vòng 03 ngày làm việc',
    warnings: [
      'Sau khi được cấp MST, trạng thái trên hệ thống thuế sẽ chuyển thành "Đang hoạt động (đã được cấp MST)".',
      'Nếu hồ sơ bị từ chối, đọc kỹ lý do trong văn bản phản hồi và bổ sung thông tin trong vòng 02 ngày.',
    ],
    legalRefs: [
      {
        label: 'Thông tư 86/2024/TT-BTC',
        docId: 'TT-86-2024-TT-BTC',
        note: 'Quy định cấp Giấy chứng nhận đăng ký thuế điện tử',
      },
    ],
    aiPrompt:
      'Sau khi nộp hồ sơ 03-ĐK-TCT, làm sao để biết mã số thuế của tôi đã được kích hoạt thành công trên eTax Mobile?',
    verifiedAt: '2026-10-14',
  },

  'ind-post-reg-duties': {
    id: 'ind-post-reg-duties',
    title: 'Nghĩa vụ Thuế & Ngưỡng Doanh thu 1 Tỷ đồng',
    summary:
      'Nắm rõ các mốc nghĩa vụ tài chính năm 2026: Ngưỡng miễn thuế 1 tỷ đồng, mở sổ kế toán giản đơn và hóa đơn điện tử.',
    actions: [
      'Kiểm tra ngưỡng doanh thu: Nếu doanh thu thực tế trong năm dưới 1 tỷ đồng/năm, bạn được MIỄN 100% thuế GTGT và thuế TNCN theo Nghị định 141/2026/NĐ-CP.',
      'Lập sổ theo dõi doanh thu (Mẫu S1a-HKD) đơn giản theo Thông tư 88/2021/TT-BTC để ghi nhận các khoản thu phát sinh.',
      'Nếu doanh thu trong năm vượt ngưỡng 1 tỷ đồng: Kê khai nộp thuế theo phương pháp trực tiếp trên doanh thu (GTGT 1% - 5%, TNCN 0.5% - 2% tùy ngành nghề).',
      'Nếu khách hàng có nhu cầu hóa đơn: Mua hóa đơn điện tử có mã của cơ quan thuế khởi tạo từ máy tính tiền hoặc hóa đơn theo từng lần phát sinh.',
    ],
    documents: [
      { id: 'doc-s1a', label: 'Sổ theo dõi doanh thu bán lẻ (Mẫu S1a-HKD ban hành kèm TT 88/2021)' },
      { id: 'doc-bank-statement', label: 'Sao kê tài khoản ngân hàng dùng cho mục đích kinh doanh' },
    ],
    fee: 'Miễn lệ phí môn bài vĩnh viễn từ 01/01/2026',
    duration: 'Thực hiện định kỳ hàng quý hoặc năm',
    warnings: [
      'Tuyệt đối không dùng chung tài khoản ngân hàng kinh doanh với các giao dịch tài chính phức tạp khó giải trình.',
      'Khi doanh thu vượt 1 tỷ đồng/năm, trong vòng 30 ngày phải liên hệ cơ quan thuế để đăng ký sử dụng hóa đơn điện tử.',
    ],
    legalRefs: [
      {
        label: 'Nghị định 141/2026/NĐ-CP',
        docId: 'ND-141-2026-ND-CP',
        note: 'Nâng ngưỡng doanh thu miễn thuế cho hộ kinh doanh lên 1 tỷ đồng/năm',
      },
      {
        label: 'Thông tư 88/2021/TT-BTC',
        docId: 'TT-88-2021-TT-BTC',
        note: 'Chế độ sổ sách kế toán giản đơn cho hộ, cá nhân kinh doanh',
      },
    ],
    aiPrompt:
      'Cá nhân kinh doanh có doanh thu dưới 1 tỷ đồng/năm có phải nộp tờ khai thuế không, và cần ghi sổ sách kế toán nào theo Nghị định 141/2026?',
    verifiedAt: '2026-10-14',
  },

  // =========================================================================
  // PATH B: HỘ KINH DOANH CÁ THỂ (CÓ ĐỊA ĐIỂM CỐ ĐỊNH)
  // =========================================================================
  'hkd-choose-name-scope': {
    id: 'hkd-choose-name-scope',
    title: 'Đặt tên Hộ kinh doanh & Lựa chọn Ngành nghề, Địa điểm',
    summary:
      'Quy chuẩn tên Hộ kinh doanh đúng luật, chọn mã ngành kinh doanh phù hợp và xác định địa chỉ kinh doanh hợp pháp.',
    actions: [
      'Đặt tên Hộ kinh doanh: Bắt buộc cấu trúc gồm 2 thành tố: "Hộ kinh doanh" + "Tên riêng" (Ví dụ: Hộ kinh doanh Cà phê An Nhiên).',
      'Kiểm tra tên: Không được trùng với tên Hộ kinh doanh khác đã đăng ký trong cùng phạm vi quận/huyện/thị xã.',
      'Xác định địa điểm: Địa chỉ cụ thể số nhà, đường, phường/xã. Không được đặt địa chỉ kinh doanh tại căn hộ chung cư (chỉ dùng để ở) theo Luật Nhà ở.',
      'Tra cứu ngành nghề: Chọn mã ngành cấp 4 theo Hệ thống ngành kinh tế Việt Nam. Lưu ý các ngành có điều kiện (VSATTP, phòng cháy chữa cháy, an ninh trật tự...).',
    ],
    documents: [
      { id: 'doc-lease-contract', label: 'Hợp đồng thuê địa điểm kinh doanh hoặc Giấy chứng nhận quyền sử dụng đất (Sổ đỏ)' },
      { id: 'doc-name-check', label: 'Phương án 2 - 3 tên riêng dự phòng tránh trùng lặp' },
    ],
    fee: '0 VNĐ',
    duration: 'Tự chuẩn bị (khoảng 30 phút)',
    warnings: [
      'Tên riêng hộ kinh doanh không được sử dụng các từ ngữ "công ty", "doanh nghiệp", "tổng công ty".',
      'Căn hộ chung cư nhà ở không được phép đăng ký làm địa điểm kinh doanh hộ cá thể.',
    ],
    legalRefs: [
      {
        label: 'Nghị định 168/2025/NĐ-CP',
        docId: 'ND-168-2025-ND-CP',
        note: 'Quy định về đặt tên hộ kinh doanh và địa điểm kinh doanh hợp pháp',
      },
    ],
    aiPrompt:
      'Quy định đặt tên Hộ kinh doanh và địa điểm kinh doanh theo Nghị định 168/2025/NĐ-CP có những điểm gì cần tránh?',
    verifiedAt: '2026-10-14',
  },

  'hkd-prepare-dossier': {
    id: 'hkd-prepare-dossier',
    title: 'Chuẩn bị Bộ Hồ sơ Đăng ký Hộ kinh doanh',
    summary:
      'Soạn thảo đầy đủ hồ sơ theo mẫu chuẩn liên thông đăng ký kinh doanh và đăng ký thuế, tránh sai sót phải đi lại nhiều lần.',
    actions: [
      'Điền Giấy đề nghị đăng ký hộ kinh doanh (theo Phụ lục ban hành kèm Nghị định 168/2025/NĐ-CP).',
      'Ghi rõ các chỉ tiêu thuế tích hợp: Dự kiến vốn, doanh thu, số lao động, phương pháp tính thuế, thông tin tài khoản ngân hàng.',
      'Nếu hộ kinh doanh do các thành viên hộ gia đình cùng thành lập: Soạn Biên bản họp các thành viên hộ gia đình và Văn bản ủy quyền cho một người làm đại diện.',
      'Scan/chụp rõ nét bản sao CCCD gắn chip của chủ hộ và các thành viên tham gia.',
    ],
    documents: [
      { id: 'doc-hkd-form', label: 'Giấy đề nghị đăng ký hộ kinh doanh (tích hợp đăng ký thuế)' },
      { id: 'doc-hkd-cccd', label: 'Bản sao CCCD gắn chip của chủ hộ kinh doanh' },
      { id: 'doc-hkd-family-doc', label: 'Biên bản họp gia đình & Giấy ủy quyền (nếu nhiều thành viên cùng góp vốn)', optional: true },
      { id: 'doc-hkd-lease', label: 'Hợp đồng thuê mặt bằng / Giấy tờ chứng minh quyền sử dụng địa điểm hợp pháp' },
    ],
    fee: '0 VNĐ chuẩn bị hồ sơ',
    duration: '1 - 2 giờ',
    warnings: [
      'Một cá nhân chỉ được đứng tên làm đại diện cho 01 Hộ kinh doanh duy nhất trên phạm vi toàn quốc (theo NĐ 168/2025/NĐ-CP).',
      'Chữ ký trên các văn bản phải đúng chữ ký của chủ hộ và các thành viên.',
    ],
    legalRefs: [
      {
        label: 'Nghị định 168/2025/NĐ-CP',
        docId: 'ND-168-2025-ND-CP',
        note: 'Thành phần hồ sơ đăng ký hộ kinh doanh liên thông đăng ký thuế',
      },
    ],
    aiPrompt:
      'Bộ hồ sơ thành lập Hộ kinh doanh cá thể gồm những giấy tờ gì và tải mẫu Giấy đề nghị ở đâu theo quy định mới nhất?',
    verifiedAt: '2026-10-14',
  },

  'hkd-submit-linked-reg': {
    id: 'hkd-submit-linked-reg',
    title: 'Nộp Hồ sơ Liên thông ĐKKD & Đăng ký Thuế',
    summary:
      'Nộp hồ sơ trực tuyến qua Cổng Dịch vụ công Quốc gia / Hệ thống thông tin giải quyết TTHC cấp tỉnh hoặc nộp trực tiếp tại Bộ phận Một cửa UBND cấp huyện/xã.',
    actions: [
      'Truy cập Cổng Dịch vụ công tỉnh/thành phố hoặc Cổng DVC Quốc gia (dichvucong.gov.vn).',
      'Chọn thủ tục "Đăng ký thành lập hộ kinh doanh" (liên thông đăng ký thuế).',
      'Tải lên các file scan định dạng PDF hoặc ảnh chất lượng cao.',
      'Thanh toán lệ phí đăng ký kinh doanh trực tuyến (nếu có yêu cầu).',
      'Nhận Biên nhận điện tử có chứa Mã số hồ sơ và ngày hẹn trả kết quả.',
    ],
    documents: [
      { id: 'doc-online-submission', label: 'Bộ hồ sơ scan bản mềm đính kèm trên Cổng DVC' },
    ],
    where: {
      label: 'Cổng Dịch vụ công Quốc gia',
      url: 'https://dichvucong.gov.vn',
      note: 'Tìm kiếm thủ tục "Đăng ký thành lập hộ kinh doanh"',
    },
    fee: 'Khoảng 50.000đ - 100.000đ (Nhiều tỉnh thành giảm 50% hoặc miễn phí khi nộp trực tuyến)',
    duration: '03 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ',
    warnings: [
      'Điểm mấu chốt 2026: Đăng ký kinh doanh liên thông với đăng ký thuế. Bạn KHÔNG bị áp dụng thời hạn 10 ngày xử phạt của đăng ký thuế trực tiếp theo Nghị định 125/2020/NĐ-CP vì hệ thống tự động liên thông.',
      'Thường xuyên kiểm tra hòm thư email hoặc tin nhắn SMS để nhận phản hồi chỉnh sửa nếu hồ sơ chưa chuẩn.',
    ],
    legalRefs: [
      {
        label: 'Nghị định 168/2025/NĐ-CP',
        docId: 'ND-168-2025-ND-CP',
        note: 'Quy trình liên thông giải quyết thủ tục đăng ký kinh doanh và đăng ký thuế',
      },
      {
        label: 'Nghị định 125/2020/NĐ-CP',
        docId: 'ND-125-2020-ND-CP',
        note: 'Quy định miễn áp dụng phạt chậm nộp đăng ký thuế đối với cơ chế liên thông',
      },
    ],
    aiPrompt:
      'Cơ chế liên thông một cửa giữa Đăng ký kinh doanh UBND và Chi cục Thuế theo Nghị định 168/2025/NĐ-CP hoạt động ra sao và mất bao lâu?',
    verifiedAt: '2026-10-14',
  },

  'hkd-receive-cert': {
    id: 'hkd-receive-cert',
    title: 'Nhận Giấy chứng nhận ĐKKD & Mã số thuế Hộ kinh doanh',
    summary:
      'Sau 03 ngày làm việc, bạn nhận Giấy chứng nhận đăng ký hộ kinh doanh điện tử (có mã QR) hoặc bản giấy tại Bộ phận Một cửa.',
    actions: [
      'Tải bản Giấy chứng nhận đăng ký hộ kinh doanh điện tử có chữ ký số từ Cổng Dịch vụ công.',
      'Kiểm tra kỹ thông tin: Tên hộ kinh doanh, địa chỉ, người đại diện, ngành nghề và Mã số hộ kinh doanh.',
      'Lưu ý: Mã số hộ kinh doanh đồng thời là Mã số thuế của hộ kinh doanh (gồm 10 số).',
      'Nhận bản gốc bằng giấy tại Bộ phận Một cửa UBND hoặc đăng ký chuyển phát bưu điện về tận nhà.',
    ],
    documents: [
      { id: 'doc-giay-phep-hkd', label: 'Giấy chứng nhận đăng ký hộ kinh doanh (bản giấy hoặc bản điện tử)' },
    ],
    fee: '0 VNĐ nhận kết quả (hoặc phí bưu điện nếu nhận tận nhà)',
    duration: '03 ngày làm việc',
    warnings: [
      'Kiểm tra chính xác từng ký tự tên chủ hộ, số CCCD và địa chỉ. Nếu phát hiện sai sót cần yêu cầu cấp đổi hiệu đính ngay.',
      'Treo biển hiệu tại địa điểm kinh doanh đúng nội dung: Tên cơ quan cấp, Tên HKD, Mã số HKD, Địa chỉ, Số điện thoại.',
    ],
    legalRefs: [
      {
        label: 'Nghị định 168/2025/NĐ-CP',
        docId: 'ND-168-2025-ND-CP',
        note: 'Giá trị pháp lý của Giấy chứng nhận đăng ký hộ kinh doanh điện tử',
      },
    ],
    aiPrompt:
      'Mã số hộ kinh doanh có phải là mã số thuế luôn không, và sau khi có Giấy chứng nhận cần treo biển hiệu như thế nào cho đúng luật?',
    verifiedAt: '2026-10-14',
  },

  'hkd-activate-tax-etax': {
    id: 'hkd-activate-tax-etax',
    title: 'Kích hoạt Thuế điện tử, Mở Tài khoản Ngân hàng HKD',
    summary:
      'Mở tài khoản thanh toán mang tên Hộ kinh doanh và liên kết ứng dụng eTax Mobile để theo dõi nghĩa vụ thuế 24/7.',
    actions: [
      'Mang Giấy chứng nhận ĐKKD và CCCD ra ngân hàng mở tài khoản thanh toán chính danh cho Hộ kinh doanh.',
      'Cài đặt ứng dụng eTax Mobile trên điện thoại, đăng nhập bằng CCCD/VNeID để kiểm tra cơ quan thuế quản lý trực tiếp.',
      'Khai báo số tài khoản ngân hàng kinh doanh lên hệ thống thuế qua mẫu thay đổi thông tin (đáp ứng yêu cầu minh bạch dòng tiền).',
    ],
    documents: [
      { id: 'doc-bank-account', label: 'Thông báo số tài khoản ngân hàng mang tên Hộ kinh doanh' },
      { id: 'doc-etax-app', label: 'Tài khoản eTax Mobile đã liên kết VNeID Mức 2' },
    ],
    where: {
      label: 'Ứng dụng eTax Mobile',
      url: 'https://canhan.gdt.gov.vn',
      note: 'Kích hoạt tài khoản giao dịch thuế điện tử',
    },
    fee: '0 VNĐ',
    duration: 'Trong vòng 10 ngày làm việc sau khi nhận Giấy phép',
    warnings: [
      'Tách bạch hoàn toàn dòng tiền cá nhân và dòng tiền kinh doanh của hộ để tránh rủi ro giải trình sau này.',
      'Miễn hoàn toàn lệ phí môn bài từ 01/01/2026, KHÔNG phải nộp tờ khai môn bài hay nộp tiền môn bài như các năm trước.',
    ],
    legalRefs: [
      {
        label: 'Nghị định 68/2026/NĐ-CP',
        docId: 'ND-68-2026-ND-CP',
        note: 'Quy định quản lý dòng tiền và giao dịch điện tử của hộ kinh doanh',
      },
    ],
    aiPrompt:
      'Hộ kinh doanh mới thành lập có phải mở tài khoản ngân hàng riêng không và làm sao liên kết với eTax Mobile?',
    verifiedAt: '2026-10-14',
  },

  'hkd-invoices-records': {
    id: 'hkd-invoices-records',
    title: 'Chế độ Sổ sách Kế toán & Hóa đơn Điện tử',
    summary:
      'Thiết lập hệ thống sổ kế toán đơn giản (Thông tư 88/2021) và đăng ký hóa đơn điện tử khởi tạo từ máy tính tiền (Nghị định 123/2020).',
    actions: [
      'Nếu doanh thu dưới 1 tỷ đồng/năm: Được miễn thuế GTGT & TNCN, chỉ cần mở Sổ S1a theo dõi doanh thu đơn giản.',
      'Nếu doanh thu trên 1 tỷ đồng/năm: Áp dụng phương pháp kê khai hoặc khoán điều chỉnh, mở 7 mẫu sổ kế toán đơn giản theo Thông tư 88/2021/TT-BTC.',
      'Đăng ký sử dụng Hóa đơn điện tử có mã của cơ quan thuế khởi tạo từ máy tính tiền (theo Điều 90 Luật Quản lý thuế & Nghị định 123/2020/NĐ-CP) nếu thuộc diện bán hàng trực tiếp đến người tiêu dùng.',
      'Liên hệ nhà cung cấp giải pháp HĐĐT (VNPT, Viettel, MISA...) để kết nối phần mềm xuất hóa đơn.',
    ],
    documents: [
      { id: 'doc-sach-ke-toan', label: 'Sổ kế toán HKD theo Thông tư 88/2021/TT-BTC' },
      { id: 'doc-chu-ky-so', label: 'Chữ ký số (Token USB hoặc Chữ ký số từ xa HSM) để ký hóa đơn điện tử', optional: true },
    ],
    fee: 'Phí phần mềm HĐĐT (tùy gói nhà mạng, khoảng 300.000đ - 800.000đ/năm nếu dùng)',
    duration: '1 - 2 ngày làm việc để kích hoạt HĐĐT',
    warnings: [
      'Hộ kinh doanh có doanh thu trên 1 tỷ đồng/năm bắt buộc phải xuất hóa đơn điện tử cho người mua khi cung cấp hàng hóa, dịch vụ.',
      'Hành vi không xuất hóa đơn hoặc xuất hóa đơn sai thời điểm có thể bị xử phạt nặng từ 4.000.000đ đến 20.000.000đ.',
    ],
    legalRefs: [
      {
        label: 'Thông tư 88/2021/TT-BTC',
        docId: 'TT-88-2021-TT-BTC',
        note: 'Chế độ chứng từ, sổ sách kế toán giản đơn cho HKD',
      },
      {
        label: 'Nghị định 123/2020/NĐ-CP',
        docId: 'ND-123-2020-ND-CP',
        note: 'Quy định về hóa đơn, chứng từ điện tử khởi tạo từ máy tính tiền',
      },
      {
        label: 'Nghị định 141/2026/NĐ-CP',
        docId: 'ND-141-2026-ND-CP',
        note: 'Quy định ngưỡng doanh thu 1 tỷ đồng và nghĩa vụ hóa đơn',
      },
    ],
    aiPrompt:
      'Hộ kinh doanh khi nào bắt buộc phải dùng hóa đơn điện tử khởi tạo từ máy tính tiền và các mẫu sổ kế toán theo Thông tư 88 cần những gì?',
    verifiedAt: '2026-10-14',
  },

  // =========================================================================
  // PATH C: KINH DOANH SÀN TMĐT & MẠNG XÃ HỘI (PHÂN LOẠI 888)
  // =========================================================================
  'tmdt-check-model': {
    id: 'tmdt-check-model',
    title: 'Xác định Mô hình Kinh doanh TMĐT & Cơ chế Sàn Nộp Thay',
    summary:
      'Phân biệt rõ giữa bán hàng trực tiếp trên sàn thương mại điện tử, làm tiếp thị liên kết (Affiliate KOC), và bán hàng qua mạng xã hội (Facebook, Livestream).',
    actions: [
      'Xác định nền tảng kinh doanh: Shopee, TikTok Shop, Lazada, Tiki, Facebook Shop, hoặc nhận hoa hồng Affiliate.',
      'Nắm vững cơ chế thuế 2026: Sàn TMĐT có chức năng đặt hàng và thanh toán trực tuyến có trách nhiệm KHẤU TRỪ và NỘP THAY thuế GTGT (1%) và TNCN (0.5%) trên từng đơn hàng thành công.',
      'Nếu bán hàng qua Facebook, livestream thanh toán chuyển khoản riêng không qua cổng thanh toán sàn: Bạn phải tự kê khai và nộp thuế trực tiếp.',
    ],
    documents: [
      { id: 'doc-tmdt-contract', label: 'Tài khoản gian hàng người bán trên Shopee / TikTok Shop' },
      { id: 'doc-vneid-tmdt', label: 'Tài khoản Định danh điện tử VNeID Mức 2' },
    ],
    fee: '0 VNĐ',
    duration: 'Tra cứu nhanh',
    warnings: [
      'Cơ chế sàn khấu trừ nộp thay không đồng nghĩa với việc bạn không cần có mã số thuế. Bạn vẫn bắt buộc phải có mã số thuế định danh để sàn đối soát thông tin.',
    ],
    legalRefs: [
      {
        label: 'Nghị định 141/2026/NĐ-CP',
        docId: 'ND-141-2026-ND-CP',
        note: 'Trách nhiệm của sàn TMĐT khấu trừ và nộp thuế thay cho người bán',
      },
      {
        label: 'Nghị định 68/2026/NĐ-CP',
        docId: 'ND-68-2026-ND-CP',
        note: 'Chính sách quản lý thuế đối với hoạt động kinh doanh thương mại điện tử',
      },
    ],
    aiPrompt:
      'Cơ chế sàn TMĐT Shopee/TikTok Shop khấu trừ nộp thuế thay theo Nghị định 141/2026 áp dụng như thế nào và người bán cần làm gì?',
    verifiedAt: '2026-10-14',
  },

  'tmdt-access-portal': {
    id: 'tmdt-access-portal',
    title: 'Truy cập Cổng Thông tin TMĐT HKD của Tổng cục Thuế',
    summary:
      'Truy cập cổng chuyên biệt của ngành thuế dành cho cá nhân, hộ kinh doanh thương mại điện tử tại địa chỉ canhantmdt.gdt.gov.vn.',
    actions: [
      'Mở trình duyệt trên máy tính hoặc điện thoại, truy cập địa chỉ chính thống: canhantmdt.gdt.gov.vn.',
      'Giao diện Cổng hỗ trợ trực tiếp các tính năng: Đăng ký mã số thuế TMĐT, Tra cứu doanh thu sàn gửi lên cơ quan thuế, Kê khai bổ sung.',
      'Chuẩn bị điện thoại mở sẵn app VNeID để quét mã QR đăng nhập.',
    ],
    documents: [],
    where: {
      label: 'Cổng Thông tin TMĐT Dành cho Cá nhân',
      url: 'https://canhantmdt.gdt.gov.vn',
      note: 'Trang thông tin chính thống của Tổng cục Thuế Việt Nam',
    },
    fee: '0 VNĐ',
    duration: 'Truy cập ngay lập tức',
    warnings: [
      'Cẩn trọng với các đường link giả mạo cơ quan thuế có đuôi .com, .vn không phải tên miền .gdt.gov.vn.',
      'Tuyệt đối không cài đặt file .APK hoặc phần mềm lạ khi được hướng dẫn qua điện thoại.',
    ],
    legalRefs: [
      {
        label: 'Công văn 311/TCT-DNNCN',
        docId: '311-TCT-DNNCN-2025-goc',
        note: 'Quy trình vận hành Cổng TMĐT HKD dành cho cá nhân',
      },
    ],
    aiPrompt:
      'Cổng TMĐT canhantmdt.gdt.gov.vn của Tổng cục Thuế có những chức năng gì cho người bán hàng online?',
    verifiedAt: '2026-10-14',
  },

  'tmdt-vneid-login': {
    id: 'tmdt-vneid-login',
    title: 'Đăng nhập Xác thực bằng VNeID Mức 2',
    summary:
      'Sử dụng tài khoản Định danh điện tử Quốc gia để đăng nhập một chạm, hệ thống tự động đồng bộ dữ liệu dân cư và thuế.',
    actions: [
      'Trên trang chủ Cổng TMĐT, nhấn nút "Đăng nhập bằng VNeID".',
      'Mở ứng dụng VNeID trên điện thoại, chọn biểu tượng Quét mã QR và quét mã hiển thị trên màn hình máy tính (hoặc đăng nhập bằng số CCCD và mật khẩu VNeID trên điện thoại).',
      'Xác nhận mã bảo mật trên app VNeID.',
      'Hệ thống tự động hiển thị họ tên, số CCCD 12 số, ngày tháng năm sinh và địa chỉ thường trú.',
    ],
    documents: [
      { id: 'doc-vneid-login', label: 'Tài khoản VNeID Mức 2 đã được phê duyệt' },
    ],
    fee: '0 VNĐ',
    duration: '30 giây thao tác',
    warnings: [
      'Nếu tài khoản VNeID chỉ mới đạt Mức 1, hệ thống sẽ từ chối đăng nhập và yêu cầu nâng cấp lên Mức 2 tại Công an xã/phường.',
    ],
    legalRefs: [
      {
        label: 'Công văn 311/TCT-DNNCN',
        docId: '311-TCT-DNNCN-2025-goc',
        note: 'Yêu cầu đăng nhập xác thực qua VNeID Mức 2 trên Cổng TMĐT',
      },
    ],
    aiPrompt:
      'Tại sao cần dùng tài khoản VNeID Mức 2 để đăng nhập Cổng TMĐT và cách giải quyết khi không đăng nhập được?',
    verifiedAt: '2026-10-14',
  },

  'tmdt-verify-888-case': {
    id: 'tmdt-verify-888-case',
    title: 'Hệ thống Phân loại 3 Trường hợp & Cấp Đuôi Mã 888',
    summary:
      'Theo Công văn 311/TCT-DNNCN, hệ thống tự động đối soát số CCCD của bạn và phân thành 1 trong 3 trường hợp để cấp mã phân loại 888 chuyên cho TMĐT.',
    actions: [
      'Trường hợp 1 (Chưa có MST nào): Hệ thống tạo mã số thuế mới dạng CCCD 12 số + mã phân loại 888 để quản lý doanh thu TMĐT.',
      'Trường hợp 2 (Đã có MST cá nhân nhưng chưa có mã 888): Hệ thống cấp mã số thuế 13 số phân loại 888 (dạng: MST-888) chuyên cho hoạt động kinh doanh TMĐT.',
      'Trường hợp 3 (Đã có mã phân loại 888 từ trước): Hệ thống hiển thị trạng thái đang hoạt động, cho phép xem lại danh sách các gian hàng đã liên kết.',
      'Khai báo bổ sung: Tên gian hàng (Shop name), link gian hàng trên Shopee/TikTok/Lazada và số tài khoản nhận tiền thanh toán từ sàn.',
      'Nhấn "Xác nhận hoàn thành đăng ký mã 888".',
    ],
    documents: [
      { id: 'doc-link-shop', label: 'Link gian hàng hoặc mã ID định danh cửa hàng trên Shopee/TikTok' },
    ],
    fee: '0 VNĐ',
    duration: 'Cấp mã tức thì qua hệ thống điện tử',
    warnings: [
      'Mã phân loại 888 là bắt buộc trong năm 2026 để khớp nối dữ liệu doanh thu do sàn TMĐT tự động gửi về cơ quan thuế.',
      'Cập nhật mã 888 này vào phần cài đặt thông tin thuế trên tài khoản Shopee/TikTok Seller Center của bạn.',
    ],
    legalRefs: [
      {
        label: 'Công văn 311/TCT-DNNCN',
        docId: '311-TCT-DNNCN-2025-goc',
        note: 'Quy định chi tiết 3 trường hợp cấp mã phân loại 888 cho cá nhân kinh doanh TMĐT',
      },
      {
        label: 'Thông tư 86/2024/TT-BTC',
        docId: 'TT-86-2024-TT-BTC',
        note: 'Cấu trúc mã số thuế 13 số phân loại hoạt động thương mại điện tử',
      },
    ],
    aiPrompt:
      'Phân tích 3 trường hợp cấp mã số thuế phân loại 888 theo Công văn 311/TCT-DNNCN dành cho người bán hàng online.',
    verifiedAt: '2026-10-14',
  },

  'tmdt-declare-monthly-tax': {
    id: 'tmdt-declare-monthly-tax',
    title: 'Đối soát Doanh thu Sàn Khấu trừ & Kê khai Thuế Ngoài Sàn',
    summary:
      'Theo dõi số thuế 1.5% do sàn đã nộp thay và thực hiện kê khai bổ sung đối với doanh thu phát sinh ngoài sàn (Facebook, Zalo, chuyển khoản trực tiếp).',
    actions: [
      'Định kỳ hàng tháng: Đăng nhập Cổng TMĐT hoặc ứng dụng eTax Mobile để xem báo cáo doanh thu và số thuế sàn Shopee/TikTok đã khấu trừ nộp thay vào Ngân sách Nhà nước.',
      'Tải Giấy xác nhận nộp thuế điện tử do sàn phát hành làm chứng từ hợp lệ.',
      'Nếu bạn có doanh thu bán hàng ngoài sàn (không qua cổng thanh toán sàn): Tự kê khai trên Cổng TMĐT theo quý hoặc theo từng lần phát sinh.',
      'Kiểm tra ngưỡng 1 tỷ đồng/năm: Nếu tổng doanh thu cả năm dưới 1 tỷ đồng, bạn được miễn thuế; nếu trên 1 tỷ đồng, sàn tiếp tục nộp thay theo đúng tỷ lệ luật định.',
    ],
    documents: [
      { id: 'doc-tmdt-statement', label: 'Báo cáo doanh thu đối soát từ Seller Center của Shopee / TikTok Shop' },
      { id: 'doc-tmdt-tax-receipt', label: 'Chứng từ khấu trừ thuế điện tử do sàn cung cấp' },
    ],
    fee: '0 VNĐ phí kê khai',
    duration: 'Thực hiện định kỳ hàng tháng/quý',
    warnings: [
      'Dữ liệu doanh thu từ sàn TMĐT truyền thẳng về Tổng cục Thuế. Bất kỳ chênh lệch nào giữa số liệu kê khai ngoài sàn và dòng tiền ngân hàng đều có thể bị cơ quan thuế rà soát.',
    ],
    legalRefs: [
      {
        label: 'Nghị định 141/2026/NĐ-CP',
        docId: 'ND-141-2026-ND-CP',
        note: 'Quy định đối soát và cấp chứng từ khấu trừ thuế điện tử của sàn TMĐT',
      },
      {
        label: 'Nghị định 68/2026/NĐ-CP',
        docId: 'ND-68-2026-ND-CP',
        note: 'Biện pháp quản lý dòng tiền và thuế đối với người bán hàng qua mạng xã hội',
      },
    ],
    aiPrompt:
      'Làm thế nào để lấy chứng từ sàn TMĐT đã nộp thuế thay cho mình và kê khai thêm phần doanh thu bán qua Facebook/Zalo?',
    verifiedAt: '2026-10-14',
  },
};
