# Kiểm kê độ phủ văn bản pháp luật

Kho RAG không dùng số lượng chunk làm tỷ lệ đầy đủ. Toàn bộ Markdown trong `document_library` (trừ `README.md`) được băm SHA-256 và tách cấu trúc Điều–Khoản–Điểm vào `rag_data/legal-markdown-provision-inventory.json`. Mỗi Nghị định và Thông tư trong `src/data/legalDocuments.json` đồng thời phải có một mục tại `rag_data/legal-coverage-targets.json`.

Một văn bản chỉ có trạng thái `FULL` khi đồng thời có:

- danh mục `expected_provisions` được đối chiếu từ văn bản chính thức;
- `source_sha256` của đúng bản nguồn đã dùng để lập danh mục;
- mọi điều, khoản, điểm trong danh mục đều xuất hiện trong locator của các chunk đã review.

Danh mục tách tự động từ Markdown cung cấp mẫu số kỹ thuật để phát hiện `PARTIAL` hoặc `MISSING`, nhưng không tự cấp trạng thái `FULL`. Nếu Markdown không có dấu mốc Điều thì trạng thái là `UNMEASURED`. Phần mềm chỉ được tuyên bố bao phủ toàn văn sau bước kiểm tra chính thức bên dưới.

Quy trình cập nhật:

1. Chạy `npm run kb:coverage` để đọc lại toàn bộ Markdown và tái sinh báo cáo kỹ thuật.
2. Với văn bản cần xác nhận `FULL`, đối chiếu danh mục tự động với bản nguồn chính thức.
3. Chép danh mục đã kiểm tra vào `expected_provisions`, dùng dạng `article:5`, `article:5/clause:2`, `article:5/clause:2/point:a`, rồi điền SHA-256 nguồn.
4. Đặt `inventory_status` thành `VERIFIED_OFFICIAL_INVENTORY`.
5. Bổ sung hoặc sửa `source_links[].locator` trong `worker/src/kb/chunkMeta.json`.
6. Chạy `npm run kb:build`, rồi `npm run kb:check` và `npm run kb:coverage:check`.

Xem báo cáo runtime tại `GET /api/kb/coverage`. Deploy bị chặn khi danh mục 38 văn bản bị thiếu, thừa hoặc file ledger không khớp nguồn.
