# Danh bạ hỗ trợ sửa lỗi đăng ký

Chỉnh `shared/taxOfficeDirectory.json`. Mỗi cơ quan có `id` duy nhất, `name` đầy đủ kèm địa phương, `aliases` là các cách gọi tương đương và `email`.

Email chưa xác minh: giữ `null`. Khi có email chính thức đã đối chiếu, thay `null` bằng chuỗi email. Không dùng email ví dụ làm dữ liệu thật.

LLM chỉ nhận ID, tên và cách gọi của cơ quan. Server chọn bản ghi theo ID hợp lệ rồi lấy email từ danh bạ; không sử dụng email do LLM sinh. Thêm cơ quan mới bằng một bản ghi mới, không thay ID của cơ quan cũ.

Nguồn nhập ngày 23/10/2026: `danhba_rag_export.json` do người dùng cung cấp, gồm 10.395 dòng. Chạy lại bằng `node scripts/import_tax_office_directory.cjs <đường-dẫn-export.json>`. Báo cáo số lượng và SHA-256 nguồn nằm trong `outputs/tax-office-directory/import-report.json`.

Bản nhập hiện có 210 cơ quan, 402 liên hệ và giữ nguyên thêm 9.993 bản ghi nguồn trong `worker/src/data/taxDirectoryRecords.json` (9.964 dòng chưa ánh xạ cơ quan và 29 dòng email cần kiểm tra). Tổng cộng toàn bộ 10.395 dòng nguồn đều được lưu. Không tự sửa tên miền hoặc suy cơ quan từ tên email. Kiểm tra cấu trúc không chứng minh hộp thư còn hoạt động.

Tìm theo họ tên và tỉnh/đơn vị hỗ trợ có dấu/không dấu, giữ tối đa 24 ứng viên để LLM phân biệt. Chỉ trả email/điện thoại đạt kiểm tra cú pháp; giá trị lỗi vẫn được giữ nguyên trong dữ liệu nguồn ở server. Chưa có bộ phận/phạm vi phụ trách thì trả `responsibilityKnown: false`; UI không gán người đó phụ trách hồ sơ. Thiếu tỉnh, tên chưa đủ hoặc trùng người thì LLM hỏi thêm. Không dùng số định danh trong các dòng lệch cột làm tên cán bộ.

Mỗi cơ quan có thể có nhiều `contacts` gồm `email`, `phone` (hoặc null), `sourceFiles`. Không tự chọn một email khi có nhiều liên hệ; `email` chỉ dùng tương thích cũ khi duy nhất. UI hiển thị các liên hệ và file nguồn, đề nghị đối chiếu thông báo trả hồ sơ.

Worker lọc ứng viên theo địa phương/số cơ sở được người dùng nhắc, Muse chọn ID hoặc hỏi thêm. LLM chỉ nhận ID/tên/đơn vị/cách gọi; không nhận các email hay điện thoại. Server kiểm ID thuộc tập ứng viên trước khi trả liên hệ. Danh bạ nằm trong Worker; trình duyệt chỉ nhận cơ quan đã chọn. Sau khi cập nhật, build và triển khai Worker cùng frontend. Chưa khẳng định bao phủ mọi cơ quan toàn quốc.
