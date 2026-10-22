# Danh bạ email cơ quan thuế

Chỉnh `shared/taxOfficeDirectory.json`. Mỗi cơ quan có `id` duy nhất, `name` đầy đủ kèm địa phương, `aliases` là các cách gọi tương đương và `email`.

Email chưa xác minh: giữ `null`. Khi có email chính thức đã đối chiếu, thay `null` bằng chuỗi email. Không dùng email ví dụ làm dữ liệu thật.

LLM chỉ nhận ID, tên và cách gọi của cơ quan. Server chọn bản ghi theo ID hợp lệ rồi lấy email từ danh bạ; không sử dụng email do LLM sinh. Thêm cơ quan mới bằng một bản ghi mới, không thay ID của cơ quan cũ.

Sau khi cập nhật danh bạ, build và triển khai Worker cùng frontend. Hiện danh bạ chỉ có Thuế cơ sở 25 Thành phố Hà Nội từ thông báo người dùng cung cấp, chưa có email. Chưa bao phủ toàn quốc.
