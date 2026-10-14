export interface RegFAQItem {
  question: string;
  answer: string;
  badge?: string;
  legalDocId?: string;
}

export const REG_FAQS: RegFAQItem[] = [
  {
    question: 'Từ năm 2026, Hộ và cá nhân kinh doanh có còn phải nộp Lệ phí môn bài không?',
    answer:
      'KHÔNG. Kể từ ngày 01/01/2026, Lệ phí môn bài đã chính thức được bãi bỏ hoàn toàn đối với Hộ kinh doanh và Cá nhân kinh doanh. Bạn không cần phải nộp Tờ khai lệ phí môn bài và không phải đóng bất kỳ khoản tiền môn bài định kỳ hàng năm nào.',
    badge: 'Quy định mới 2026',
    legalDocId: 'ND-141-2026-ND-CP',
  },
  {
    question: 'Ngưỡng doanh thu miễn thuế 1 tỷ đồng/năm được áp dụng cụ thể ra sao?',
    answer:
      'Theo Nghị định 141/2026/NĐ-CP, Hộ kinh doanh và Cá nhân kinh doanh có doanh thu trong năm dương lịch từ 1 tỷ đồng trở xuống được MIỄN 100% thuế GTGT và thuế TNCN, đồng thời không bắt buộc phải phát hành hóa đơn điện tử từng lần. Khi doanh thu vượt trên 1 tỷ đồng, bạn sẽ thực hiện kê khai nộp thuế theo biểu tỷ lệ trên phần doanh thu thực tế.',
    badge: 'Miễn thuế 1 tỷ',
    legalDocId: 'ND-141-2026-ND-CP',
  },
  {
    question: 'Đăng ký Hộ kinh doanh tại UBND có bị xử phạt chậm đăng ký thuế 10 ngày không?',
    answer:
      'KHÔNG. Theo quy định tại Nghị định 168/2025/NĐ-CP, thủ tục đăng ký hộ kinh doanh hiện nay áp dụng cơ chế LIÊN THÔNG MỘT CỬA tự động với cơ quan Thuế. Cơ quan ĐKKD cấp huyện sẽ chuyển thông tin sang hệ thống Thuế để cấp mã số thuế cùng lúc với Giấy chứng nhận. Do đó, người thành lập Hộ kinh doanh không phải chịu chế tài phạt chậm nộp hồ sơ thuế 10 ngày theo Nghị định 125/2020/NĐ-CP như hình thức đăng ký thuế trực tiếp cũ.',
    badge: 'Liên thông một cửa',
    legalDocId: 'ND-168-2025-ND-CP',
  },
  {
    question: 'Mã số thuế phân loại 888 trên Cổng TMĐT là gì và có bắt buộc không?',
    answer:
      'Mã phân loại 888 là mã số thuế định danh gồm 13 số (hoặc phân loại tích hợp trên CCCD) dành riêng cho hoạt động kinh doanh trên nền tảng thương mại điện tử theo Công văn 311/TCT-DNNCN và Thông tư 86/2024/TT-BTC. Người bán trên Shopee, TikTok Shop, Lazada... bắt buộc phải kích hoạt mã này thông qua tài khoản VNeID Mức 2 trên Cổng TMĐT (canhantmdt.gdt.gov.vn) để các sàn đối soát và thực hiện khấu trừ nộp thay thuế hợp pháp.',
    badge: 'Bắt buộc TMĐT',
    legalDocId: '311-TCT-DNNCN-2025-goc',
  },
  {
    question: 'Nếu tôi vừa có cửa hàng vừa bán hàng trên Shopee/TikTok thì nên đăng ký theo lộ trình nào?',
    answer:
      'Bạn nên chọn Lộ trình B: Hộ kinh doanh cá thể. Bạn đăng ký Giấy chứng nhận Hộ kinh doanh tại địa chỉ cửa hàng vật lý trước. Sau khi được cấp Giấy phép (có mã số HKD 10 số), bạn dùng mã này để cập nhật vào thông tin Người bán trên Shopee/TikTok Seller Center và Cổng TMĐT. Như vậy bạn sẽ quản lý toàn vẹn cả kênh bán hàng offline và online một cách minh bạch, an toàn pháp lý.',
    badge: 'Bán hàng đa kênh',
    legalDocId: 'ND-168-2025-ND-CP',
  },
  {
    question: 'Một cá nhân được đứng tên đăng ký tối đa bao nhiêu Hộ kinh doanh?',
    answer:
      'Theo Nghị định 168/2025/NĐ-CP, một cá nhân chỉ được đứng tên làm đại diện cho DUY NHẤT 01 Hộ kinh doanh trên phạm vi toàn quốc. Nếu bạn có nhu cầu mở rộng kinh doanh tại nhiều địa điểm khác nhau, bạn có thể đăng ký "Địa điểm kinh doanh" trực thuộc Hộ kinh doanh đã có, hoặc chuyển đổi mô hình sang Doanh nghiệp (Công ty TNHH / Cổ phần).',
    badge: 'Quy định pháp lý',
    legalDocId: 'ND-168-2025-ND-CP',
  },
];
