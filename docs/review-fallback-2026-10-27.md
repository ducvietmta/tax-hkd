# Khắc phục thiếu thời gian kiểm chứng dự phòng

Lượt `10d954d0-8bc4-4167-b5ad-f8bd005fcc44`, ghi nhận 27/10/2026 lúc
05:51:29 giờ Việt Nam, có 10 claim, 2 request, một lượt Muse review với
`issues=null`, không có repair hoặc reviewer dự phòng. Kết quả là
`REVIEW_PROVIDER_UNAVAILABLE`; chat log xác nhận `credits_used=0`.
Trace cũ không lưu failureCode/timings nên chưa xác định được lỗi gốc của
provider là timeout, HTTP hay định dạng JSON. Không coi đây là bằng chứng RAG thiếu.

Mã cũ cho reviewer đầu toàn bộ cửa sổ 25 giây; chỉ chạy dự phòng nếu còn hơn
1 giây. Vì vậy reviewer dùng hết timeout sẽ làm dự phòng không thể chạy.

Bản v2.17.4 dành 40 giây trong tổng ngân sách 120 giây cho review. Lượt đầu
được tối đa 25 giây và để lại 15 giây cho dự phòng khi có hai provider. Nếu thời
gian còn ít hơn, phân chia theo phần còn lại. Sửa đáp án chỉ được bắt đầu khi
còn đủ 20 giây sửa và 40 giây review. Không tăng tổng deadline và không tắt
strict evidence gate. Lưu failureCode theo reviewer và timings ở grounding trace.

Kiểm tra giả lập đồng hồ: primary hết timeout vẫn chạy Muse dự phòng độc lập;
chỉ kết quả kiểm chứng hợp lệ mới được trả. Nếu cả hai không khả dụng vẫn
chặn và không trừ lượt. Đây là xác minh plumbing bằng fixture, không chứng minh
đáp án pháp lý của câu hỏi người dùng đã thành công trên provider live.

Fixture kiểm tra kiến trúc cũng cập nhật admission D1 giả lập để tương ứng với
rate limiter hiện tại; vẫn kiểm tra 429 khi bị từ chối và 401 khi giả mạo header.
