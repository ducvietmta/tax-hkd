# Nội dung cho Trợ lý đọc tài liệu

Thêm file Markdown với tên trùng `id` trong `src/data/legalDocuments.json`, ví dụ `ND-141-2026-ND-CP.md`.
Chỉ dùng nội dung được phép công khai trong thư viện. File được đóng gói cùng Worker, không phải kho tài liệu cá nhân.

Dùng tiêu đề Markdown (#, ##, ###) để chia mục; giữ đủ điều kiện, ngoại lệ, phụ lục và bảng. Không cần OCR hoặc nội dung mẫu. Không tự đặt số trang PDF nếu chưa đối chiếu.

Sau khi thêm/sửa: chạy `npm run docs:build`, kiểm thử rồi triển khai Worker. Giao diện tự nhận trạng thái sẵn sàng từ API. ID không tồn tại, file rỗng/chỉ có thông tin xuất nguồn hoặc dài hơn 2.000.000 ký tự sẽ bị từ chối khi build.

Đợt nhập 26/10/2026: 33 văn bản đã có nội dung, giữ nguyên byte file người dùng cung cấp. Manifest `import-2026-10-26.json` ghi ID, SHA-256, trạng thái và danh sách còn thiếu. File `pending/NQ-204-2025-QH15.md` hiện chỉ có tiêu đề/dòng nguồn, chưa được đưa vào chỉ mục đọc hiểu. Không dùng các file này để tự nâng cấp thẻ RAG thành verified hoặc xác nhận hiệu lực pháp lý.

File chuyển từ PDF chỉ có một tiêu đề Markdown vẫn được chia theo dòng Điều/Chương nhận diện được và giới hạn khoảng 24.000 ký tự mỗi mục ở ranh giới dòng. Nội dung nguồn không bị cắt bỏ hoặc thay đổi; tên mục là nhãn điều hướng, không phải kết luận pháp lý. Giới hạn ngữ cảnh 80.000 ký tự và việc yêu cầu chọn mục cho văn bản dài giữ nguyên.

Phiên bản tạo từ SHA-256 nội dung. Thay đổi phiên bản mở hội thoại riêng. Tài liệu tối đa 80.000 ký tự được đọc toàn văn; tài liệu dài hơn cần chọn một mục, kèm mục liền trước/sau. Nếu phạm vi vẫn quá dài, hệ thống yêu cầu chia mục, không cắt ngầm. Liên kết trang PDF và tìm kiếm đa tài liệu chưa bật trong phiên bản này.

Đợt nhập thứ hai 26/10/2026: bổ sung 26 file từ `van-ban-thue-md-dot2-day-du (1).zip`, khớp đủ 59/59 tài liệu trong danh mục. Manifest `import-2026-10-26-batch2.json` ghi SHA-256 ZIP và từng file. NQ-204 đã có nội dung trong đợt hai; bản chỉ có tiêu đề ở `pending/` được giữ làm lịch sử, không dùng làm nguồn hiện tại. TT89 khoảng 1,45 triệu ký tự được giữ đầy đủ, chia mục để đọc trong giới hạn ngữ cảnh hiện có. Các file là bản chuyển đổi OCR do người dùng cung cấp, có thể có lỗi nhận dạng; việc nhập không xác nhận tính chính xác hoặc hiệu lực pháp lý.
