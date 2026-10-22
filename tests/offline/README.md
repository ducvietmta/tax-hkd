# Bộ 191 ca TAX-HKD chạy offline

Đã xóa hẳn 9 ca theo yêu cầu. Bộ hiện tại có **191 ca**, giữ ID gốc của các ca còn lại; không còn ca tắt.

```sh
npm run test:offline
# hoặc
npm run test:offline:191 -- --ids=G005,G195,G196
```

Lệnh cũ `test:offline:200` là alias tương thích, cũng chỉ chạy 191 ca hiện tại.

- Dữ liệu: `tests/fixtures/tax-hkd-191.json`.
- Hợp đồng kiểm thử: `tests/offline/tax-hkd-191.spec.cjs`.
- Runner: `scripts/test_offline_191.cjs`.
- Báo cáo: `outputs/tests/offline-200/report.html` và `report.json`. Giữ đường dẫn báo cáo cũ để tab đã mở đọc được bản mới; tiêu đề và số lượng bên trong là 191.
- Bộ JSON có đầy đủ hợp đồng offline: `outputs/tests/offline-200/test-cases.json`.

Runner chặn truy cập mạng, không cần khóa API và không gọi JEV/Quyet/Muse/Cloudflare. Ngày nghiệp vụ cố định là 16/10/2026. Lịch sử G189–G194 được giữ nguyên. 70 đáp án mới vẫn là đề xuất, không tự gán thành đáp án đã được duyệt.

**115 ca chỉ kiểm tra tìm tài liệu RAG với nhãn giả lập; 76 ca có thêm kiểm tra khác:** đọc kỳ thời gian, trích số, tính thuế, hiển thị số tiền, sửa viện dẫn, kiểm tra thiếu ý và hợp đồng reviewer. Dữ kiện đưa thẳng vào bộ tính được ghi rõ trong báo cáo. Không so đáp án tham chiếu với chính nó để tính PASS.

`PASS_OFFLINE` chỉ xác nhận các kiểm tra đã liệt kê ở từng ca, không chứng minh mô hình thật đã trả lời đúng. Kiểm thử reviewer dùng tín hiệu giả lập, không thay thế chấm ngữ nghĩa. Bộ này không chứng nhận lại toàn bộ pháp luật hoặc đáp án tham chiếu.

Mã thoát `0` khi toàn bộ kiểm tra được chọn đạt; `1` nếu có lỗi hoặc có lần thử truy cập mạng. `--ids` tạo báo cáo riêng để không ghi đè báo cáo đầy đủ.
