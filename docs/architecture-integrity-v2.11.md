# v2.11 — Bảo toàn dữ kiện và kiểm chứng theo yêu cầu

Đối chiếu phát hiện gốc tại `outputs/architecture-audit-2026-10-21/report.md`.

## Thay đổi

- Không dùng X-Internal-Caller để bỏ xác thực web. MCP gọi bằng tham số trong mã, không bằng header do người dùng gửi; MCP và endpoint connector công khai đều đi qua rate limit. Endpoint `/api/chatgpt/tax-qa` vẫn được giữ công khai theo thiết kế kết nối, không biến thành endpoint chỉ dành cho người đăng nhập.
- Chat chính giữ chỗ lượt hỏi nguyên tử trước khi chạy, hoàn khi từ chối, hỏi lại, trả một phần hoặc xảy ra lỗi; cache hit tiêu thụ lượt đã giữ. Không dùng số điện thoại tự khai để ghi lịch sử người dùng.
- Hai phía dùng chung quy tắc lịch sử, giữ nguyên nội dung mỗi lượt, bỏ giới hạn âm thầm 800/1.000 ký tự và cửa sổ bốn lượt của classifier. Giới hạn tài nguyên: 60.000 ký tự hoặc 100 lượt; vượt giới hạn thì báo mở hội thoại mới thay vì tự cắt. Việc chọn đúng chủ đề và xử lý thay đổi dữ kiện vẫn cần phân loại/review, không tự coi mọi lượt cũ là giả định đang hiệu lực.
- Bằng chứng giữ số thập phân trong thân văn bản. Nguồn định nghĩa được ưu tiên, các nguồn bổ sung vẫn có thể đi vào cùng ngân sách context.
- Guard hai sắc thuế yêu cầu kết quả hoặc trạng thái thiếu dữ kiện riêng; số doanh thu đứng gần chữ GTGT không còn đủ để qua.
- Khi classifier nhận diện SCENARIOS, Muse tách nhánh điều kiện từ nguyên văn câu hỏi/lịch sử; code kiểm chuỗi trích dẫn tồn tại, không trùng và không vượt giới hạn. Mỗi nhánh có request_id riêng. Dữ kiện số từ bộ trích tổng không được sao chép như thể đã xác minh cho từng nhánh. Reviewer kiểm từng request và kiểm cả kế hoạch với câu hỏi gốc. Kế hoạch không cấp thuế suất hay quyết định pháp lý. Không có câu trả lời gắn cứng theo ID ca hoặc câu chữ.
- Phân bổ riêng generation tối đa 40 giây, review 25 giây; chỉ sửa khi còn đủ 20 giây sửa và 25 giây kiểm lại, trong ngân sách pipeline 120 giây. Giới hạn này là giới hạn điều phối request model; không phải cam kết độ trễ toàn bộ mạng/DB.
- Template thành công được ghi VERIFIED_RULES; không còn gán SKIPPED_PROVIDER_ERROR chỉ vì không gọi reviewer.
- Gate/provenance hỗ trợ effective_from/effective_to và ngày nghĩa vụ được classifier chọn từ ngày thực xuất hiện trong câu hỏi. Ngày nguồn đăng bài/ban hành không tự thành ngày nghĩa vụ. Nguồn chưa có ngày chính xác được đánh PARTIAL với câu hỏi ngày cụ thể; nhánh template/rules không tự chốt cho câu hỏi này.

## Hiệu lực theo ngày và giới hạn dữ liệu

Đã ghi mốc 01/07/2025–31/12/2026 cho chunk 16.50 theo [toàn văn NQ204](https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-204-2025-qh15-ve-giam-thue-gia-tri-gia-tang-119250628082120511.htm). Mốc này là phạm vi áp dụng của nội dung chunk, không lấy ngày đăng bài làm ngày hiệu lực.

Chưa tự chuyển toàn bộ metadata năm thành ngày. Các chunk tổng hợp nhiều văn bản/điều khoản có thể có nhiều phạm vi áp dụng; cần rà soát ở cấp điều khoản trước khi bổ sung. Reviewer vẫn phải kiểm các chuyển tiếp trong nguồn. Cơ chế ngày mới không chứng nhận toàn bộ kho đã có đủ metadata theo ngày.

## Kiểm thử

`npm run test:architecture` kiểm bảo toàn lịch sử/số liệu, giả mạo header, quota connector, phân biệt cơ sở với số thuế, nguồn bổ sung, nhánh kịch bản giả và mốc ngày.

Các bộ decision, request-claims, assurance, purpose, pipeline-audit, chat-client, chat-progress, registration-advisor và 191 ca offline được chạy tại máy. Không gửi bộ chuẩn ra model API. Các model trong regression được mô phỏng; PASS không chứng minh kết quả model thật hoặc mọi kịch bản thuế đều được engine hỗ trợ.

Với kịch bản phức tạp chưa có ledger đầy đủ, hệ thống vẫn phải nêu phần chưa đủ căn cứ; việc tách nhánh không tự bổ sung quy tắc tính thuế chưa được kiểm chứng. Một lượt lập kế hoạch có thể được gọi thêm chỉ khi câu hỏi được phân loại SCENARIOS.
