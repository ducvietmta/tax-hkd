export const REGISTRATION_WELCOME = 'Mình sẽ giúp bạn chuẩn bị hồ sơ đăng ký thuế trực tiếp cho cá nhân kinh doanh, từ giấy tờ đến cách điền tờ khai.\n\nBạn dự định làm công việc gì? Hãy mô tả bạn bán hàng hay cung cấp dịch vụ gì, ai trả tiền cho bạn và bạn nhận tiền bán hàng hay hoa hồng. Mình sẽ hỏi thêm khi cần để gợi ý đúng ngành nghề.\n\nChưa cần gửi số căn cước, số tài khoản hay địa chỉ nhà cụ thể.';

export const REGISTRATION_PROMPTS = [
  'Tôi làm tiếp thị liên kết TikTok, chỉ nhận hoa hồng và không trực tiếp bán hàng. Tôi muốn đăng ký thuế cá nhân kinh doanh.',
  'Tôi cung cấp dịch vụ sửa máy tính tại nhà khách hàng. Hãy hỏi thêm để hướng dẫn đăng ký thuế trực tiếp.',
  'Tôi đã có mã số thuế từ tiền lương, giờ có thêm hoạt động kinh doanh. Tôi cần đăng ký hoặc bổ sung thông tin gì?',
];

export const REGISTRATION_SOURCES = [
  { label: 'Thông tư 90/2026/TT-BTC · đăng ký thuế và mẫu 03-ĐKT', url: 'https://chinhphu.vn/?classid=1&docid=218839&pageid=27160&typegroupid=6' },
  { label: 'Quyết định 36/2025/QĐ-TTg · hệ thống ngành kinh tế', url: 'https://vanban.chinhphu.vn/?classid=1&docid=215475&pageid=27160' },
];

// Source data, not a classifier. Read directly from QĐ36 Appendix I pp.30,37.
// Selection and any clarifying question belong to the AI, based on actual activity.
export const INDUSTRY_REFERENCE = [
  ['7310', '73100', 'Quảng cáo', 30],
  ['7320', '73200', 'Nghiên cứu thị trường và thăm dò dư luận', 30],
  ['7330', '73300', 'Hoạt động quan hệ công chúng', 30],
  ['7410', '74100', 'Hoạt động thiết kế chuyên dụng', 30],
  ['7420', '74200', 'Hoạt động nhiếp ảnh', 30],
  ['7430', '74300', 'Hoạt động phiên dịch', 30],
  ['9510', '95100', 'Sửa chữa, bảo dưỡng máy tính, thiết bị thông tin và truyền thông', 37],
  ['9610', '96100', 'Giặt là, làm sạch các sản phẩm dệt và lông thú', 37],
  ['9621', '96210', 'Dịch vụ làm tóc', 37],
] as const;

// Labels and field numbers follow the original 03-ĐKT in the official TT90 archive.
// These are explanations, never inputs for collecting a person's identity here.
export const TAX_FORM_FIELDS = [
  { field: 'Đối tượng đăng ký', help: 'Chọn Cá nhân kinh doanh nếu bạn đang kê khai đúng đối tượng này.', example: 'Tích ô “Cá nhân kinh doanh”.' },
  { field: 'I.1–3 · Họ tên, ngày sinh, số định danh', help: 'Công dân Việt Nam có dữ liệu dân cư: điền họ tên IN HOA, ngày sinh và số định danh khớp dữ liệu dân cư. Chỉ nhập thông tin thật trên hồ sơ chính thức.', example: 'NGUYỄN VĂN A · ngày sinh của bạn · số định danh 12 số của bạn.' },
  { field: 'I.4–7 · Liên hệ, định danh trước đây, tài khoản', help: 'Điền số điện thoại/email đang sử dụng (nếu có); số định danh trước đây chỉ khi được xác lập lại. Kê khai tài khoản, tên chủ tài khoản và ngân hàng theo thực tế.', example: 'Email bạn theo dõi thường xuyên; không tự điền một số định danh cũ nếu không có.' },
  { field: 'II · Dịch vụ làm thủ tục thuế (nếu có)', help: 'Chỉ điền thông tin tổ chức/cá nhân cung cấp dịch vụ làm thủ tục về thuế theo hợp đồng. Tự nộp thì không tự đặt thông tin đại lý thuế.', example: 'Bạn tự thực hiện: không kê khai một đơn vị dịch vụ giả định.' },
  { field: 'III.1–2 · Tên cửa hàng/thương hiệu và địa chỉ', help: 'Ghi tên thực tế. Có địa điểm cố định thì ghi địa chỉ trụ sở; kinh doanh thường xuyên không có địa điểm cố định thì ghi nơi cư trú. Cho thuê bất động sản ghi nơi có bất động sản theo hướng dẫn mẫu.', example: 'Sửa máy tính An · số nhà/đường, xã/phường/đặc khu, tỉnh/thành phố theo địa chỉ thực tế.' },
  { field: 'III.3 · Nơi nhận thông báo thuế', help: 'Chỉ kê khai khi khác địa chỉ trụ sở. Ghi đầy đủ địa chỉ liên hệ và thông tin liên lạc nếu có.', example: 'Trùng địa chỉ trên: không lập thêm một địa chỉ khác chỉ để điền đủ ô.' },
  { field: 'III.4 · Ngành nghề kinh doanh', help: 'Ghi các hoạt động thực tế. Mẫu giấy yêu cầu ngành nghề; nếu màn hình điện tử yêu cầu mã, đối chiếu đúng hệ thống mã trên màn hình. AI sẽ giải thích gợi ý sau khi hiểu việc bạn làm.', example: '“Dịch vụ sửa chữa máy tính tại nhà khách hàng” rõ hơn “kinh doanh online”.' },
  { field: 'III.5–6 · Ngày hoạt động, tài khoản kinh doanh', help: 'Ghi ngày bắt đầu hoạt động thực tế; kê khai tài khoản, tên chủ tài khoản, ngân hàng tương ứng. Không lấy ngày đọc hướng dẫn thay ngày bắt đầu.', example: 'Bắt đầu ngày 05/10/2026 thì ghi 05/10/2026, không tự đổi thành ngày nộp.' },
  { field: 'Cam kết và ký/xác nhận điện tử', help: 'Kiểm tra các mục, ký và ghi rõ họ tên hoặc xác nhận điện tử theo cách nộp. Đây là hồ sơ đăng ký thuế, không phải giấy phép kinh doanh.', example: 'Lưu bản hồ sơ đã nộp và mã tiếp nhận để tra cứu kết quả.' },
];

/** Server-owned instructions and source evidence, separate from the user's text.
 * No client-side keyword routing or automatic legal/industry classification.
 */
export function taxRegistrationInstructions(): string {
  return `CHẾ ĐỘ HƯỚNG DẪN: chuẩn bị ĐĂNG KÝ THUẾ TRỰC TIẾP cho cá nhân kinh doanh. Ngày hiện tại: ${new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })}.
Hãy hướng dẫn bằng hội thoại dựa trên lịch sử: hiểu hoạt động thực tế trước; mỗi lượt hỏi tối đa 1–2 điều còn thiếu (ngành nghề, địa bàn cấp tỉnh/xã, có địa điểm cố định, đã đăng ký thuế kinh doanh hay mới có MST tiền lương, cách nộp). Không hỏi lại dữ kiện đã có. Không yêu cầu số căn cước, OTP, số tài khoản hoặc địa chỉ nhà chi tiết trong chat.
Khi đủ dữ kiện, tổng hợp: (1) trường hợp áp dụng; (2) giấy tờ bắt buộc và thông tin chuẩn bị phân biệt rõ; (3) nơi/cách nộp phù hợp; (4) hướng dẫn từng nhóm mục của 03-ĐKT kèm ví dụ; (5) thời hạn, cách theo dõi kết quả; (6) việc sau đăng ký. Nếu chưa đủ, vẫn hướng dẫn phần chắc chắn và hỏi phần thiếu. Không tự chuyển sang thành lập hộ hay tính thuế. Không suy miễn đăng ký hộ chỉ vì online/doanh thu thấp; luồng thuế trực tiếp không thay nghĩa vụ đăng ký hộ nếu có.
Khi người dùng yêu cầu tổng hợp hướng dẫn, ưu tiên đủ 6 mục đánh số trên (khoảng 450–700 từ nếu cần), thay giới hạn trả lời ngắn thông thường. Không bỏ chỉ tiêu của mẫu để rút gọn. Phải giữ nguyên giả định của người hỏi, không biến giả định đủ điều kiện thành xác nhận pháp lý. Làm tại nhà khách hàng chưa chứng minh không có trụ sở cố định; nếu chưa nói rõ thì hỏi hoặc hướng dẫn có điều kiện.
Với công dân Việt Nam có dữ liệu dân cư, phần I.1 họ tên IN HOA, I.2 ngày sinh, I.3 số định danh, I.4 điện thoại, I.5 email nếu có, I.6 định danh cũ chỉ khi được xác lập lại, I.7 tài khoản/tên chủ/ngân hàng. Địa chỉ hoạt động ở III.2, nơi nhận thông báo khác ở III.3, không tự thêm mục địa chỉ vào phần I của nhánh này. Phần II là dịch vụ thủ tục thuế theo hợp đồng nếu có, không đánh đồng mọi người được ủy quyền với đại lý thuế. Phải giải thích đủ III.1–6 và ký/xác nhận; ví dụ dùng dữ liệu giả hoặc dữ kiện hoạt động đã có, không xin định danh thật trong chat.
Đã có MST tiền lương: nói đăng ký/bổ sung thông tin hoạt động kinh doanh và nhận kết quả tương ứng, không nói cấp MST kinh doanh mới hoặc cấp MST thứ hai. Không tự khẳng định VNeID mức 2 là phương thức duy nhất/bắt buộc để nộp online nếu nguồn chưa xác nhận. Nêu đúng hạn nộp 10 ngày làm việc theo trường hợp áp dụng; không đoán ngày hết hạn bằng “quanh giữa tháng”. Sau đăng ký, hướng dẫn kiểm tra kết quả, tài khoản giao dịch và nghĩa vụ kê khai/hóa đơn theo tình huống, không tự ấn định khai hàng năm hay cứ khách yêu cầu là được xuất hóa đơn.
Nguồn đối chiếu: Điều 21 TT90/2026/TT-BTC từ 01/07/2026: 03-ĐKT hoặc hồ sơ khai thuế tích hợp đăng ký thuế; nơi nộp tại Thuế cơ sở nơi đặt trụ sở, không có địa điểm cố định thì nơi cư trú, riêng cho thuê BĐS thì nơi có BĐS (nhiều BĐS được chọn một nơi có BĐS). Phần I mẫu là định danh/liên hệ/tài khoản; II dịch vụ thủ tục thuế nếu có; III.1 tên cửa hàng, III.2 trụ sở, III.3 nơi nhận thông báo nếu khác, III.4 ngành nghề thực tế, III.5 ngày bắt đầu, III.6 tài khoản. Không mặc định đính kèm bản sao căn cước cho người đã có dữ liệu dân cư. Có MST tiền lương chưa đồng nghĩa đã đăng ký hoạt động kinh doanh; không xin MST cá nhân thứ hai.
Mã ngành: đối chiếu QĐ36/2025/QĐ-TTg có hiệu lực 15/11/2025 và bằng chứng truy xuất được; nêu mã, tên, cấp mã, lý do phù hợp và nguồn. Không dùng mã quản lý thuế 888 làm mã ngành kinh tế, không suy mã từ riêng tên nền tảng. Nếu thiếu mô tả thì hỏi lại; chưa có bằng chứng mã thì nói chưa xác định được mã, vẫn hướng dẫn ghi hoạt động thực tế, không bịa mã. Không bịa địa chỉ cơ quan, nút bấm, phí hay kết quả phê duyệt.
Danh mục đối chiếu đã đọc từ Phụ lục I QĐ36 (mã cấp4/cấp5, tên, trang; không phải ngành người dùng đã chọn): ${INDUSTRY_REFERENCE.map(([c4,c5,name,page])=>`${c4}/${c5} ${name} tr.${page}`).join('; ')}. Nguồn: https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/9/36-1.pdf . Đây là một phần danh mục; ngành khác phải tra nguồn, không ép vào danh sách này. Affiliate chưa đủ để mặc định là quảng cáo.`;
}
