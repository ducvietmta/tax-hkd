import type { PathId, QuizQuestion } from '../types';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q_location',
    title: 'Địa điểm hoạt động kinh doanh của bạn như thế nào?',
    subtitle: 'Địa điểm là tiêu chí pháp lý quan trọng nhất để phân định giữa Hộ kinh doanh và Cá nhân kinh doanh',
    options: [
      {
        id: 'has_store',
        label: 'Có cửa hàng, mặt bằng cố định hoặc ki-ốt, xưởng sản xuất',
        description: 'Mở quán ăn, cửa hiệu tạp hóa, tiệm làm tóc, nhà thuốc, kho hàng có treo biển hiệu',
        icon: 'Store',
        badge: 'Cần giấy phép HKD',
      },
      {
        id: 'online_only',
        label: 'Kinh doanh thuần online, không mở cửa hàng đón khách trực tiếp',
        description: 'Bán hàng qua Shopee, TikTok Shop, Facebook, livestream, làm Affiliate, sáng tạo nội dung',
        icon: 'Globe',
        badge: 'Cổng TMĐT 888',
      },
      {
        id: 'no_store',
        label: 'Bán hàng rong, lưu động, dịch vụ tự do hoặc làm tại nhà khách',
        description: 'Bán đồ ăn vặt lưu động, thợ điện nước, gia sư, lái xe công nghệ, thợ sửa chữa lưu động',
        icon: 'Truck',
        badge: 'Đăng ký thuế trực tiếp',
      },
    ],
  },
  {
    id: 'q_channel',
    title: 'Kênh bán hàng và nguồn doanh thu chính của bạn?',
    subtitle: 'Quy định thuế năm 2026 có cơ chế riêng biệt giữa kênh bán lẻ truyền thống và sàn TMĐT khấu trừ nộp thay',
    options: [
      {
        id: 'ecommerce',
        label: 'Sàn TMĐT (Shopee, TikTok Shop, Lazada, Tiki) hoặc mạng xã hội',
        description: 'Thuộc diện sàn TMĐT khấu trừ và nộp thay thuế GTGT 1% và TNCN 0.5% theo Nghị định 141/2026/NĐ-CP',
        icon: 'ShoppingBag',
        badge: 'Sàn khấu trừ nộp thay',
      },
      {
        id: 'offline',
        label: 'Bán lẻ trực tiếp tại cửa hàng, cơ sở hoặc chợ truyền thống',
        description: 'Khách hàng thanh toán tiền mặt, chuyển khoản QR tài khoản cá nhân/HKD trực tiếp tại điểm bán',
        icon: 'Users',
        badge: 'Khai nộp thuế trực tiếp',
      },
      {
        id: 'both',
        label: 'Kết hợp cả bán tại cửa hàng vật lý và mở gian hàng online trên sàn',
        description: 'Vừa có điểm bán đón khách vừa phát triển kênh bán hàng online đa kênh',
        icon: 'Layers',
        badge: 'Mô hình đa kênh',
      },
    ],
  },
  {
    id: 'q_revenue',
    title: 'Mức doanh thu dự kiến trong một năm dương lịch?',
    subtitle: 'Theo Nghị định 141/2026/NĐ-CP, ngưỡng doanh thu được miễn toàn bộ thuế GTGT & TNCN là 1 tỷ đồng/năm',
    options: [
      {
        id: 'under_1b',
        label: 'Dưới 1 tỷ đồng / năm (Dưới khoảng 83 triệu đồng/tháng)',
        description: 'Được MIỄN toàn bộ thuế GTGT và thuế TNCN, không bắt buộc sử dụng hóa đơn điện tử',
        icon: 'ShieldCheck',
        badge: 'Miễn 100% thuế',
      },
      {
        id: 'over_1b',
        label: 'Từ 1 tỷ đồng / năm trở lên (Trên khoảng 83 triệu đồng/tháng)',
        description: 'Phải kê khai nộp thuế GTGT & TNCN theo biểu tỷ lệ ngành nghề và phát hành hóa đơn điện tử',
        icon: 'TrendingUp',
        badge: 'Thuộc diện tính thuế',
      },
    ],
  },
  {
    id: 'q_identity',
    title: 'Tình trạng mã số thuế & giấy tờ định danh của bạn?',
    subtitle: 'Từ ngày 01/07/2025 theo Thông tư 86/2024/TT-BTC, số CCCD 12 số chính thức thay thế mã số thuế cá nhân',
    options: [
      {
        id: 'has_vneid2',
        label: 'Đã có CCCD gắn chip 12 số và tài khoản VNeID Mức độ 2',
        description: 'Đã đủ điều kiện làm mọi thủ tục online qua Cổng Dịch vụ công Quốc gia & Cổng TMĐT',
        icon: 'Smartphone',
        badge: 'Chuẩn số hóa 2026',
      },
      {
        id: 'has_personal_mst',
        label: 'Đã có MST cá nhân 10 số cũ và CCCD nhưng chưa kích hoạt VNeID mức 2',
        description: 'Cần cập nhật số CCCD vào hệ thống thuế và kích hoạt định danh mức 2 tại Công an xã/phường',
        icon: 'CreditCard',
        badge: 'Cần chuẩn hóa CCCD',
      },
      {
        id: 'never_registered',
        label: 'Chưa từng đăng ký MST và chưa rõ thủ tục bắt đầu từ đâu',
        description: 'TaxHKD sẽ hướng dẫn bạn khởi tạo từ bước đầu tiên chỉ với chiếc thẻ CCCD gắn chip',
        icon: 'HelpCircle',
        badge: 'Đăng ký lần đầu',
      },
    ],
  },
];

export interface PathDecision {
  pathId: PathId;
  title: string;
  badge: string;
  reason: string;
  highlights: string[];
}

export function decidePath(answers: Record<string, string>): PathDecision {
  const location = answers.q_location;
  const channel = answers.q_channel;
  const revenue = answers.q_revenue;

  // Rule 1: Has fixed store or omnichannel with physical presence -> Household business (Hộ kinh doanh)
  if (location === 'has_store' || channel === 'both') {
    return {
      pathId: 'household',
      title: 'Hộ kinh doanh cá thể (Có địa điểm cố định)',
      badge: 'Phù hợp nhất với bạn',
      reason:
        'Bạn có cửa hàng, ki-ốt hoặc địa điểm kinh doanh vật lý cố định. Theo Nghị định 168/2025/NĐ-CP, bạn cần đăng ký thành lập Hộ kinh doanh tại Cơ quan ĐKKD cấp huyện/xã để được cấp Giấy chứng nhận và liên thông cấp mã số thuế tự động.',
      highlights: [
        'Cơ chế liên thông 1 cửa: Nhận Giấy chứng nhận ĐKKD đồng thời là Giấy chứng nhận đăng ký thuế',
        'Có tư cách pháp lý mở tài khoản ngân hàng chính danh Hộ kinh doanh và ký hợp đồng thương mại',
        'Miễn hoàn toàn lệ phí môn bài từ 01/01/2026',
        revenue === 'under_1b'
          ? 'Doanh thu dưới 1 tỷ đồng/năm được miễn 100% thuế GTGT & TNCN (Nghị định 141/2026/NĐ-CP)'
          : 'Doanh thu trên 1 tỷ đồng/năm áp dụng chế độ sổ sách kế toán giản đơn (TT 88/2021) & Hóa đơn điện tử',
      ],
    };
  }

  // Rule 2: Purely online / e-commerce / affiliate -> Platform (Sàn TMĐT & Mạng xã hội)
  if (channel === 'ecommerce' || location === 'online_only') {
    return {
      pathId: 'platform',
      title: 'Cá nhân kinh doanh trên Sàn TMĐT & Mạng xã hội',
      badge: 'Tối ưu nhanh nhất',
      reason:
        'Bạn kinh doanh trực tuyến trên các sàn TMĐT (Shopee, TikTok Shop, Lazada...) hoặc mạng xã hội. Bạn chỉ cần kích hoạt mã định danh kinh doanh TMĐT (phân loại 888) trực tiếp qua Cổng TMĐT bằng tài khoản VNeID Mức 2 theo Công văn 311/TCT-DNNCN.',
      highlights: [
        'Thao tác 100% online trên Cổng TMĐT (canhantmdt.gdt.gov.vn), không cần nộp hồ sơ giấy',
        'Xác thực một chạm bằng định danh điện tử VNeID Mức độ 2',
        'Sàn TMĐT tự động kê khai và nộp thay thuế GTGT 1% và TNCN 0.5% theo Nghị định 141/2026/NĐ-CP',
        'Miễn toàn bộ lệ phí đăng ký và lệ phí môn bài',
      ],
    };
  }

  // Rule 3: Direct mobile / freelancer without fixed location -> Individual (Cá nhân KD trực tiếp)
  return {
    pathId: 'individual',
    title: 'Cá nhân kinh doanh trực tiếp (Không có địa điểm cố định)',
    badge: 'Thủ tục đơn giản nhất',
    reason:
      'Bạn kinh doanh lưu động, bán hàng rong, làm tự do hoặc không thuê địa điểm cố định. Bạn không bắt buộc phải lập Hộ kinh doanh tại UBND mà chỉ cần đăng ký thuế trực tiếp với Chi cục Thuế nơi cư trú bằng số CCCD 12 số.',
    highlights: [
      'Không cần thủ tục ĐKKD tại UBND cấp huyện, chỉ cần thực hiện đăng ký thuế',
      'Sử dụng trực tiếp số CCCD 12 số làm mã số thuế theo Thông tư 86/2024/TT-BTC',
      'Đăng ký online thuận tiện qua Cổng Dịch vụ công Quốc gia hoặc eTax Mobile',
      'Miễn 100% lệ phí môn bài và miễn thuế nếu doanh thu dưới 1 tỷ đồng/năm',
    ],
  };
}
