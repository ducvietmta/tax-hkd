# Đợt kiểm duyệt thẻ HKD/CNKD ngày 26/10/2026

Đã xử lý danh sách 30 văn bản có trạng thái MISSING trong kiểm kê kỹ thuật.
Đây là kiểm duyệt bằng AI theo các đoạn nguồn đã chọn, không phải kiểm duyệt
của con người hoặc chứng nhận tính đầy đủ/hiệu lực toàn bộ văn bản.

Kết quả: 33 thẻ 16.197–16.229 từ 27 văn bản, gồm 24 thẻ có phạm vi từ năm
2026 và 9 thẻ lịch sử. Ba văn bản không tạo thẻ runtime: NĐ320/2025 và TT20/2026
thuộc TNDN; TT121/2026 chỉ sửa Phụ lục I biểu mẫu đăng ký doanh nghiệp trong
phần đã đọc, không sửa bộ mẫu hộ kinh doanh. Không tạo quy tắc TNDN cho HKD.

Mỗi thẻ giữ trích đoạn, locator, giới hạn, khoảng năm, SHA-256 nguồn và nội dung.
Trạng thái VERIFIED_CONDITIONAL thể hiện kiểm duyệt có điều kiện trong phạm vi
đó. Chưa bao phủ mọi điều/khoản của các văn bản. Manifest và nội dung kiểm duyệt
ở `rag_data/legal-card-review-2026-10-26.json`; nhập lặp lại bằng
`node scripts/import_legal_cards_20261026.cjs`, sau đó build RAG và compile case index.

NĐ310 trong thư viện là bản thuyết trình/tóm tắt. Thẻ mới dùng bản PDF ký số
chính thức tải từ Chính phủ, đã đọc trực quan trang 1–2, chỉ trích định nghĩa
bất khả kháng. Không lấy các khung phạt từ bản tóm tắt làm quy tắc đã duyệt.

Đã đọc cả hai trang QĐ2551/QĐ-BTC (15/09/2026). Đính chính khoản 5 Điều 99 TT89
về các mẫu, gồm 01/XSBHĐCMG-CNKD và 01/BK-XSBHĐCMG. Thẻ 16.229 giữ phần
nội dung thay thế; hai thẻ TT89 Điều 11 và Điều 68 không nằm trong phạm vi sửa.
Không suy toàn bộ mẫu của TT50/TT18 vẫn là mẫu hiện hành.

Không nhập bảng ngày gia hạn ở Điều 2 NĐ245 vì bản OCR có nhãn quý dễ nhầm;
thẻ chỉ xử lý Điều 1 và Điều 3, không tính lịch nộp thuế. Các văn bản cũ bị
thay thế được giới hạn năm; không tự đổi chúng thành quy tắc năm 2026.

Đã đối chiếu PDF NĐ296/2026 ở trang 10–12: Điều 15 sửa khoản 5 Điều 93,
khoản 5 Điều 19 sửa khoản 2 Điều 87 NĐ168. Hai thẻ NĐ168 vì vậy chỉ nhập
khoản 1 Điều 87 và khoản 1–4 Điều 93; không chép các khoản cũ đã sửa làm
quy tắc hiện hành. Đã bổ sung ngày bắt đầu hiệu lực và kiểm tra ngày liền trước
cho các thẻ có mốc xác định, ngoài giới hạn năm.

Sau đợt nhập, ledger có 34 PARTIAL, 4 MISSING, 0 FULL trong 38 nghị định/thông
tư. Bốn mục MISSING gồm ba văn bản ngoài phạm vi và NĐ310: mẫu số kỹ thuật của
NĐ310 đang được tách từ bản tóm tắt có Điều 10, không tương ứng khoản 1 Điều 1
trong PDF chính thức dùng cho thẻ. Không sửa locator hoặc gắn FULL để làm đẹp
chỉ số. Muốn đo đầy đủ phải lập inventory chính thức và kiểm duyệt các phần còn lại.

Kiểm tra: nguyên văn/SHA-256, giới hạn giai đoạn lịch sử, loại trừ doanh nghiệp,
4 truy vấn tìm thẻ mới, 191 câu offline, 106 kiểm tra nguồn và 43 kiểm tra ranh
giới case recognition. Chưa đo độ chính xác đáp án pháp lý live của đợt thẻ mới.
