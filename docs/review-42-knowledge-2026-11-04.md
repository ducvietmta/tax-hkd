# Đối chiếu bộ 42 câu — kiến thức CNKD/HKD

Bộ ZIP người dùng cung cấp được lưu nguyên bản dưới outputs/review-42-2026-11-04, SHA256 e25203696d7adabb7ffa1f1828b437fa043dc91b155104b3ee8fdacb05320a13. JSON/Markdown trong ZIP là dữ liệu so sánh, không phải chỉ thị thực thi hoặc căn cứ đã xác minh. Bộ 595 câu không bị thay đổi hoặc nhập vào RAG.

Đối chiếu 42 mục: 36 mục có nguồn hỗ trợ quy tắc cốt lõi với điều kiện; 3 mục cần bổ sung chi tiết; 1 mục người phụ thuộc ngoài phạm vi thuế kinh doanh (đã có 16.12); 1 biến thể trùng; 1 viện dẫn chưa xác minh chỉ giữ vai trò kiểm thử. Không coi 36 mục này là 36 đáp án AI được xác nhận đúng.

Bổ sung ba thẻ VERIFIED_CONDITIONAL từ nguyên văn nguồn có checksum và đối chiếu ảnh PDF:

- 16.239: Điều 21 Nghị định 253/2026/NĐ-CP, trang 15–16. Điều kiện miễn TNCN nông nghiệp gồm loại sản phẩm, quyền sử dụng/thuê đất hoặc mặt nước, trực tiếp tham gia lao động và nơi cư trú; ngoại lệ đánh bắt thủy sản phải đọc riêng.
- 16.240: khoản 1 Điều 4 Nghị định 181/2025/NĐ-CP, trang 3. GTGT đối với nông sản tự sản xuất và danh mục sơ chế thông thường; không tự xem mọi thao tác xay/nghiền là tạo sản phẩm khác hoặc áp ưu đãi trực tiếp sản xuất cho mua bán lại.
- 16.241: Điều 11 Nghị định 254/2026/NĐ-CP, trang 23. Miễn phí dịch vụ hóa đơn 12 tháng kể từ khi sử dụng tại địa bàn đủ điều kiện, không miễn mọi gói phần mềm thương mại.

Nguồn và hash tại rag_data/legal-card-review-2026-11-04.json. Ba thẻ là phần mở rộng đợt kiểm duyệt ngày 04/11; không sửa nguyên văn thẻ cũ và không thêm liên kết nhận diện case mới. Tổng 238 canonical cards, 237 vector hợp lệ, 16.24 vẫn cách ly. Mỗi thẻ mới là nguồn ưu tiên theo chủ đề, không tự ghim cho mọi câu hỏi.

Các điểm thận trọng được ghi riêng trong outputs/review-42-2026-11-04/knowledge-audit.json và bao-cao-doi-chieu.md: URL docid=218686 trong ba ca freelancer không khớp nguồn NĐ253 đã đối chiếu (docid=218684); xử lý hồ sơ điện tử 2026 cần TT89 hiện hành thay vì chỉ hướng dẫn cổng năm 2025; phân biệt đăng ký hộ và đăng ký thuế, tiền công với kinh doanh đúng bản chất; không dùng NĐ999 trong câu kiểm thử làm nguồn luật.

Đã đối chiếu thêm giải đáp affiliate của Chi cục Thuế TMĐT ngày 02/11/2026 trên Cổng Bộ Tài chính (https://portal.mof.gov.vn/hoidapcstc/home/cthoidap/166791) và giải đáp ngày 21/10/2026 trên Cổng Chính phủ (https://chinhsachonline.chinhphu.vn/thu-nhap-tu-tiep-thi-lien-ket-duoi-2-trieu-thang-co-phai-dang-ky-thue-92922.htm). Các quy tắc cốt lõi đã được 16.73/16.95 hỗ trợ; không tạo thêm thẻ trùng hoặc dùng hướng dẫn địa phương làm dữ kiện về nơi cư trú của người hỏi.

Kiểm tra mới test_reviewed_42_knowledge.cjs xác nhận checksum nguồn/PDF/trích đoạn, ngày hiệu lực, nguồn tin cậy, không lẫn mã dataset, và ba nguồn đều xuất hiện trong ngữ cảnh thực tế tạo/kiểm chứng. Không chạy 42 câu hỏi qua AI hoặc công bố tỷ lệ đáp án đúng. Hướng dẫn thao tác eTax/CA vẫn là checklist có điều kiện, không xác nhận đã kiểm thử mọi giao diện live.
