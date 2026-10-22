/** Cross-question reasoning contract. Tax rates and exceptions come from RAG,
 * never from canned numerical examples or a forced default industry. */
export const GROUNDED_ANSWER_POLICY = `QUY TRÌNH TRẢ LỜI DỰA TRÊN BẰNG CHỨNG:
1. Tách câu hỏi thành các yêu cầu và kịch bản độc lập. Giữ đúng chủ thể, năm/kỳ, hoạt động, quyền hưởng, giả định và điều người dùng loại trừ. Không gộp các kịch bản thay thế vào cùng một tổng. Nhãn/trích xuất tự động chỉ là gợi ý, một khoản doanh thu không thay thế tổng nhiều hoạt động.
2. Với mỗi kịch bản, phân biệt tiền hàng/GMV, hoa hồng được hưởng, doanh thu, tiền thực nhận, thu hộ, chi phí, thu nhập tính thuế và thuế đã nộp. Ghi nhận khoản chưa thu tiền theo thời điểm mà bằng chứng quy định, không chỉ theo dòng tiền. Chỉ loại khoản trùng một lần. Nếu người dùng xác nhận phần chi phí còn lại hợp lệ sau điều chỉnh thì được dùng giả định đó, không coi toàn bộ chi phí vẫn chưa xác minh.
3. Xác định phương pháp ĐANG ĐƯỢC ÁP DỤNG trước khi tính. Đọc cả điều kiện, ngoại lệ chuyển tiếp và thời gian ổn định trong bằng chứng; không suy chỉ từ việc vượt một mốc doanh thu rằng phải đổi ngay trong cùng kỳ. Thiếu phương pháp hiện tại/năm bắt đầu thì nói rõ, trình bày các nhánh nếu-thì và tính minh họa theo từng nhánh đủ dữ kiện; không chốt một số thành nghĩa vụ chắc chắn.
4. Khi có nhiều phương pháp được phép lựa chọn, tính riêng các phương pháp đủ dữ kiện rồi mới so sánh. Thiếu phương pháp đang áp dụng không phải lý do bỏ nhánh minh họa theo thu nhập nếu doanh thu và chi phí hợp lệ đã đủ: phải tính trước/sau giảm cho nhánh đó, gắn rõ điều kiện áp dụng; đồng thời trả nhánh doanh thu bằng số hoặc biến số tùy dữ kiện tỷ lệ. Không suy chi phí lớn thì phương pháp thu nhập luôn có lợi. Chưa rõ tỷ lệ ngành thì giữ biến số hoặc nêu giả định minh họa rõ ràng; KHÔNG mặc định người dùng bán hàng, không gán một tỷ lệ mặc định để ép ra số cuối. Khi các giả định thay đổi kết quả, ghi rõ số nào có điều kiện.
5. Áp dụng độc lập từng sắc thuế/chính sách giảm theo đúng cơ sở và thứ tự trong nguồn. Mức trừ dùng chung không được trừ nhiều lần. Chỉ tính những sắc thuế được hỏi; việc nhiều ngành không tự làm phát sinh yêu cầu tính thêm thuế khác. Giữ độ chính xác đến một đồng ở ranh giới.
6. Phân biệt khoản nền tảng GIỮ LẠI với thuế đã nộp hợp lệ. Chưa xác định loại thuế, chủ thể, kỳ, chứng từ và trạng thái nộp thì không trừ ngay, không khẳng định hoàn. Tính nghĩa vụ có điều kiện trước, chỉ đối trừ khoản đã được xác minh phù hợp.
7. Trả lời được phần nào có căn cứ thì trình bày phần đó. Một thông tin thiếu không làm mất tất cả các phép tính/dữ kiện đã xác định. Phần chưa chốt phải nêu cụ thể thiếu gì và hỏi tối đa một câu gộp các dữ kiện quyết định; không dùng câu từ chối chung chung thay cho phần trả lời có ích.
8. Mọi kết luận pháp lý và viện dẫn phải khớp văn bản, điều/khoản, nội dung, hiệu lực trong BẰNG CHỨNG. Không tự nhớ điều khoản để điền cho đủ. Không biến dự thảo, ví dụ khác hoặc nhãn định tuyến thành luật áp dụng. Nếu nguồn không cho biết một chi tiết, bỏ khẳng định đó và nêu giới hạn cụ thể.
9. Trình bày đủ từng yêu cầu; với nhiều kịch bản/phương pháp BẮT BUỘC ưu tiên bảng gồm kịch bản, cơ sở, thuế suất, trước giảm, sau giảm và điều kiện. Không lặp lại từng số tiền ở nhiều đoạn; ghi điều kiện chung một lần rồi dùng bảng. Trả lời gọn khoảng 300–600 từ cho bài tổng hợp, nhưng không bỏ nhánh để đạt giới hạn từ. Không trình bày suy luận nội bộ.
10. Kết thúc bằng mục Căn cứ pháp lý: chỉ liệt kê các điều/khoản thực sự đã dùng và có trong bằng chứng, viết đầy đủ tên và số hiệu văn bản. Không bịa điều để đủ mục căn cứ; phần chưa có nguồn thì nói rõ, không dẫn văn bản khác thay thế.`;

/** Actionable recovery steps for general review dimensions, not fixture IDs. */
export function reviewRepairGuidance(issues: string[]): string {
  const hints: Record<string, string> = {
    facts: 'Đối chiếu từng số và giả định với câu hỏi; không đổi quyền hưởng thành thực nhận, không coi một số thành tổng. Kết luận còn thiếu dữ kiện phải chuyển thành nếu-thì từ câu đầu.',
    evidence: 'Đọc lại nguyên văn điều kiện VÀ ngoại lệ của các nguồn. Bỏ mọi kết luận áp dụng ngay nếu chưa biết tình trạng/phương pháp hiện tại. Trả lời phần có căn cứ và nêu chính xác điều kiện chưa chốt.',
    coverage: 'Lập danh sách mọi yêu cầu, hoạt động, phương pháp và kịch bản thay thế; trả riêng từng mục. Thiếu dữ kiện ở một mục thì nêu biến số/giả định của mục đó, không bỏ các mục khác.',
    registration_scope: 'Giữ đúng thủ tục đăng ký người dùng hỏi; đăng ký cá nhân kinh doanh thường chỉ đăng ký thuế hoạt động cá nhân. Trả phần thuế trước theo nguồn, không thay bằng miễn đăng ký hộ. Bỏ mọi giả định chưa có về bán rong/lưu động/địa điểm cố định; phân biệt thu nhập với doanh thu, miễn thuế với miễn đăng ký.',
    citations: 'Kiểm tra từng điều/khoản được dẫn với nguồn; sửa hoặc bỏ viện dẫn không có đúng nội dung trong bằng chứng, kể cả mục căn cứ cuối bài.',
    calculation_coverage: 'Tính đủ trước/sau giảm cho mọi nhánh đủ dữ kiện. Không tuyên bố phương pháp có lợi hơn nếu chưa tính đủ các phương pháp. Không dùng cơ sở của sắc thuế này cho sắc thuế khác.',
    method_applicability: 'Kiểm tra phương pháp đang áp dụng, năm bắt đầu và điều khoản chuyển tiếp/thời gian ổn định; số vượt ngưỡng không đủ để chốt chuyển ngay. Đưa các nhánh áp dụng khác nhau và hỏi dữ kiện còn thiếu.',
    method_comparison: 'Tính và so sánh đầy đủ các phương pháp có thể áp dụng; chưa đủ tỷ lệ/ngành thì không kết luận phương pháp tối ưu chỉ vì có nhiều chi phí.',
    scenario_coverage: 'Tách các kịch bản thay thế; giữ số liệu gốc, chỉ thay dữ kiện người dùng đổi; cộng/trừ từng hoạt động và khoản điều chỉnh trong đúng kịch bản.',
    revenue_recognition: 'Xác định doanh thu theo quyền hưởng/thời điểm trong nguồn, không mặc định phải thu tiền; giữ phân biệt GMV và hoa hồng, ghi trùng và công nợ.',
    income_rate_tier: 'Đối chiếu lại thuế suất theo đúng doanh thu tổng của TỪNG kịch bản trong nguồn, rồi tính lại thu nhập × thuế suất và mức sau giảm. Không dùng thuế suất dải khác làm ví dụ dù có chữ minh họa. Giữ riêng điều kiện chọn phương pháp với việc chọn thuế suất trong phương pháp đó.',
  };
  return [...new Set(issues.map(issue => hints[issue.split(':')[0]]).filter(Boolean))].join('\n');
}

/** Safe recovery is a question, never a release of the rejected legal draft. */
export function reviewClarification(missingFact: string | undefined): string | null {
  const questions: Record<string, string> = {
    CURRENT_METHOD: 'Để chốt số thuế cho đúng kỳ, mình cần biết: bạn đang tính TNCN theo tỷ lệ doanh thu hay theo thu nhập (doanh thu trừ chi phí), bắt đầu từ năm nào?',
    ACTIVITY_RATE: 'Mình cần xác định đúng nhóm hoạt động trước khi chốt tỷ lệ và tiền thuế. Bạn mô tả rõ từng phần công việc, hàng hóa/vật tư đi kèm và khoản tiền được hưởng theo hợp đồng được không?',
    RECOGNITION_TIME: 'Để xác định đúng doanh thu của kỳ, bạn cho biết công việc đã hoàn thành/nghiệm thu hoặc hàng đã chuyển giao vào thời điểm nào, và khoản tiền được hưởng đã được xác nhận chưa?',
    WITHHOLDING_TYPE: 'Mình chưa thể đối trừ khoản bị giữ khi chưa xác định được bản chất. Chứng từ hoặc báo cáo của bên trả ghi loại thuế, người nộp, kỳ thuế và trạng thái đã nộp như thế nào?',
    OWNERSHIP: 'Để xác định tổng doanh thu của đúng người, bạn cho biết ai thực tế kinh doanh, đứng tên hợp đồng và được hưởng tiền của từng hoạt động?',
    EXPENSE_BASIS: 'Để chốt thu nhập tính thuế, bạn cho biết phần chi phí nào đã loại khoản cá nhân/ghi trùng và được xác nhận đủ điều kiện, phần nào còn chờ đối soát?',
  };
  return missingFact && Object.hasOwn(questions, missingFact) ? questions[missingFact] : null;
}

/** Match policy breadth to semantic purpose; a definition is not a tax computation. */
export function groundedAnswerPolicy(semantic:{answerPurpose?:string}):string {
 if(semantic.answerPurpose!=='DEFINITION')return GROUNDED_ANSWER_POLICY;
 return 'GIẢI THÍCH VÀ TỔNG HỢP DỰA TRÊN NGUỒN: RAG là dữ liệu/căn cứ, không phải đáp án cố định. Tự viết lời giải thích mạch lạc theo câu hỏi: định nghĩa, ý nghĩa thực tế, phạm vi và điểm dễ nhầm. Được diễn giải khác câu chữ, kết nối các đoạn bằng chứng và dùng ví dụ giả định rõ ràng khi phù hợp; không suy thêm nghĩa vụ pháp lý ngoài nguồn. Không ép đáp án thành một dòng hay chép nguyên văn tài liệu. Giữ đúng điều kiện/kỳ/chủ thể; không biến doanh thu thành tiền lời, không gán tình trạng đăng ký cho người hỏi. Không kể hết thủ tục hoặc tính tiền nếu không được hỏi. Chỉ viện dẫn điều/khoản khớp nội dung trong bằng chứng; không yêu cầu phải có viện dẫn cho một ví dụ giả định không chứa kết luận pháp lý mới. Không trình bày suy nghĩ nội bộ.';
}
