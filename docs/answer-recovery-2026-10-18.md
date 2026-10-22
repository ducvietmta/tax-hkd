# Khắc phục câu tổng hợp bị chặn

## Tái hiện và nguyên nhân

Câu mới kết hợp sửa máy, bán linh kiện, affiliate, loại ghi trùng, chi phí và hai kịch bản doanh thu. Lần gọi production trước sửa trả `Answer review blocked`, `evidence:CONTRADICTED`, thiếu bao phủ và sai viện dẫn. `repairTrace` xác nhận cả bản nháp và bản sửa đều tuyên bố phương pháp thu nhập có lợi hơn mà chưa tính phương pháp doanh thu, đồng thời kết luận chuyển ngay khi vượt 3 tỷ. Bằng chứng truy xuất đã có ngoại lệ chuyển từ năm tiếp theo; vấn đề không phải thiếu mọi tài liệu.

Hướng dẫn sinh cũ mâu thuẫn với nguồn: ép gán ngành bán hàng khi chưa rõ tỷ lệ, ép tính ngay 17% khi vượt 3 tỷ, ép chốt số tiền, ép thêm GTGT dù người dùng chỉ hỏi TNCN, giới hạn độ dài cho cả câu nhiều ý. Lượt sửa chỉ nhận mã lỗi chung và tái sử dụng các chỉ dẫn mâu thuẫn đó. Bộ pending khớp 2/3 nhóm còn kích hoạt chủ đề cho thuê dù không có cho thuê.

## Thay đổi dùng chung

- `answerPolicy.ts`: một quy trình theo bằng chứng, tách kịch bản, phương pháp đang áp dụng, ngoại lệ chuyển tiếp, quyền hưởng so với tiền nhận; giữ các giả định hợp lệ người dùng đã xác nhận. Trả các phần xác minh được, ghi điều kiện cho số minh họa; không ép kết luận cuối hoặc tỷ lệ mặc định.
- Prompt chung và hợp đồng câu tính thuế bỏ những luật mẫu xung đột nguồn. Không cài số tiền/kết quả của câu hỏi vào runtime.
- Jev phân loại thêm cấu trúc bài toán và phương pháp hiện tại bằng native Choice trong luồng phân loại sẵn có. Template một cơ sở không được xác minh câu tổng hợp/nhiều kịch bản hoặc ghi đè phương pháp đang áp dụng. Không dùng từ khóa để phân loại hai nhãn này.
- Cùng điều kiện bao phủ cũng áp dụng cho fallback Rules Engine sau lỗi model: không được lấy số tiền đầu tiên của một hoạt động để xuất đáp án thay thế cho cả bài nhiều kịch bản. Lỗi provider được báo đúng là lỗi kết nối/model, không đem template thiếu ý đi kiểm định rồi hiển thị thành lỗi pháp lý.
- Reviewer kiểm tra khả năng áp dụng phương pháp, so sánh chi phí/thuế, từng kịch bản và ghi nhận doanh thu. Repair nhận hướng dẫn cụ thể cho từng loại lỗi; vẫn chỉ một lượt sửa, không vòng lặp vô hạn.
- Nếu vẫn không qua kiểm định và Jev xác định rõ một dữ kiện người dùng còn thiếu, thay bản nháp bị bác bằng câu hỏi làm rõ có cấu trúc. Không công bố bản nháp/số thuế bị bác, không đánh dấu đã xác minh, không cache câu hỏi này. Thiếu nguồn pháp luật không được biến thành yêu cầu người dùng cung cấp dữ kiện không liên quan.
- Trong cùng lượt review, một Choice riêng có thể chọn một đoạn dữ kiện/số học thuần túy đã đối chiếu với đề, không chứa thuế suất, số thuế hay kết luận pháp lý và không phụ thuộc đoạn trước. Chỉ đoạn được chọn đủ độ tin cậy mới được giữ trước câu hỏi làm rõ; chọn NONE hoặc định dạng không hợp lệ thì không trích đoạn. Đây không phải cho qua phần tài chính bị bác; trạng thái vẫn NEEDS_CLARIFICATION, không cache.
- Pending cho thuê bắt buộc có nhóm cho thuê, không kích hoạt chỉ vì có cộng doanh thu và một số tiền.
- Giữ bảng tỷ lệ Markdown cùng điều kiện thành khối nguyên vẹn trong ngân sách giới hạn: selector từng dòng trước đây có thể chỉ giữ dòng hoạt động khác 1% mà bỏ tỷ lệ hàng hóa/dịch vụ. Câu chỉ hỏi TNCN ưu tiên nguồn phương pháp/chuyển tiếp, bảng ngành và mức trừ; không để ví dụ giảm GTGT lấn các nguồn đó. Ngân sách context dành chỗ cho phần bao phủ và dữ kiện để reviewer không vượt giới hạn evidence.
- Giữ nguyên quy tắc ngắn tối đa 3.000 ký tự theo cấu trúc/kích thước, không chỉ theo tên file supplements: dữ liệu sau hợp nhất có thể giữ tên file cũ dù nội dung đã được thay. Lỗi này từng làm mất dòng 15%/17% trong quy tắc phương pháp dù retrieval báo đã tìm thấy tài liệu. Trace bổ sung `providedToModel` để phân biệt tìm thấy với thực sự đưa vào prompt.
- Đổi phiên bản pipeline để không dùng lại cache cũ.
- Kiểm tra riêng thuế suất theo thu nhập cho từng dải doanh thu/kịch bản; không cho nhãn minh họa hợp thức hóa thuế suất sai. Giữ nguyên nhãn mâu thuẫn/bịa dữ kiện khi confidence thấp, không đổi thành nhãn soft rồi cho qua. Chỉ khi các lựa chọn reviewer đều tích cực và còn cảnh báo confidence mới bỏ lượt repair thừa; lỗi nội dung vẫn sửa và kiểm tra lại. Lượt repair dùng reasoning thấp cho nhiệm vụ đã có chỉ dẫn sửa cụ thể.
- Giới hạn mỗi đáp án 6.000 output token; câu tính dựa trên nguồn dùng reasoning thấp, không yêu cầu suy luận dài. Không retry một lượt Muse đã hết thời gian; chỉ tối đa hai lượt cho lỗi tạm thời và có ngân sách thời gian chung. Repair dùng phần ngân sách còn lại (tối đa 20 giây, mốc mục tiêu 53 giây toàn luồng) để tránh MCP hết hạn trong khi Worker vẫn chạy lặp. Đây là giới hạn vận hành, không bảo đảm model luôn trả được đáp án khi provider lỗi.

## Kiểm thử

`test:scenario-recovery`: kiểm thử toàn luồng bằng provider giả lập: sửa thành công; lỗi kéo dài chuyển thành hỏi dữ kiện; không có câu hỏi làm rõ an toàn thì vẫn chặn; không lộ số thuế bị bác. Các ca mới và số kiểm tra độc lập ở `tests/fixtures/scenario-recovery.json`. Các phép thử giả lập kiểm tra cơ chế, không chứng nhận model trả đúng pháp luật.

Giữ kiểm thử 191 ca offline và bộ decision/scope. Gọi lại production với câu gốc, ca đổi số và ca đã xác nhận phương pháp đang dùng để kiểm tra hành vi model thực tế; lưu kết quả tại `outputs/answer-recovery/`.

Mã nền local trước sửa đã đối chiếu với Worker production tải qua Wrangler, không có khác biệt sau chuẩn hóa khoảng trắng/chú thích. Không thay nguồn luật hoặc dữ liệu RAG trong lần sửa này.

## Kết quả phát hành thực tế

Worker: `e0770e53-8508-4e87-9f28-22982c69f13a`.

- 191 ca offline đạt; bộ decision/scope và kiểm thử cơ chế khôi phục đạt. Đây là kiểm thử thành phần/transport, không phải 191 đáp án model live.
- Câu gốc: MCP trả NEEDS_CLARIFICATION trong khoảng 28 giây, hỏi phương pháp đang áp dụng và năm bắt đầu; không trả thông báo từ chối chung và không công bố bản nháp bị bác.
- Ca đổi số: cùng cơ chế, NEEDS_CLARIFICATION khoảng 23 giây; runtime không gắn kết quả với ID hoặc số tiền mẫu.
- Hai bản nháp vẫn có vấn đề được reviewer ghi nhận; không coi các ca này là đã PASS đủ yêu cầu tính thuế. Phần dữ kiện chỉ được giữ nếu reviewer riêng chọn đủ độ tin cậy; lần thử này không có đoạn đạt ngưỡng.
- Lần thử đã nêu phương pháp hiện tại ở bản phát hành cuối gặp MODEL_TIMEOUT sau khoảng 40 giây, được báo SKIPPED_GENERATION_ERROR/system_connection_error, không bị ngụy trang thành lỗi pháp lý. Lần thử trước đó đã trả 35 triệu/24,5 triệu đúng giả định, nhưng không dùng kết quả cũ để tuyên bố lần phát hành cuối đạt live.
- Do đó đã cải thiện cơ chế hỏi làm rõ và xử lý chặn, chưa chứng minh mọi câu mới đều tính đầy đủ/đúng ổn định. Muse có thể tiếp tục lỗi hoặc quá thời gian; giữ kiểm định và không hứa bỏ mọi trường hợp cần chặn.

Kết quả chi tiết ở `outputs/answer-recovery/*-release-check.json`.
