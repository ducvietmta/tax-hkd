import type { BusinessClassification } from './quyetProvider';

/** Coverage requirements by semantic topic, not question IDs or keyword matches.
 * Legal conclusions must still come from the retrieved, period-scoped evidence.
 */
export function answerContract(semantic: BusinessClassification): string {
  const common = 'Tách tất cả yêu cầu trong câu hỏi (kể cả lựa chọn hoặc phủ định) thành các ý cần trả lời. Trả lời từng ý; thiếu hồ sơ cho một ý không bỏ các ý còn lại. Chỉ dẫn điều/khoản có trong bằng chứng và đúng nhánh, không tự nhớ số điều. Dữ kiện trích xuất chỉ hỗ trợ: một số tiền của một hoạt động không thay thế tổng nhiều hoạt động được nêu trong câu hỏi.';
  const topics: Record<string, string> = {
    REVENUE_OWNERSHIP: 'Xác định chủ thể thực và đơn vị áp dụng ngưỡng trong nguồn trước khi so số tiền. Sổ sách/địa điểm/ngành độc lập không tự chứng minh người nộp thuế độc lập. Nếu người dùng xác nhận cùng chủ thể, cộng các khoản không trùng lặp cùng kỳ theo quy tắc nguồn; nếu các chủ thể khác nhau, không tự cộng. Phân biệt trần hưởng giảm với ngưỡng miễn, không làm tròn qua ranh giới.',
    BUSINESS_EXPENSES: 'Trả lời riêng khả năng được trừ và yêu cầu thay đổi/bổ sung hồ sơ nếu được hỏi. Không tự bắt buộc đổi tên, cũng không bảo đảm không bao giờ cần điều chỉnh hợp đồng. Với lãi vay: đối chiếu nghĩa vụ vay, sử dụng vốn, người thực trả, hồ sơ liên kết, giới hạn lãi theo bên cho vay và điều kiện thanh toán trong nguồn. Không thêm đối trừ thuế đã nộp khi câu chỉ hỏi chi phí.',
    INVOICE_CORRECTION: 'Chọn nhánh theo loại sai sót, loại hóa đơn và thời điểm. Nguồn cho lựa chọn điều chỉnh hoặc thay thế thì giữ cả hai; chỉ bắt buộc một cách nếu đúng ngoại lệ và đủ dữ kiện. Tách cách sửa hóa đơn khỏi kỳ khai thuế: nếu chưa thể chốt kỳ, nói cụ thể thiếu loại hóa đơn, phương pháp/kỳ khai hoặc hồ sơ nào. Không suy kỳ thuế chỉ từ ngày phát hiện.',
  };
  return common + '\n' + (topics[semantic.topic || ''] || '');
}

export const UNVERIFIED_ANSWER = 'Mình chưa xác minh được đầy đủ câu trả lời với các căn cứ hiện có nên chưa thể đưa ra kết luận chắc chắn. Cần đối chiếu lại nội dung và điều khoản áp dụng trước khi sử dụng kết quả này.';
