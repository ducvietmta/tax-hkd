/** Public workflow milestones only. Never includes model thoughts or draft answers. */
export const CHAT_PROGRESS_LABELS = {
  connecting: 'Đang kết nối dịch vụ trả lời',
  received: 'Đã nhận câu hỏi',
  classifying: 'Xác định nội dung và dữ kiện câu hỏi',
  retrieving: 'Tìm tài liệu pháp lý liên quan',
  preparing: 'Đối chiếu kỳ áp dụng và điều kiện',
  generating: 'Soạn câu trả lời theo căn cứ',
  reviewing: 'Kiểm tra nội dung và viện dẫn',
  repairing: 'Rà soát và bổ sung đáp án',
  finalizing: 'Hoàn tất câu trả lời',
  cache: 'Đã tìm thấy đáp án đã kiểm tra',
} as const;
export type ChatProgressStage = keyof typeof CHAT_PROGRESS_LABELS;
export interface ChatProgress { stage: ChatProgressStage; }
