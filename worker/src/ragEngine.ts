/**
 * RAG KNOWLEDGE BASE ENGINE (Compiled for Cloudflare Workers Edge)
 * Generated at: 2026-10-16T15:01:23.251Z
 * Chunks: 103 verified | Routes: 55
 */

export interface RagChunk {
  id: string;
  file: string;
  section: string;
  ref_id: string | null;
  tier: string;
  text: string;
}

export interface QueryRoute {
  id: string;
  any: string[];
  context_any?: string[];
  expand?: string[];
  not?: string[];
  refs: string[];
  priority: number;
}

export const QUERY_ROUTES: QueryRoute[] = [
  {
    "id": "ORDER_RETURNS_AND_PLATFORM_FEE",
    "any": [
      "đơn hoàn",
      "hủy hoàn",
      "hoàn hàng",
      "đơn hủy",
      "hàng hoàn",
      "phí sàn",
      "thu hộ",
      "tiền ship"
    ],
    "refs": [
      "16.32",
      "16.42",
      "16.72"
    ],
    "expand": [
      "net revenue after returns",
      "platform fee not deductible for direct method"
    ],
    "priority": 85
  },
  {
    "id": "HISTORICAL_YEAR_THRESHOLD",
    "any": [
      "2022",
      "2023",
      "2024",
      "2025"
    ],
    "refs": [
      "16.54"
    ],
    "expand": [
      "TT40 historical threshold",
      "annualization if applicable"
    ],
    "priority": 80
  },
  {
    "id": "HISTORICAL_PARTIAL_YEAR",
    "any": [
      "không đủ 12 tháng",
      "không trọn năm",
      "mở giữa năm"
    ],
    "context_any": [
      "2021",
      "2022",
      "2023",
      "2024",
      "2025"
    ],
    "refs": [
      "16.54",
      "16.60"
    ],
    "expand": [
      "TT40 historical partial-year annualization if applicable"
    ],
    "priority": 90
  },
  {
    "id": "SOFTWARE_CALC",
    "any": [
      "htkk",
      "etax",
      "phần mềm",
      "nhảy thuế",
      "tự tính",
      "ô thuế"
    ],
    "refs": [
      "16.55"
    ],
    "expand": [
      "displayed calculation",
      "legal liability"
    ],
    "priority": 60
  },
  {
    "id": "ONE_BILLION",
    "any": [
      "1 tỷ",
      "1,0 tỷ",
      "1.000.000.000",
      "chạm mốc",
      "vượt 1 tỷ"
    ],
    "refs": [
      "16.44",
      "16.99",
      "16.53",
      "16.41",
      "16.72",
      "16.77"
    ],
    "expand": [
      "threshold operator",
      "crossing quarter"
    ],
    "priority": 70
  },
  {
    "id": "MISSING_DUPLICATE_PERIOD",
    "any": [
      "quên khai",
      "gộp quý",
      "nộp trùng",
      "treo nợ",
      "tháng 1,2,3",
      "quý 2",
      "quý II"
    ],
    "refs": [
      "16.59"
    ],
    "expand": [
      "period integrity",
      "procedural state"
    ],
    "priority": 60
  },
  {
    "id": "BOOKS",
    "any": [
      "s1a",
      "s2a",
      "s2b",
      "s2c",
      "s2d",
      "s2e",
      "vở thường",
      "excel",
      "sổ doanh thu"
    ],
    "refs": [
      "16.52",
      "16.71"
    ],
    "expand": [
      "book by tax method"
    ],
    "priority": 60
  },
  {
    "id": "VOLUNTARY_EINVOICE",
    "any": [
      "tự nguyện",
      "dưới 1 tỷ",
      "khách công ty cần hóa đơn"
    ],
    "refs": [
      "16.58"
    ],
    "expand": [
      "voluntary e-invoice separate from tax status"
    ],
    "context_any": [
      "hóa đơn"
    ],
    "priority": 60
  },
  {
    "id": "NO_INPUT_INVOICE",
    "any": [
      "không có hóa đơn đầu vào",
      "không có đầu vào",
      "hàng mua ngoài chợ"
    ],
    "refs": [
      "16.58",
      "16.19"
    ],
    "expand": [
      "output invoice",
      "input evidence"
    ],
    "priority": 60
  },
  {
    "id": "COD_SHIP",
    "any": [
      "cod",
      "ship thu hộ",
      "phí ship",
      "vận chuyển thu hộ"
    ],
    "refs": [
      "16.22"
    ],
    "expand": [
      "collection on behalf",
      "gross revenue"
    ],
    "priority": 60
  },
  {
    "id": "PLATFORM_FEE",
    "any": [
      "phí sàn",
      "sàn trừ phí",
      "còn chuyển về",
      "doanh thu net"
    ],
    "refs": [
      "16.32"
    ],
    "expand": [
      "gross vs net",
      "platform fee cost"
    ],
    "priority": 60
  },
  {
    "id": "RETURNS",
    "any": [
      "hoàn hàng",
      "trả lại hàng",
      "đơn hoàn"
    ],
    "refs": [
      "16.18",
      "16.32"
    ],
    "expand": [
      "returned goods",
      "invoice adjustment"
    ],
    "priority": 60
  },
  {
    "id": "VOUCHER",
    "any": [
      "voucher",
      "mã giảm giá",
      "trợ giá"
    ],
    "refs": [
      "16.32"
    ],
    "expand": [
      "who bears discount"
    ],
    "priority": 60
  },
  {
    "id": "NONBUSINESS_CASH",
    "any": [
      "tự chuyển",
      "tiền vay",
      "vay ngân hàng",
      "chuyển nhầm"
    ],
    "refs": [
      "16.33"
    ],
    "expand": [
      "cash flow not revenue"
    ],
    "priority": 60
  },
  {
    "id": "BONUS_EINVOICE",
    "any": [
      "thưởng doanh số",
      "thưởng hãng",
      "hỗ trợ hãng",
      "tiền thưởng"
    ],
    "context_any": [
      "hđđt",
      "hóa đơn"
    ],
    "refs": [
      "16.47",
      "16.41"
    ],
    "expand": [
      "bonus HĐĐT threshold uncertainty",
      "current-year invoice threshold"
    ],
    "priority": 95
  },
  {
    "id": "BONUS",
    "any": [
      "thưởng doanh số",
      "hỗ trợ hãng",
      "tiền thưởng",
      "thưởng hãng"
    ],
    "refs": [
      "16.34",
      "16.47",
      "16.49"
    ],
    "expand": [
      "business other revenue",
      "bonus classification"
    ],
    "priority": 70
  },
  {
    "id": "MIX_BDS",
    "any": [
      "cho thuê nhà",
      "cho thuê bất động sản",
      "bđs"
    ],
    "refs": [
      "16.29"
    ],
    "expand": [
      "separate business and real estate"
    ],
    "context_any": [
      "bán",
      "kinh doanh",
      "hàng"
    ],
    "priority": 60
  },
  {
    "id": "PLATFORM_WITHHELD",
    "any": [
      "sàn đã khấu trừ",
      "sàn nộp thay",
      "sàn đã trừ",
      "nộp thay",
      "khấu trừ trên sàn"
    ],
    "refs": [
      "16.35",
      "16.48",
      "16.72"
    ],
    "expand": [
      "withholding not removal of revenue"
    ],
    "priority": 60
  },
  {
    "id": "PLATFORM_OVER3B",
    "any": [
      "4 tỷ",
      "trên 3 tỷ",
      ">3 tỷ",
      "17%"
    ],
    "refs": [
      "16.57"
    ],
    "expand": [
      "annual income-method settlement",
      "credit withheld tax"
    ],
    "context_any": [
      "sàn",
      "shopee",
      "tiktok"
    ],
    "priority": 60
  },
  {
    "id": "METHOD_3B",
    "any": [
      "3 tỷ",
      "17%",
      "lợi nhuận",
      "thu nhập tính thuế"
    ],
    "refs": [
      "16.56"
    ],
    "expand": [
      "method boundary",
      "method transition"
    ],
    "priority": 60
  },
  {
    "id": "COSTS",
    "any": [
      "giá vốn",
      "chi phí",
      "phí quảng cáo"
    ],
    "refs": [
      "16.56",
      "16.57"
    ],
    "expand": [
      "ratio method vs income method"
    ],
    "priority": 60
  },
  {
    "id": "NQ204",
    "any": [
      "0,8%",
      "0.8%",
      "nq204",
      "giảm 20%",
      "giảm vat",
      "giảm gtgt"
    ],
    "refs": [
      "16.50"
    ],
    "expand": [
      "VAT rate reduction"
    ],
    "priority": 60
  },
  {
    "id": "NQ43",
    "any": [
      "giảm 30%",
      "30% tncn",
      "nq43",
      "nghị quyết 43",
      "ưu đãi thuế 2026",
      "giảm thuế tncn"
    ],
    "refs": [
      "16.39",
      "16.99"
    ],
    "expand": [
      "whole tax year reduction"
    ],
    "priority": 85
  },
  {
    "id": "REVENUE_TIME",
    "any": [
      "xuất hóa đơn tháng",
      "giao hàng tháng",
      "thời điểm doanh thu"
    ],
    "refs": [
      "16.30"
    ],
    "expand": [
      "revenue timing vs invoice timing"
    ],
    "priority": 60
  },
  {
    "id": "DEPOSIT",
    "any": [
      "đặt cọc",
      "tạm ứng"
    ],
    "refs": [
      "16.43",
      "16.30"
    ],
    "expand": [
      "deposit vs advance"
    ],
    "priority": 60
  },
  {
    "id": "ASSET_SALE",
    "any": [
      "thanh lý",
      "bán máy cũ",
      "bán xe",
      "tài sản"
    ],
    "refs": [
      "16.36",
      "16.38"
    ],
    "expand": [
      "asset classification",
      "registered-right asset exception"
    ],
    "priority": 60
  },
  {
    "id": "AFFILIATE",
    "any": [
      "affiliate",
      "tiếp thị liên kết",
      "7403"
    ],
    "refs": [
      "16.20",
      "16.73",
      "16.37",
      "16.95"
    ],
    "expand": [
      "affiliate classification"
    ],
    "priority": 75
  },
  {
    "id": "EFILE_ACCEPT",
    "any": [
      "không tiếp nhận",
      "đã ghi nhận",
      "email tiếp nhận"
    ],
    "refs": [
      "16.24"
    ],
    "expand": [
      "electronic filing acceptance"
    ],
    "priority": 60
  },
  {
    "id": "TAX_REG_DEADLINE",
    "any": [
      "đăng ký thuế lần đầu",
      "thời hạn đăng ký thuế",
      "03-đkt",
      "03đkt",
      "mã số thuế lần đầu",
      "10 ngày làm việc",
      "đăng ký thuế cho hoạt động kinh doanh"
    ],
    "refs": [
      "16.64",
      "16.65"
    ],
    "expand": [
      "tax registration deadline NĐ 252"
    ],
    "priority": 80
  },
  {
    "id": "LATE_TAX_REG_PENALTY",
    "any": [
      "chậm đăng ký thuế",
      "quá hạn đăng ký thuế",
      "phạt chậm đăng ký",
      "đăng ký thuế muộn",
      "đăng ký muộn từ tháng"
    ],
    "refs": [
      "16.66",
      "16.65"
    ],
    "expand": [
      "late tax registration penalty Điều 10 NĐ 125"
    ],
    "priority": 80
  },
  {
    "id": "WRONG_REG_INFO",
    "any": [
      "khai sai hồ sơ đăng ký",
      "sai thông tin đăng ký thuế",
      "sai ngày bắt đầu kinh doanh",
      "khai sai chỉ tiêu"
    ],
    "refs": [
      "16.67"
    ],
    "expand": [
      "Điều 12 NĐ 125 wrong declaration"
    ],
    "priority": 75
  },
  {
    "id": "UNDERDECLARED_TAX",
    "any": [
      "khai thiếu thuế",
      "khai sai làm thiếu thuế",
      "phạt 20%",
      "truy thu thuế"
    ],
    "refs": [
      "16.68"
    ],
    "expand": [
      "Điều 16 NĐ 125 20 percent"
    ],
    "priority": 75
  },
  {
    "id": "NO_INVOICE_PENALTY",
    "any": [
      "không lập hóa đơn",
      "không xuất hóa đơn",
      "phạt không xuất hóa đơn",
      "số lượng hóa đơn",
      "quên xuất hóa đơn"
    ],
    "refs": [
      "16.69",
      "16.38"
    ],
    "expand": [
      "Điều 24 NĐ 125 per-invoice penalty"
    ],
    "priority": 80,
    "not": [
      "chưa đăng ký"
    ]
  },
  {
    "id": "TAX_ASSESSMENT",
    "any": [
      "ấn định thuế",
      "bị ấn định",
      "đầu vào cao hơn đầu ra",
      "đầu vào lớn hơn đầu ra"
    ],
    "refs": [
      "16.70"
    ],
    "expand": [
      "Điều 24 Luật 108 ấn định cases"
    ],
    "priority": 75
  },
  {
    "id": "YOUTUBE_REVENUE",
    "any": [
      "youtube",
      "adsense",
      "doanh thu youtube",
      "làm video",
      "thu nhập youtube"
    ],
    "refs": [
      "16.74"
    ],
    "expand": [
      "youtube revenue as business income"
    ],
    "priority": 75
  },
  {
    "id": "SPOUSE_TWO_HKD",
    "any": [
      "vợ chồng",
      "hai hộ kinh doanh",
      "2 hộ kinh doanh",
      "mỗi người một hộ",
      "chồng vợ"
    ],
    "refs": [
      "16.75",
      "16.8",
      "16.7"
    ],
    "expand": [
      "threshold per individual business person"
    ],
    "priority": 75
  },
  {
    "id": "THUE_SUAT_NGANH",
    "any": [
      "tỷ lệ gtgt",
      "tỷ lệ tncn",
      "bao nhiêu %",
      "bao nhiêu phần trăm",
      "tỷ lệ theo ngành",
      "tỷ lệ % trên doanh thu",
      "mỗi ngành",
      "doanh thu gộp",
      "cho thuê"
    ],
    "refs": [
      "16.77"
    ],
    "expand": [
      "industry tax rate table NĐ 68"
    ],
    "priority": 75,
    "not": [
      "2022",
      "2023",
      "2024",
      "2025"
    ]
  },
  {
    "id": "GIAM30_THUTUC",
    "any": [
      "mẫu giảm 30",
      "hồ sơ giảm 30",
      "thủ tục giảm 30",
      "kê khai giảm 30",
      "làm sao để được giảm 30",
      "điền tờ khai",
      "tờ khai giảm 30"
    ],
    "refs": [
      "16.78"
    ],
    "expand": [
      "NQ43 procedure pending"
    ],
    "priority": 75
  },
  {
    "id": "NGUONG_HDDT_PHAMVI",
    "any": [
      "tính vào ngưỡng",
      "cộng vào ngưỡng",
      "ngưỡng hđt",
      "ngưỡng hóa đơn"
    ],
    "refs": [
      "16.79"
    ],
    "expand": [
      "e-invoice threshold composition"
    ],
    "priority": 75
  },
  {
    "id": "HOAN_THUE",
    "any": [
      "hoàn thuế",
      "nộp thừa",
      "tiền thuế nộp thừa",
      "đề nghị hoàn",
      "lấy lại tiền thuế"
    ],
    "refs": [
      "16.51"
    ],
    "expand": [
      "tax refund overpayment"
    ],
    "priority": 75
  },
  {
    "id": "PLATFORM_MECHANISM",
    "any": [
      "hàng trả lại",
      "trả hàng",
      "đơn bị hủy",
      "đơn hủy",
      "sàn bù trừ",
      "bù trừ thuế",
      "sàn cấn trừ",
      "cấn trừ thuế sàn",
      "nđ 117",
      "nđ 252",
      "khấu trừ theo từng giao dịch"
    ],
    "refs": [
      "16.42"
    ],
    "expand": [
      "platform return offset mechanism"
    ],
    "priority": 70
  },
  {
    "id": "EINVOICE_REG_STATUS",
    "any": [
      "đã đăng ký hđt",
      "đã đăng ký hóa đơn",
      "chưa đăng ký hđt",
      "chưa đăng ký hóa đơn",
      "đăng ký hđt",
      "đăng ký hóa đơn điện tử"
    ],
    "not": [
      "thủ tục",
      "đăng ký ở đâu",
      "ở đâu đăng ký"
    ],
    "refs": [
      "16.58",
      "16.41"
    ],
    "expand": [
      "einvoice registration status slot"
    ],
    "priority": 90
  },
  {
    "id": "HAS_INPUT_INVOICE",
    "any": [
      "có hóa đơn đầu vào",
      "hóa đơn đầu vào"
    ],
    "not": [
      "không có hóa đơn đầu vào",
      "không có đầu vào"
    ],
    "refs": [
      "16.58"
    ],
    "expand": [
      "input invoice separation principle"
    ],
    "priority": 60
  },
  {
    "id": "WAGE_TAX_TABLE",
    "any": [
      "lương",
      "tiền công",
      "biểu thuế",
      "lũy tiến",
      "giảm trừ",
      "gia cảnh",
      "người phụ thuộc",
      "thu nhập tính thuế"
    ],
    "refs": [
      "16.81",
      "16.82"
    ],
    "expand": [
      "5-bracket progressive table 2026",
      "15.5m/6.2m deductions"
    ],
    "priority": 80,
    "not": [
      "hộ kinh doanh"
    ]
  },
  {
    "id": "WAGE_WITHHOLD_10PCT",
    "any": [
      "khấu trừ 10%",
      "khấu trừ thuế tncn",
      "vãng lai",
      "không ký hợp đồng",
      "hợp đồng dưới 3 tháng",
      "cam kết",
      "tt111",
      "thông tư 111",
      "5 triệu",
      "ngưỡng 5 triệu"
    ],
    "refs": [
      "16.83",
      "16.85"
    ],
    "expand": [
      "5m per payment threshold from 01/07/2026"
    ],
    "priority": 80
  },
  {
    "id": "WAGE_SETTLEMENT",
    "any": [
      "quyết toán",
      "ủy quyền quyết toán",
      "hoàn thuế",
      "08/UQ",
      "05/QTT",
      "hoàn thuế tncn"
    ],
    "refs": [
      "16.85",
      "16.86",
      "16.93"
    ],
    "expand": [
      "authorization conditions",
      "15m casual income rule"
    ],
    "priority": 80
  },
  {
    "id": "FREELANCER_WAGE_CLASS",
    "any": [
      "freelancer",
      "contractor",
      "thù lao",
      "không đăng ký kinh doanh",
      "làm cho công ty nước ngoài"
    ],
    "refs": [
      "16.84"
    ],
    "expand": [
      "service fee without business registration = wage income"
    ],
    "priority": 85,
    "not": [
      "đã đăng ký"
    ]
  },
  {
    "id": "RESIDENCY_183",
    "any": [
      "cư trú",
      "183 ngày",
      "không cư trú",
      "thu nhập từ nước ngoài",
      "thu nhập ở nước ngoài",
      "hiệp định",
      "tránh đánh thuế hai lần",
      "song thuế",
      "singapore"
    ],
    "refs": [
      "16.87",
      "16.94"
    ],
    "expand": [
      "residency criteria worldwide scope"
    ],
    "priority": 75
  },
  {
    "id": "REAL_ESTATE_TRANSFER_TAX",
    "any": [
      "chuyển nhượng nhà",
      "bán nhà",
      "nhà duy nhất",
      "sang tên",
      "chuyển nhượng đất",
      "nhà đất"
    ],
    "refs": [
      "16.88"
    ],
    "expand": [
      "2% transfer tax",
      "sole house exemption ND253"
    ],
    "priority": 80,
    "not": [
      "cho thuê"
    ]
  },
  {
    "id": "SECURITIES_CAPITAL",
    "any": [
      "chứng khoán",
      "cổ phiếu",
      "cổ tức",
      "chuyển nhượng vốn",
      "đầu tư vốn",
      "lợi tức"
    ],
    "refs": [
      "16.89"
    ],
    "expand": [
      "0.1% securities",
      "20% capital gain",
      "5% dividends"
    ],
    "priority": 80
  },
  {
    "id": "INHERIT_GIFT_PRIZE",
    "any": [
      "thừa kế",
      "quà tặng",
      "trúng thưởng",
      "bản quyền",
      "trúng số",
      "tài sản số",
      "vàng miếng"
    ],
    "refs": [
      "16.90"
    ],
    "expand": [
      "20m threshold",
      "10%/5%/0.1% rates"
    ],
    "priority": 80
  },
  {
    "id": "RENTAL_RATE_MIXED",
    "any": [
      "cho thuê"
    ],
    "refs": [
      "16.91",
      "16.92",
      "16.77"
    ],
    "expand": [
      "rental PIT formula",
      "mixed threshold PENDING"
    ],
    "priority": 85
  },
  {
    "id": "LE_PHI_MON_BAI",
    "any": [
      "môn bài",
      "thuế môn bài",
      "lệ phí môn bài",
      "mon bai",
      "thue mon bai",
      "le phi mon bai"
    ],
    "refs": [
      "16.97",
      "16.98"
    ],
    "expand": [
      "lệ phí môn bài hộ kinh doanh theo bậc doanh thu",
      "Nghị định 139/2016/NĐ-CP",
      "Nghị định 22/2020/NĐ-CP"
    ],
    "priority": 90
  },
  {
    "id": "DANG_KY_MST_888",
    "any": [
      "đăng ký 888",
      "đăng ký mã 888",
      "dang ky ma 888",
      "dang ky 888",
      "888 như thế nào",
      "888 nhu the nao",
      "cách đăng ký 888",
      "hướng dẫn đăng ký 888",
      "thủ tục đăng ký 888",
      "đăng ký mã số thuế 888",
      "đã có mst 10 số",
      "da co mst 10 so",
      "có cần đăng ký 888",
      "co can dang ky 888",
      "có cần 888",
      "co can 888",
      "có cần mã 888",
      "co can ma 888",
      "cccd có cần 888",
      "cccd co can 888",
      "đã có cccd",
      "da co cccd",
      "bắt buộc đăng ký mã 888",
      "bat buoc dang ky ma 888",
      "bắt buộc mã 888",
      "bat buoc ma 888"
    ],
    "refs": [
      "16.100",
      "16.96"
    ],
    "expand": [
      "thủ tục đăng ký mã 888 từng bước Cổng thuế TMĐT",
      "CV 311/TCT-DNNCN-2025"
    ],
    "priority": 95
  },
  {
    "id": "CHON_HKD_CNKD",
    "any": [
      "cnkd",
      "hkd hay",
      "hay cnkd",
      "ca nhan kinh doanh hay",
      "nên đăng ký hkd",
      "nen dang ky hkd",
      "nên đăng ký cnkd",
      "nen dang ky cnkd",
      "mở hộ kinh doanh hay",
      "mo ho kinh doanh hay",
      "chon dang ky hkd",
      "chọn đăng ký hkd"
    ],
    "refs": [
      "16.7",
      "16.8",
      "16.107"
    ],
    "priority": 80
  }
];

export const CANONICAL_CHUNKS: RagChunk[] = [
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1008",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.1. Cầm đồ: doanh thu không phải toàn bộ dòng tiền gốc vay",
    "ref_id": "16.1",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.1. Cầm đồ: doanh thu không phải toàn bộ dòng tiền gốc vay\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- **Quy tắc đã xác minh về GTGT:** theo khoản 4 Điều 11 NĐ 181/2025/NĐ-CP, với dịch vụ cầm đồ, giá tính thuế GTGT là **số tiền phải thu từ dịch vụ cầm đồ chưa có GTGT**; khoản phải thu này bao gồm **tiền lãi phải thu từ cho vay cầm đồ và khoản thu khác phát sinh từ việc bán hàng cầm đồ (nếu có)**.\n- Vì vậy, **tiền gốc HKD giao cho khách khi cho vay và khoản khách hoàn trả tiền gốc không tự thân là doanh thu dịch vụ cầm đồ**. Không được cộng toàn bộ dòng tiền giải ngân/thu nợ vào doanh thu chỉ vì tiền đi qua tài khoản.\n- Nếu có xử lý/bán tài sản cầm cố, phải hạch toán và phân loại khoản thu đó theo đúng quy định về cầm đồ, quyền sở hữu/xử lý tài sản và Điều 11 nêu trên; không được tự động coi toàn bộ giá bán là tiền lãi.\n- **TNCN của HKD:** phải áp cơ chế HKD năm 2026 theo NĐ 68/2026 đã được NĐ 141/2026 sửa đổi, dựa trên doanh thu kinh doanh thực tế và phương pháp TNCN tương ứng với mức doanh thu. Không lấy tiền gốc cho vay/thu hồi làm doanh thu TNCN chỉ vì đó là dòng tiền vào/ra.\n- **Hồ sơ nên giữ:** hợp đồng/phiếu cầm đồ, bảng theo dõi tiền gốc - lãi - phí, chứng từ giải ngân/thu nợ, hồ sơ xử lý tài sản và sao kê đối chiếu.\n- **Điểm AI phải hỏi thêm trước khi tính số thuế:** doanh thu năm, phương pháp tính TNCN, cơ cấu lãi/phí, có xử lý tài sản hay không và khoản thu xử lý tài sản là gì.\n- Nguồn:\n  - NĐ 181/2025/NĐ-CP (Điều 11 - giá tính thuế GTGT dịch vụ cầm đồ): https://xaydungchinhsach.chinhphu.vn/nghi-dinh-181-2025-nd-cp-quy-dinh-chi-tiet-thi-hanh-mot-so-dieu-cua-luat-thue-gia-tri-gia-tang-119250707172930626.htm\n  - Lưu ý cập nhật 26/09/2026: NĐ 181/2025 đã bị sửa đổi, bổ sung bởi NĐ 144/2026/NĐ-CP (hiệu lực 20/06/2026) ở Điều 3, Điều 26 và Phụ lục I, II — không chạm đến Điều 11 nên kết luận về giá tính thuế dịch vụ cầm đồ ở trên vẫn giữ nguyên.\n  - NĐ 68/2026/NĐ-CP: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-68-2026-nd-cp-quy-dinh-ve-chinh-sach-thue-quan-ly-thue-voi-ho-kinh-doanh-119260306102906789.htm\n  - NĐ 141/2026/NĐ-CP nâng ngưỡng doanh thu lên 1 tỷ từ 01/01/2026."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1009",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.2. Mua nông sản rồi sơ chế/chế biến",
    "ref_id": "16.2",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.2. Mua nông sản rồi sơ chế/chế biến\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Phải tách 3 tình huống:\n  1. **Người tự sản xuất nông nghiệp** bán sản phẩm chưa chế biến hoặc chỉ qua sơ chế thông thường: thuộc nhóm ưu đãi/không chịu GTGT và miễn TNCN nếu đáp ứng đầy đủ điều kiện luật định.\n  2. **HKD mua của nông dân rồi bán lại nguyên trạng/không tạo sản phẩm mới:** về bản chất là phân phối hàng hóa; không được tự nhận ưu đãi “người trực tiếp sản xuất”.\n  3. **HKD mua nguyên liệu rồi xay, nghiền, gia công, chế biến thành sản phẩm khác:** về nguyên tắc phải xét nhóm sản xuất/gia công/chế biến. Nếu sản phẩm đầu ra đáp ứng định nghĩa **thức ăn chăn nuôi** theo pháp luật chăn nuôi thì chính sách GTGT của thức ăn chăn nuôi được ưu tiên áp dụng.\n- Ví dụ bắp mua của nông dân rồi xay thành bột/mảnh để bán làm thức ăn chăn nuôi: không đủ dữ kiện để chốt chỉ bằng từ “bắp”; cần kiểm tra sản phẩm đầu ra có phải thức ăn chăn nuôi theo pháp luật chuyên ngành và HKD có thực hiện hoạt động chế biến hay chỉ mua bán.\n- Nguồn: VBHN 114/VBHN-VPQH Luật GTGT:\n  https://xaydungchinhsach.chinhphu.vn/van-ban-hop-nhat-114-vbhn-vpqh-hop-nhat-luat-thue-gia-tri-gia-tang-119260605094756577.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1010",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.3. Mua heo hơi, thuê lò mổ rồi bán thịt",
    "ref_id": "16.3",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.3. Mua heo hơi, thuê lò mổ rồi bán thịt\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Nếu HKD **tự chăn nuôi** và bán sản phẩm chăn nuôi chưa chế biến thành sản phẩm khác hoặc chỉ qua sơ chế thông thường, cần kiểm tra điều kiện ưu đãi dành cho người trực tiếp sản xuất.\n- Nếu HKD **mua heo của người khác**, không được tự áp dụng ưu đãi dành cho người trực tiếp chăn nuôi.\n- Việc thuê lò mổ không làm doanh thu của HKD trở thành “dịch vụ giết mổ”. Lò mổ cung cấp dịch vụ cho HKD; doanh thu bán thịt của HKD phải phân loại theo hoạt động thực tế của HKD:\n  - chỉ mua/bán hàng hóa sau thao tác thông thường → hướng phân phối;\n  - tổ chức quá trình sản xuất/chế biến đầu vào thành sản phẩm bán ra → hướng sản xuất/chế biến.\n- Vì vậy không được chốt 1,5% hay 4,5% chỉ từ câu “thuê giết mổ”; cần xem quy trình, hợp đồng, hóa đơn đầu vào và sản phẩm đầu ra.\n- Nguồn: VBHN 114/VBHN-VPQH Luật GTGT và bảng tỷ lệ ngành của chính sách HKD 2026.\n- CROSS_REFERENCE: 16.49 (bảng tỷ lệ ngành theo NĐ 68/2026, có nguồn chính thức); nguyên tắc doanh thu TNCN theo Điều 5 NĐ 68/2026: https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1011",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.4. Cung cấp nhân công/nhân lực cho công trình",
    "ref_id": "16.4",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.4. Cung cấp nhân công/nhân lực cho công trình\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Nếu hợp đồng thực chất là **cung cấp dịch vụ nhân công/xây dựng không bao thầu nguyên vật liệu**, doanh thu thuộc nhóm dịch vụ/xây dựng không bao thầu NVL; khi áp phương pháp tỷ lệ trên doanh thu thì sử dụng tỷ lệ của nhóm này.\n- Nếu HKD nhận **trọn gói thi công có bao thầu vật tư**, phải phân loại sang nhóm xây dựng có bao thầu nguyên vật liệu.\n- Thuế không thay thế nghĩa vụ lao động/BHXH. Nếu HKD trực tiếp thuê, quản lý và trả lương người lao động thì phải kiểm tra riêng quan hệ lao động, hợp đồng, chấm công, tiền lương và BHXH.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/thue-suat-doi-voi-cac-hoat-dong-kinh-doanhcua-ho-kinh-doanh-119260407103211289.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1012",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.5. Sang nhượng sạp/quyền kinh doanh tại chợ",
    "ref_id": "16.5",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.5. Sang nhượng sạp/quyền kinh doanh tại chợ\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Không có một “thuế suất sang nhượng sạp” dùng cho mọi trường hợp. Phải xác định **tài sản/quyền nào được chuyển giao**:\n  - bán hàng hóa, thiết bị, tài sản của cơ sở;\n  - chuyển nhượng quyền thuê/quyền sử dụng điểm kinh doanh theo hợp đồng với đơn vị quản lý chợ;\n  - chuyển giao cả hoạt động kinh doanh;\n  - hoặc quyền liên quan bất động sản/tài sản phải đăng ký.\n- Chỉ sau khi xác định đúng đối tượng chuyển giao mới xác định doanh thu, loại thuế, hóa đơn và hồ sơ. AI phải hỏi hợp đồng thuê sạp/quyết định bố trí sạp và hợp đồng sang nhượng; **không được lấy giá ghi miệng hoặc một tỷ lệ thuế chung để chốt**.\n- CROSS_REFERENCE: 16.36 (bán tài sản phải đăng ký quyền sở hữu/quyền sử dụng — quy tắc HĐĐT riêng theo NĐ 254/2026). Nguồn chính thức về trường hợp không phải sử dụng HĐĐT theo NĐ 254/2026: https://xaydungchinhsach.chinhphu.vn/truong-hop-nao-khong-phai-su-dung-hoa-don-dien-tu-119260716095423868.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1013",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.6. Chủ HKD có được giảm trừ gia cảnh vào thu nhập kinh doanh?",
    "ref_id": "16.6",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.6. Chủ HKD có được giảm trừ gia cảnh vào thu nhập kinh doanh?\n- **LEGAL_STATUS:** `VERIFIED`.\n- **Không.** Giảm trừ gia cảnh theo Điều 10 Luật TNCN 109/2025/QH15 được trừ khi tính thuế đối với **thu nhập từ tiền lương, tiền công** của cá nhân cư trú, không phải khoản giảm trừ chung cho thu nhập từ kinh doanh.\n- Do đó không lấy 15,5 triệu/tháng của bản thân hoặc 6,2 triệu/tháng/người phụ thuộc để trừ trực tiếp khỏi thu nhập kinh doanh của HKD.\n- Nếu cùng cá nhân vừa có lương vừa kinh doanh, giảm trừ gia cảnh xử lý ở phần thu nhập tiền lương/tiền công theo điều kiện luật định.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/quy-dinh-giam-tru-gia-canh-trong-thue-thu-nhap-ca-nhan-119260327071750084.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1014",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.7. Một cá nhân có được đứng tên 2 HKD?",
    "ref_id": "16.7",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.7. Một cá nhân có được đứng tên 2 HKD?\n- **LEGAL_STATUS:** `VERIFIED`.\n- **Không.** Khoản 1 Điều 83 Nghị định 168/2025/NĐ-CP: cá nhân/thành viên hộ gia đình thuộc đối tượng thành lập HKD **chỉ được đăng ký một hộ kinh doanh trong phạm vi toàn quốc**.\n- Một HKD có thể đăng ký nhiều ngành nghề và có nhiều địa điểm kinh doanh theo quy định; không cần tạo HKD thứ hai chỉ để tách kênh bán.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-168-2025-nd-cp-ve-dang-ky-doanh-nghiep-119250702175708554.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1015",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.8. Vợ và chồng mỗi người một HKD tại cùng địa chỉ",
    "ref_id": "16.8",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.8. Vợ và chồng mỗi người một HKD tại cùng địa chỉ\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- NĐ 168/2025/NĐ-CP giới hạn **mỗi cá nhân một HKD**, không đặt một lệnh cấm chung rằng hai cá nhân là vợ chồng không được mỗi người đăng ký một HKD.\n- Cùng một địa chỉ không tự động làm hồ sơ bất hợp pháp; vẫn phải bảo đảm địa chỉ được phép kinh doanh, điều kiện ngành nghề, thông tin đăng ký và hoạt động thực tế của từng HKD.\n- Về thuế, không được tự động cộng doanh thu của vợ và chồng chỉ vì quan hệ hôn nhân. Tuy nhiên nếu thực tế là **một hoạt động kinh doanh bị chia hình thức** để né ngưỡng/nghĩa vụ thuế thì cơ quan thuế có quyền quản lý theo bản chất giao dịch và dữ liệu thực tế.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-168-2025-nd-cp-ve-dang-ky-doanh-nghiep-119250702175708554.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1016",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.9. Tài khoản ngân hàng/ví điện tử của HKD",
    "ref_id": "16.9",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.9. Tài khoản ngân hàng/ví điện tử của HKD\n- **LEGAL_STATUS:** `VERIFIED`.\n- HKD **có thể sử dụng nhiều tài khoản ngân hàng hoặc ví điện tử** để nhận tiền; pháp luật thuế không bắt buộc chỉ dùng một tài khoản duy nhất.\n- HKD phải thông báo với cơ quan thuế **tất cả tài khoản/ví liên quan đến hoạt động sản xuất, kinh doanh** và kê khai đầy đủ doanh thu từ mọi kênh.\n- Chuyển tiền giữa tài khoản dùng cho kinh doanh và tài khoản của chủ hộ không tự động là doanh thu mới; phải ghi nội dung và lưu chứng từ để phân biệt doanh thu, góp vốn, rút tiền, hoàn ứng, chi hộ...\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-co-the-su-dung-nhieu-tai-khoan-ngan-hang-nhan-tien-tu-cac-kenh-ban-hang-khac-nhau-11926072216591801.htm\n  https://xaydungchinhsach.chinhphu.vn/huong-dan-ho-kinh-doanh-thong-bao-so-tai-khoan-ngan-hang-so-hieu-vi-dien-tu-tren-ung-dung-etax-mobile-119260413154428966.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1017",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.10. Hợp đồng cho thuê dài hạn chấm dứt trước thời hạn",
    "ref_id": "16.10",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.10. Hợp đồng cho thuê dài hạn chấm dứt trước thời hạn\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Nghĩa vụ thuế phải bám **doanh thu thực tế và kỳ phát sinh**. Nếu hợp đồng 5 năm chấm dứt sau 3 năm, cần có biên bản/thỏa thuận thanh lý và thực hiện khai bổ sung/điều chỉnh hồ sơ liên quan để phản ánh phần doanh thu thực tế.\n- Nếu việc điều chỉnh làm phát sinh **tiền thuế nộp thừa**, xử lý theo cơ chế bù trừ/hoàn nộp thừa của pháp luật quản lý thuế; không giữ nguyên nghĩa vụ cho khoản tiền 2 năm còn lại mà người cho thuê không có quyền hưởng.\n- Nếu tiền thuê đã thu trước nhưng phải hoàn lại khi thanh lý thì chứng từ hoàn tiền là phần quan trọng của hồ sơ.\n- Nguồn nền:\n  https://xaydungchinhsach.chinhphu.vn/chinh-sach-moi-ve-thue-voi-ho-ca-nhan-cho-thue-bat-dong-san-119260312092953897.htm\n  https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-252-2026-nd-cp-huong-dan-thi-hanh-luat-quan-ly-thue-119260715155021635.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1018",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.11. HKD mua SaaS/tool/quảng cáo của nhà cung cấp nước ngoài",
    "ref_id": "16.11",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.11. HKD mua SaaS/tool/quảng cáo của nhà cung cấp nước ngoài\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- **Không được mặc định** mọi SaaS đều chịu “GTGT 5% + TNDN 5%”, nhưng cũng **không được kết luận HKD luôn không phải khấu trừ/nộp thay** khi nhà cung cấp chưa thực hiện nghĩa vụ tại Việt Nam.\n- Quy trình xác định:\n  1. **Xác định cơ chế của nhà cung cấp:** nếu là nhà cung cấp nước ngoài thuộc cơ chế đăng ký/kê khai trực tiếp tại Việt Nam và đã thực hiện đúng nghĩa vụ cho doanh thu tại Việt Nam, bên mua không nộp trùng cùng nghĩa vụ. Nếu giao dịch qua nền tảng thuộc diện nền tảng khấu trừ/nộp thay thì kiểm tra chứng từ của nền tảng.\n  2. **Nếu là hợp đồng trực tiếp với nhà thầu nước ngoài:** Điều 30 TT 89/2026/TT-BTC vẫn quy định Bên Việt Nam ký hợp đồng với nhà thầu nước ngoài thực hiện khấu trừ, nộp thay trong trường hợp thuộc cơ chế này. Khái niệm Bên Việt Nam của cơ chế thuế nhà thầu bao gồm cả cá nhân sản xuất, kinh doanh tại Việt Nam; vì vậy HKD không được mặc định miễn trách nhiệm chỉ vì không phải doanh nghiệp.\n  3. **Phân loại SaaS:** nếu dịch vụ đáp ứng định nghĩa **dịch vụ phần mềm** theo pháp luật Việt Nam thì thuộc đối tượng **không chịu GTGT**. Nếu không phải dịch vụ phần mềm thì phải xác định mức GTGT theo bản chất dịch vụ.\n  4. **Phân loại thu nhập TNDN của bên nước ngoài:** dịch vụ phần mềm/dịch vụ thông thường và **tiền bản quyền** có thể áp tỷ lệ TNDN khác nhau; phải đọc điều khoản quyền sử dụng, chuyển giao quyền sở hữu trí tuệ và phạm vi license. Không suy từ chữ “SaaS” ra một tỷ lệ duy nhất.\n  5. **Hợp đồng NET:** nếu bên Việt Nam chịu thuế thay để nhà cung cấp nhận đủ giá NET, doanh thu tính thuế phải xác định theo quy tắc gross-up tương ứng của cơ chế thuế nhà thầu.\n- **Kết luận thực hành:** trước khi nộp thay, kiểm tra (a) nhà cung cấp có MST/đăng ký trực tiếp tại Việt Nam không; (b) hóa đơn/chứng từ thuế hoặc cơ chế nền tảng; (c) hợp đồng có phải nhà thầu trực tiếp hay giao dịch nền tảng; (d) SaaS có phải dịch vụ phần mềm và có yếu tố bản quyền không.\n- Nguồn:\n  - NĐ 252/2026/NĐ-CP (cơ chế đăng ký của nhà cung cấp nước ngoài): https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-252-2026-nd-cp-huong-dan-thi-hanh-luat-quan-ly-thue-119260715155021635.htm\n  - TT 89/2026/TT-BTC, Điều 30-31 (khai thuế nhà thầu/NCCNN): https://vanban.chinhphu.vn/?classid=1&docid=218974&orggroupid=4&pageid=27160\n  - Luật GTGT hợp nhất - sản phẩm/dịch vụ phần mềm thuộc nhóm không chịu GTGT: https://xaydungchinhsach.chinhphu.vn/van-ban-hop-nhat-114-vbhn-vpqh-hop-nhat-luat-thue-gia-tri-gia-tang-119260605094756577.htm\n  - TT 103/2014/TT-BTC đã bị thay thế (TT 89/2026 từ 01/07/2026; phần TNDN bởi TT 20/2026 từ 12/03/2026 — kiểm chứng 26/09/2026); phân loại Bên Việt Nam và tỷ lệ thuế nhà thầu hiện tra theo Điều 30-31 TT 89/2026 và luật thuế hiện hành."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1019",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.12. Đăng ký/thay đổi người phụ thuộc trên eTax Mobile",
    "ref_id": "16.12",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.12. Đăng ký/thay đổi người phụ thuộc trên eTax Mobile\n- **LEGAL_STATUS:** `VERIFIED` cho quy trình được cơ quan thuế công bố; giao diện có thể thay đổi nên phải ghi ngày kiểm tra.\n- Hướng dẫn Cục Thuế/Thuế Hà Nội công bố tháng 5/2026:\n  1. `Đăng ký thuế`\n  2. `Kê khai hồ sơ đăng ký thuế` – mã TTHC `1.008499`\n  3. Chọn đăng ký lần đầu hoặc thay đổi thông tin nếu đã có mã số thuế\n  4. Nhập thông tin người phụ thuộc\n  5. Xác nhận OTP\n  6. Kiểm tra thông báo nộp hồ sơ thành công.\n- Nếu chỉ cập nhật thông tin định danh người phụ thuộc, có thể dùng chức năng tra cứu/cập nhật thông tin người phụ thuộc theo hướng dẫn eTax Mobile.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/huong-dan-dang-ky-moi-thay-doi-thong-tin-nguoi-phu-thuoc-tren-etax-mobile-119260317091940213.htm\n  https://xaydungchinhsach.chinhphu.vn/huong-dan-cap-nhat-thong-tin-nguoi-phu-thuoc-tren-etax-mobile-119260316170710976.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1020",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.13. Mua bán điện thoại cũ",
    "ref_id": "16.13",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.13. Mua bán điện thoại cũ\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Nếu HKD chỉ mua điện thoại cũ rồi bán lại, hoạt động chính là **phân phối/cung cấp hàng hóa**. Với HKD trên 1 tỷ đến 3 tỷ chọn phương pháp TNCN theo tỷ lệ doanh thu, áp tỷ lệ của nhóm phân phối hàng hóa; GTGT tính theo tỷ lệ của nhóm phân phối trên doanh thu chịu thuế.\n- Nguồn hàng mua từ cá nhân không có hóa đơn phải có hồ sơ chứng minh nguồn gốc, thông tin người bán, hàng hóa, giá trị và chứng từ thanh toán; trường hợp đủ điều kiện có thể lập bảng kê theo chế độ kế toán HKD.\n- Nếu HKD đồng thời sửa chữa, thay linh kiện, tân trang thu phí thì phải tách doanh thu dịch vụ nếu xác định được.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/thue-suat-doi-voi-cac-hoat-dong-kinh-doanhcua-ho-kinh-doanh-119260407103211289.htm\n  https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-mua-hang-tu-ca-nhan-kinh-doanh-co-doanh-thu-duoi-500-trieu-dong-nam-khong-hoa-don-co-duoc-phep-lap-bang-ke-mua-hang-119260312204259799.htm\n- Lưu ý: bài hướng dẫn bảng kê tháng 4/2026 còn ghi ngưỡng 500 triệu; từ NĐ 141/2026 phải đọc ngưỡng tương ứng là 1 tỷ."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1021",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.14. HKD/cá nhân trực tiếp chăn nuôi lợn thịt",
    "ref_id": "16.14",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.14. HKD/cá nhân trực tiếp chăn nuôi lợn thịt\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Thu nhập của hộ gia đình/cá nhân **trực tiếp sản xuất nông nghiệp, chăn nuôi** từ sản phẩm chưa chế biến thành sản phẩm khác hoặc chỉ qua sơ chế thông thường thuộc diện ưu đãi/miễn TNCN theo điều kiện của Luật TNCN; sản phẩm chăn nuôi do chính tổ chức/cá nhân sản xuất bán ra cũng thuộc nhóm không chịu GTGT theo Luật GTGT.\n- Điều kiện “trực tiếp sản xuất” rất quan trọng. Hộ mua lợn của người khác để kinh doanh lại không được suy ra cùng cơ chế.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/van-ban-hop-nhat-114-vbhn-vpqh-hop-nhat-luat-thue-gia-tri-gia-tang-119260605094756577.htm\n  Luật TNCN 109/2025/QH15 và NĐ 253/2026/NĐ-CP."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1022",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.15. Homestay/lưu trú",
    "ref_id": "16.15",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.15. Homestay/lưu trú\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- **Kinh doanh lưu trú ngắn hạn không đồng nhất với cho thuê bất động sản.** Chính sách cho thuê BĐS hiện hành nêu rõ hoạt động cho thuê BĐS không bao gồm dịch vụ lưu trú.\n- Homestay cung cấp chỗ ở ngắn hạn và các tiện ích phục vụ khách về nguyên tắc là **dịch vụ lưu trú**; khi áp phương pháp tỷ lệ doanh thu phải dùng nhóm dịch vụ phù hợp, không lấy tỷ lệ “cho thuê bất động sản” chỉ vì tài sản là nhà.\n- Nếu doanh thu bao gồm ăn uống, tour, vận chuyển… và tách được từng hoạt động thì tính theo từng nhóm tương ứng.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/luu-y-ve-thue-voi-ho-kinh-doanh-cho-thue-bat-dong-san-119251201163934708.htm\n  https://xaydungchinhsach.chinhphu.vn/thue-suat-doi-voi-cac-hoat-dong-kinh-doanhcua-ho-kinh-doanh-119260407103211289.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1023",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.16. Hóa đơn GTGT đầu vào của HKD có được khấu trừ/hoàn?",
    "ref_id": "16.16",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.16. Hóa đơn GTGT đầu vào của HKD có được khấu trừ/hoàn?\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- HKD theo cơ chế GTGT **tỷ lệ trực tiếp trên doanh thu** không sử dụng hóa đơn GTGT đầu vào để khấu trừ thuế đầu vào như doanh nghiệp áp dụng phương pháp khấu trừ.\n- Hóa đơn/chứng từ đầu vào vẫn rất quan trọng để chứng minh nguồn gốc hàng hóa và, khi HKD tính TNCN theo **thu nhập (doanh thu - chi phí)**, để chứng minh chi phí được trừ nếu đáp ứng điều kiện.\n- Không được trả lời “có hóa đơn GTGT đầu vào thì được hoàn/khấu trừ” nếu HKD không thuộc phương pháp/đối tượng hoàn theo Luật GTGT.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/nghi-dinh-181-2025-nd-cp-quy-dinh-chi-tiet-thi-hanh-mot-so-dieu-cua-luat-thue-gia-tri-gia-tang-119250707172930626.htm\n  https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-68-2026-nd-cp-quy-dinh-ve-chinh-sach-thue-quan-ly-thue-voi-ho-kinh-doanh-119260306102906789.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1024",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.17. Giao dịch cũ chưa lập hóa đơn / lập hóa đơn muộn",
    "ref_id": "16.17",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.17. Giao dịch cũ chưa lập hóa đơn / lập hóa đơn muộn\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Việc đã bỏ sót thời điểm lập hóa đơn **không làm mất nghĩa vụ lập hóa đơn**. Không được backdate hoặc xóa dấu vết giao dịch để “làm cho đúng ngày”.\n- Phải lập/xử lý hóa đơn theo NĐ 254/2026 và TT 91/2026 tại thời điểm phát hiện, đồng thời đánh giá nghĩa vụ khai bổ sung và rủi ro xử phạt do lập hóa đơn không đúng thời điểm.\n- Cách xử lý chi tiết phụ thuộc giao dịch xảy ra trước hay sau 01/07/2026 và loại hóa đơn; AI phải hỏi ngày giao dịch/ngày hoàn thành dịch vụ trước khi hướng dẫn thao tác.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-254-2026-nd-cp-ve-hoa-don-dien-tu-chung-tu-dien-tu-119260713164251972.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1025",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.18. Khách trả lại hàng sau khi đã lập hóa đơn",
    "ref_id": "16.18",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.18. Khách trả lại hàng sau khi đã lập hóa đơn\n- **LEGAL_STATUS:** `VERIFIED`.\n- Từ 01/07/2026, theo điểm c khoản 5 Điều 10 TT 91/2026/TT-BTC: khi người mua trả lại toàn bộ hoặc một phần hàng hóa (kể cả đổi hàng làm thay đổi giá trị), **người bán lập hóa đơn điều chỉnh**.\n- Ngoại lệ: nếu các bên thỏa thuận người mua lập hóa đơn khi trả lại thì người mua lập HĐĐT giao người bán; với tài sản phải đăng ký quyền sở hữu/quyền sử dụng đã đăng ký tên người mua còn có quy tắc riêng.\n- Người bán và người mua phải lưu đầy đủ hồ sơ/chứng từ liên quan việc trả hàng; nghĩa vụ thuế được điều chỉnh theo chứng từ/hóa đơn xử lý.\n- Không dùng cách “xóa hóa đơn cũ rồi giả như chưa bán”.\n- Nguồn:\n  - TT 91/2026/TT-BTC (hiệu lực 01/07/2026): https://vanban.chinhphu.vn/?docid=219006&pageid=27160\n  - NĐ 254/2026/NĐ-CP: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-254-2026-nd-cp-ve-hoa-don-dien-tu-chung-tu-dien-tu-119260713164251972.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1026",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.19. Mua hàng từ người dân/cá nhân không có hóa đơn",
    "ref_id": "16.19",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.19. Mua hàng từ người dân/cá nhân không có hóa đơn\n- **LEGAL_STATUS:** `VERIFIED`.\n- HKD được phép lập **bảng kê mua hàng hóa/dịch vụ** trong các trường hợp người bán không thuộc diện lập hóa đơn theo hướng dẫn áp dụng; bảng kê cần có tối thiểu thông tin định danh người bán, địa chỉ, hàng hóa, số lượng, giá trị và hình thức thanh toán.\n- Phải lưu chứng từ thanh toán và hồ sơ liên quan. Bảng kê **không phải giấy phép hợp thức hóa hàng không rõ nguồn gốc**; vẫn phải chứng minh giao dịch thực tế và nguồn gốc theo pháp luật chuyên ngành.\n- Với khoản thanh toán từng lần từ ngưỡng pháp luật yêu cầu thanh toán không dùng tiền mặt để được tính chi phí, phải đáp ứng điều kiện thanh toán tương ứng.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-mua-hang-tu-ca-nhan-kinh-doanh-co-doanh-thu-duoi-500-trieu-dong-nam-khong-hoa-don-co-duoc-phep-lap-bang-ke-mua-hang-119260312204259799.htm\n  https://xaydungchinhsach.chinhphu.vn/quy-dinh-moi-ve-thue-va-hoa-don-dien-tu-trong-thuong-mai-dien-tu-va-ban-hang-da-kenh-119260717133903995.htm\n- Lưu ý cập nhật ngưỡng 500 triệu trong bài tháng 4 thành 1 tỷ theo NĐ 141/2026."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1027",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.20. Affiliate: phân loại theo nền tảng — ưu tiên CV 7403 cho affiliate trên TMĐT",
    "ref_id": "16.20",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[PHẠM VI NGUỒN CŨ] Nhánh bên dưới cho rằng chưa đăng ký kinh doanh đồng nghĩa tiền công là hướng dẫn theo tình huống/nguồn cũ, KHÔNG phải quy tắc phân loại chung cho mọi affiliate năm 2026. Không áp nhánh này chỉ từ việc chưa có giấy đăng ký. Phải đối chiếu quan hệ lao động/dịch vụ thực tế, kỳ áp dụng và hướng dẫn trong 16.95; không lấy ngày ban hành công văn làm ngày luật tự đổi phân loại.\n16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.20. Affiliate: phân loại theo nền tảng — ưu tiên CV 7403 cho affiliate trên TMĐT\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — chốt đúng chỉ khi xác định được affiliate diễn ra **trên hay ngoài nền tảng TMĐT**.\n- **Quy tắc ưu tiên (cập nhật 12/10/2026):** tiếp thị liên kết **trên nền tảng TMĐT** (TikTok Shop, Shopee...) áp dụng **Công văn 7403/CT-TMĐT (06/10/2026)** — xem **16.95**: là **thu nhập từ kinh doanh** (không phải tiền công), thuế suất TNCN **5% trên doanh thu khi thuộc diện phải nộp thuế**; trước tiên phải xét ngưỡng doanh thu của đúng năm, chủ quản nền tảng có chức năng đặt hàng + thanh toán phải khấu trừ/khai thay/nộp thay theo Điều 43 NĐ 252/2026/NĐ-CP. CV 7403 không đặt điều kiện \"đã đăng ký hay chưa\" cho phân loại này; hệ quả là người làm affiliate phải đăng ký thuế, kê khai, nộp thuế theo NĐ 68/2026/NĐ-CP và NĐ 141/2026/NĐ-CP.\n- Công văn 7403 ban hành ngày 06/10/2026 là văn bản hướng dẫn, không tự tạo ra mốc đổi cách tính thuế vào ngày đó. Với thu nhập năm 2025, xác định theo quy định và bản chất khoản chi trả của năm 2025; với thu nhập năm 2026, xét theo quy định áp dụng cho năm 2026. Decision tree theo giải đáp Cục Thuế 23/07/2026 và CV 1241/CTCBA-TTHT 2024 dùng khi cần phân loại theo quan hệ thực tế, đặc biệt với affiliate ngoài nền tảng TMĐT:\n  - nếu cá nhân **không đăng ký kinh doanh/đăng ký thuế** cho hoạt động affiliate trong tình huống được hỏi, khoản hoa hồng có tính chất tiền lương, tiền công và bên chi trả có trách nhiệm khấu trừ/nộp thay theo quy định;\n  - nếu đã đăng ký kinh doanh/đăng ký thuế đúng hoạt động, tiền hoa hồng là **doanh thu kinh doanh**; cách khai/nộp tiếp theo phụ thuộc tổng doanh thu và phương pháp TNCN.\n- Không được lấy bài cộng đồng “affiliate mặc định 7%” hay “booking mặc định 10%” làm đáp án. Phải phân biệt hoa hồng tiếp thị liên kết, quảng cáo số/KOL booking, creator revenue, bán hàng của chính mình và các nguồn khác.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/lam-tiep-thi-lien-ket-ban-hang-huong-hoa-hong-tren-san-tmdt-can-khai-thue-nhu-the-nao-119260723160309548.htm\n  https://xaydungchinhsach.chinhphu.vn/cach-ke-khai-thue-xuat-hoa-don-voi-ho-kinh-doanh-tiep-thi-lien-ket-119260407163142252.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1028",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.21. HĐĐT điều chỉnh/thay thế sau 01/07/2026",
    "ref_id": "16.21",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.21. HĐĐT điều chỉnh/thay thế sau 01/07/2026\n- **LEGAL_STATUS:** `VERIFIED`.\n- Từ 01/07/2026, ưu tiên NĐ 254/2026/NĐ-CP và TT 91/2026/TT-BTC khi xử lý hóa đơn sai, điều chỉnh, thay thế, trả hàng và truyền dữ liệu.\n- Không áp máy móc quy trình NĐ 123/2020/NĐ-CP hoặc TT 78/2021/TT-BTC nếu quy định đã được thay thế.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-254-2026-nd-cp-ve-hoa-don-dien-tu-chung-tu-dien-tu-119260713164251972.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1029",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.22. COD và phí ship thu hộ",
    "ref_id": "16.22",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.22. COD và phí ship thu hộ\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — với **giới hạn đã ghi nhận 06/10/2026** (xem đoạn GIỚI HẠN bên dưới).\n- Không quyết định doanh thu chỉ bằng số tiền COD chuyển vào tài khoản.\n- Nếu phí ship thực sự là khoản **thu hộ cho đơn vị vận chuyển**, có hợp đồng/đơn hàng/đối soát và hóa đơn vận chuyển thể hiện bên vận chuyển là bên cung cấp dịch vụ, khoản thu hộ không phải doanh thu mà HKD được hưởng.\n- Nếu HKD tự thu phí giao hàng như một phần giá bán/dịch vụ của mình rồi tự thuê hãng vận chuyển, khoản thu từ khách có thể là doanh thu của HKD.\n- Vì vậy case “hàng 100k + ship 30k + COD 130k” chỉ chốt doanh thu 100k khi chứng minh được 30k là thu hộ; không có quyền tự chọn 100k hay 130k theo phương án “an toàn hơn”.\n- **GIỚI HẠN 06/10/2026 (hạ kết luận):** Điều 7 NĐ 254/2026/NĐ-CP chỉ quy định về **nghĩa vụ SỬ DỤNG HĐĐT** (khoản thu hộ thuộc trường hợp không phải sử dụng HĐĐT), **không chứng minh** khoản đó được loại khỏi **DOANH THU TÍNH THUẾ**. Muốn loại khỏi doanh thu tính thuế phải đồng thời có: (1) căn cứ định nghĩa doanh thu — **khoản 1 Điều 5 NĐ 68/2026/NĐ-CP** (đính chính 06/10/2026 theo Công báo 152: \"Doanh thu là toàn bộ tiền bán hàng, tiền gia công, tiền cung ứng dịch vụ kể cả trợ giá, phụ thu, phụ trội mà hộ kinh doanh, cá nhân kinh doanh được hưởng, không phân biệt đã thu được tiền hay chưa thu được tiền; bao gồm cả các khoản thưởng, hỗ trợ đạt doanh số, khuyến mại, chiết khấu thanh toán, bồi thường liên quan đến kinh doanh; không bao gồm chiết khấu thương mại, giảm giá hàng bán và giá trị hàng bán bị trả lại\" — khoản không phải \"được hưởng\" thì không phải doanh thu); và (2) chứng từ chứng minh **bản chất thu hộ** của khoản tiền cụ thể (hợp đồng/đối soát, hóa đơn vận chuyển ghi bên vận chuyển là bên cung cấp dịch vụ). Thiếu (2) → không được trừ. Chưa đối chiếu được (1) cho khoản thu hộ cụ thể từ văn bản gốc → phần \"loại khỏi doanh thu tính thuế\" giữ ở mức **chưa đủ nguồn để chốt tuyệt đối**; trường hợp ranh giới hỏi cơ quan thuế quản lý trực tiếp.\n- **Guardrail số học:** trước khi trừ một khoản ship/thu hộ khỏi số tiền hàng, phải chứng minh khoản đó **đã nằm trong số tiền hàng ban đầu**. Nếu đề bài nêu “tiền hàng 1,15 tỷ” và “phí ship 90 triệu” thành hai khoản riêng, ship thu hộ chỉ có nghĩa là **không cộng 90 triệu vào doanh thu**; không được lấy `1,15 tỷ - 90 triệu`.\n- Nếu kết quả sau xử lý phí ship làm thay đổi việc vượt/không vượt ngưỡng 1 tỷ, phải lập lại cầu nối số học và kiểm tra double subtraction theo file `00A`.\n- Nguồn: Điều 7 NĐ 254/2026/NĐ-CP (hiệu lực 01/7/2026; trích qua 4 nguồn thứ cấp độc lập cùng trích — luatvietnam.vn, thuvienphapluat.vn (2 bài), bizzi.vn — chưa đọc toàn văn NĐ gốc; bài tóm tắt chính thức trên Cổng Chính phủ xác nhận NĐ 254/2026 hiệu lực 01/7/2026 và viện dẫn Điều 7: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-254-2026-nd-cp-ve-hoa-don-dien-tu-chung-tu-dien-tu-119260713164251972.htm) — CROSS_REFERENCE: 16.32 (nguyên tắc loại trừ chiết khấu/giảm giá/hàng trả lại khỏi doanh thu TNCN, có nguồn chính thức)."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1030",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.23. HKD mới ra kinh doanh giữa năm: ngưỡng 1 tỷ",
    "ref_id": "16.23",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.23. HKD mới ra kinh doanh giữa năm: ngưỡng 1 tỷ\n- **LEGAL_STATUS:** `VERIFIED`.\n- NĐ 68/2026 và NĐ 141/2026 dùng **doanh thu thực tế phát sinh trong năm** đối với HKD/CNKD; không có quy tắc tự động chia ngưỡng 1 tỷ theo số tháng hoạt động của HKD.\n- Do đó HKD bắt đầu tháng 3 không tự chia `1 tỷ × 10/12` để tạo ngưỡng mới.\n- Nếu trong năm doanh thu lũy kế vượt 1 tỷ, nghĩa vụ khai/nộp và HĐĐT phát sinh theo quy định; riêng HĐĐT phải đăng ký trong 30 ngày kể từ ngày cuối cùng của kỳ tính thuế có doanh thu lũy kế vượt ngưỡng.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm\n  https://xaydungchinhsach.chinhphu.vn/huong-dan-khai-thue-tinh-thue-va-su-dung-hoa-don-119260309113415826.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1031",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.24. Hồ sơ thuế điện tử: “đã gửi/ghi nhận” khác với “tiếp nhận hồ sơ hợp lệ”",
    "ref_id": "16.24",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.24. Hồ sơ thuế điện tử: “đã gửi/ghi nhận” khác với “tiếp nhận hồ sơ hợp lệ”\n- **LEGAL_STATUS:** `VERIFIED`.\n- Từ 01/07/2026, TT 89/2026/TT-BTC quy định: thời điểm xác nhận người nộp thuế nộp hồ sơ thuế điện tử là **ngày Hệ thống thông tin quản lý thuế tiếp nhận đầy đủ hồ sơ hợp lệ** và ngày đó được ghi trên **Thông báo tiếp nhận hồ sơ thuế điện tử** gửi cho người nộp thuế. Cơ quan thuế căn cứ thời điểm này để xác định có nộp chậm hay không.\n- Hệ thống/cổng gửi hồ sơ có thể ghi nhận thao tác gửi trước khi cơ quan thuế phát hành thông báo tiếp nhận hoặc không tiếp nhận. Vì vậy **không được coi một email kỹ thuật “đã gửi/đã ghi nhận” là bằng chứng cuối cùng rằng hồ sơ hợp lệ đã nộp đúng hạn**.\n- Nếu cơ quan thuế phát hành **Thông báo không tiếp nhận**, người nộp thuế phải sửa/nộp lại. Ngày của lần gửi lỗi không tự động được dùng làm ngày nộp hợp lệ cho hồ sơ thay thế.\n- Với hồ sơ phát sinh trước 01/07/2026, phải áp quy định giao dịch điện tử tương ứng của thời kỳ đó (ví dụ TT 19/2021/TT-BTC), không dùng TT 89 hồi tố.\n- **Cấm khuyến nghị cố ý nộp số liệu sai để “giữ hạn”.**\n- Nguồn: TT 89/2026/TT-BTC, quy định về thời điểm xác nhận nộp hồ sơ và thông báo tiếp nhận/không tiếp nhận: https://vanban.chinhphu.vn/?classid=1&docid=218974&orggroupid=4&pageid=27160"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1032",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.25. Trạng thái MST 03/06 và tạm hoãn xuất cảnh",
    "ref_id": "16.25",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.25. Trạng thái MST 03/06 và tạm hoãn xuất cảnh\n- **LEGAL_STATUS:** `VERIFIED`.\n- Trạng thái 03 và 06 không đồng nghĩa:\n  - `03`: đã ngừng hoạt động nhưng chưa hoàn thành thủ tục chấm dứt hiệu lực MST;\n  - `06`: không hoạt động tại địa chỉ đã đăng ký theo thông báo/xác minh của cơ quan thuế.\n- Diện nợ thuế của CNKD/chủ HKD: tiêu chí nợ từ **50 triệu đồng**, quá hạn từ **120 ngày** phải đi cùng điều kiện **thuộc trường hợp bị cưỡng chế thi hành quyết định hành chính về quản lý thuế**.\n- Diện không hoạt động tại địa chỉ đăng ký là một căn cứ riêng: NĐ 252/2026 quy định mốc 120 ngày kể từ thông báo không hoạt động nếu vẫn không khôi phục/chấm dứt MST theo quy định.\n- Không dùng công thức sai “cứ nợ 50 triệu 120 ngày là tự động cấm xuất cảnh” hoặc “không nợ thì trạng thái 06 chắc chắn không thể bị hoãn xuất cảnh”.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/quy-dinh-cac-truong-hop-tam-hoan-xuat-canh-do-no-thue-119260703100941028.htm\n  https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-252-2026-nd-cp-huong-dan-thi-hanh-luat-quan-ly-thue-119260715155021635.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1033",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.26. Dạy học/đào tạo",
    "ref_id": "16.26",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.26. Dạy học/đào tạo\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Phải xác định người dạy đang cung cấp **dịch vụ giáo dục/đào tạo với tư cách HKD** hay nhận thù lao mang tính tiền lương/tiền công.\n- Dịch vụ dạy học, dạy nghề đáp ứng phạm vi pháp luật giáo dục thuộc nhóm không chịu GTGT theo Luật GTGT; TNCN vẫn phải phân loại theo tư cách và phương pháp tính thuế tương ứng.\n- Không được mặc định “đã có mã ngành 8559 thì GTGT/TNCN đều bằng 0”.\n- Nguồn chính thức: khoản 13 Điều 5 Luật Thuế GTGT 2024 (48/2024/QH15) — “Hoạt động dạy học, dạy nghề theo quy định của pháp luật về giáo dục, giáo dục nghề nghiệp” thuộc đối tượng không chịu thuế GTGT. Toàn văn luật (Thư viện Pháp luật): https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-Thue-gia-tri-gia-tang-2024-so-48-2024-QH15-556390.aspx?anchor=dieu_14"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1034",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.27. Gỗ tròn mua về cưa xẻ thành thanh/ván rồi bán",
    "ref_id": "16.27",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.27. Gỗ tròn mua về cưa xẻ thành thanh/ván rồi bán\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Nếu HKD mua gỗ nguyên liệu rồi **cưa xẻ/gia công/chế biến** thành sản phẩm bán ra, đây không còn là tình huống “chỉ mua đi bán lại” đơn thuần; phải xem nhóm sản xuất/gia công/chế biến.\n- Nếu HKD mua sản phẩm gỗ đã hoàn chỉnh rồi bán lại, về bản chất là phân phối hàng hóa.\n- Nếu gỗ do chính người sản xuất lâm nghiệp bán và chỉ qua sơ chế thông thường, cần kiểm tra riêng chính sách GTGT đối với sản phẩm rừng trồng của người trực tiếp sản xuất.\n- Vì vậy câu hỏi “1% hay 3% GTGT” không thể chốt nếu chưa biết nguồn gỗ và mức độ chế biến.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/van-ban-hop-nhat-114-vbhn-vpqh-hop-nhat-luat-thue-gia-tri-gia-tang-119260605094756577.htm\n  https://xaydungchinhsach.chinhphu.vn/thue-suat-doi-voi-cac-hoat-dong-kinh-doanhcua-ho-kinh-doanh-119260407103211289.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1035",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.28. Mua cà phê tươi của dân rồi bán lại",
    "ref_id": "16.28",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.28. Mua cà phê tươi của dân rồi bán lại\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Nếu HKD không phải người trực tiếp trồng cà phê mà **mua của nông dân rồi bán lại**, không được tự nhận chính sách dành cho người trực tiếp sản xuất chỉ vì hàng hóa là nông sản.\n- Nếu chỉ mua/bán lại, phân loại theo hoạt động phân phối hàng hóa, đồng thời kiểm tra quy định GTGT đặc thù của nông sản ở từng khâu và đối tượng người mua.\n- Nếu có sơ chế/chế biến làm thay đổi sản phẩm, phải đánh giá lại theo mức độ chế biến.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/van-ban-hop-nhat-114-vbhn-vpqh-hop-nhat-luat-thue-gia-tri-gia-tang-119260605094756577.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1036",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.29. Vừa kinh doanh thông thường vừa cho thuê bất động sản: tách riêng ngưỡng và mức trừ",
    "ref_id": "16.29",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.29. Vừa kinh doanh thông thường vừa cho thuê bất động sản: tách riêng ngưỡng và mức trừ\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- **Phần đã xác minh chắc chắn về GTGT/TNCN:** hoạt động **cho thuê bất động sản (BĐS)** được kê khai và tính thuế riêng, không nhập chung doanh thu với hoạt động kinh doanh khác để dùng một mức trừ duy nhất. Cục Thuế đã hướng dẫn rõ doanh thu cho thuê BĐS được kê khai, tính thuế riêng và mức doanh thu không chịu thuế/không phải nộp TNCN được trừ riêng cho nhóm BĐS và nhóm hoạt động kinh doanh khác. NĐ 141/2026 đã nâng mốc 500 triệu trong NĐ 68/2026 lên **1 tỷ đồng** từ 01/01/2026.\n- Vì vậy:\n  - nhóm bán hàng, dịch vụ, affiliate... áp dụng ngưỡng/mức trừ 1 tỷ theo quy định dành cho hoạt động kinh doanh thông thường; nếu có nhiều ngành trong nhóm này thì mức trừ 1 tỷ chỉ dùng **một lần trong chính nhóm đó** và phân bổ theo quy định;\n  - nhóm **cho thuê BĐS** có cơ chế riêng; tổng doanh thu các hợp đồng cho thuê BĐS được xét riêng trong nhóm BĐS và mốc 1 tỷ của nhóm này không được lấy sang bù cho bán hàng/affiliate, cũng không lấy mức trừ của bán hàng/affiliate sang bù cho BĐS.\n- **Ví dụ chuẩn để AI tránh gộp sai:** bán mỹ phẩm 780 triệu + affiliate 420 triệu + cho thuê căn hộ 360 triệu. Khi xét GTGT/TNCN, nhóm kinh doanh thông thường là **1,20 tỷ**, còn nhóm cho thuê BĐS là **360 triệu**. Không tạo một “rổ” 1,56 tỷ rồi phân bổ một mức trừ 1 tỷ cho cả ba hoạt động. Với BĐS 360 triệu/năm, phần cho thuê nằm dưới ngưỡng 1 tỷ của chính nhóm BĐS.\n- **Affiliate phải phân loại riêng trước khi tính:** không mặc định affiliate luôn có cùng một tỷ lệ; áp decision tree tại mục 16.20.\n- **Hóa đơn điện tử:** Điều 7 NĐ 254/2026 quy định HKD/CNKD có thu nhập từ **cho thuê BĐS thuộc trường hợp không phải sử dụng HĐĐT**. Tuy nhiên, ngoại lệ HĐĐT của BĐS **không được suy diễn** thành kết luận rằng doanh thu BĐS chắc chắn bị loại khỏi mọi phép xác định ngưỡng HĐĐT của các hoạt động khác.\n  - Nếu riêng các hoạt động kinh doanh không phải BĐS đã trên 1 tỷ (ví dụ 780 + 420 = 1,20 tỷ) thì nghĩa vụ HĐĐT của các hoạt động đó đã rõ theo quy định chung; phần cho thuê BĐS vẫn thuộc ngoại lệ riêng.\n  - Nếu các hoạt động không phải BĐS từ 1 tỷ trở xuống nhưng **chỉ khi cộng thêm BĐS mới vượt 1 tỷ**, nguồn chính thức công khai được rà soát đến V4.3 chưa giải thích trực tiếp cách xét ngưỡng HĐĐT trong tình huống hỗn hợp này. AI **không được tự chốt**; phải kiểm tra hướng dẫn hiện hành của cơ quan thuế cho đúng tình huống.\n- **Cấm suy luận sai:**\n  1. không lấy `bán hàng + affiliate + tiền thuê BĐS` rồi dùng một mức trừ 1 tỷ cho TNCN;\n  2. không tính GTGT tiền thuê BĐS dưới ngưỡng riêng bằng cách máy móc lấy toàn bộ doanh thu thuê × 5%;\n  3. không coi “BĐS không phải dùng HĐĐT” là miễn HĐĐT cho các hoạt động bán hàng/dịch vụ khác.\n- Nguồn:\n  - Cục Thuế hướng dẫn kê khai tách riêng BĐS và hoạt động khác: https://xaydungchinhsach.chinhphu.vn/huong-dan-ho-kinh-doanh-ke-khai-thue-khi-vua-cho-thue-bat-dong-san-vua-cho-thue-tai-san-119260323160131075.htm\n  - NĐ 141/2026/NĐ-CP nâng mốc tại Điều 3, Điều 4 NĐ 68/2026 từ 500 triệu lên 1 tỷ: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm\n  - Điều 7 NĐ 254/2026/NĐ-CP - trường hợp cho thuê BĐS không phải sử dụng HĐĐT: https://xaydungchinhsach.chinhphu.vn/truong-hop-nao-khong-phai-su-dung-hoa-don-dien-tu-119260716095423868.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1037",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.30. Thời điểm doanh thu ≠ thời điểm lập hóa đơn; tiền đặt cọc/trả trước phải phân loại theo giao dịch",
    "ref_id": "16.30",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.30. Thời điểm doanh thu ≠ thời điểm lập hóa đơn; tiền đặt cọc/trả trước phải phân loại theo giao dịch\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- **Thời điểm xác định doanh thu HKD:** đối với bán hàng hóa là thời điểm chuyển giao quyền sở hữu/quyền sử dụng hàng hóa; đối với cung ứng dịch vụ là thời điểm hoàn thành dịch vụ hoặc hoàn thành từng phần việc, trừ các trường hợp đặc thù được quy định riêng.\n- **Thời điểm lập HĐĐT là một lớp pháp lý khác.** Không được suy ngược rằng “đã lập hóa đơn = doanh thu chắc chắn phát sinh đúng bằng số trên hóa đơn ở thời điểm đó”. Nếu hóa đơn lập sai/sớm/muộn thì phải xử lý sai sót hóa đơn; hóa đơn sai không tự thay đổi sự kiện pháp lý làm phát sinh doanh thu.\n- Với **tiền đặt cọc theo Bộ luật Dân sự để bảo đảm thực hiện hợp đồng cung cấp dịch vụ**, NĐ 254/2026 quy định trường hợp thu đặt cọc này không phải lập hóa đơn tại thời điểm nhận cọc. Không được đánh đồng đặt cọc bảo đảm với tiền thanh toán trước.\n- Với **tiền trả trước**, phải xác định giao dịch là hàng hóa, dịch vụ hay trường hợp đặc thù. Cấm dùng quy tắc tuyệt đối “tiền nhận trước chưa bao giờ là doanh thu” hoặc “tiền nhận trước luôn là doanh thu”.\n- **Guardrail:** trước khi trả lời, lập hai dòng độc lập: `sự kiện xác định doanh thu` và `sự kiện xác định thời điểm hóa đơn`; chỉ sau đó mới đối chiếu hai dòng.\n- Nguồn:\n  - Cục Thuế về thời điểm doanh thu HKD: https://xaydungchinhsach.chinhphu.vn/nhan-tien-hoa-hong-tu-nuoc-ngoai-ve-qua-chuyen-khoan-thoi-diem-ghi-nhan-doanh-thu-va-xuat-hoa-don-duoc-xac-dinh-khi-nao-119260722103856073.htm\n  - Thời điểm lập HĐĐT và đặt cọc dịch vụ theo NĐ 254/2026: https://xaydungchinhsach.chinhphu.vn/thoi-diem-lap-hoa-don-khi-thuc-hien-kinh-doanh-hang-hoa-dich-vu-co-gi-moi-119260728152001421.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1038",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.31. Hợp đồng hỗn hợp: phải tách cấu phần hàng hóa, dịch vụ, xây dựng/lắp đặt; không được mở rộng dữ kiện",
    "ref_id": "16.31",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.31. Hợp đồng hỗn hợp: phải tách cấu phần hàng hóa, dịch vụ, xây dựng/lắp đặt; không được mở rộng dữ kiện\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Một hợp đồng có thể đồng thời chứa bán hàng hóa, dịch vụ thiết kế/giám sát, sản xuất, gia công, xây dựng hoặc lắp đặt. AI không được gán toàn bộ hợp đồng vào một nhóm chỉ vì tiêu đề hợp đồng có một từ khóa.\n- Với từng cấu phần phải kiểm tra: đối tượng giao, thời điểm chuyển giao, nghiệm thu từng phần, điều khoản thanh toán, quyền sở hữu và giá trị tách riêng hay không.\n- Đối với xây dựng/lắp đặt, doanh thu có quy tắc riêng gắn với giá trị công trình/hạng mục/khối lượng xây dựng, lắp đặt nghiệm thu theo quy định.\n- **Cấm mở rộng dữ kiện:** “thiết kế đã hoàn thành” không tự suy ra “thiết kế + giám sát đã hoàn thành”; “đã sản xuất 40%” không tự suy ra “đã nghiệm thu 40%”; “đã nhận tiền” không tự suy ra “đã chuyển giao”.\n- Nếu dữ kiện không đủ để tách giá trị từng cấu phần, AI phải nêu phần chưa thể chốt và tài liệu cần xem thay vì tự phân bổ.\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/phuong-phap-tinh-thue-voi-ca-nhan-kinh-doanh-ho-kinh-doanh-119260309100708724.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1039",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.32. Voucher, trợ giá, chiết khấu và phí sàn: xác định ai chịu khoản giảm cuối cùng",
    "ref_id": "16.32",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.32. Voucher, trợ giá, chiết khấu và phí sàn: xác định ai chịu khoản giảm cuối cùng\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Không phân loại chỉ dựa vào tên “voucher”, “mã giảm giá”, “trợ giá” hoặc “phí tài trợ”. Phải xác định **ai là người chịu khoản giảm cuối cùng** và chứng từ/đối soát phản ánh khoản đó như thế nào.\n- **Chiết khấu thương mại/giảm giá hàng bán do chính người bán chịu** và được phản ánh đúng bản chất có thể là khoản giảm doanh thu theo quy định doanh thu TNCN.\n- **Khoản sàn/nền tảng tài trợ và bù lại đầy đủ cho shop** không được tự động coi là khoản giảm doanh thu của shop; cần xác định số tiền shop thực tế được hưởng từ giao dịch và cách phản ánh trên hóa đơn/đối soát.\n- **Phí dịch vụ/phí quảng cáo/phí sàn** mà shop phải trả là chi phí/cấn trừ dòng tiền; không vì sàn giữ trước khi chuyển tiền mà tự động làm giảm doanh thu gross.\n- Nếu “shop tài trợ voucher” thực chất là một **phí marketing trả cho sàn** chứ không phải giảm giá hàng bán cho người mua, không được tự động trừ khỏi doanh thu; phải xem thỏa thuận, hóa đơn và đối soát.\n- Nguồn:\n  - Doanh thu TNCN loại trừ chiết khấu thương mại, giảm giá hàng bán, hàng bán bị trả lại: https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm\n  - NĐ 254/2026 yêu cầu hóa đơn phản ánh chiết khấu thương mại/khuyến mại và nội dung nghiệp vụ kinh tế: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-254-2026-nd-cp-ve-hoa-don-dien-tu-chung-tu-dien-tu-119260713164251972.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1040",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.33. Tiền vào tài khoản không phát sinh từ kinh doanh: tự chuyển tiền, tiền vay, chuyển nhầm",
    "ref_id": "16.33",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.33. Tiền vào tài khoản không phát sinh từ kinh doanh: tự chuyển tiền, tiền vay, chuyển nhầm\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Doanh thu kinh doanh là khoản HKD thực tế được hưởng từ hoạt động sản xuất, kinh doanh. Không được lấy tổng tiền vào tài khoản làm doanh thu.\n- Các khoản như **chủ hộ tự chuyển tiền giữa tài khoản của mình**, **tiền vay có nghĩa vụ hoàn trả**, **tiền ngân hàng giải ngân**, **tiền người khác chuyển nhầm đã hoàn lại** không tự thân là doanh thu kinh doanh nếu hồ sơ chứng minh đúng bản chất.\n- Hồ sơ nên dùng để giải trình: sao kê hai chiều, hợp đồng/giấy vay, khế ước nhận nợ, chứng từ giải ngân, chứng từ hoàn trả, trao đổi xác nhận chuyển nhầm.\n- **Best practice ≠ nghĩa vụ pháp lý:** khuyến nghị tách tài khoản kinh doanh để dễ đối chiếu là biện pháp quản trị, không được nói thành quy định “pháp luật bắt buộc chỉ dùng một tài khoản riêng” nếu không có căn cứ.\n- Nguồn khái niệm doanh thu TNCN: https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1041",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.34. TNCN có “doanh thu khác”: thưởng, hỗ trợ, chiết khấu thanh toán, bồi thường liên quan kinh doanh",
    "ref_id": "16.34",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.34. TNCN có “doanh thu khác”: thưởng, hỗ trợ, chiết khấu thanh toán, bồi thường liên quan kinh doanh\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Khi xác định **doanh thu TNCN** của HKD, phải ưu tiên danh mục pháp luật thay vì suy luận kế toán thông thường.\n- Doanh thu TNCN bao gồm: **thưởng**, **hỗ trợ đạt doanh số**, khuyến mại, **chiết khấu thanh toán**, hỗ trợ bằng tiền/không bằng tiền, trợ giá, phụ thu/phụ trội/phí thu thêm, **bồi thường vi phạm hợp đồng**, bồi thường khác liên quan hoạt động kinh doanh và doanh thu khác; không bao gồm chiết khấu thương mại, giảm giá hàng bán, hàng bán bị trả lại theo quy định.\n- Vì vậy không được tự loại một khoản chỉ vì gọi nó là “giảm giá vốn”, “thu nhập tài chính”, “hoàn chi phí” hoặc “không phải tiền bán hàng”.\n- **Hỗ trợ marketing/hoàn chi phí:** phải kiểm tra có phải chi hộ/hoàn hộ thuần túy theo ủy quyền hay là khoản hỗ trợ mà HKD được hưởng. Nếu là khoản hỗ trợ bằng tiền liên quan hoạt động kinh doanh thì không được tự loại khỏi doanh thu TNCN.\n- **Bồi thường bảo hiểm/tổn thất:** nếu liên quan trực tiếp hoạt động kinh doanh, phải kiểm tra quy định “bồi thường khác liên quan hoạt động kinh doanh”; không tự loại chỉ vì mang tên “bồi thường”.\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1042",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.35. Sàn khấu trừ: tổng doanh thu, khoản đã nộp và nghĩa vụ còn lại là ba lớp khác nhau",
    "ref_id": "16.35",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "## 16.35. Sàn khấu trừ: tổng doanh thu, khoản đã nộp và nghĩa vụ còn lại là ba lớp khác nhau\n[CĂN CỨ] Khoản 1 Điều 8 Nghị định 68/2026/NĐ-CP, sửa đổi bởi Nghị định 141/2026/NĐ-CP; hướng dẫn Cục Thuế trong các nguồn đính kèm.\n[PHẠM VI] Hướng dẫn Cục Thuế về doanh thu qua nền tảng năm 2026, khoản 1 Điều 8 NĐ68 được sửa bởi NĐ141.\n[DOANH THU] Giao dịch được sàn khấu trừ vẫn nằm trong doanh thu thực tế cần tổng hợp; không lấy doanh thu trừ tiền thuế hoặc phí sàn để xét ngưỡng. Tổng hợp các kênh cùng người, tránh cộng trùng.\n[KHÔNG NỘP HAI LẦN] Giao dịch đã được khai, nộp thay không mặc nhiên phải khai/nộp lại chính số thuế đó. Nghĩa vụ thông báo doanh thu hoặc quyết toán năm vẫn tùy phương pháp và tổng doanh thu.\n[ĐỐI CHIẾU TAX] Dòng tax, ảnh ví hoặc tiền bị giữ chưa chứng minh đã nộp TNCN. Kiểm loại thuế, người/MST, kỳ, giao dịch, chứng từ khấu trừ/nộp và trạng thái điều chỉnh/hoàn. Hồ sơ trùng chỉ tính một lần. Đây là checklist đối soát, không đặt thêm một mẫu thủ tục bắt buộc.\n[TÁCH SẮC THUẾ] Chứng từ ghi GTGT không phải TNCN để trừ thẳng nghĩa vụ TNCN. Chứng từ TNCN cùng tên nhưng sai kỳ hoặc MST cần tra soát; không tự ghi nhận.\n[NỘP THỪA] Xác định đúng nghĩa vụ, ưu đãi nếu đủ, rồi đối chiếu số thuế thực đã nộp. Nộp thừa có thể đề nghị xử lý theo hồ sơ; không đồng nghĩa được hoàn tự động. Hỏi cả doanh thu và khoản tax thì giải quyết riêng cả hai.\nNguồn đối chiếu ngày 16/10/2026:\n- https://xaydungchinhsach.chinhphu.vn/co-can-khai-bao-doanh-thu-khi-ban-hang-qua-shopee-grab-be-cac-san-da-khau-tru-thue-119260721055834808.htm\n- https://xaydungchinhsach.chinhphu.vn/ban-hang-da-kenh-hieu-dung-de-thuc-hien-dung-nghia-vu-thue-119260727151911181.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1043",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.36. Thanh lý/bán tài sản kinh doanh, tài sản cá nhân và phế liệu phải phân loại riêng",
    "ref_id": "16.36",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.36. Thanh lý/bán tài sản kinh doanh, tài sản cá nhân và phế liệu phải phân loại riêng\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Không được coi mọi khoản bán tài sản là doanh thu bán hàng thông thường, cũng không được loại mọi khoản thanh lý khỏi hoạt động kinh doanh.\n- Phải kiểm tra nguồn hình thành và mục đích sử dụng thực tế của tài sản: chứng từ mua, hồ sơ theo dõi tài sản/công cụ, chi phí vận hành, nhật ký sử dụng, tỷ lệ sử dụng cá nhân - kinh doanh và chứng từ thanh lý.\n- **Tài sản cá nhân chưa từng phục vụ hoạt động kinh doanh** không tự động trở thành doanh thu HKD chỉ vì chủ hộ là người bán.\n- **Tài sản/công cụ phục vụ hoạt động kinh doanh và phế liệu phát sinh từ hoạt động kinh doanh** có thể tạo khoản thu liên quan hoạt động kinh doanh; phải xác định riêng cách xử lý TNCN, GTGT và hóa đơn thay vì cộng cơ học vào “doanh thu bán hàng”.\n- **Quy tắc HĐĐT đặc biệt:** theo NĐ 254/2026, HKD/CNKD **bán tài sản phải đăng ký quyền sở hữu, quyền sử dụng** thuộc diện áp dụng HĐĐT theo quy định, không được chỉ nhìn ngưỡng 1 tỷ để kết luận “dưới ngưỡng thì không cần HĐĐT”.\n- Nguồn:\n  - NĐ 254/2026/HĐĐT: https://xaydungchinhsach.chinhphu.vn/huong-dan-su-dung-hoa-don-dien-tu-voi-ho-kinh-doanh-co-doanh-thu-duoi-1-ty-dong-nam-119260727150121544.htm\n  - Doanh thu TNCN và doanh thu khác: https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1044",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.37. “Doanh thu” phải xác định theo mục đích pháp lý: TNCN, GTGT và HĐĐT không được dùng chung máy móc",
    "ref_id": "16.37",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.37. “Doanh thu” phải xác định theo mục đích pháp lý: TNCN, GTGT và HĐĐT không được dùng chung máy móc\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Trước câu hỏi có thưởng/hỗ trợ/bồi thường/thu tài chính/thanh lý tài sản, AI phải lập **ba cột riêng**: `TNCN`, `GTGT`, `HĐĐT`.\n- **TNCN:** doanh thu có danh mục rộng theo Điều 5 NĐ 68/2026, bao gồm nhiều khoản thưởng, hỗ trợ, chiết khấu thanh toán và bồi thường liên quan kinh doanh.\n- **GTGT/HĐĐT cho khoản thu không liên quan bán hàng/cung cấp dịch vụ:** NĐ 254/2026 liệt kê các khoản thu như bồi thường bằng tiền, tiền thưởng, thu đòi người thứ ba của bảo hiểm, các khoản thu hộ và các khoản thu tài chính trong nhóm **không phải sử dụng HĐĐT** theo trường hợp được dẫn chiếu từ pháp luật GTGT. Điều này chứng minh không được lấy cách xử lý TNCN rồi áp nguyên xi cho GTGT/hóa đơn.\n- **Ngưỡng HĐĐT 1 tỷ:** NĐ 141/2026 hiện dùng câu chữ **“doanh thu năm trên 01 tỷ đồng”**, thay cho cách diễn đạt cũ trong NĐ 68 trước sửa đổi. Nếu chỉ các khoản “doanh thu khác”/thưởng/bồi thường làm tổng vượt ngưỡng, AI **không được tự chọn** doanh thu TNCN hoặc doanh thu GTGT làm mẫu số thay thế; phải kiểm tra hướng dẫn hiện hành cho đúng loại khoản thu.\n- Với bán tài sản phải đăng ký quyền sở hữu/quyền sử dụng, áp quy tắc riêng tại 16.36.\n- **Cấm kết luận:** “TNCN = 920 triệu, GTGT = 920 triệu nên HĐĐT cũng = 920 triệu” chỉ vì ba con số tình cờ giống nhau.\n- Nguồn:\n  - Doanh thu TNCN: https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm\n  - Khoản thu không liên quan bán hàng/cung cấp dịch vụ không phải sử dụng HĐĐT: https://xaydungchinhsach.chinhphu.vn/truong-hop-nao-khong-phai-su-dung-hoa-don-dien-tu-119260716095423868.htm\n  - NĐ 141/2026 về ngưỡng HĐĐT hiện hành: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1045",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.38. Hộ kinh doanh doanh thu dưới 1 tỷ năm 2026 có bắt buộc dùng hóa đơn điện tử không? — Không bắt buộc (với hoạt độn",
    "ref_id": "16.38",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.38. Hộ kinh doanh doanh thu dưới 1 tỷ năm 2026 có bắt buộc dùng hóa đơn điện tử không? — Không bắt buộc (với hoạt động thông thường), được tự nguyện; ngoại lệ bán tài sản phải đăng ký quyền\n- **LEGAL_STATUS:** `VERIFIED`.\n- **Trả lời ngắn:** Đối với hoạt động bán hàng hóa/cung cấp dịch vụ thông thường, hộ kinh doanh có doanh thu năm từ 1 tỷ đồng trở xuống **không bắt buộc** sử dụng hóa đơn điện tử; được tự nguyện đăng ký sử dụng nếu đủ điều kiện và có nhu cầu. Chỉ hộ kinh doanh có doanh thu năm trên 1 tỷ đồng mới bắt buộc sử dụng hóa đơn điện tử có mã của cơ quan thuế hoặc hóa đơn điện tử từ máy tính tiền.\n- **Ngoại lệ (NĐ 254/2026):** hộ/cá nhân kinh doanh **bán tài sản phải đăng ký quyền sở hữu/quyền sử dụng** vẫn thuộc diện phải áp dụng HĐĐT theo quy tắc riêng của NĐ 254/2026, không chỉ nhìn ngưỡng 1 tỷ. Xem chi tiết tại 16.36.\n- NĐ 141/2026/NĐ-CP (29/4/2026, hiệu lực từ 01/01/2026) nâng ngưỡng không chịu thuế GTGT và TNCN của hộ kinh doanh từ 500 triệu lên 1 tỷ đồng/năm; ngưỡng nghĩa vụ hóa đơn điện tử áp theo cùng mốc 1 tỷ.\n- **Lưu ý câu chữ:** văn bản dùng \"doanh thu năm trên 01 tỷ đồng\" cho diện bắt buộc. Khi doanh thu lũy kế trong năm chạm/vượt mốc 1 tỷ, phải đối chiếu nguyên văn NĐ 141/2026 và hướng dẫn của cơ quan thuế quản lý trực tiếp về thời điểm chuyển đổi nghĩa vụ (đã ghi nhận cách diễn đạt \"đạt từ 1 tỷ\" và \"vượt trên 1 tỷ\" khác nhau giữa các tài liệu tuyên truyền).\n- Nguồn chính thức:\n  - Toàn văn NĐ 141/2026/NĐ-CP (29/4/2026, hiệu lực từ 01/01/2026): https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm\n  - Trường hợp không phải sử dụng HĐĐT theo NĐ 254/2026: https://xaydungchinhsach.chinhphu.vn/truong-hop-nao-khong-phai-su-dung-hoa-don-dien-tu-119260716095423868.htm\n  - Công văn 3405/CT-CS ngày 26/05/2026 về hóa đơn điện tử (đã kiểm chứng nội dung ngày 26/09/2026).\n  - Tài liệu tuyên truyền NĐ 141 của cơ quan thuế Hưng Yên (đã kiểm chứng nội dung ngày 26/09/2026).\n- CROSS_REFERENCE: 16.36 (ngoại lệ bán tài sản phải đăng ký quyền sở hữu/quyền sử dụng — quy tắc HĐĐT riêng theo NĐ 254/2026)."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1046",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.39. Nghị quyết 43/2026/QH16: giảm 30% số thuế TNCN phải nộp kỳ 2026–2027",
    "ref_id": "16.39",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.39. Nghị quyết 43/2026/QH16: giảm 30% số thuế TNCN phải nộp kỳ 2026–2027\n- **LEGAL_STATUS:** `VERIFIED` (đối chiếu toàn văn trên Cổng Chính phủ ngày 26/09/2026).\n- **Điều 1 khoản 1:** giảm 30% **số thuế thu nhập cá nhân phải nộp** của kỳ tính thuế năm 2026 và năm 2027 đối với thu nhập từ kinh doanh của cá nhân cư trú có mức doanh thu hằng năm của năm 2026, năm 2027 **không quá 10 tỷ đồng**.\n- Giảm trên **số thuế phải nộp**, không giảm doanh thu tính thuế, không giảm thuế suất. **Không áp dụng cho thuế GTGT.**\n- **Điều 2 khoản 1:** hiệu lực từ **24/8/2026**, áp dụng cho **kỳ tính thuế năm 2026, năm 2027** — tức cả năm 2026, không chỉ các tháng sau ngày hiệu lực.\n- **Điều 2 khoản 2:** Chính phủ quy định chi tiết → Nghị định hướng dẫn thi hành tại 26/09/2026 còn là **DRAFT (dự thảo)**, không được dùng làm luật hiện hành.\n- **ĐÃ XÁC MINH (chính sách):** HKD/CNKD cư trú có doanh thu năm không quá 10 tỷ được giảm 30% số TNCN phải nộp của năm 2026 và 2027.\n- **Thủ tục kê khai (PENDING):** xem danh sách PENDING duy nhất tại **16.78** (thay thế đoạn liệt kê chi tiết trước đây để giữ single source of truth). Cấm hướng dẫn người dùng điền mẫu/chỉ tiêu dựa trên dự thảo.\n- Nguồn: toàn văn NQ 43/2026/QH16 (Cổng Chính phủ): https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-43-2026-qh16-ve-giam-thue-thu-nhap-ca-nhan-thue-thu-nhap-doanh-nghiep-119260830184758301.htm\nDiễn giải đơn vị xét ngưỡng: quy định xét doanh thu hằng năm của cá nhân cư trú. Khi nhiều cửa hàng hoặc hoạt động thực sự thuộc cùng cá nhân, xét tổng doanh thu kinh doanh của cá nhân; sổ sách độc lập không biến mỗi hoạt động thành cá nhân khác. Không tự cộng doanh thu của các cá nhân độc lập chỉ vì cùng gia đình. Phải xác định chủ thể trước khi cộng; không cộng trùng tổng với các phần của tổng."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1047",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.40. Chỉ tiêu [14] Mẫu 01/CNKD (TT 50/2026): được CHỌN ngành/địa điểm áp mức trừ 1 tỷ theo phương án có lợi nhất",
    "ref_id": "16.40",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.40. Chỉ tiêu [14] Mẫu 01/CNKD (TT 50/2026): được CHỌN ngành/địa điểm áp mức trừ 1 tỷ theo phương án có lợi nhất\n- **LEGAL_STATUS:** `VERIFIED` (nguyên văn trong bản công bố thủ tục của Bộ Tài chính trên Cổng Chính phủ, kiểm chứng 26/09/2026).\n- Nguyên văn: *\"Đối với cá nhân kinh doanh nộp thuế thu nhập cá nhân trên doanh thu tính thuế có nhiều ngành, nghề kinh doanh áp dụng thuế suất thuế thu nhập cá nhân khác nhau, có nhiều địa điểm kinh doanh thì được lựa chọn một (01) ngành, nghề hoặc một (01) địa điểm kinh doanh để áp dụng mức trừ 01 tỷ đồng trước khi tính thuế thu nhập cá nhân theo phương án có lợi nhất. Trường hợp ngành, nghề, địa điểm kinh doanh được lựa chọn chưa trừ đủ 01 tỷ đồng, cá nhân được tiếp tục lựa chọn thêm ngành, nghề, địa điểm kinh doanh khác để tiếp tục được trừ cho đến khi đủ 01 tỷ đồng.\"*\n- **Cấm phân bổ pro-rata theo tỷ trọng doanh thu** khi văn bản không quy định cơ chế đó (xem guardrail G1).\n- **Hiệu lực TT 50/2026:** từ ngày ký ban hành **13/5/2026** (Cổng Chính phủ; đối chiếu 26/09/2026).\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/huong-dan-thu-tuc-khai-thue-doi-voi-ho-kinh-doanh-ca-nhan-kinh-doanh-119260530072620314.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1048",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.41. HĐĐT bắt buộc khi doanh thu năm hiện tại >1 tỷ; doanh thu năm trước chỉ dùng xác định nhánh chuyển ngưỡng và thời",
    "ref_id": "16.41",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.41. HĐĐT bắt buộc khi doanh thu năm hiện tại >1 tỷ; doanh thu năm trước chỉ dùng xác định nhánh chuyển ngưỡng và thời hạn đăng ký 30 ngày (khoản 5 Điều 8 NĐ 68/2026, NĐ 141/2026 sửa đổi)\n- **LEGAL_STATUS:** `VERIFIED` (toàn văn sửa đổi trên Cổng Chính phủ, kiểm chứng 26/09/2026).\n- Nguyên văn: *\"Hộ kinh doanh, cá nhân kinh doanh mới ra kinh doanh tại Điều 9 Nghị định này hoặc hộ kinh doanh, cá nhân kinh doanh có doanh thu năm trước chưa trên 01 tỷ đồng (trừ trường hợp đã đăng ký sử dụng hóa đơn điện tử theo điểm b khoản này) nhưng trong năm tính thuế có doanh thu trên 01 tỷ đồng trở lên thì phải áp dụng hóa đơn điện tử có mã của cơ quan thuế, hóa đơn điện tử khởi tạo từ máy tính tiền có kết nối dữ liệu với cơ quan thuế. Hộ kinh doanh, cá nhân kinh doanh đăng ký sử dụng hóa đơn điện tử trong thời gian 30 ngày kể từ ngày cuối cùng của kỳ tính thuế có doanh thu lũy kế trên 01 tỷ đồng.\"*\n- Hai điều kiện cộng dồn của nhánh chuyển ngưỡng: (a) mới ra kinh doanh (Điều 9) **hoặc** doanh thu năm trước chưa trên 01 tỷ (trừ đã tự nguyện đăng ký); **và** (b) trong năm tính thuế doanh thu trên 01 tỷ trở lên. Doanh thu năm trước không cộng vào doanh thu năm nay nhưng là **điều kiện áp dụng trực tiếp**.\n- **Guardrail áp dụng (26/09/2026, sau phản biện của Việt):** câu hỏi \"có bắt buộc HĐĐT không\" chỉ cần **doanh thu năm hiện tại trên 01 tỷ** → trả lời **có, bắt buộc**, cấm đòi doanh thu năm trước mới chốt. Hai điều kiện cộng dồn trên thuộc **nhánh chuyển ngưỡng** — dùng để xác định *thời điểm* phải đăng ký (mốc 30 ngày), không phải điều kiện để xác định *có thuộc diện bắt buộc hay không*. Doanh thu năm trước không được dùng để phủ nhận diện bắt buộc khi năm nay đã trên 01 tỷ.\n- Mốc 30 ngày tính từ **ngày cuối cùng của kỳ tính thuế** có doanh thu lũy kế vượt ngưỡng — không phải từ ngày thực tế vượt; kỳ khai tháng/quý cho mốc khác nhau.\n- **Cảnh báo câu chữ:** nhánh chuyển ngưỡng dùng \"trên 01 tỷ đồng trở lên\", câu đầu khoản dùng \"trên 01 tỷ đồng\", diện tự nguyện là \"từ 01 tỷ đồng trở xuống\". Khi doanh thu chạm đúng 1 tỷ, phải đối chiếu nguyên văn và hỏi cán bộ thuế quản lý.\n- **Hiệu lực NĐ 141/2026:** từ **01/01/2026** (Công văn 3509/QNG-NVDTPC của Thuế tỉnh Quảng Ngãi; đối chiếu 26/09/2026).\n- **Guardrail chống chia năm 2026 (bổ sung 2026-10-06):** ngưỡng 1 tỷ áp dụng cho **cả năm 2026** — cấm diễn giải \"từ 29/04/2026 (ngày ban hành NĐ 141) mới áp 1 tỷ, quý 1/2026 vẫn 500 triệu\". NĐ 141/2026 quy định hiệu lực từ 01/01/2026.\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1049",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.42. Sàn thương mại điện tử khấu trừ/nộp thay (NĐ 117/2025 → NĐ 252/2026 từ 01/7/2026): HKD không khai/nộp lại; hàng b",
    "ref_id": "16.42",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.42. Sàn thương mại điện tử khấu trừ/nộp thay (NĐ 117/2025 → NĐ 252/2026 từ 01/7/2026): HKD không khai/nộp lại; hàng bị trả lại sàn tự bù trừ\n- **LEGAL_STATUS:** `VERIFIED` về nội dung (nguồn: bài giải thích chính thức trên Cổng Chính phủ, kiểm chứng 26/09/2026). **Ghi chú nguồn:** số khoản/điều từng chữ chưa đối chiếu trực tiếp toàn văn NĐ gốc — khi trích số điều khoản phải ghi rõ mức nguồn này, không khẳng định số khoản chưa tự kiểm chứng.\n- Sàn thương mại điện tử **khấu trừ, nộp thay** thuế GTGT và thuế TNCN **theo từng giao dịch** (tỷ lệ % trên doanh thu mỗi giao dịch).\n- **Hàng bị trả lại / đơn bị hủy: sàn tự bù trừ** số thuế đã khấu trừ, nộp thay với số thuế phải khấu trừ, nộp thay của các giao dịch khác.\n- HKD **đã được sàn khấu trừ, kê khai, nộp thay** thì **không khai, không nộp lại** thuế GTGT, thuế TNCN đối với các giao dịch đó.\n- **Hiệu lực NĐ 117/2025:** từ **01/7/2025** (Điều 13 NĐ 117; đối chiếu thuvienphapluat.vn trích toàn văn ngày 26/09/2026). **Từ 01/7/2026, NĐ 117/2025 đã bị NĐ 252/2026/NĐ-CP (hướng dẫn Luật Quản lý thuế 108/2025/QH15) thay thế toàn bộ** — trích dẫn hiện hành là **NĐ 252/2026** (cơ chế sàn khấu trừ/nộp thay tiếp tục, ví dụ Điều 43; kiểm chứng 26/09/2026, tin cậy cao). Nội dung NĐ 117 chỉ còn đúng cho giai đoạn 01/7/2025–30/6/2026.\n- **Cấm:** HKD tự đưa giao dịch sàn vào tờ khai của mình rồi cấn trừ khi không nêu được cơ chế pháp lý; cấm gộp tầng tổng hợp ngưỡng với tầng tờ khai/giao dịch (guardrail G3).\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/quy-dinh-moi-quan-ly-thue-doi-voi-ho-ca-nhan-kinh-doanh-tren-nen-tang-thuong-mai-dien-tu-119250612171755463.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1050",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.43. Đặt cọc vs tạm ứng: thời điểm lập hóa đơn dịch vụ",
    "ref_id": "16.43",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.43. Đặt cọc vs tạm ứng: thời điểm lập hóa đơn dịch vụ\n- **LEGAL_STATUS:** `VERIFIED` (nguồn: trả lời chính thức của Thuế cơ sở 9 Đà Nẵng trên Cổng Chính phủ ngày 24/09/2026, trích nguyên văn điều khoản; kiểm chứng 26/09/2026).\n- **Khoản 2 Điều 9 NĐ 254/2026:** thời điểm lập hóa đơn đối với cung cấp dịch vụ là khi hoàn thành; trường hợp thu tiền trước hoặc trong khi cung cấp dịch vụ thì thời điểm lập hóa đơn là **thời điểm thu tiền** — **không bao gồm** trường hợp thu tiền đặt cọc theo BLDS để bảo đảm thực hiện hợp đồng cung cấp dịch vụ.\n- **Điều 37 NĐ 21/2021:** các bên không xác định rõ là tiền đặt cọc hay tiền trả trước → số tiền đó **được coi là tiền trả trước**.\n- **Điều 328 BLDS (91/2015/QH13):** đặt cọc để bảo đảm giao kết/thực hiện hợp đồng; khi hợp đồng được thực hiện, tài sản đặt cọc được trả lại **hoặc được trừ để thực hiện nghĩa vụ trả tiền** → \"có/không cấn trừ vào giá\" **không phải** dấu hiệu phân biệt đặt cọc với tạm ứng (guardrail G4).\n- Kết luận của cơ quan thuế: đặt cọc thật theo BLDS → **không lập hóa đơn lúc nhận**; tạm ứng → **lập hóa đơn lúc thu tiền**.\n- Hai lớp độc lập (16.30): bị định danh lại thành tạm ứng chỉ đổi **lớp hóa đơn** (lập ngay khi nhận), không tự động đổi **lớp doanh thu TNCN** (vẫn theo thời điểm hoàn thành dịch vụ). Cấm lấy thời điểm lập hóa đơn làm bằng chứng thời điểm ghi nhận doanh thu TNCN.\n- Nguồn: https://chinhsachonline.chinhphu.vn/thoi-diem-lap-hoa-don-khoan-tam-ung-hop-dong-91876.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1051",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.44. Nghị định 141/2026/NĐ-CP nâng ngưỡng doanh thu lên 1 tỷ đồng: phân biệt mức trừ TNCN và cơ sở GTGT",
    "ref_id": "16.44",
    "tier": "VERIFIED",
    "text": "[CẬP NHẬT NGƯỠNG] Nghị định 141/2026/NĐ-CP nâng ngưỡng doanh thu năm 2026 không phải chịu thuế GTGT, không phải nộp TNCN kinh doanh lên 1 tỷ đồng; không đồng nghĩa trừ 1 tỷ khỏi doanh thu GTGT khi đã thuộc diện nộp.\n[GIỚI HẠN PHƯƠNG PHÁP] Công thức trừ mức doanh thu rồi nhân tỷ lệ trong mục này CHỈ áp dụng TNCN theo phương pháp tỷ lệ trên doanh thu. Không áp cho phương pháp thu nhập tính thuế; không trừ mức này khỏi doanh thu GTGT. Không dùng mẫu tờ khai để thay điều kiện chọn phương pháp. Xem 16.56 và 16.99.\n16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.44. 1 tỷ đồng: ngưỡng xác định đối tượng kê khai + khoản trừ riêng của TNCN — không khấu trừ khỏi doanh thu GTGT\n- **LEGAL_STATUS:** `VERIFIED` (cấu trúc Mẫu 01/CNKD, TT 50/2026, bản công bố của Bộ Tài chính trên Cổng Chính phủ; kiểm chứng 26/09/2026).\n- Mẫu 01/CNKD chỉ áp dụng cho hộ/cá nhân kinh doanh **có doanh thu năm trên 01 tỷ đồng**.\n- Cột TNCN có chỉ tiêu **\"Doanh thu được trừ để xác định doanh thu tính thuế\"**; phía GTGT **không có cột trừ tương ứng** → 1 tỷ không phải khoản khấu trừ doanh thu GTGT.\n- Hệ quả tính toán bắt buộc: `GTGT phải nộp = doanh thu GTGT × tỷ lệ GTGT` (không trừ 1 tỷ); `TNCN phải nộp = (doanh thu chịu thuế − phần được trừ theo [14]) × tỷ lệ TNCN`.\n- **Hiệu lực TT 50/2026:** từ ngày ký ban hành **13/5/2026** (Cổng Chính phủ; đối chiếu 26/09/2026).\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/huong-dan-thu-tuc-khai-thue-doi-voi-ho-kinh-doanh-ca-nhan-kinh-doanh-119260530072620314.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1052",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.45. Thuật ngữ đúng theo phương pháp tính thuế TNCN",
    "ref_id": "16.45",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.45. Thuật ngữ đúng theo phương pháp tính thuế TNCN\n- **LEGAL_STATUS:** `VERIFIED` (Mẫu 01/CNKD + hướng dẫn TT 50/2026 trên Cổng Chính phủ).\n- Phương pháp **thuế suất × doanh thu** → dùng **\"doanh thu tính thuế\"** (= doanh thu chịu thuế − mức trừ 1 tỷ theo chỉ tiêu [14]).\n- Phương pháp **thu nhập tính thuế × thuế suất** → dùng **\"thu nhập tính thuế\"**.\n- **Cấm** ghi \"thu nhập chịu thuế\" cho cơ sở tính của phương pháp tỷ lệ trên doanh thu.\n- **Hiệu lực TT 50/2026:** từ ngày ký ban hành **13/5/2026** (Cổng Chính phủ; đối chiếu 26/09/2026).\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/huong-dan-thu-tuc-khai-thue-doi-voi-ho-kinh-doanh-ca-nhan-kinh-doanh-119260530072620314.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1053",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.46. Ví dụ minh họa hiệu chỉnh sau 3 case: pipeline tính đầy đủ (không phải nghĩa vụ cuối cùng)",
    "ref_id": "16.46",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.46. Ví dụ minh họa hiệu chỉnh sau 3 case: pipeline tính đầy đủ (không phải nghĩa vụ cuối cùng)\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — minh họa phương pháp; số cuối cùng phụ thuộc dữ kiện thực tế và ý kiến cán bộ thuế quản lý.\n- Dữ kiện (case 02): tổng hoạt động hoàn thành 1.180tr (bán hàng 1.010 + sửa chữa 170, đã trừ hoàn trả hợp lệ); 130tr Shopee sàn đã khấu trừ/kê khai/nộp thay; một địa điểm mỗi ngành.\n- **Bước 1 — phân bổ [14]** (giả định sửa chữa có tỷ lệ TNCN cao hơn): trừ 170tr sửa chữa trước, trừ tiếp 830tr bán hàng → còn 180tr bán hàng chịu TNCN → thuế TNCN minh họa = 180 × 0,5% = **0,9tr**. Con số này **chỉ minh họa lý thuyết của phép phân bổ ngành**.\n- **Bước 2 — cơ chế sàn:** 130tr Shopee HKD không khai/nộp lại (16.42); mức trừ 1 tỷ tính trên tổng gộp 1.180tr gồm cả phần sàn, sau đó đối trừ số sàn đã khấu trừ/nộp thay (16.48) → 0,9tr là thuế TNCN trước đối trừ và trước giảm 30% NQ 43, **không phải nghĩa vụ HKD phải tự nộp cuối cùng**.\n- **Bước 3 — NQ 43:** nếu đủ điều kiện (DT năm ≤ 10 tỷ), số thuế TNCN phải nộp được giảm 30% (16.39); cách kê khai chi tiết chờ Nghị định chính thức (16.39, PENDING).\n- **Bước 4 — GTGT:** tính trên doanh thu GTGT, không trừ 1 tỷ (16.44).\n- Số phải nộp cuối cùng chỉ chốt sau khi đối trừ số sàn đã khấu trừ/nộp thay (16.48), xác nhận dữ kiện bao vật tư (tỷ lệ sửa chữa) và kỳ khai tháng/quý (mốc HĐĐT).\n- CROSS_REFERENCE: 16.42 (cơ chế sàn khấu trừ/kê khai/nộp thay), 16.44 (GTGT tính trên doanh thu, không trừ 1 tỷ), 16.48 (đối trừ số sàn đã khấu trừ/nộp thay), 16.39 (giảm 30% số thuế TNCN theo NQ 43) — các mục này đều có nguồn chính thức; mục 16.46 chỉ minh họa phương pháp, không phải kết luận pháp lý độc lập."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1055",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.48. Mức trừ 1 tỷ TNCN với doanh thu qua sàn đã nộp thay: tính trên tổng gộp, đối trừ sau — VERIFIED (đóng U-Q2)",
    "ref_id": "16.48",
    "tier": "VERIFIED",
    "text": "[GIỚI HẠN PHƯƠNG PHÁP] Công thức trừ mức doanh thu rồi nhân tỷ lệ trong mục này CHỈ áp dụng TNCN theo phương pháp tỷ lệ trên doanh thu. Không áp cho phương pháp thu nhập tính thuế; không trừ mức này khỏi doanh thu GTGT. Không dùng mẫu tờ khai để thay điều kiện chọn phương pháp. Xem 16.56 và 16.99.\n16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.48. Mức trừ 1 tỷ TNCN với doanh thu qua sàn đã nộp thay: tính trên tổng gộp, đối trừ sau — VERIFIED (đóng U-Q2)\n- **LEGAL_STATUS:** `VERIFIED` (Việt đối chiếu pháp luật và hướng dẫn đến 26/09/2026).\n- Sàn đã khấu trừ/nộp thay **không làm mất quyền hưởng mức trừ 1 tỷ**.\n- Với cá nhân áp dụng TNCN = tỷ lệ % × doanh thu tính thuế: mức trừ tổng cộng là **1 tỷ đồng/năm trên toàn bộ hoạt động kinh doanh**.\n- Nhiều ngành/nghề hoặc địa điểm: được lựa chọn ngành/nghề hoặc địa điểm để áp mức trừ theo phương án có lợi nhất (16.40); nếu chưa dùng hết 1 tỷ thì tiếp tục phân bổ sang ngành/nghề/địa điểm khác.\n- Doanh thu qua Shopee/TikTok vẫn là doanh thu của HKD; sàn chỉ đóng vai trò khấu trừ và nộp thuế thay.\n- Ví dụ: bán hàng TikTok 800tr (sàn đã khấu trừ TNCN) + dịch vụ trực tiếp 700tr = 1,5 tỷ → mức trừ TNCN vẫn là 1 tỷ.\n- **Cấm** tính: 1,5 tỷ − 800tr đã nộp thay = 700tr — sai hoàn toàn.\n- Logic đúng: tổng doanh thu kinh doanh → phân bổ mức trừ 1 tỷ → xác định TNCN phải nộp → đối trừ số TNCN sàn đã khấu trừ/nộp thay.\n- Mẫu khai hiện hành có riêng các cột: doanh thu TMĐT đã được khấu trừ/nộp thay; số tiền tổ chức đã nộp thay; số thuế phải nộp thêm; số thuế nộp thừa.\n- Nếu tổng doanh thu cả năm ≤ 1 tỷ: số thuế sàn đã khấu trừ có thể trở thành thuế nộp thừa → xử lý hoàn hoặc bù trừ theo hồ sơ năm.\n- Lưu ý: mức trừ được phân bổ theo ngành/nghề/địa điểm, không hiểu đơn giản thành \"chọn sàn hay chọn Facebook\".\n- Nguồn:\n  - Mức trừ 1 tỷ TNCN (NĐ 141/2026 sửa đổi NĐ 68/2026): https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm\n  - Doanh thu TNCN bao gồm doanh thu qua sàn (Điều 5 NĐ 68/2026): https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1056",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.49. Nhóm thuế suất của khoản \"thưởng\" chưa rõ bản chất: xác định bản chất trước, cấm áp máy móc — VERIFIED_CONDITIONA",
    "ref_id": "16.49",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.49. Nhóm thuế suất của khoản \"thưởng\" chưa rõ bản chất: xác định bản chất trước, cấm áp máy móc — VERIFIED_CONDITIONAL (đóng U-Q4)\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` (Việt đối chiếu pháp luật và hướng dẫn đến 26/09/2026).\n- Chưa được phép chọn tỷ lệ chỉ vì chứng từ ghi chữ \"thưởng\". Trước hết phải xác định **tại sao người ta trả tiền**.\n- Phân loại theo bản chất:\n  - Thưởng/hỗ trợ đạt doanh số gắn với hoạt động phân phối hàng hóa → gắn với hoạt động thương mại;\n  - Trả tiền để HKD trưng bày, quảng cáo, marketing → bản chất có thể là dịch vụ;\n  - Không khớp nhóm cụ thể nào sau khi phân tích → \"hoạt động kinh doanh khác\".\n- Tỷ lệ % tính thuế TNCN theo ngành (NĐ 68/2026): xem bảng chuẩn tại **16.77**. (Ghi chú 2026-10-06: dòng liệt kê tỷ lệ cụ thể trước đây đã được rút số — chuỗi nguồn cũ (file 03 tier CASE_EVIDENCE) không đủ để VERIFIED; bảng 16.77 đã được điền từ nguyên văn luật ngày 2026-10-06: GTGT theo Điều 12 khoản 2 điểm b Luật 48/2024/QH15, TNCN theo Điều 7 khoản 3 Luật 109/2025/QH15.)\n- Cấm quy tắc \"không rõ thưởng là gì → cứ áp 1% hoạt động khác\".\n- Phải đọc: hợp đồng + chính sách thưởng + điều kiện nhận thưởng + nghĩa vụ HKD phải thực hiện.\n- Ví dụ: \"nhập đủ 3 tỷ hàng thì được thưởng 100 triệu\" → nghiêng mạnh về khoản thưởng gắn với hoạt động phân phối hàng hóa. \"Trả 10 triệu/tháng để đặt quầy trưng bày và treo banner\" → nghiêng về cung cấp dịch vụ quảng cáo/trưng bày.\n- Nguồn:\n  - Doanh thu TNCN và các khoản thưởng/hỗ trợ (Điều 5 NĐ 68/2026): https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm\n  - Tỷ lệ % tính thuế TNCN theo ngành (NĐ 68/2026): xem bảng chuẩn tại **16.77** (đã điền từ nguyên văn luật ngày 2026-10-06)"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1058",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.50. Giảm GTGT theo NQ204/NĐ174: đúng phương pháp, đối tượng và giai đoạn",
    "ref_id": "16.50",
    "tier": "VERIFIED",
    "text": "## 16.50. Giảm GTGT theo NQ204/NĐ174: đúng phương pháp, đối tượng và giai đoạn\n[PHẠM VI] Nghị định 174/2025/NĐ-CP thực hiện Nghị quyết 204/2025/QH15 trong giai đoạn 01/07/2025–31/12/2026. Xét hàng hóa/dịch vụ thực tế và nhóm loại trừ tại khoản 1 Điều 1, Phụ lục I, II; tên ngành chung chưa đủ xác nhận.\n[PHƯƠNG PHÁP] Khoản 2 Điều 1 NĐ174 phân biệt: khấu trừ áp thuế suất 8% cho đối tượng đủ điều kiện; trực tiếp trên doanh thu giảm 20% mức tỷ lệ. Thuế suất 5% trên hóa đơn không đồng nghĩa tỷ lệ trực tiếp 5%.\n[TÍNH TRỰC TIẾP] Đã xác nhận đủ điều kiện: tỷ lệ sau giảm = tỷ lệ gốc × 80%; 1% thành 0,8%, 5% thành 4%, không phải trừ 20 điểm phần trăm hoặc mặc định trừ 2 điểm. GTGT = doanh thu chịu thuế từng nhóm × tỷ lệ tương ứng.\n[NGOẠI LỆ] Không áp giảm cho nhóm bị loại trừ; không biến thuế suất 5% hoặc không chịu thuế thành diện được giảm. Có cả nhóm được và không được giảm thì tách doanh thu; thiếu phân bổ thì chưa chốt số cuối.\n[DỮ KIỆN] Cần thời điểm, phương pháp, tỷ lệ gốc, loại hàng/dịch vụ và cơ sở tính thuế. Người dùng đã giả định rõ đủ điều kiện thì tính theo giả định, ghi điều kiện ngắn gọn; không hỏi lại điều đã được xác nhận.\n[PHÂN BIỆT] NQ43 không giảm GTGT; phần trừ TNCN không khấu trừ khỏi cơ sở GTGT. Trình tự hóa đơn theo khoản 3 Điều 1 NĐ174; không suy nghĩa vụ hóa đơn từ phép tính đơn thuần.\nNguồn đối chiếu ngày 16/10/2026:\n- https://baochinhphu.vn/giam-thue-gia-tri-gia-tang-tu-01-7-2025-den-het-31-12-2026-10225070118590677.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1059",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.51. Chuỗi thay thế mẫu 01/TKN-CNKD (TT 18 → TT 50 → TT 89) và quy tắc hồ sơ đề nghị hoàn thuế nộp thừa — VERIFIED (ki",
    "ref_id": "16.51",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.51. Chuỗi thay thế mẫu 01/TKN-CNKD (TT 18 → TT 50 → TT 89) và quy tắc hồ sơ đề nghị hoàn thuế nộp thừa — VERIFIED (kiểm chứng 26/09/2026)\n- **LEGAL_STATUS:** `VERIFIED` (đối chiếu thuvienphapluat.vn toàn văn TT 50/2026/TT-BTC; LuatVietnam.vn và QĐ 2551/QĐ-BTC về TT 89/2026/TT-BTC; kiểm chứng 26/09/2026).\n- **Chuỗi thay thế mẫu 01/TKN-CNKD:** ban hành lần đầu kèm TT 18/2026/TT-BTC (05/3/2026) → được thay thế bởi mẫu kèm **TT 50/2026/TT-BTC** (Điều 3, hiệu lực **13/5/2026**) → tiếp tục được thay thế bởi mẫu kèm **TT 89/2026/TT-BTC** (khoản 5 Điều 99, hiệu lực **01/7/2026**; nội dung đính chính bởi **QĐ 2551/QĐ-BTC** ngày 17/09/2026). Hiện hành (từ 01/7/2026): dùng **Mẫu 01/TKN-CNKD ban hành kèm TT 89/2026/TT-BTC**. Mã số mẫu giữ nguyên qua các lần thay thế, chỉ phiên bản văn bản ban hành thay đổi.\n- **Hồ sơ đề nghị hoàn thuế nộp thừa của HKD/CNKD:** tờ khai thuế **Mẫu 01/TKN-CNKD** (đối với HKD/CNKD nộp TNCN theo phương pháp thuế suất × doanh thu, có chỉ tiêu đề nghị hoàn); **Mẫu 02/CNKD-TNCN-QTT** (phương pháp thu nhập tính thuế × thuế suất). Cơ sở: Điều 5 TT 18/2026, được TT 50/2026 cập nhật mẫu và TT 89/2026 thay thế phiên bản hiện hành.\n- **Quy tắc chắc chắn về thủ tục hoàn:** người nộp thuế **phải lập hồ sơ đề nghị hoàn**; cơ quan thuế tiếp nhận, phân loại (hoàn trước / kiểm tra trước hoàn) và giải quyết. Nếu thông tin trên hồ sơ khác dữ liệu quản lý của cơ quan thuế thì bị yêu cầu giải trình, bổ sung — thời gian này không tính vào thời hạn giải quyết. **Không khẳng định** \"khớp dữ liệu là được hoàn tự động không cần hồ sơ\".\n- **Thời hạn giải quyết** (con số theo Điều 75 Luật Quản lý thuế 2019 sửa đổi bởi Luật 56/2024/QH15; số điều tương ứng trong Luật Quản lý thuế 108/2025/QH15 hiện hành **chưa xác minh** — khi dẫn chỉ nêu con số, không ghi số điều): **06 ngày làm việc** đối với hồ sơ thuộc diện hoàn thuế trước; **40 ngày** đối với hồ sơ thuộc diện kiểm tra trước hoàn thuế — tính từ ngày cơ quan thuế có thông báo (bằng văn bản) về việc chấp nhận hồ sơ và thời hạn giải quyết.\n- **Guardrail:** khi dẫn bất kỳ mẫu biểu HKD nào, luôn kiểm tra văn bản đang hiệu lực **tại thời điểm viết** — chuỗi TT 18 → TT 50 → TT 89 trong vòng 4 tháng cho thấy mẫu biểu HKD 2026 thay đổi nhanh, không được dẫn mẫu cũ theo trí nhớ. Riêng hồ sơ khai thuế có kỳ tính thuế trước 01/7/2026 thì tiếp tục dùng mẫu áp dụng trước thời điểm TT 89 có hiệu lực (khoản 1 Điều 100 TT 89/2026).\n- Nguồn:\n  - TT 50/2026/TT-BTC (toàn văn, thuvienphapluat.vn): https://thuvienphapluat.vn/van-ban/Doanh-nghiep/Thong-tu-50-2026-TT-BTC-sua-doi-Thong-tu-18-2026-TT-BTC-quan-ly-thue-ho-kinh-doanh-705455.aspx\n  - Từ 01/7/2026, 6 biểu mẫu khai thuế được thay thế (LuatVietnam.vn): https://LuatVietnam.vn/tin-van-ban-moi/tu-01-7-2026-6-bieu-mau-khai-thue-duoc-thay-the-186-110509-article.html\n  - QĐ 2551/QĐ-BTC đính chính TT 89/2026/TT-BTC: https://doanhnhan.congly.vn/bo-tai-chinh-thay-the-mot-so-mau-bieu-quan-ly-thue.html"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1060",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.52. Chọn sổ kế toán 2026: S1a/S2a/S2b–S2e theo trạng thái và phương pháp thuế; không bắt buộc mua “sổ in sẵn” — VERIF",
    "ref_id": "16.52",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.52. Chọn sổ kế toán 2026: S1a/S2a/S2b–S2e theo trạng thái và phương pháp thuế; không bắt buộc mua “sổ in sẵn” — VERIFIED\n- **LEGAL_STATUS:** `VERIFIED` (Thông tư 152/2025/TT-BTC, nguồn hướng dẫn chính thức Bộ Tài chính, kiểm chứng 27/09/2026).\n- **Quy tắc chọn sổ:**\n  1. HKD/CNKD thuộc đối tượng **không chịu thuế GTGT, không phải nộp thuế TNCN** → dùng **Sổ doanh thu bán hàng hóa, dịch vụ mẫu S1a-HKD**.\n  2. HKD/CNKD nộp **GTGT và TNCN theo tỷ lệ % trên doanh thu** → dùng **S2a-HKD** để ghi doanh thu theo nhóm ngành có cùng tỷ lệ/mức thuế suất.\n  3. HKD/CNKD nộp GTGT theo tỷ lệ % doanh thu và TNCN theo **thu nhập tính thuế** → dùng bộ sổ **S2b-HKD (doanh thu), S2c-HKD (doanh thu/chi phí), S2d-HKD (vật liệu/dụng cụ/sản phẩm/hàng hóa), S2e-HKD (tiền)** theo hướng dẫn.\n  4. Có thuế đặc thù khác thì mở thêm sổ theo dõi nghĩa vụ thuế khác theo Thông tư.\n- **Guardrail:** không chọn sổ chỉ bằng câu “doanh thu dưới 1 tỷ”. Năm 2026, ngưỡng 1 tỷ thường giúp xác định nhóm không chịu GTGT/không phải nộp TNCN đối với hoạt động kinh doanh thông thường, nhưng AI vẫn phải xác nhận **trạng thái/phương pháp thuế** trước khi chốt mẫu sổ nếu case có ngoại lệ hoặc đang trong chuyển tiếp.\n- **Vở thường có dùng được không?** Pháp luật cho phép lưu sổ bằng **bản giấy hoặc điện tử**, đồng thời cho phép bổ sung/sửa đổi biểu mẫu sổ cho phù hợp. Vì vậy không có yêu cầu phải mua một cuốn sổ in sẵn tại nhà sách. Một cuốn vở giấy chỉ nên dùng khi được lập thành sổ với nội dung/cột cần thiết và thông tin nhận diện theo quy định; ghi tự do không theo cấu trúc mẫu không phải cách an toàn.\n- **Mẫu trả lời ngắn:** “Nếu bạn thuộc nhóm không chịu GTGT/không phải nộp TNCN thì dùng S1a-HKD. Không bắt buộc mua sổ in sẵn; có thể in mẫu, làm Excel hoặc lập sổ giấy có đủ nội dung theo mẫu.”\n- Nguồn chính thức Bộ Tài chính: https://www.mof.gov.vn/bo-tai-chinh/thong-tin-tham-dinh-gia/huong-dan-ke-toan-cho-ho-va-ca-nhan-kinh-doanh-tu-nam-2026\n- Nguồn Cổng Chính phủ: https://xaydungchinhsach.chinhphu.vn/huong-dan-ke-toan-cho-ho-kinh-doanh-ca-nhan-kinh-doanh-khong-chiu-thue-gtgt-khong-phai-nop-thue-tncn-11926011214502446.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1061",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.53. Vượt ngưỡng 1 tỷ trong năm 2026: bắt đầu khai từ quý phát sinh vượt; sau đó xác định chu kỳ tháng/quý theo dải do",
    "ref_id": "16.53",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.53. Vượt ngưỡng 1 tỷ trong năm 2026: bắt đầu khai từ quý phát sinh vượt; sau đó xác định chu kỳ tháng/quý theo dải doanh thu và phương pháp — VERIFIED_CONDITIONAL\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` vì nghĩa vụ pháp lý đã rõ nhưng cách xử lý hồ sơ cụ thể còn phụ thuộc lịch sử tờ khai đã nộp/chấp nhận trên hệ thống.\n- **Nguyên tắc 2026:** HKD/CNKD tự xác định doanh thu năm **từ 1 tỷ đồng trở xuống** thì thực hiện thông báo doanh thu thực tế theo cơ chế 01/TKN-CNKD. Nếu trong năm phát sinh doanh thu thực tế **trên 1 tỷ đồng**, thực hiện khai thuế, nộp thuế **kể từ quý phát sinh doanh thu trên 1 tỷ đồng**.\n- **Biên ngưỡng:** `=1 tỷ` vẫn thuộc nhánh “từ 1 tỷ trở xuống”; chỉ khi **>1 tỷ** mới kích hoạt nhánh trên 1 tỷ. Nếu người dùng nói “chạm mốc 1 tỷ” mà không rõ đúng bằng hay đã vượt, không được tự hiểu là vượt.\n- **Chu kỳ sau khi thuộc diện khai:**\n  - GTGT: doanh thu năm **từ 50 tỷ đồng trở xuống** → khai theo **quý**; **trên 50 tỷ** → theo **tháng**.\n  - TNCN theo phương pháp `% x doanh thu`: khai/nộp **theo quý** cùng cơ chế GTGT.\n  - TNCN theo phương pháp `thu nhập tính thuế x thuế suất`: tạm nộp theo chu kỳ gắn với dải doanh thu/phương pháp theo quy định hiện hành và quyết toán năm khi thuộc diện.\n- **Cấm suy ngược:** nếu lũy kế lần đầu vượt 1 tỷ ở tháng 8 (quý III) thì điểm kích hoạt là **quý III**; không vì cuối năm vượt ngưỡng mà tự tạo nghĩa vụ cho quý II khi đến hết quý II chưa vượt.\n- **Lịch sử khai tháng/quý là lớp thủ tục riêng:** nếu người dùng đã nộp tờ khai tháng 1, 2, 3 hoặc đã nộp một tờ quý và được hệ thống chấp nhận, AI phải hỏi/kiểm tra trạng thái trước khi bảo nộp tờ khai chồng kỳ. Không dùng câu “đã khai tháng trước đây” làm căn cứ pháp lý rằng hiện tại phải tiếp tục khai tháng.\n- **Case mẫu:** “Tháng 8 lũy kế vượt 1 tỷ, doanh thu năm không quá 50 tỷ, TNCN theo % doanh thu” → về nghĩa vụ hiện hành, bắt đầu từ **quý III** và chu kỳ là **quý**. Các tờ tháng 1–3 đã nộp là vấn đề chuyển tiếp/hồ sơ, không tự biến quý III thành khai tháng.\n- Nguồn Cục Thuế/Cổng Chính phủ (đã cập nhật ngưỡng 1 tỷ): https://xaydungchinhsach.chinhphu.vn/lam-video-dang-tai-len-nen-tang-youtube-va-co-phat-sinh-doanh-thu-co-can-ke-khai-thue-119260723152359049.htm\n- Nguồn thủ tục 01/CNKD/01-TKN-CNKD: https://xaydungchinhsach.chinhphu.vn/huong-dan-thu-tuc-khai-thue-doi-voi-ho-kinh-doanh-ca-nhan-kinh-doanh-119260530072620314.htm\n- NĐ 141/2026 sửa ngưỡng 500 triệu thành 1 tỷ: https://xaydungchinhsach.chinhphu.vn/nghi-dinh-so-141-2026-nd-cp-quy-dinh-moi-ve-chinh-sach-thue-doi-voi-ho-kinh-doanh-doanh-nghiep-119260430091642895.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1062",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.54. Kỳ 2022–2025: ngưỡng 100 triệu/năm; trường hợp lịch sử không trọn năm phải xác định đúng phương pháp trước khi “q",
    "ref_id": "16.54",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.54. Kỳ 2022–2025: ngưỡng 100 triệu/năm; trường hợp lịch sử không trọn năm phải xác định đúng phương pháp trước khi “quy đổi 12 tháng” — VERIFIED_CONDITIONAL\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Với kỳ **2022–2025**, quy tắc chung theo TT 40/2021/TT-BTC là hộ/cá nhân kinh doanh có doanh thu trong năm dương lịch **từ 100 triệu đồng trở xuống** thuộc trường hợp không phải nộp GTGT và TNCN từ kinh doanh. Không lấy ngưỡng 1 tỷ của năm 2026 trả lời ngược.\n- **Nếu kinh doanh đủ 12 tháng:** xét tổng doanh thu của năm theo ngưỡng 100 triệu. Ví dụ năm 2023 tổng doanh thu 80 triệu → dưới ngưỡng.\n- **Nếu không trọn năm:** không được tự áp một công thức cho mọi trường hợp. TT 40 bản gốc (khoản 3 Điều 7, áp dụng 01/08/2021–31/12/2021) quy định việc quy đổi doanh thu tương ứng 12 tháng đối với **hộ khoán kinh doanh không trọn năm**; doanh thu thực tế dùng tính số thuế là doanh thu của số tháng thực tế kinh doanh. Ví dụ chính thức trong TT 40: bắt đầu kinh doanh, 9 tháng dự kiến 90 triệu (10 triệu/tháng) → quy đổi 12 tháng = 120 triệu nên thuộc diện phải nộp thuế trên doanh thu thực tế 90 triệu. **Lưu ý thời gian:** từ 01/01/2022, TT 100/2021/TT-BTC đã sửa khoản 3 Điều 7 TT 40 — hộ khoán mới ra kinh doanh trong năm xét theo doanh thu kinh doanh thực tế trong năm so với 100 triệu, không quy đổi 12 tháng nữa. Chi tiết tại 16.60.\n- Hoạt động **cho thuê tài sản** không đủ 12 tháng cũng có quy tắc 12 tháng riêng trong TT 40 bản gốc (điểm c khoản 1 Điều 9); từ 01/01/2022, TT 100/2021 sửa điểm này: xét theo doanh thu cho thuê thực tế phát sinh trong năm so với 100 triệu (trường hợp trả trước nhiều năm thì phân bổ theo năm dương lịch).\n- **Guardrail:** trước khi annualize một case lịch sử, phải biết người hỏi thuộc hộ khoán/cho thuê tài sản hay cơ chế khác; không mang logic annualize lịch sử sang năm 2026.\n- Nguồn chính thức Cục Thuế — TT 40/2021/TT-BTC và ví dụ không trọn năm: https://binhduong.gdt.gov.vn/wps/portal/home/documents/detail?1dmy=&current=true&urile=wcm%3Apath%3AGDT+Content%2Fsa_gdt%2Fcctthc%2Ftthchh%2Fsa_tthc_vanban%2Fsa_tthc_vb_vbqd%2Fbad3a9ff-6e52-4bb5-a14b-293ae4d44026\nCăn cứ tính số thuế: Điều 10 Thông tư 40/2021/TT-BTC quy định doanh thu tính thuế, tỷ lệ và công thức; khoản 2 dẫn Phụ lục I theo ngành nghề. Không dùng Điều 8 (nộp thay) hoặc Điều 9 (trường hợp đặc thù) làm căn cứ chung cho phép tính bán hàng thông thường khi không có tình tiết tương ứng. Nguồn: https://chinhsachonline.chinhphu.vn/kinh-doanh-thuong-mai-dien-tu-xac-dinh-doanh-thu-tinh-thue-the-nao-79191.htm ; https://portal.mof.gov.vn/hoidapcstc/home/cthoidap/152386"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1063",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.55. HTKK/eTax/phần mềm tự tính ra số thuế không tự chứng minh nghĩa vụ cuối cùng — VERIFIED_CONDITIONAL",
    "ref_id": "16.55",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.55. HTKK/eTax/phần mềm tự tính ra số thuế không tự chứng minh nghĩa vụ cuối cùng — VERIFIED_CONDITIONAL\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` vì quy tắc thuế được xác minh nhưng hành vi hiển thị phụ thuộc phiên bản/phần mềm và dữ liệu nhập.\n- Một ô số thuế được phần mềm tính theo công thức không thay thế bước xác định **đối tượng/kỳ/ngưỡng** theo luật. AI phải tách:\n  1. `DISPLAYED_CALCULATION`: phần mềm đang nhân/chuyển số thế nào;\n  2. `LEGAL_LIABILITY`: kỳ đó người nộp thuế có thuộc diện phát sinh nghĩa vụ hay không.\n- Ví dụ: nhập doanh thu **14.355.500** vào nhóm phân phối, phần mềm hiển thị GTGT **143.555** (=1%) và TNCN khoảng **71.778** (=0,5%) cho thấy phần mềm đang chạy công thức tỷ lệ. Nếu đây là **năm 2023**, kinh doanh đủ 12 tháng và **tổng doanh thu cả năm** vẫn không quá 100 triệu, phải quay về ngưỡng lịch sử tại 16.54 trước khi kết luận phải nộp.\n- Không khuyên người dùng sửa/xóa số liệu chỉ để làm ô thuế về 0. Phải kiểm tra đúng tờ khai, đúng kỳ và toàn bộ doanh thu năm; nếu phần mềm/tờ khai không phản ánh đúng trường hợp thì xử lý theo hướng dẫn của cơ quan thuế/phần mềm.\n- Cross-reference: 16.24 (trạng thái hồ sơ điện tử), 16.51 (phiên bản mẫu), 16.54 (kỳ lịch sử)."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1064",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.56. Phương pháp TNCN theo dải doanh thu và ngoại lệ chuyển từ năm tiếp theo",
    "ref_id": "16.56",
    "tier": "VERIFIED",
    "text": "## 16.56. Phương pháp TNCN theo dải doanh thu và ngoại lệ chuyển từ năm tiếp theo\n[CĂN CỨ] Điều 7 Luật Thuế thu nhập cá nhân 109/2025/QH15; khoản 5 Điều 4 Nghị định 68/2026/NĐ-CP, cập nhật ngưỡng theo Nghị định 141/2026/NĐ-CP.\n[PHẠM VI] Cá nhân kinh doanh thông thường theo Điều 7 Luật 109/2025/QH15, Điều 4 NĐ68/2026 đã sửa bởi NĐ141/2026. Không áp bảng này máy móc cho tiền lương hoặc cho thuê bất động sản có quy tắc riêng.\n[DẢI DOANH THU] Sau cập nhật ngưỡng NĐ141: trên 1 tỷ đến đúng 3 tỷ thuộc dải lựa chọn tỷ lệ doanh thu hoặc thu nhập tính thuế ×15%; trên 3 tỷ đến đúng 50 tỷ là dải thu nhập tính thuế ×17%; trên 50 tỷ là ×20%. Đây là thuế suất trên thu nhập tính thuế, không nhân trực tiếp với doanh thu.\n[CHUYỂN TIẾP] Điểm d khoản 5 Điều 4 NĐ68: trường hợp đang áp dụng tỷ lệ doanh thu ở dải được lựa chọn, cuối năm mới xác định thực tế vượt 3 tỷ thì chuyển phương pháp thu nhập từ năm tiếp theo. Không chỉ thấy tổng cuối năm >3 tỷ rồi hồi tố 17% cho năm đó.\n[ỔN ĐỊNH] Phương pháp thu nhập thuộc trường hợp quy định được áp dụng ổn định 2 năm liên tục. Cần biết phương pháp đang áp dụng và năm bắt đầu; doanh thu giảm không tự chứng minh được đổi phương pháp ngay.\n[DỮ KIỆN] Nếu chỉ nêu doanh thu vượt 3 tỷ mà chưa rõ phương pháp đang áp dụng hoặc tình huống vượt cuối năm, trình bày nhánh phù hợp/hỏi thêm. Thiếu thu nhập tính thuế hợp lệ thì không suy số thuế từ chi phí ước lượng, tiền còn lại hay số dư.\n[RANH GIỚI] Bảo toàn đến đồng, không làm tròn qua 3 tỷ hoặc 50 tỷ. Giảm NQ43 là bước riêng, không quyết định phương pháp.\nNguồn đối chiếu ngày 16/10/2026:\n- https://xaydungchinhsach.chinhphu.vn/quy-dinh-thue-thu-nhap-ca-nhan-doi-voi-thu-nhap-tu-kinh-doanh-119260327063731539.htm\n- https://xaydungchinhsach.chinhphu.vn/phuong-phap-tinh-thue-voi-ca-nhan-kinh-doanh-ho-kinh-doanh-119260309100708724.htm\n- https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-du-kien-dau-nam-doanh-thu-duoi-3-ty-dong-cuoi-nam-vuot-3-ty-dong-ap-dung-phuong-phap-tinh-thue-tncn-nao-119260722111045417.htm\n- https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1065",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.57. Sàn đã khấu trừ theo giao dịch nhưng doanh thu năm >3 tỷ: vẫn quyết toán TNCN theo phương pháp thu nhập; số sàn n",
    "ref_id": "16.57",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.57. Sàn đã khấu trừ theo giao dịch nhưng doanh thu năm >3 tỷ: vẫn quyết toán TNCN theo phương pháp thu nhập; số sàn nộp thay được đối trừ; phí sàn/quảng cáo có thể là chi phí được trừ nếu đủ điều kiện — VERIFIED\n- **LEGAL_STATUS:** `VERIFIED`.\n- Khấu trừ/nộp thay của nền tảng theo từng giao dịch là cơ chế thực hiện nghĩa vụ tại nguồn; **không làm thay đổi phương pháp TNCN phải áp dụng cho cả năm**.\n- Nếu doanh thu năm **trên 3 tỷ đến 50 tỷ**, HKD/CNKD bắt buộc tính TNCN theo `thu nhập tính thuế × 17%` và khai quyết toán TNCN năm. Số TNCN nền tảng đã khấu trừ/nộp thay **được trừ** khi xác định số còn phải nộp theo quyết toán.\n- Với doanh thu >3 tỷ, **phí sàn và phí quảng cáo** có thể là chi phí được trừ nếu thực tế liên quan hoạt động kinh doanh và đáp ứng điều kiện hóa đơn/chứng từ, thanh toán theo Điều 6 NĐ 68/2026. Không tự trừ các khoản này khỏi doanh thu nếu đang ở phương pháp `% × doanh thu`.\n- GTGT vẫn xử lý theo cơ chế riêng; không lấy việc quyết toán TNCN 17% để suy rằng GTGT cũng tính trên lợi nhuận.\n- Nguồn:\n  - Cục Thuế trả lời case sàn >3 tỷ và quyết toán/đối trừ: https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-tren-san-thuong-mai-dien-tu-co-doanh-thu-tren-3-50-ty-dong-nam-cuoi-nam-co-phai-quyet-toan-thue-tncn-theo-loi-nhuan-11926072106422835.htm\n  - Phí sàn/quảng cáo được trừ nếu đủ điều kiện: https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-qua-thuong-mai-dien-tu-co-doanh-thu-tren-3-ti-dong-phi-san-va-phi-quang-cao-co-duoc-tru-khi-tinh-thue-tncn-119260722171402469.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1066",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.58. HĐĐT tự nguyện ở nhóm ≤1 tỷ và trường hợp không có hóa đơn đầu vào: tách quyền dùng HĐĐT khỏi nghĩa vụ thuế và ch",
    "ref_id": "16.58",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.58. HĐĐT tự nguyện ở nhóm ≤1 tỷ và trường hợp không có hóa đơn đầu vào: tách quyền dùng HĐĐT khỏi nghĩa vụ thuế và chứng từ đầu vào — VERIFIED_CONDITIONAL\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Năm 2026, HKD/CNKD có doanh thu năm **từ 1 tỷ đồng trở xuống** nếu đáp ứng điều kiện và có nhu cầu thì **được đăng ký sử dụng HĐĐT**. Việc đăng ký tự nguyện không tự làm doanh thu tăng, không tự biến hộ thành đối tượng phải nộp GTGT/TNCN và không tự đổi phương pháp TNCN; nghĩa vụ thuế vẫn xét theo quy định thuế tương ứng.\n- Trường hợp doanh thu **trên 1 tỷ** thuộc diện bắt buộc HĐĐT theo quy tắc tại 16.41 (ngoại lệ tài sản phải đăng ký quyền xem 16.38).\n- **Không có hóa đơn đầu vào** không phải là lý do để bỏ nghĩa vụ lập hóa đơn đầu ra khi pháp luật yêu cầu. Cục Thuế đã hướng dẫn trường hợp bán Facebook trên 1–3 tỷ, hàng mua không đủ hóa đơn đầu vào vẫn có thể lựa chọn phương pháp thuế suất × doanh thu và đăng ký/xuất HĐĐT.\n- Tuy nhiên, thiếu chứng từ đầu vào có thể ảnh hưởng việc chứng minh nguồn gốc hàng hóa và **chi phí được trừ** nếu áp dụng phương pháp thu nhập tính thuế; không được suy thành “đầu vào không hóa đơn thì mọi thứ đều hợp lệ”.\n- Nguồn:\n  - HĐĐT tự nguyện dưới 1 tỷ: https://xaydungchinhsach.chinhphu.vn/huong-dan-su-dung-hoa-don-dien-tu-voi-ho-kinh-doanh-co-doanh-thu-duoi-1-ty-dong-nam-119260727150121544.htm\n  - Không đủ hóa đơn đầu vào, doanh thu 1–3 tỷ: https://xaydungchinhsach.chinhphu.vn/ban-hang-qua-facebook-doanh-thu-tren-1-3-ty-dong-khong-co-hoa-don-dau-vao-co-the-lua-chon-phuong-phap-tinh-thue-nao-119260721164211413.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1067",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.59. Quên kỳ / nộp trùng tháng-quý: giữ nguyên ranh giới kỳ tính thuế; chưa nộp thì nộp đúng kỳ bị thiếu, đã nộp sai t",
    "ref_id": "16.59",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.59. Quên kỳ / nộp trùng tháng-quý: giữ nguyên ranh giới kỳ tính thuế; chưa nộp thì nộp đúng kỳ bị thiếu, đã nộp sai thì khai bổ sung đúng kỳ sai — VERIFIED_CONDITIONAL\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` vì cách thao tác hủy/điều chỉnh cụ thể còn phụ thuộc hồ sơ đã được hệ thống chấp nhận và trạng thái nghĩa vụ.\n- Mỗi kỳ tháng/quý có thời hạn và hồ sơ riêng. Nếu **quý II thuộc diện phải khai nhưng chưa nộp**, không được coi việc cộng doanh thu quý II vào tờ quý III là thay thế cho tờ quý II; phải xử lý **hồ sơ của đúng quý II** và nghĩa vụ chậm tương ứng.\n- Nếu **chưa từng nộp** hồ sơ của kỳ đó → nộp hồ sơ lần đầu của đúng kỳ (dù đã muộn).\n- Nếu **đã nộp nhưng có sai, sót** → khai bổ sung cho **kỳ phát sinh sai, sót** theo Luật QLT 108/2025 và NĐ 252/2026.\n- Nếu đã nộp **trùng tháng và quý** cho cùng khoảng thời gian, trước khi nộp thêm/hủy phải kiểm tra: tờ nào đã tiếp nhận, kỳ nào đang tạo nghĩa vụ/nợ, mã giao dịch và thông báo của hệ thống; không đưa ra lệnh “nộp thêm một tờ quý” khi có nguy cơ chồng kỳ.\n- Nguồn:\n  - Thời hạn hồ sơ tháng/quý: https://xaydungchinhsach.chinhphu.vn/quy-dinh-thoi-han-nop-ho-so-khai-thue-119260703120801722.htm\n  - Khai bổ sung đúng kỳ sai, sót: https://xaydungchinhsach.chinhphu.vn/quy-dinh-khai-bo-sung-ho-so-khai-thue-khoan-thu-khac-119260716102235462.htm"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1068",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.60. Temporal canonical: ngưỡng GTGT/TNCN của hộ/cá nhân kinh doanh theo từng kỳ 2021–2026 — VERIFIED_HISTORICAL + VER",
    "ref_id": "16.60",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.60. Temporal canonical: ngưỡng GTGT/TNCN của hộ/cá nhân kinh doanh theo từng kỳ 2021–2026 — VERIFIED_HISTORICAL + VERIFIED_CURRENT\n- **LEGAL_STATUS:** `VERIFIED_HISTORICAL` cho 2021–2025; `VERIFIED_CURRENT` cho 2026 (tại ngày 27/09/2026).\n- Bảng thời gian tối thiểu khi trả lời câu hỏi có nhiều năm:\n  - **2021:** 100 triệu đồng/năm trở xuống (TT 92 trước 01/08/2021 và TT 40 từ 01/08/2021; có quy định chuyển tiếp — xem 16.62).\n  - **2022–2025:** 100 triệu đồng/năm trở xuống. Không áp mức 200 triệu của Luật GTGT 2024 cho năm 2025.\n  - **2026:** 01 tỷ đồng/năm trở xuống (NĐ 141/2026/NĐ-CP sửa NĐ 68/2026/NĐ-CP, hiệu lực áp dụng từ 01/01/2026).\n- Các mốc trung gian dễ gây nhầm: Luật GTGT 2024 từng quy định mốc 200 triệu có hiệu lực từ 01/01/2026; NĐ 68/2026 dùng mốc 500 triệu; NĐ 141/2026 ngày 29/04/2026 sửa thành 01 tỷ và quy định hiệu lực từ 01/01/2026. Tại ngày 27/09/2026, câu trả lời hiện hành cho năm 2026 không được dừng ở mốc 200 triệu hoặc 500 triệu.\n- **Hộ khoán kinh doanh không trọn năm — xét ngưỡng theo từng kỳ (bổ sung 27/09/2026 theo review của Việt):**\n  - Trước 01/08/2021 (TT 92: điểm b khoản 1 Điều 2) và 01/08/2021–31/12/2021 (TT 40 bản gốc, khoản 3 Điều 7): hộ khoán kinh doanh không đủ 12 tháng trong năm dương lịch (mới ra kinh doanh, kinh doanh thường xuyên theo thời vụ, ngừng/tạm ngừng kinh doanh) thì mức 100 triệu đồng/năm để xét không phải nộp thuế GTGT/TNCN là doanh thu tính thuế TNCN của một năm 12 tháng; doanh thu tính thuế thực tế để xác định số thuế khoán phải nộp trong năm là doanh thu tương ứng với số tháng thực tế kinh doanh. Ví dụ trong TT 40: kinh doanh 9 tháng, doanh thu thực tế 90 triệu → quy đổi tương ứng 120 triệu/12 tháng → thuộc diện phải nộp thuế trên doanh thu thực tế 90 triệu.\n  - Từ 01/01/2022 (TT 100/2021/TT-BTC sửa khoản 3 Điều 7 TT 40): hộ khoán mới ra kinh doanh trong năm (kinh doanh không đủ 12 tháng trong năm dương lịch) xét trên doanh thu kinh doanh thực tế trong năm so với 100 triệu — trên 100 triệu thì thuộc diện phải nộp thuế GTGT/TNCN, từ 100 triệu trở xuống thì không phải nộp.\n  - **Câu chặn:** không kết luận \"doanh thu thực tế dưới 100 triệu thì không phải nộp\" trước khi xác định phương pháp tính thuế (khoán/kê khai/từng lần phát sinh), số tháng kinh doanh thực tế và kỳ áp dụng. Không lấy cách quy đổi của hộ khoán áp cho mọi trường hợp.\n- **LEGAL_STATUS (mục bổ sung):** `VERIFIED_HISTORICAL` (đối chiếu văn bản gốc 27/09/2026).\n- Nguồn mục bổ sung: khoản 3 Điều 7 TT 40/2021/TT-BTC (bản gốc và bản sửa bởi khoản 1 Điều 1 TT 100/2021/TT-BTC); điểm b khoản 1 Điều 2 TT 92/2015/TT-BTC; https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Circular-40-2021-TT-BTC-value-added-tax-personal-income-tax-479507.aspx\n- Rule cho RAG/AI: nếu truy xuất được nhiều chunk có các số 100 triệu / 200 triệu / 500 triệu / 1 tỷ, phải đọc ngày hiệu lực và kỳ áp dụng, ưu tiên văn bản sửa đổi mới nhất có hiệu lực cho đúng kỳ, không chọn con số xuất hiện nhiều nhất; nêu rõ đây là thay đổi theo thời gian nếu người dùng hỏi nhiều năm.\n- Nguồn: NĐ 141/2026/NĐ-CP ngày 29/04/2026; thông tin triển khai của Cục Thuế/Cổng TTĐT Chính phủ về việc nâng ngưỡng lên 01 tỷ đồng/năm."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1069",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.61. Temporal canonical: từ 01/07/2026, thời hạn khai bổ sung chuyển từ 10 năm xuống 05 năm — VERIFIED_CURRENT",
    "ref_id": "16.61",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.61. Temporal canonical: từ 01/07/2026, thời hạn khai bổ sung chuyển từ 10 năm xuống 05 năm — VERIFIED_CURRENT\n- **LEGAL_STATUS:** `VERIFIED_CURRENT` (tại ngày 27/09/2026).\n- Điều 47 Luật Quản lý thuế 38/2019/QH14 từng quy định thời hạn khai bổ sung là 10 năm kể từ ngày hết hạn nộp hồ sơ của kỳ có sai, sót, với các điều kiện của luật.\n- Luật Quản lý thuế 108/2025/QH15 có hiệu lực từ 01/07/2026; khoản 5 Điều 12 quy định thời hạn khai bổ sung là **05 năm** kể từ ngày hết thời hạn nộp hồ sơ của kỳ có sai, sót, đồng thời thiết kế lại các trường hợp được khai bổ sung.\n- Guardrail: không dùng chunk cũ \"được khai bổ sung trong 10 năm\" làm câu trả lời hiện hành sau 01/07/2026 mà không kiểm tra điều khoản chuyển tiếp/tình huống cụ thể. Với hồ sơ của kỳ cũ đang xử lý trong năm 2026, cần xác định luật thủ tục áp dụng và điều khoản chuyển tiếp trước khi kết luận còn hay hết thời hạn.\n- Không suy ra \"hết 05 năm thì nghĩa vụ thuế tự mất\"; thời hạn khai bổ sung, thời hiệu xử phạt và thời hạn truy thu/xử lý nghĩa vụ là các vấn đề khác nhau.\n- Về không xử phạt khi tự khai bổ sung: chỉ áp dụng khi đủ điều kiện theo khoản 2 Điều 44 Luật 108/2025/QH15 (hành vi khai sai theo khoản 2 Điều 45, đã khai bổ sung, đã tự giác nộp đủ số tiền thuế phải nộp, hoàn thành trước các mốc phát hiện/kiểm tra/thanh tra mà luật quy định). Không hứa \"chắc chắn thoát phạt\" khi chưa đủ điều kiện."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1070",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.62. Năm 2021: ngưỡng 100 triệu đồng không bị mất khi chuyển từ TT 92 sang TT 40 — VERIFIED_HISTORICAL",
    "ref_id": "16.62",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.62. Năm 2021: ngưỡng 100 triệu đồng không bị mất khi chuyển từ TT 92 sang TT 40 — VERIFIED_HISTORICAL\n- **LEGAL_STATUS:** `VERIFIED_HISTORICAL` (chỉ đúng cho kỳ 2021).\n- TT 40/2021/TT-BTC có hiệu lực từ 01/08/2021; khoản 6 Điều 20 bãi bỏ Chương I và Chương II TT 92/2015/TT-BTC kể từ thời điểm TT 40 có hiệu lực.\n- Trước 01/08/2021, TT 92 đã có ngưỡng 100 triệu đồng/năm: khoản 2 Điều 1 (người nộp thuế theo Chương I không bao gồm cá nhân kinh doanh có doanh thu từ 100 triệu đồng/năm trở xuống); điểm b khoản 1 Điều 2 (với cá nhân nộp thuế khoán, doanh thu từ 100 triệu đồng/năm trở xuống là mức xác định không phải nộp GTGT, TNCN).\n- Từ 01/08/2021, khoản 2 Điều 4 TT 40 tiếp tục quy định hộ/cá nhân kinh doanh có doanh thu trong năm dương lịch từ 100 triệu đồng trở xuống thuộc trường hợp không phải nộp GTGT và TNCN.\n- Hệ quả: khi đánh giá ngưỡng doanh thu năm 2021, không được nói từ 01/08/2021 ngưỡng 100 triệu bị mất. Nhưng không diễn đạt quá đơn giản là \"chia năm 2021 thành hai nửa để tính thuế riêng\": Điều 20 TT 40 có quy định chuyển tiếp, đặc biệt hộ đang được quản lý theo phương pháp khoán trước thời điểm TT 40 có hiệu lực và không yêu cầu chuyển đổi thì tiếp tục nộp theo phương pháp khoán đến hết kỳ tính thuế năm 2021. Phương pháp quản lý/kê khai cụ thể phải xét quy định chuyển tiếp của từng trường hợp.\n- Không được suy diễn: không dùng mục này cho năm 2026; không tự suy ra mọi hộ trong năm 2021 đều phải \"tách tờ khai\" tại ngày 01/08/2021; không dùng ngưỡng này để kết luận về lệ phí, hóa đơn hoặc nghĩa vụ khác ngoài phạm vi GTGT/TNCN nếu chưa kiểm tra riêng."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1071",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.63. Thời hạn nộp hồ sơ khai thuế tháng/quý từ 01/07/2026 (Điều 10 NĐ 252/2026): ngày cuối cùng của tháng đầu quý sau,",
    "ref_id": "16.63",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.63. Thời hạn nộp hồ sơ khai thuế tháng/quý từ 01/07/2026 (Điều 10 NĐ 252/2026): ngày cuối cùng của tháng đầu quý sau, không phải \"ngày 30\" — VERIFIED_CURRENT\n- **LEGAL_STATUS:** `VERIFIED_CURRENT` (đối chiếu web ngày 28/09/2026; NĐ 252/2026/NĐ-CP: OK trong citation_validity.md cùng ngày).\n- Từ 01/07/2026, Luật Quản lý thuế 108/2025 không quy định trực tiếp thời hạn nộp hồ sơ khai thuế mà giao Chính phủ quy định chi tiết. Điều 10 NĐ 252/2026/NĐ-CP (ban hành 30/6/2026, hiệu lực 01/7/2026) quy định:\n  - Thuế khai theo tháng: chậm nhất là ngày thứ 20 của tháng tiếp theo tháng phát sinh nghĩa vụ thuế.\n  - Thuế khai theo quý: chậm nhất là ngày cuối cùng của tháng đầu của quý tiếp theo quý phát sinh nghĩa vụ thuế (ví dụ: tờ khai quý IV/2026 hạn 31/01/2027).\n  - Ngày cuối cùng trùng ngày nghỉ thì tính là ngày làm việc liền kề sau ngày nghỉ (khoản 7 Điều 3 NĐ 252/2026).\n- Ghi nhớ từ lỗi thực tế ngày 28/09/2026: không được viết gọn hạn quý thành \"ngày 30 của tháng đầu quý sau\" — các tháng có 31 ngày thì hạn là ngày 31. Quy định cũ (Điều 44 Luật QLT 2019) cũng dùng cách diễn đạt \"ngày cuối cùng\", không phải \"ngày 30\".\n- Nguồn: toàn văn Điều 10 NĐ 252/2026/NĐ-CP (đối chiếu qua thuvienphapluat.vn ngày 28/09/2026)."
  },
  {
    "id": "KB/16C-dang-ky-thue-va-xu-phat.md#1077",
    "file": "KB/16C-dang-ky-thue-va-xu-phat.md",
    "section": "16.64. Thời hạn đăng ký thuế lần đầu từ 01/07/2026 (NĐ 252/2026, Điều 6)",
    "ref_id": "16.64",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16C — Đăng ký thuế lần đầu & xử phạt vi phạm hành chính về thuế, hóa đơn (VERIFIED 2026-10-06)\n## 16.64. Thời hạn đăng ký thuế lần đầu từ 01/07/2026 (NĐ 252/2026, Điều 6)\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — kết luận đúng chỉ khi xác định được loại đăng ký (liên thông hay trực tiếp).\n- Căn cứ: khoản 3 Điều 10 Luật Quản lý thuế 108/2025/QH15, chi tiết tại điểm a khoản 3 Điều 6 NĐ 252/2026/NĐ-CP (hiệu lực 01/07/2026).\n- **Đăng ký thuế liên thông** (thực hiện đăng ký thuế cùng với đăng ký kinh doanh theo cơ chế một cửa liên thông): thời hạn theo thời hạn đăng ký hộ kinh doanh/doanh nghiệp.\n- **Đăng ký thuế trực tiếp** với cơ quan thuế (không liên thông): **10 ngày làm việc** kể từ mốc tương ứng, trong đó:\n  - ngày được cấp giấy phép thành lập và hoạt động / giấy phép đăng ký kinh doanh / quyết định thành lập (tổ chức thuộc diện đăng ký hoạt động, kinh doanh);\n  - **ngày bắt đầu hoạt động kinh doanh** (tổ chức, hộ kinh doanh, cá nhân kinh doanh không thuộc diện đăng ký kinh doanh; hoặc thuộc diện đăng ký kinh doanh nhưng chưa được cấp giấy chứng nhận — đăng ký thuế trực tiếp bằng mẫu 03-ĐKT);\n  - ngày ký hợp đồng nhận thầu (nhà thầu nước ngoài), ngày ký hợp đồng dầu khí;\n  - ngày phát sinh nghĩa vụ thuế TNCN (cá nhân trực tiếp đăng ký theo nghĩa vụ TNCN);\n  - ngày phát sinh nghĩa vụ với ngân sách nhà nước (trường hợp khác chưa có mã số thuế).\n- **Áp dụng cho HKD:** HKD đăng ký kinh doanh và đăng ký thuế liên thông thì không tính mốc 10 ngày làm việc ở trên; cá nhân kinh doanh không thuộc diện đăng ký kinh doanh (buôn bán lưu động, nhỏ lẻ) thì tính 10 ngày làm việc từ ngày bắt đầu hoạt động.\n- **Điểm AI phải hỏi trước khi chốt:** người hỏi đăng ký thuế liên thông cùng đăng ký HKD hay đăng ký trực tiếp; ngày được cấp Giấy CN ĐKKD / ngày bắt đầu hoạt động thực tế.\n- Nguồn (đối chiếu chéo 4 nguồn thứ cấp độc lập, cùng trích điểm a khoản 3 Điều 6 NĐ 252/2026; chưa đối chiếu toàn văn NĐ 252 — không dùng cho case tranh chấp, chỉ dùng cho tư vấn thông thường):\n  - https://luatvietnam.vn/thue-phi-le-phi/thoi-han-dang-ky-thue-565-111315-article.html\n  - https://www.myvietnamtax.com/2026/07/cau-hoi-FAQs-thue-ho-kinh-doanh-2026.html\n  - https://www.meinvoice.vn/tin-tuc/18392/dang-ky-thue-la-gi/\n  - https://thuvienphapluat.vn/hoi-dap-phap-luat/khi-nao-ho-kinh-doanh-phai-dang-ky-thue-138096388.html"
  },
  {
    "id": "KB/16C-dang-ky-thue-va-xu-phat.md#1078",
    "file": "KB/16C-dang-ky-thue-va-xu-phat.md",
    "section": "16.65. Chế tài chậm đăng ký thuế KHÔNG áp dụng cho trường hợp đăng ký thuế liên thông",
    "ref_id": "16.65",
    "tier": "VERIFIED",
    "text": "16C — Đăng ký thuế lần đầu & xử phạt vi phạm hành chính về thuế, hóa đơn (VERIFIED 2026-10-06)\n## 16.65. Chế tài chậm đăng ký thuế KHÔNG áp dụng cho trường hợp đăng ký thuế liên thông\n- **LEGAL_STATUS:** `VERIFIED` (nguyên văn Điều 1 NĐ 125/2020, đọc toàn văn ngày 2026-10-06).\n- Khoản 1 Điều 1 NĐ 125/2020/NĐ-CP quy định nghị định này **không áp dụng** đối với hành vi vi phạm thủ tục đăng ký thuế của tổ chức, cá nhân **thực hiện đăng ký thuế cùng với đăng ký kinh doanh theo cơ chế liên thông**.\n- Hệ quả: khung phạt chậm đăng ký thuế tại Điều 10 NĐ 125 (xem 16.66) **chỉ áp dụng cho đăng ký thuế trực tiếp**, không được lấy để phạt HKD đăng ký thuế liên thông cùng đăng ký HKD vì chậm đăng ký ban đầu.\n- **Cấm suy luận sai:** \"HKD nào chậm đăng ký thuế cũng bị phạt theo Điều 10\" — phải kiểm tra loại đăng ký trước.\n- Nguồn: toàn văn NĐ 125/2020/NĐ-CP: https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-125-2020-ND-CP-xu-phat-vi-pham-hanh-chinh-ve-thue-hoa-don-455646.aspx"
  },
  {
    "id": "KB/16C-dang-ky-thue-va-xu-phat.md#1079",
    "file": "KB/16C-dang-ky-thue-va-xu-phat.md",
    "section": "16.66. Khung phạt chậm đăng ký thuế lần đầu (Điều 10 NĐ 125/2020) — mức tổ chức và mức cá nhân",
    "ref_id": "16.66",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16C — Đăng ký thuế lần đầu & xử phạt vi phạm hành chính về thuế, hóa đơn (VERIFIED 2026-10-06)\n## 16.66. Khung phạt chậm đăng ký thuế lần đầu (Điều 10 NĐ 125/2020) — mức tổ chức và mức cá nhân\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — chỉ áp dụng khi thuộc phạm vi NĐ 125 (đăng ký trực tiếp, xem 16.65).\n- Mức ghi trong Điều 10 là mức **tổ chức**:\n  - chậm 1–10 ngày và có tình tiết giảm nhẹ: **cảnh cáo**;\n  - chậm 1–30 ngày (ngoài trường hợp cảnh cáo): **1–2 triệu đồng**;\n  - chậm 31–90 ngày: **3–6 triệu đồng**;\n  - chậm từ 91 ngày trở lên: **6–10 triệu đồng**.\n- Cá nhân/HKD = **1/2** theo khoản 5 Điều 5 NĐ 125:\n  - 1–30 ngày: **0,5–1 triệu**; 31–90 ngày: **1,5–3 triệu**; từ 91 ngày: **3–5 triệu**.\n- Tình tiết tăng nặng/giảm nhẹ (Điều 7 NĐ 125, được sửa bởi NĐ 310/2025, hiệu lực 16/01/2026): mức cụ thể mặc định là **trung bình khung**; 1 tình tiết giảm nhẹ → giảm 10% mức trung bình; từ 2 tình tiết giảm nhẹ → áp mức tối thiểu; tăng nặng áp dụng tương tự theo chiều ngược lại.\n- Nguồn: toàn văn NĐ 125/2020/NĐ-CP (Điều 5, Điều 7, Điều 10): https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-125-2020-ND-CP-xu-phat-vi-pham-hanh-chinh-ve-thue-hoa-don-455646.aspx\n- NĐ 310/2025/NĐ-CP sửa NĐ 125 (hiệu lực 16/01/2026): https://thuvienphapluat.vn/van-ban/Thuong-mai/Nghi-dinh-310-2025-ND-CP-sua-doi-Nghi-dinh-125-2020-ND-CP-xu-phat-hanh-chinh-linh-vuc-thue-478004.aspx"
  },
  {
    "id": "KB/16C-dang-ky-thue-va-xu-phat.md#1080",
    "file": "KB/16C-dang-ky-thue-va-xu-phat.md",
    "section": "16.67. Khai sai hồ sơ thuế nhưng không làm thiếu thuế (Điều 12 NĐ 125/2020)",
    "ref_id": "16.67",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16C — Đăng ký thuế lần đầu & xử phạt vi phạm hành chính về thuế, hóa đơn (VERIFIED 2026-10-06)\n## 16.67. Khai sai hồ sơ thuế nhưng không làm thiếu thuế (Điều 12 NĐ 125/2020)\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — phải xác định được chỉ tiêu khai sai có/không liên quan đến xác định nghĩa vụ thuế trong hồ sơ cụ thể.\n- Ba bậc vi phạm (mức **tổ chức**):\n  1. khai sai hoặc chưa đầy đủ nội dung các chỉ tiêu trong hồ sơ thuế, **không liên quan đến xác định nghĩa vụ thuế**: **0,5–1,5 triệu đồng**;\n  2. khai sai các chỉ tiêu trên tờ khai thuế, các phụ lục kèm theo tờ khai thuế, **không liên quan đến xác định nghĩa vụ thuế**: **1,5–2,5 triệu đồng**;\n  3. khai sai các chỉ tiêu trên tờ khai thuế, các phụ lục kèm theo tờ khai thuế **liên quan đến xác định nghĩa vụ thuế nhưng chưa đến mức làm thiếu số thuế phải nộp** hoặc tăng số thuế được miễn, giảm, hoàn: **5–8 triệu đồng**.\n- Cá nhân/HKD = **1/2**: 0,25–0,75 triệu / 0,75–1,25 triệu / 2,5–4 triệu.\n- Áp dụng cho khai sai hồ sơ đăng ký thuế: **không tự gắn** \"sai ngày bắt đầu kinh doanh\" hay \"sai địa chỉ\" vào bậc nào — phải kiểm tra chỉ tiêu đó trong mẫu hồ sơ cụ thể có liên quan đến xác định nghĩa vụ thuế hay không, rồi mới chọn bậc.\n- Nguồn: toàn văn NĐ 125/2020/NĐ-CP (Điều 5, Điều 12): https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-125-2020-ND-CP-xu-phat-vi-pham-hanh-chinh-ve-thue-hoa-don-455646.aspx"
  },
  {
    "id": "KB/16C-dang-ky-thue-va-xu-phat.md#1081",
    "file": "KB/16C-dang-ky-thue-va-xu-phat.md",
    "section": "16.68. Khai sai dẫn đến thiếu số thuế phải nộp (Điều 16 NĐ 125/2020)",
    "ref_id": "16.68",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16C — Đăng ký thuế lần đầu & xử phạt vi phạm hành chính về thuế, hóa đơn (VERIFIED 2026-10-06)\n## 16.68. Khai sai dẫn đến thiếu số thuế phải nộp (Điều 16 NĐ 125/2020)\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Phạt **20%** tính trên số tiền thuế khai thiếu hoặc số tiền thuế đã được miễn, giảm, hoàn cao hơn so với quy định.\n- **Điều 16 là ngoại lệ của quy tắc chia đôi:** theo khoản 5 Điều 5 NĐ 125, các mức tại Điều 16, 17, 18 **giữ nguyên** cho cá nhân — không chia đôi.\n- NĐ 310/2025 (hiệu lực 16/01/2026) sửa một số điều kiện áp dụng tại Điều 16; đồng thời sửa khoản 3 Điều 9: trường hợp khai bổ sung hồ sơ khai thuế và **tự giác nộp đủ** số tiền thuế phải nộp **trước thời điểm cơ quan có thẩm quyền phát hiện** thì không bị xử phạt — không được suy rộng quy tắc này sang khai sai hồ sơ đăng ký thuế nếu văn bản không quy định.\n- Phân biệt với trốn thuế: Điều 16 áp dụng cho khai sai (không có yếu tố gian lận bị quy vào trốn thuế theo Điều 17).\n- Nguồn: toàn văn NĐ 125/2020/NĐ-CP (Điều 16) và NĐ 310/2025/NĐ-CP (sửa Điều 9, Điều 16): xem link tại 16.66."
  },
  {
    "id": "KB/16C-dang-ky-thue-va-xu-phat.md#1082",
    "file": "KB/16C-dang-ky-thue-va-xu-phat.md",
    "section": "16.69. Không lập hóa đơn khi bán hàng hóa, cung cấp dịch vụ (Điều 24 NĐ 125/2020, sửa bởi NĐ 310/2025)",
    "ref_id": "16.69",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16C — Đăng ký thuế lần đầu & xử phạt vi phạm hành chính về thuế, hóa đơn (VERIFIED 2026-10-06)\n## 16.69. Không lập hóa đơn khi bán hàng hóa, cung cấp dịch vụ (Điều 24 NĐ 125/2020, sửa bởi NĐ 310/2025)\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — điều kiện tiên quyết: đã xác định được **nghĩa vụ lập hóa đơn** theo quy định đối với giao dịch đó (xem nhánh 16B và 16.38). Không được lấy \"đã đăng ký HĐĐT\" thay cho \"có nghĩa vụ lập hóa đơn\".\n- Từ 16/01/2026, mức phạt được tính **theo số lượng hóa đơn không lập** (mức **tổ chức**):\n  - 1 hóa đơn: **1–2 triệu đồng**;\n  - 2 đến dưới 10 hóa đơn: **2–10 triệu đồng**;\n  - 10 đến dưới 20 hóa đơn: **10–30 triệu đồng**;\n  - 20 đến dưới 50 hóa đơn: **30–50 triệu đồng**;\n  - từ 50 hóa đơn trở lên: **60–80 triệu đồng**.\n- Cá nhân/HKD = **1/2**: 0,5–1 triệu / 1–5 triệu / 5–15 triệu / 15–25 triệu / 30–40 triệu.\n- NĐ 310 bãi bỏ mức cố định cũ (khoản 5 Điều 24 cũ và các điểm liên quan) — **không dùng mức \"10–20 triệu\" cũ cho năm 2026**.\n- NĐ 310 có bảng mức riêng cho hành vi không lập hóa đơn đối với hàng khuyến mại, biếu tặng, hàng mẫu, cho vay mượn — không gộp với bán hàng thông thường.\n- Nguồn: NĐ 310/2025/NĐ-CP sửa Điều 24 NĐ 125/2020 (hiệu lực 16/01/2026): https://thuvienphapluat.vn/van-ban/Thuong-mai/Nghi-dinh-310-2025-ND-CP-sua-doi-Nghi-dinh-125-2020-ND-CP-xu-phat-hanh-chinh-linh-vuc-thue-478004.aspx"
  },
  {
    "id": "KB/16C-dang-ky-thue-va-xu-phat.md#1084",
    "file": "KB/16C-dang-ky-thue-va-xu-phat.md",
    "section": "16.70. Các trường hợp bị ấn định thuế từ 01/07/2026 (khoản 2 Điều 24 Luật Quản lý thuế 108/2025)",
    "ref_id": "16.70",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16C — Đăng ký thuế lần đầu & xử phạt vi phạm hành chính về thuế, hóa đơn (VERIFIED 2026-10-06)\n## 16.70. Các trường hợp bị ấn định thuế từ 01/07/2026 (khoản 2 Điều 24 Luật Quản lý thuế 108/2025)\n(a) Các trường hợp liên quan trực tiếp hộ/cá nhân kinh doanh:\n  - a) **không đăng ký thuế; không khai thuế**; không nộp bổ sung hồ sơ thuế theo yêu cầu của cơ quan thuế; hoặc khai thuế **không đầy đủ, trung thực, chính xác về căn cứ tính thuế**;\n  - b) hồ sơ khai thuế đã nộp nhưng **không xác định được các yếu tố làm cơ sở xác định căn cứ tính thuế**, hoặc xác định được nhưng không tự tính được số thuế phải nộp;\n  - c) **không phản ánh hoặc phản ánh không đầy đủ, trung thực, chính xác số liệu trên sổ kế toán** để xác định nghĩa vụ nộp thuế;\n  - d) **không xuất trình sổ kế toán, hóa đơn, chứng từ** và tài liệu cần thiết liên quan đến việc xác định số thuế phải nộp **trong thời hạn quy định**;\n  - đ) không chấp hành quyết định kiểm tra thuế;\n  - e) mua, bán, trao đổi và hạch toán, kê khai thuế theo giá trị hàng hóa, dịch vụ **không đúng giá thực tế thanh toán hoặc không theo giá giao dịch thông thường trên thị trường** làm giảm nghĩa vụ thuế;\n  - g) mua, trao đổi hàng hóa sử dụng **hóa đơn, chứng từ không hợp pháp** mà hàng hóa, dịch vụ là có thật và **đã kê khai doanh thu tính thuế**;\n  - h) sử dụng chứng từ, tài liệu **không phản ánh đúng bản chất giao dịch** hoặc giá trị giao dịch thực tế để làm giảm nghĩa vụ thuế.\n- **Kết luận cho câu hỏi \"đầu vào cao hơn đầu ra có bị ấn định không\":** chênh lệch đầu vào/đầu ra **không tự động** dẫn đến ấn định. Cơ quan thuế chỉ ấn định khi người nộp thuế rơi vào một trong các trường hợp trên (ví dụ: không xuất trình được sổ sách, chứng từ; hạch toán không đúng giá thị trường; bỏ sót doanh thu). Nếu sổ sách, hóa đơn, chứng từ đầy đủ và phản ánh đúng bản chất, chênh lệch tự thân không phải căn cứ ấn định."
  },
  {
    "id": "KB/16C-dang-ky-thue-va-xu-phat.md#1087",
    "file": "KB/16C-dang-ky-thue-va-xu-phat.md",
    "section": "16.71. Sổ sách, chứng từ và lưu trữ của nhóm ≤1 tỷ (thông báo doanh thu 01/TKN-CNKD)",
    "ref_id": "16.71",
    "tier": "VERIFIED",
    "text": "16C — Đăng ký thuế lần đầu & xử phạt vi phạm hành chính về thuế, hóa đơn (VERIFIED 2026-10-06)\n## 16.71. Sổ sách, chứng từ và lưu trữ của nhóm ≤1 tỷ (thông báo doanh thu 01/TKN-CNKD)\n- **LEGAL_STATUS:** `VERIFIED` (kế thừa từ 16.52 — Thông tư 152/2025/TT-BTC).\n- Nhóm không chịu thuế GTGT / không phải nộp thuế TNCN (doanh thu năm từ 1 tỷ trở xuống, hoạt động kinh doanh thông thường, **nộp thuế theo phương pháp tỷ lệ % / thông báo doanh thu** — loại trừ nhóm tự chọn phương pháp kê khai dù ≤1 tỷ, nhóm này theo Thông tư 88/2021/TT-BTC) sử dụng **Sổ doanh thu bán hàng hóa, dịch vụ mẫu S1a-HKD**; được lưu bằng bản giấy hoặc điện tử; không bắt buộc mua sổ in sẵn.\n- **Không có căn cứ** bắt buộc nhóm này phải mở đầy đủ bộ sổ kế toán của phương pháp kê khai (bộ sổ theo Thông tư 88/2021/TT-BTC chỉ áp dụng cho hộ/cá nhân kinh doanh nộp thuế theo phương pháp kê khai).\n- Tuy nhiên, để tự chứng minh doanh thu thực tế đã thông báo và **phòng ấn định thuế** theo điểm c, d khoản 2 Điều 24 Luật 108/2025 (xem 16.70), HKD **nên** ghi chép doanh thu đầy đủ và lưu trữ hóa đơn, chứng từ liên quan đến hoạt động kinh doanh. Đây là **khuyến nghị phòng vệ suy từ 16.70, không phải nghĩa vụ pháp lý** trong TT 152/2025 — cấm diễn đạt thành \"bắt buộc\"/\"phải\".\n- CROSS_REFERENCE: 16.52 (chọn mẫu sổ 2026), 16.70 (ấn định khi không có/không xuất trình sổ sách chứng từ).\n- Nguồn: https://www.mof.gov.vn/bo-tai-chinh/thong-tin-tham-dinh-gia/huong-dan-ke-toan-cho-ho-va-ca-nhan-kinh-doanh-tu-nam-2026"
  },
  {
    "id": "KB/16D-da-nguon-pham-vi-nguong.md#1089",
    "file": "KB/16D-da-nguon-pham-vi-nguong.md",
    "section": "16.72. Doanh thu năm: quyền được hưởng, phạm vi chủ thể và số liệu cần đối soát",
    "ref_id": "16.72",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "## 16.72. Doanh thu năm: quyền được hưởng, phạm vi chủ thể và số liệu cần đối soát\n[CĂN CỨ] Điều 5 Nghị định 68/2026/NĐ-CP về doanh thu; Nghị định 141/2026/NĐ-CP cập nhật ngưỡng. Checklist phân biệt GMV, tiền ròng và thu hộ là diễn giải áp dụng, không phải trích nguyên văn.\n[PHẠM VI] Kinh doanh năm 2026; Điều 5 NĐ68 về doanh thu và cơ chế tổng hợp của cùng người nộp thuế. Ngưỡng thuế hiện hành đối chiếu NĐ141; định nghĩa doanh thu không tự quyết định phương pháp.\n[QUY TẮC] Xét khoản phát sinh từ hoạt động kinh doanh mà người kinh doanh được hưởng, không chỉ tiền đã rút về ngân hàng. Thưởng, hỗ trợ hoặc hiện vật phải phân loại theo bản chất; chiết khấu thương mại, giảm giá, hàng trả lại phải có hồ sơ đúng.\n[GMV VÀ HOA HỒNG] Người chỉ tiếp thị hàng của người khác: GMV là giá trị giao dịch được giới thiệu, không tự là doanh thu của người tiếp thị. Xét hoa hồng/quyền hưởng và khoản doanh thu liên quan; khác người tự bán hàng sở hữu của mình.\n[GỘP VÀ RÒNG] Báo cáo gộp, số tiền sau phí/thuế và số tiền đã rút khác nhau. Phí sàn không tự giảm doanh thu; tiền vay, chuyển nội bộ, thu hộ có hồ sơ không tự là tiền bán hàng.\n[NGƯỠNG NĂM] Tổng hợp các kênh của cùng chủ thể, không cộng trùng tổng với chi tiết. Không đổi số một tháng thành doanh thu thực tế năm hoặc chia ngưỡng năm thành ngưỡng tháng. Tổng và chi tiết mâu thuẫn thì đối soát trước khi chốt.\n[CẦN BIẾT] Vai trò người bán/affiliate, hợp đồng, quyền hưởng, kỳ đối soát, phần phí/thu hộ/hủy hoàn, chủ thể và tổng doanh thu năm. Độc lập thực chất khác chia tài khoản hình thức.\nNguồn đối chiếu ngày 16/10/2026:\n- https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm\n- https://xaydungchinhsach.chinhphu.vn/ban-hang-da-kenh-hieu-dung-de-thuc-hien-dung-nghia-vu-thue-119260727151911181.htm"
  },
  {
    "id": "KB/16D-da-nguon-pham-vi-nguong.md#1090",
    "file": "KB/16D-da-nguon-pham-vi-nguong.md",
    "section": "16.73. Affiliate: căn cứ pháp lý của decision tree phân loại (bổ sung 16.20)",
    "ref_id": "16.73",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[PHẠM VI NGUỒN CŨ] Nhánh bên dưới cho rằng chưa đăng ký kinh doanh đồng nghĩa tiền công là hướng dẫn theo tình huống/nguồn cũ, KHÔNG phải quy tắc phân loại chung cho mọi affiliate năm 2026. Không áp nhánh này chỉ từ việc chưa có giấy đăng ký. Phải đối chiếu quan hệ lao động/dịch vụ thực tế, kỳ áp dụng và hướng dẫn trong 16.95; không lấy ngày ban hành công văn làm ngày luật tự đổi phân loại.\n16D — Đa nguồn thu nhập & phạm vi tính ngưỡng 1 tỷ (VERIFIED 2026-10-06)\n## 16.73. Affiliate: căn cứ pháp lý của decision tree phân loại (bổ sung 16.20)\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — chốt đúng chỉ khi xác định được tình trạng đăng ký kinh doanh/đăng ký thuế của cá nhân đối với hoạt động affiliate **và hoạt động diễn ra ngoài nền tảng TMĐT**.\n- **Cập nhật 12/10/2026 — phạm vi áp dụng:** với tiếp thị liên kết **trên nền tảng TMĐT** (TikTok Shop, Shopee...), **CV 7403/CT-TMĐT (06/10/2026)** được ưu tiên — xem **16.95**: phân loại là **thu nhập từ kinh doanh** (không phải tiền công), thuế suất TNCN **5% trên doanh thu**, nền tảng khấu trừ/khai thay/nộp thay. Ngày 06/10/2026 chỉ là ngày ban hành công văn hướng dẫn, không phải mốc pháp luật đổi cách phân loại thu nhập. Decision tree dưới đây dùng để xét quan hệ thực tế với bên chi trả, nhất là affiliate ngoài nền tảng TMĐT hoặc thu nhập của năm trước.\n- Decision tree tại 16.20 được củng cố thêm bằng các căn cứ sau:\n  - **Chưa đăng ký kinh doanh/đăng ký thuế** cho hoạt động affiliate: khoản hoa hồng có tính chất **tiền lương, tiền công**. Căn cứ: Công văn 1241/CTCBA-TTHT năm 2024 (và Công văn 1232/CTCBA-TTHT) — cá nhân làm tiếp thị liên kết trên sàn TMĐT, dù không đăng ký hộ kinh doanh hay cá nhân kinh doanh, vẫn thuộc diện nộp thuế TNCN theo dạng tiền lương, tiền công; phân loại này đã được Cục Thuế xác nhận lại trong giải đáp ngày 23/07/2026 (xem 16.20).\n  - Cơ chế khấu trừ: tổ chức/cá nhân trả thu nhập **khấu trừ 10%** trên tổng thu nhập trước khi thanh toán khi chi trả từ **2 triệu đồng/lần trở lên** đối với trường hợp không ký hợp đồng lao động hoặc hợp đồng dưới 3 tháng (điểm i khoản 1 Điều 25 Thông tư 111/2013/TT-BTC). Cuối năm cá nhân quyết toán theo biểu lũy tiến nếu thuộc diện.\n  - **Đã đăng ký kinh doanh/đăng ký thuế đúng hoạt động**: tiền hoa hồng là **doanh thu kinh doanh**, xếp vào nhóm cung cấp dịch vụ; cách khai/nộp tiếp theo phụ thuộc tổng doanh thu và phương pháp TNCN (xem 16.20, 16.53).\n- **Cấm dùng một mức cho mọi case:** không chốt \"affiliate mặc định 7%\", \"booking mặc định 10%\", hay \"khấu trừ 10% là xong nghĩa vụ\" khi chưa phân loại đúng và chưa xét tổng doanh thu năm.\n- CROSS_REFERENCE: 16.20 (decision tree), 16.95 (ưu tiên cho affiliate trên nền tảng TMĐT), 16.29 (affiliate trong nhóm kinh doanh thông thường khi xét ngưỡng), 16.35 (tổng hợp đa kênh).\n- Nguồn:\n  - https://esos.vn/blogs/news/thu-nhap-tu-lam-tiep-thi-lien-ket-co-phai-dong-thu-nhap-ca-nhan-khong (trích Công văn 1241/CTCBA-TTHT 2024)\n  - https://thuvienphapluat.vn/ma-so-thue/phap-luat-thue/lam-tiep-thi-lien-ket-affiliate-co-phai-dong-thu-nhap-ca-nhan-khong-co-may-truong-hop-dong-thu-694004-185525.html\n  - https://xaydungchinhsach.chinhphu.vn/lam-tiep-thi-lien-ket-ban-hang-huong-hoa-hong-tren-san-tmdt-can-khai-thue-nhu-the-nao-119260723160309548.htm"
  },
  {
    "id": "KB/16D-da-nguon-pham-vi-nguong.md#1091",
    "file": "KB/16D-da-nguon-pham-vi-nguong.md",
    "section": "16.74. Doanh thu YouTube/AdSense: hoạt động kinh doanh, tự kê khai TNCN và GTGT",
    "ref_id": "16.74",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16D — Đa nguồn thu nhập & phạm vi tính ngưỡng 1 tỷ (VERIFIED 2026-10-06)\n## 16.74. Doanh thu YouTube/AdSense: hoạt động kinh doanh, tự kê khai TNCN và GTGT\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — theo giải đáp chính thức của Cục Thuế trên Cổng Chính phủ (đọc nguyên văn ngày 2026-10-06); áp dụng khi doanh thu chỉ phát sinh từ YouTube, chưa tính các hoạt động khác.\n- Trường hợp doanh thu **chỉ phát sinh từ việc làm YouTube**: người nộp thuế có trách nhiệm **tự kê khai, nộp thuế TNCN và thuế GTGT** (doanh thu YouTube được xử lý như hoạt động kinh doanh).\n- Áp dụng ngưỡng theo điểm a khoản 1 Điều 8 NĐ 68/2026 (sửa bởi NĐ 141/2026):\n  - tự xác định doanh thu năm từ YouTube **từ 1 tỷ đồng trở xuống**: chỉ thực hiện **thông báo doanh thu thực tế**, chậm nhất **31/01** của năm dương lịch tiếp theo; nếu mới ra kinh doanh trong 6 tháng đầu năm 2026: thông báo doanh thu đến 30/6/2026 chậm nhất **31/7/2026 (đã qua tại thời điểm 06/10/2026 — nếu chưa thực hiện thì thông báo bổ sung ngay và kiểm tra quy định xử lý trễ hạn)**, và thông báo 6 tháng cuối năm chậm nhất 31/01 năm sau;\n  - tự xác định tổng doanh thu năm từ YouTube **trên 1 tỷ đồng**: thực hiện **khai thuế, nộp thuế kể từ quý phát sinh doanh thu trên 1 tỷ đồng**;\n  - tổng hợp doanh thu năm **trên 3 tỷ đồng**, hoặc trên 1 tỷ đồng và lựa chọn khai TNCN theo phương pháp **thu nhập tính thuế × thuế suất**: thực hiện **quyết toán thuế TNCN theo năm**, chậm nhất **31/3** của năm dương lịch tiếp theo.\n- Nếu ngoài YouTube còn có hoạt động khác (bán hàng, sàn TMĐT, affiliate...): tổng hợp toàn bộ theo 16.35/16.37/16.29 trước khi xét ngưỡng.\n- Nguồn (giải đáp Cục Thuế, Cổng Chính phủ): https://xaydungchinhsach.chinhphu.vn/lam-video-dang-tai-len-nen-tang-youtube-va-co-phat-sinh-doanh-thu-co-can-ke-khai-thue-119260723152359049.htm"
  },
  {
    "id": "KB/16D-da-nguon-pham-vi-nguong.md#1092",
    "file": "KB/16D-da-nguon-pham-vi-nguong.md",
    "section": "16.75. Ngưỡng 1 tỷ xét theo từng cá nhân kinh doanh; vợ chồng hai HKD không tự động cộng doanh thu",
    "ref_id": "16.75",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16D — Đa nguồn thu nhập & phạm vi tính ngưỡng 1 tỷ (VERIFIED 2026-10-06)\n## 16.75. Ngưỡng 1 tỷ xét theo từng cá nhân kinh doanh; vợ chồng hai HKD không tự động cộng doanh thu\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Điều 4 NĐ 68/2026/NĐ-CP (được sửa bởi NĐ 141/2026/NĐ-CP) xác định đối tượng theo **từng cá nhân kinh doanh**: \"cá nhân cư trú có hoạt động sản xuất, kinh doanh, bao gồm cả cá nhân đăng ký thành lập hộ kinh doanh hoặc người được các thành viên hộ gia đình ủy quyền làm người đại diện hộ kinh doanh\" — doanh thu năm từ 1 tỷ đồng trở xuống thì không phải nộp thuế TNCN. Ngưỡng xét theo từng cá nhân kinh doanh/người đại diện HKD, không phải theo hộ gia đình.\n- Vợ và chồng mỗi người một HKD riêng (mỗi người một mã số thuế, một người đại diện): **không được tự động cộng** doanh thu của hai HKD chỉ vì quan hệ hôn nhân để xét ngưỡng 1 tỷ.\n- Ngoại lệ chống lách: nếu thực tế là **một hoạt động kinh doanh bị chia hình thức** thành hai HKD để né ngưỡng/nghĩa vụ thuế, cơ quan thuế có quyền quản lý theo bản chất giao dịch và dữ liệu thực tế (xem 16.8).\n- CROSS_REFERENCE: 16.7 (mỗi cá nhân chỉ được đăng ký một HKD trong phạm vi toàn quốc), 16.8 (vợ chồng mỗi người một HKD).\n- Nguồn:\n  - Điều 4 NĐ 68/2026 (sửa bởi NĐ 141/2026) — trích qua: https://thuvienphapluat.vn/ma-so-thue/phap-luat-thue/thuc-hu-quy-dinh-nang-nguong-chiu-thue-ho-kinh-doanh-tu-3-ty-tro-len-moi-phai-dong-thue-co-dung-kho-114775-224607.html\n  - NĐ 168/2025/NĐ-CP về đăng ký doanh nghiệp (mỗi cá nhân một HKD): https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-168-2025-nd-cp-ve-dang-ky-doanh-nghiep-119250702175708554.htm"
  },
  {
    "id": "KB/16E-va-lo-hong-p0.md#1096",
    "file": "KB/16E-va-lo-hong-p0.md",
    "section": "16.77. Bảng tỷ lệ % GTGT và TNCN trên doanh thu theo nhóm ngành 2026 — ĐÃ CÓ NGUỒN (điền từ nguyên văn luật ngày 2026-10",
    "ref_id": "16.77",
    "tier": "VERIFIED",
    "text": "16E — Vá lỗ hổng P0 (audit 20 vòng, 2026-10-06)\n## 16.77. Bảng tỷ lệ % GTGT và TNCN trên doanh thu theo nhóm ngành 2026 — ĐÃ CÓ NGUỒN (điền từ nguyên văn luật ngày 2026-10-06)\n- **LEGAL_STATUS:** `VERIFIED` — mọi con số dưới đây trích nguyên văn điều luật (xem Nguồn). Khung công thức, phạm vi áp dụng và guardrail giữ nguyên từ bản KHUNG.\n- **Nguồn (chuỗi dẫn chiếu đầy đủ):**\n  - GTGT: **Điều 12 khoản 2 điểm b Luật 48/2024/QH15** (b1 1%; b2 5%; b3 3%; b4 2%) — được **NĐ 68/2026 Điều 3 khoản 2** dẫn chiếu (\"tỷ lệ % ... thực hiện theo quy định của Luật Thuế GTGT 48/2024/QH15\").\n  - TNCN: **Điều 7 khoản 3 Luật 109/2025/QH15** (nguyên văn 5 gạch đầu dòng dưới đây) — được **NĐ 68/2026 Điều 4 khoản 2** dẫn chiếu (\"thực hiện nộp thuế theo quy định tại Điều 7 Luật Thuế TNCN 109/2025/QH15\").\n  - Cho thuê BĐS: **khoản 4 Điều 7 Luật 109/2025/QH15** (khoản 1 Điều 7 đã được Luật 09/2026/QH16 sửa thành mức Chính phủ quy định; NĐ 141/2026 cụ thể hóa 1 tỷ): TNCN = max(doanh thu năm − 1 tỷ, 0) × 5% (kỳ 2026).\n- **BANNER ĐÃ ĐIỀN (thay thế banner KHUNG CHƯA ĐIỀN):** bảng số liệu đã được điền từ nguyên văn luật ngày 2026-10-06. Chuỗi nguồn duy nhất từng tồn tại trong kho cho các tỷ lệ (dòng trong thân 16.49 trích file 03 tier CASE_EVIDENCE) đã được rút số và chuyển thành pointer về đây ngày 2026-10-06.\n- **Câu kết luận chuẩn:** Khi bảng đã có nguồn: thuế GTGT phải nộp = doanh thu tính thuế GTGT × tỷ lệ GTGT của nhóm ngành (không trừ 1 tỷ — xem 16.44); thuế TNCN phải nộp = (doanh thu tính thuế TNCN − phần mức trừ 1 tỷ theo cơ chế chọn ngành tại chỉ tiêu [14], xem 16.40) × tỷ lệ TNCN của nhóm ngành.\n- **Phạm vi thời gian:** chỉ áp dụng cho **kỳ tính thuế năm 2026**. Cấm dùng bảng này cho kỳ trước 2026 (tỷ lệ các năm trước theo văn bản của từng kỳ — xem temporal 16.60).\n- **Phạm vi doanh thu:** doanh thu năm **trên 1 tỷ đến 3 tỷ đồng** (sau **NĐ 141/2026**; luật gốc Điều 7 khoản 1 Luật 109/2025 ghi 500 triệu — NĐ 141 nâng ngưỡng miễn lên 1 tỷ, xem 16.49).\n- **Điều kiện áp dụng (khóa phạm vi — cả 4 phải đủ):**\n  1. Khoản thu đã được phân loại là **thu nhập từ kinh doanh**. Loại trừ nhánh tiền lương/tiền công (VD: affiliate chưa đăng ký kinh doanh/đăng ký thuế — xem decision tree 16.20/16.73).\n  2. Đang áp dụng **phương pháp TNCN = tỷ lệ % trên doanh thu**. Loại trừ phương pháp thu nhập tính thuế × thuế suất (mốc 3 tỷ — xem 16.56).\n  3. Đã phân loại đúng nhóm ngành của **từng hoạt động** (mỗi hoạt động một dòng).\n  4. Đã tách doanh thu theo 3 cột TNCN / GTGT / HĐĐT (16.37) — tỷ lệ trong bảng chỉ dùng cho đúng cột của nó.\n- **Bảng tỷ lệ GTGT (Điều 12 khoản 2 điểm b Luật 48/2024/QH15 — nguyên văn):**\n\n  | Nhóm ngành | Tỷ lệ GTGT |\n  |---|---|\n  | b1) Phân phối, cung cấp hàng hóa | 1% |\n  | b2) Dịch vụ, xây dựng không bao thầu nguyên vật liệu | 5% |\n  | b3) Sản xuất, vận tải, dịch vụ có gắn với hàng hóa, xây dựng có bao thầu nguyên vật liệu | 3% |\n  | b4) Hoạt động kinh doanh khác | 2% |\n\n- **Bảng tỷ lệ TNCN (Điều 7 khoản 3 Luật 109/2025/QH15 — nguyên văn, giữ đúng cấu trúc luật):**\n\n  | Nhóm ngành | Tỷ lệ TNCN |\n  |---|---|\n  | Phân phối, cung cấp hàng hoá | 0,5% |\n  | Dịch vụ, xây dựng không bao thầu nguyên vật liệu | 2% |\n  | ↳ Riêng: hoạt động cho thuê tài sản, đại lý bảo hiểm, đại lý xổ số, đại lý bán hàng đa cấp | 5% |\n  | Sản xuất, vận tải, dịch vụ có gắn với hàng hoá, xây dựng có bao thầu nguyên vật liệu | 1,5% |\n  | Hoạt động cung cấp sản phẩm và dịch vụ nội dung thông tin số về giải trí, trò chơi điện tử, phim số, ảnh số, nhạc số, quảng cáo số | 5% |\n  | Hoạt động kinh doanh khác | 1% |\n\n  Lưu ý cấu trúc: luật đặt \"cho thuê tài sản, đại lý...\" là **mệnh đề Riêng trong gạch dịch vụ**, không phải nhóm độc lập — bảng trên giữ đúng cấu trúc này (đây chính là điểm các bài thứ cấp trình bày khác nhau: có bài tách thành dòng riêng, có bài không).\n- **[VERIFIED]** [Cho thuê BĐS — đính chính 06/10/2026 theo chuỗi văn bản chính thức] TNCN = max(doanh thu năm − 1 tỷ, 0) × thuế suất 5% (kỳ 2026; chỉ cho thuê, trừ lưu trú). Chuỗi: khoản 4 Điều 7 Luật 109/2025 → Luật 09/2026/QH16 Điều 1 (24/4/2026, hiệu lực 01/01/2026) sửa khoản 1 Điều 7 thành 'mức Chính phủ quy định' → NĐ 141/2026 (29/4/2026, hiệu lực 01/01/2026) Điều 1 khoản 1 thay '500 triệu' → '01 tỷ' tại Điều 3, 4 NĐ 68/2026. Lập luận cũ 'NĐ không sửa được luật nên giữ 500 triệu' đã bị bác bỏ (bỏ sót Luật 09/2026/QH16). Không nhân mức trừ theo từng hợp đồng. **[PENDING]** cộng/tách với hoạt động kinh doanh khác."
  },
  {
    "id": "KB/16E-va-lo-hong-p0.md#1098",
    "file": "KB/16E-va-lo-hong-p0.md",
    "section": "16.78. Giảm 30% số thuế TNCN phải nộp 2026–2027: cổng thủ tục (chính sách xem 16.39)",
    "ref_id": "16.78",
    "tier": "VERIFIED",
    "text": "16E — Vá lỗ hổng P0 (audit 20 vòng, 2026-10-06)\n## 16.78. Giảm 30% số thuế TNCN phải nộp 2026–2027: cổng thủ tục (chính sách xem 16.39)\n(a) Chính sách: xem 16.39. Nội dung chính sách đã VERIFIED — không restate ở đây để tránh lệch single source of truth."
  },
  {
    "id": "KB/16E-va-lo-hong-p0.md#1101",
    "file": "KB/16E-va-lo-hong-p0.md",
    "section": "16.79. Phạm vi doanh thu xét ngưỡng HĐĐT 1 tỷ: nguyên tắc + 3 ca PENDING",
    "ref_id": "16.79",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16E — Vá lỗ hổng P0 (audit 20 vòng, 2026-10-06)\n## 16.79. Phạm vi doanh thu xét ngưỡng HĐĐT 1 tỷ: nguyên tắc + 3 ca PENDING\n[Nguyên tắc] Ngưỡng HĐĐT xét theo \"doanh thu năm trên 01 tỷ đồng\" (NĐ 141/2026/NĐ-CP, hiệu lực 01/01/2026). Nếu **riêng doanh thu bán hàng/cung cấp dịch vụ thông thường** đa kênh (gồm cả phần sàn đã khấu trừ/nộp thay — xem 16.35) **đã trên 01 tỷ đồng** → thuộc diện bắt buộc HĐĐT, trả lời \"có\" dứt khoát theo 16.41, không đòi thêm dữ kiện."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1105",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.81. Biểu thuế lũy tiến tiền lương, tiền công 2026 (Điều 9 Luật 109/2025/QH15)",
    "ref_id": "16.81",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.81. Biểu thuế lũy tiến tiền lương, tiền công 2026 (Điều 9 Luật 109/2025/QH15)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc ngày 06/10/2026.\n- 5 bậc (thu nhập tính thuế/tháng): đến 10 triệu → 5%; trên 10–30 triệu → 10%; trên 30–60 triệu → 20%; trên 60–100 triệu → 30%; trên 100 triệu → 35%. (Theo năm: đến 120 / trên 120–360 / trên 360–720 / trên 720–1.200 / trên 1.200 triệu.)\n- **Hiệu lực:** Điều 29 — Luật hiệu lực chung 01/7/2026; riêng quy định về tiền lương, tiền công của cá nhân cư trú áp dụng từ **kỳ tính thuế năm 2026**.\n- **Chuyển tiếp:** kỳ 2025 trở về trước áp Luật 04/2007 — biểu 7 bậc (đến 5tr 5%; 5–10tr 10%; 10–18tr 15%; 18–32tr 20%; 32–52tr 25%; 52–80tr 30%; trên 80tr 35%); giảm trừ 11 triệu / 4,4 triệu.\n- **Dữ kiện cần hỏi:** kỳ tính thuế (năm nào); thu nhập tính thuế/tháng sau mọi giảm trừ.\n- Nguồn: https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-Thue-thu-nhap-ca-nhan-2025-so-109-2025-QH15-665870.aspx\n- **Đối chiếu chính thức 06/10/2026:** đã đọc trực tiếp toàn văn trên Cổng TTĐT Chính phủ (vanban.chinhphu.vn, docid=216495; PDF: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat109-2025.pdf) — nội dung điều khoản dưới đây khớp nguyên văn."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1106",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.82. Giảm trừ gia cảnh và thu nhập tính thuế tiền lương (Điều 8, 10 Luật 109/2025/QH15)",
    "ref_id": "16.82",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.82. Giảm trừ gia cảnh và thu nhập tính thuế tiền lương (Điều 8, 10 Luật 109/2025/QH15)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc ngày 06/10/2026 (Điều 8, 10). Riêng mức thu nhập NPT 3 triệu: VERIFIED_CONDITIONAL (Điều 3 TT 87/2026 qua 3 nguồn thứ cấp).\n- Giảm trừ bản thân: **15,5 triệu đồng/tháng** (186 triệu/năm); mỗi người phụ thuộc: **6,2 triệu đồng/tháng** (khoản 1 Điều 10). Mỗi NPT chỉ được tính giảm trừ **một lần cho một NNT** (khoản 3).\n- NPT gồm (khoản 4): con chưa thành niên / mất năng lực hành vi / khuyết tật / không khả năng lao động; con thành niên đang học ĐH-CĐ-THCN-học nghề, vợ/chồng không khả năng lao động, bố mẹ hết tuổi lao động hoặc không khả năng lao động, người không nơi nương tựa do NNT nuôi dưỡng — với điều kiện **không có thu nhập hoặc thu nhập không vượt mức Bộ Tài chính quy định** (Điều 3 TT 87/2026/TT-BTC: bình quân **03 triệu đồng/tháng** từ mọi nguồn — PDF chính thức https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/7/87-btc.signed.pdf, gói ChatGPT đọc trực tiếp đủ 6 trang). Điều 4 quy định hồ sơ theo nhóm (con; vợ/chồng; cha mẹ; người khác) kèm điều kiện tuổi/khả năng lao động — không có thu nhập không đồng nghĩa tự động đủ điều kiện. Không áp ngưỡng 3 triệu này thay cho mức giảm trừ 6,2 triệu/người — hai đại lượng khác nhau.\n- Thu nhập tính thuế = tổng thu nhập chịu thuế − BHXH/BHYT/BHTN và bảo hiểm bắt buộc khác − giảm trừ Điều 10, 11 (khoản 2 Điều 8). Thời điểm xác định: khi trả thu nhập hoặc khi NNT nhận được (khoản 3 Điều 8).\n- Đăng ký NPT: hồ sơ trước **31/12** năm tính thuế (điểm a khoản 2 Điều 48 NĐ 253/2026 — thứ cấp).\n- **Kỳ áp dụng:** 2026. **Dữ kiện cần hỏi:** số NPT đã đăng ký; thu nhập của NPT; các khoản bảo hiểm đã đóng.\n- Nguồn: Luật 109/2025 (URL như 16.81); TT 87: https://thuvienphapluat.vn/ma-so-thue/phap-luat-thue/nam-2026-nguoi-phu-thuoc-co-thu-nhap-bao-nhieu-thi-duoc-dang-ky-giam-tru-gia-canh-238632-230086.html"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1107",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.83. Khấu trừ thuế khi trả thu nhập (Điều 50 NĐ 253/2026/NĐ-CP)",
    "ref_id": "16.83",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.83. Khấu trừ thuế khi trả thu nhập (Điều 50 NĐ 253/2026/NĐ-CP)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc Điều 50 ngày 06/10/2026. NĐ 253/2026 (30/6/2026, hiệu lực 01/7/2026) thay thế NĐ 65/2013.\n- **Khoản 2 (vãng lai):** trả lương/tiền công/tiền thù lao cho cá nhân cư trú **không ký HĐLĐ hoặc HĐLĐ dưới 3 tháng** (kể cả đã chấm dứt HĐLĐ), chi trả **từ 5 triệu đồng/lần trở lên** → **khấu trừ 10%** trước khi trả. Dưới 5 triệu/lần: khấu trừ 10% **khi cá nhân có yêu cầu**.\n- **Cam kết:** cá nhân chỉ có thu nhập thuộc diện khấu trừ 10% nhưng ước tính tổng thu nhập chịu thuế sau giảm trừ **chưa đến mức phải nộp thuế** → làm cam kết theo mẫu để tạm chưa khấu trừ (số hiệu mẫu mới: chưa xác minh được từ phụ lục TT 89 và đính chính — PENDING; không tự gắn 08/CK-TNCN là mẫu mới đã kiểm chứng. Tham khảo: vanban.chinhphu.vn docid=218974.)\n- **HĐLĐ từ 3 tháng trở lên:** khấu trừ theo Biểu lũy tiến Điều 9, kể cả ký ở nhiều nơi.\n- **Chuyển tiếp:** ngưỡng 5 triệu/lần thay ngưỡng 2 triệu/lần của TT 111/2013. TT 87/2026/TT-BTC thay thế TT 111/2013 và các thông tư liệt kê tại khoản 2 Điều 8 (hiệu lực 01/7/2026; PDF chính thức: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/7/87-btc.signed.pdf — gói ChatGPT đọc trực tiếp). Lưu ý phạm vi: TT 87 chỉ quy định 3 nội dung hẹp (mức thu nhập NPT tại Điều 3; hồ sơ NPT tại Điều 4; thuế chứng khoán phái sinh) — các nội dung khác áp theo NĐ 253/2026 và luật. Giữ văn bản cũ để trả lời kỳ cũ.\n- **Chuyển tiếp thời điểm (P09):** tách thời điểm khấu trừ từng lần với quyết toán năm — giữ ngày chi trả khi xét chuyển tiếp; không tự sửa lại các lần khấu trừ đã thực hiện trước khi quy định có hiệu lực.\n- **Dữ kiện cần hỏi:** loại hợp đồng; mức chi trả mỗi lần; thời điểm chi trả.\n- Nguồn: https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-253-2026-ND-CP-huong-dan-Luat-Thue-thu-nhap-ca-nhan-699193.aspx\n- **Đối chiếu chính thức 06/10/2026:** đã đọc trực tiếp toàn văn trên Cổng TTĐT Chính phủ (vanban.chinhphu.vn, docid=218684; PDF: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/7/253m-ndcp.signed.pdf) — nội dung điều khoản dưới đây khớp nguyên văn."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1108",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.84. Phân loại thu nhập freelancer/thù lao dịch vụ (điểm c khoản 2 Điều 8 NĐ 253/2026/NĐ-CP)",
    "ref_id": "16.84",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.84. Phân loại thu nhập freelancer/thù lao dịch vụ (điểm c khoản 2 Điều 8 NĐ 253/2026/NĐ-CP)\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — 4 nguồn thứ cấp độc lập cùng trích số điều (nguoiquansat.vn, markettimes.vn, atslegal.vn, tpm.com.vn); chưa đọc toàn văn NĐ gốc (đang chờ đọc qua vanban.chinhphu.vn).\n- Nội dung quy định: tiền thù lao nhận được từ cung cấp dịch vụ của cá nhân **không đăng ký kinh doanh, không đăng ký thuế cho hoạt động đó** — kể cả có hay không có giấy phép/chứng chỉ hành nghề — được xác định là thu nhập từ tiền lương, tiền công.\n- **Không suy rộng:** (a) tên gọi \"contractor\"/\"freelancer\" trong hợp đồng **không quyết định** phân loại — quyết định là tình trạng đăng ký cho đúng hoạt động cung cấp dịch vụ đó; (b) đã có MST HKD cho hoạt động **khác** cũng **không đủ** để đưa khoản thù lao này sang nhánh kinh doanh; (c) không khẳng định mọi freelancer đều là tiền lương — trường hợp đã đăng ký đúng hoạt động thì sang nhánh kinh doanh (16.73).\n- **Hệ quả khi rơi vào nhánh tiền lương:** không áp ngưỡng 1 tỷ của HKD; thuế theo biểu lũy tiến (16.81), khấu trừ theo 16.83, quyết toán theo 16.85.\n- **Hiệu lực:** từ **kỳ tính thuế năm 2026** (vì được xác định là thu nhập từ tiền lương, tiền công — điểm a khoản 1 Điều 69 NĐ 253/2026; thứ cấp).\n- **[PENDING]** chưa có công văn chính thức riêng cho contractor làm việc cho công ty nước ngoài (thu nhập từ nước ngoài, khấu trừ tại nguồn nước ngoài, hiệp định song thuế).\n- **Dữ kiện cần hỏi (slot quyết định):** đã đăng ký kinh doanh/đăng ký thuế **cho đúng hoạt động cung cấp dịch vụ này** chưa; bản chất công việc và nơi thực hiện; tình trạng cư trú; hiệp định song thuế nếu thu nhập từ nước ngoài.\n- Giới hạn phạm vi ca (P06): hỏi đáp về HKD xuất khẩu phần mềm nộp GTGT (https://chinhsachonline.chinhphu.vn/ho-kinh-doanh-xuat-khau-phan-mem-nop-thue-gia-tri-gia-tang-the-nao-89864.htm) chỉ giải quyết GTGT, không giải quyết phân loại TNCN của contractor — không suy từ ca này.\n- Nguồn: https://nguoiquansat.vn/toan-bo-nguoi-lao-dong-can-chu-y-thong-bao-quan-trong-nay-tu-co-quan-thue-bo-qua-co-the-mat-quyen-loi-319255.html ; https://tpm.com.vn/vi/luu-y-quan-trong-tu-co-quan-thue-den-toan-bo-nguoi-lao-dong-ve-thue-tncn-bo-qua-la-lo-quyen-loi/"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1109",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.85. Quyết toán và ủy quyền quyết toán thuế TNCN (Điều 51 NĐ 253/2026/NĐ-CP)",
    "ref_id": "16.85",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.85. Quyết toán và ủy quyền quyết toán thuế TNCN (Điều 51 NĐ 253/2026/NĐ-CP)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc Điều 51 ngày 06/10/2026.\n- **Ai phải quyết toán (khoản 1):** tổ chức/cá nhân trả thu nhập; cá nhân cư trú có thu nhập từ tiền lương, tiền công — quyết toán theo năm, **trừ**: (a) số thuế phải nộp **nhỏ hơn** số đã nộp mà **không yêu cầu hoàn hoặc bù trừ** kỳ sau; (b) có thêm thu nhập nơi khác mà phần này **bình quân tháng trong năm không quá 15 triệu đồng**, đã bị khấu trừ 10% → không phải quyết toán phần đó (nếu tự quyết toán, hệ thống hỗ trợ tổng hợp và trừ số thuế đã khấu trừ).\n- **Được ủy quyền (khoản 2**, kể cả không làm đủ 12 tháng): (a) chỉ có **một nguồn** thu nhập lương, **HĐLĐ từ 3 tháng trở lên** tại một tổ chức và **đang làm việc tại đó vào thời điểm quyết toán** (kể cả điều chuyển do sáp nhập/hợp nhất/chia/tách/chuyển đổi hoặc cùng hệ thống); (b) như (a) + có nguồn thu nhập khác đã bị khấu trừ theo điểm b khoản 1 (≤15 triệu/tháng bình quân).\n- **KHÔNG được ủy quyền — phải tự quyết toán (khoản 3, đối chiếu chính thức 06/10/2026):** trong kỳ có **đề nghị giảm thuế** do thiên tai, hỏa hoạn, tai nạn, bệnh hiểm nghèo → phải tự quyết toán. (Thẻ trước đây ghi thêm 'giảm trừ Điều 49 (chi y tế, giáo dục-đào tạo)': nội dung này mới chỉ qua nguồn thứ cấp, chưa đối chiếu được trên cổng chính thức — giữ VERIFIED_CONDITIONAL. Bổ sung từ P03 (gói ChatGPT đọc Điều 49, PDF trang 46–47): Điều 49 cho giảm trừ chi y tế, giáo dục/đào tạo của bản thân và NPT theo điều kiện luật định (chứng từ hợp pháp, không được nguồn khác chi trả); mức chi được giảm trừ giao Chính phủ quy định — Điều 5 TT 87 chỉ dẫn chiếu lại, không tự đặt trần số tiền. Chưa xác minh văn bản quy định mức cụ thể → không lấy toàn bộ chi phí thực trả làm số được trừ mặc định.)\n- **Thời hạn (thứ cấp):** tổ chức trả thu nhập: chậm nhất **31/3**; cá nhân trực tiếp: **30/4** (Điều 10 NĐ 252/2026 — 3 nguồn thứ cấp trích nguyên văn). **Hồ sơ (thứ cấp):** tờ khai 02/QTT-TNCN, phụ lục 02-1/BK-QTT-TNCN, chứng từ khấu trừ (Công văn 1296/CT-NVT 04/3/2026).\n- Mẫu ủy quyền: 08/UQ-QTT-TNCN (TT 80/2021).\n- **Dữ kiện cần hỏi:** số nơi trả thu nhập; loại HĐLĐ; còn làm việc tại thời điểm quyết toán không; có đề nghị giảm thuế (thiên tai/hỏa hoạn/tai nạn/bệnh hiểm nghèo) không; có giảm trừ Điều 49 không (thứ cấp).\n- Nguồn: NĐ 253/2026 (URL như 16.83).\n- **Đối chiếu chính thức 06/10/2026:** đã đọc trực tiếp toàn văn trên Cổng TTĐT Chính phủ (vanban.chinhphu.vn, docid=218684; PDF: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/7/253m-ndcp.signed.pdf) — nội dung điều khoản dưới đây khớp nguyên văn."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1110",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.86. Hoàn thuế TNCN (Điều 6 Luật 109/2025; Điều 15 Luật 108/2025)",
    "ref_id": "16.86",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.86. Hoàn thuế TNCN (Điều 6 Luật 109/2025; Điều 15 Luật 108/2025)\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — điều kiện hoàn đọc toàn văn gốc (Điều 6 Luật 109/2025); thủ tục/thời hạn qua thứ cấp.\n- **Điều kiện (Điều 6 Luật 109/2025, nguyên văn ý):** hoàn thuế khi cá nhân có **số thuế đã nộp lớn hơn số thuế phải nộp** hoặc **chưa đến mức phải nộp**.\n- **Xử lý nộp thừa (Điều 15 Luật Quản lý thuế 108/2025 — thứ cấp):** được **bù trừ** với số phải nộp hoặc **hoàn trả** khi không còn nợ thuế; **không hoàn** nếu NNT từ chối nhận hoặc quá **10 năm** kể từ ngày nộp mà không bù trừ/đề nghị hoàn.\n- **Thủ tục:** đề nghị hoàn theo Điều 18 Luật 108/2025 (PDF chính thức https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf — gói ChatGPT đọc trực tiếp Điều 18, trang 24–25). Điều 18 phân biệt hoàn theo luật thuế với hoàn trả nộp thừa theo Điều 15; hồ sơ đủ điều kiện mới xử lý tự động; có phân loại hoàn trước/kiểm tra trước — không phải mọi hồ sơ cá nhân đều tự động hoàn ngay. Hoàn tự động qua eTax Mobile (QĐ 108/QĐ-TCT 24/01/2025) — xử lý 03 ngày làm việc kể từ thông báo tiếp nhận (thứ cấp). Muốn hướng dẫn mẫu/hạn/nơi nộp chi tiết phải kiểm tra văn bản quản lý thuế chi tiết.\n- **Dữ kiện cần hỏi:** đã quyết toán chưa (trực tiếp/ủy quyền); có MST không; còn nợ thuế không.\n- Nguồn: Luật 109/2025 (URL như 16.81); thủ tục: https://xcyber.vn/cong-ty-hoan-thue-thu-nhap-ca-nhan-cho-nhan-vien/"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1111",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.87. Cá nhân cư trú / không cư trú (Điều 2 Luật 109/2025/QH15)",
    "ref_id": "16.87",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.87. Cá nhân cư trú / không cư trú (Điều 2 Luật 109/2025/QH15)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc trên thuvienphapluat.vn ngày 06/10/2026 (qua nghiên cứu độc lập, đã đối chiếu).\n- **Điều 2 khoản 2 (nguyên văn):** *\"Cá nhân cư trú là người đáp ứng một trong các điều kiện sau đây: a) Có mặt tại Việt Nam từ 183 ngày trở lên tính trong 01 năm dương lịch hoặc tính theo 12 tháng liên tục kể từ ngày đầu tiên có mặt tại Việt Nam; b) Có nơi ở thường xuyên tại Việt Nam, bao gồm có nơi ở đăng ký thường trú hoặc có nhà thuê để ở tại Việt Nam theo hợp đồng thuê có thời hạn.\"*\n- **Điều 2 khoản 1 (nguyên văn):** *\"Người nộp thuế thu nhập cá nhân là cá nhân cư trú có thu nhập chịu thuế quy định tại Điều 3 của Luật này phát sinh trong và ngoài lãnh thổ Việt Nam và cá nhân không cư trú có thu nhập chịu thuế quy định tại Điều 3 của Luật này phát sinh trong lãnh thổ Việt Nam.\"* → cư trú chịu thuế **toàn cầu**; không cư trú chỉ thu nhập phát sinh **trong lãnh thổ Việt Nam**.\n- **Hiệu lực:** 01/7/2026 (Điều 29 khoản 1). Luật ban hành 10/12/2025.\n- **Áp dụng case ranh giới:** người ở VN 150 ngày nhưng **thuê nhà 12 tháng theo hợp đồng có thời hạn** → đáp ứng điểm b khoản 2 → nhiều khả năng là **cá nhân cư trú**. Dữ kiện cần hỏi: hợp đồng thuê có thời hạn không (thuê không hợp đồng/không thời hạn thì đánh giá khác).\n- **Hiệp định tránh đánh thuế hai lần (VD: Singapore):** chưa đọc được văn bản hiệp định gốc → PENDING. Nguồn thứ cấp: Công văn 3867/TCT-HTQT (2014) — áp dụng hiệp định trên cơ sở NNT tự kê khai và tự chịu trách nhiệm.\n- Nguồn: https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-Thue-thu-nhap-ca-nhan-2025-so-109-2025-QH15-665870.aspx ; về hiệp định: https://luatminhkhue.vn/van-ban/cong-van-3867-tct-htqt-2014-thu-tuc-ap-dung-hiep-dinh-tranh-danh-thue-hai-lan-tong-cuc-thue.aspx\n- **Đối chiếu chính thức 06/10/2026:** đã đọc trực tiếp toàn văn trên Cổng TTĐT Chính phủ (vanban.chinhphu.vn, docid=216495; PDF: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat109-2025.pdf) — nội dung điều khoản dưới đây khớp nguyên văn."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1112",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.88. Chuyển nhượng bất động sản: thuế suất và miễn thuế (Điều 14, Điều 4 Luật 109/2025/QH15)",
    "ref_id": "16.88",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.88. Chuyển nhượng bất động sản: thuế suất và miễn thuế (Điều 14, Điều 4 Luật 109/2025/QH15)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc ngày 06/10/2026 (qua nghiên cứu độc lập).\n- **Điều 14 khoản 1 (nguyên văn):** *\"thuế thu nhập cá nhân đối với thu nhập từ chuyển nhượng bất động sản của cá nhân cư trú được xác định bằng giá chuyển nhượng nhân (x) với thuế suất 2%.\"*\n- **Miễn thuế nhà ở duy nhất — Điều 4 khoản 2 (nguyên văn):** *\"Thu nhập từ chuyển nhượng nhà ở, quyền sử dụng đất ở và tài sản gắn liền với đất ở của cá nhân trong trường hợp cá nhân chỉ có một nhà ở, đất ở duy nhất tại Việt Nam.\"* Lưu ý trung thực: nguyên văn luật **không ghi thêm** điều kiện thời gian sở hữu 183 ngày (khác luật cũ) — điều kiện chi tiết (sở hữu ≥183 ngày, chuyển nhượng toàn bộ) được trích từ NĐ 253/2026 qua nguồn thứ cấp (baophapluat.vn), chưa đọc toàn văn NĐ gốc → phần điều kiện chi tiết giữ VERIFIED_CONDITIONAL.\n- **Miễn BĐS giữa thân nhân — Điều 4 khoản 1:** vợ chồng; cha mẹ đẻ/nuôi–con; cha mẹ chồng/vợ–con dâu/rể; ông bà–cháu nội/ngoại; anh chị em ruột (toàn văn gốc).\n- **Hiệu lực:** 01/7/2026 (không thuộc nhóm áp dụng từ kỳ 2026 vì không phải thu nhập từ kinh doanh/tiền lương).\n- **Dữ kiện cần hỏi:** số lượng nhà/đất đang sở hữu tại VN; quan hệ thân nhân (nếu có); chuyển nhượng toàn bộ hay một phần.\n- Nguồn: https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-Thue-thu-nhap-ca-nhan-2025-so-109-2025-QH15-665870.aspx ; điều kiện chi tiết: https://doanhnhan.baophapluat.vn/ban-nha-duy-nhat-duoc-mien-thue-thu-nhap-ca-nhan-trong-truong-hop-nao-744f8fa2.html\n- **Đối chiếu chính thức 06/10/2026:** đã đọc trực tiếp toàn văn trên Cổng TTĐT Chính phủ (vanban.chinhphu.vn, docid=216495; PDF: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat109-2025.pdf) — nội dung điều khoản dưới đây khớp nguyên văn."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1113",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.89. Chứng khoán, chuyển nhượng vốn, đầu tư vốn (Điều 12, 13 Luật 109/2025/QH15)",
    "ref_id": "16.89",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.89. Chứng khoán, chuyển nhượng vốn, đầu tư vốn (Điều 12, 13 Luật 109/2025/QH15)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc ngày 06/10/2026 (qua nghiên cứu độc lập).\n- **Chuyển nhượng chứng khoán — Điều 13 khoản 2 (nguyên văn):** *\"thuế thu nhập cá nhân đối với thu nhập từ chuyển nhượng chứng khoán được xác định bằng giá chuyển nhượng nhân (x) với thuế suất 0,1% theo từng lần chuyển nhượng.\"* → thuế tính trên **giá bán**, không phải lợi nhuận: **bán lỗ vẫn phải nộp 0,1% × giá bán**; điều khoản không có cơ chế khấu trừ/bù trừ lỗ.\n- **Chuyển nhượng vốn nói chung — Điều 13 khoản 1:** 20% × (giá bán − giá mua − chi phí hợp lý); không xác định được giá mua/chi phí → 2% × giá chuyển nhượng.\n- **Đầu tư vốn (cổ tức, lợi tức) — Điều 12:** thuế = thu nhập tính thuế × **5%**, tính theo từng lần phát sinh. (Luật không dùng chữ \"khấu trừ tại nguồn\" tại điều này — cơ chế khấu trừ thực tế theo Luật Quản lý thuế, không suy thêm.)\n- **Hiệu lực:** 01/7/2026.\n- Nguồn: https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-Thue-thu-nhap-ca-nhan-2025-so-109-2025-QH15-665870.aspx\n- **Đối chiếu chính thức 06/10/2026** (vanban.chinhphu.vn docid=216495; PDF: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat109-2025.pdf): **khoản 2 Điều 13** khớp nguyên văn. Khoản 1 Điều 13 và Điều 12 mới chỉ đọc qua TVPL."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1114",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.90. Thừa kế, quà tặng, trúng thưởng, bản quyền, thu nhập khác (Điều 15, 18, 19, 27 Luật 109/2025/QH15)",
    "ref_id": "16.90",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.90. Thừa kế, quà tặng, trúng thưởng, bản quyền, thu nhập khác (Điều 15, 18, 19, 27 Luật 109/2025/QH15)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc ngày 06/10/2026 (qua nghiên cứu độc lập).\n- **Trúng thưởng — Điều 15:** thuế = **10%** × phần giá trị giải thưởng vượt trên 20 triệu đồng/lần.\n- **Thừa kế, quà tặng — Điều 18:** thuế = **10%** × phần giá trị tài sản thừa kế, quà tặng vượt trên 20 triệu đồng/lần phát sinh. Phạm vi tài sản chịu thuế (Điều 3 khoản 9): chứng khoán, phần vốn trong tổ chức kinh tế, cơ sở kinh doanh, BĐS và tài sản phải đăng ký sở hữu/sử dụng. Miễn: thừa kế/quà tặng BĐS giữa thân nhân (Điều 4 khoản 1).\n- Tên miền \".vn\", tín chỉ carbon, biển số trúng đấu giá: **5%** × phần vượt 20 triệu (Điều 19, 27). Tài sản số, vàng miếng: **0,1%** × giá chuyển nhượng.\n- **Hiệu lực:** 01/7/2026.\n- **Đối chiếu chính thức 06/10/2026** (PDF Cổng Chính phủ): Điều 15 = \"Thuế TNCN đối với thu nhập từ trúng thưởng\" (cá nhân cư trú); Điều 18 = \"Thuế TNCN đối với thu nhập từ nhận thừa kế, quà tặng\" (cá nhân cư trú) — khớp ánh xạ của thẻ này. **Bác bỏ** ánh xạ trong gói ChatGPT P15 (\"Đ15 gộp thừa kế/quà tặng; Đ18 là thu nhập của cá nhân không cư trú\"): không đúng văn bản, không nhập.\n- Nguồn: https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-Thue-thu-nhap-ca-nhan-2025-so-109-2025-QH15-665870.aspx ; PDF chính thức: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat109-2025.pdf"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1115",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.91. Cho thuê BĐS — công thức và hiệu lực (khoản 4 Điều 7 Luật 109/2025; Luật 09/2026/QH16; NĐ 141/2026)",
    "ref_id": "16.91",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.91. Cho thuê BĐS — công thức và hiệu lực (khoản 4 Điều 7 Luật 109/2025; Luật 09/2026/QH16; NĐ 141/2026)\n- **LEGAL_STATUS:** `VERIFIED` — chuỗi văn bản đã đối chiếu trực tiếp 06/10/2026 (Cổng TTĐT Chính phủ + Công báo 152).\n- **Chuỗi căn cứ:**\n  - Khoản 4 Điều 7 Luật 109/2025/QH15: TNCN cho thuê BĐS (trừ lưu trú) = (doanh thu − mức tại khoản 1 Điều 7) × 5%.\n  - Luật 09/2026/QH16 Điều 1 (Quốc hội khóa XVI thông qua 24/4/2026; Điều 1 hiệu lực từ 01/01/2026): sửa khoản 1 Điều 7 — bãi bỏ mức cứng 500 triệu, thay bằng \"mức doanh thu do Chính phủ quy định\".\n  - NĐ 141/2026/NĐ-CP (ký 29/4/2026, hiệu lực 01/01/2026) Điều 1 khoản 1: thay cụm \"500 triệu đồng\" → \"01 tỷ đồng\" tại Điều 3, Điều 4, khoản 1 Điều 8, Điều 9, 10, khoản 3 Điều 11, khoản 1–2 Điều 12, khoản 4 Điều 17, khoản 3 Điều 18 NĐ 68/2026.\n- **Kết luận cho kỳ 2026 (chỉ cho thuê BĐS, không phải lưu trú): TNCN = max(doanh thu năm − 1 tỷ, 0) × 5%.**\n- Mức trừ tính trên tổng doanh thu cho thuê BĐS năm của cá nhân — không nhân mức trừ theo từng hợp đồng/nhà.\n- Dưới 1 tỷ: vẫn phải khai báo thuế (baochinhphu.vn 12/06/2026, thứ cấp) — khai nhưng không phát sinh số thuế phải nộp.\n- **Ghi chú lịch sử (đính chính 06/10/2026):** công thức (DT − 500 triệu) × 5% theo nguyên văn Luật 109 ban đầu đã được thay thế cho kỳ 2026 — cấm áp cho kỳ 2026. Lập luận cũ \"NĐ không sửa được luật nên giữ 500 triệu\" là sai vì bỏ sót Luật 09/2026/QH16 (luật sửa luật). Cho thuê trước 2026: TT 40/2021.\n- **[PENDING]** cộng/tách mức trừ với hoạt động kinh doanh khác (16.92).\n- Nguồn chính thức: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat109-2025.pdf ; NĐ 141: https://xdcs.cdnchinhphu.vn/446259493575335936/2026/5/4/141-ndcp-signed-1777883675606599215477.pdf ; NĐ 68 tại Công báo 152: https://congbaocdn.chinhphu.vn/180507251028987904/2026/3/18/cong-bao-so-152-ngay-19-03-47065_1773803455_signed.pdf"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1117",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.93. Chuyển tiếp 2025→2026 cho thuế TNCN tiền lương (Điều 29 Luật 109/2025/QH15)",
    "ref_id": "16.93",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.93. Chuyển tiếp 2025→2026 cho thuế TNCN tiền lương (Điều 29 Luật 109/2025/QH15)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc Điều 29 ngày 06/10/2026.\n- Điều 29 khoản 1–2: Luật 109/2025 hiệu lực **01/7/2026**; riêng quy định về thu nhập từ kinh doanh, tiền lương, tiền công của cá nhân cư trú áp dụng từ **kỳ tính thuế năm 2026**.\n- **Quyết toán năm 2025** (thực hiện trong 2026): áp **Luật 04/2007** — biểu 7 bậc, giảm trừ 11 triệu/4,4 triệu, khấu trừ vãng lai 10% từ 2 triệu/lần (TT 111/2013).\n- Luật 04/2007 hết hiệu lực từ 01/7/2026; riêng phần lương/tiền công/kinh doanh của cá nhân cư trú hết hiệu lực từ kỳ tính thuế 2026 (khoản 3).\n- **Dữ kiện cần hỏi:** kỳ tính thuế là năm nào — cấm áp biểu 2026 cho kỳ 2025.\n- Nguồn: Luật 109/2025 (URL như 16.81).\n- **Đối chiếu chính thức 06/10/2026:** đã đọc trực tiếp toàn văn trên Cổng TTĐT Chính phủ (vanban.chinhphu.vn, docid=216495; PDF: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat109-2025.pdf) — nội dung điều khoản dưới đây khớp nguyên văn."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1118",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.94. Hiệp định tránh đánh thuế hai lần Việt Nam–Singapore (Điều 4, 14, 15, 24)",
    "ref_id": "16.94",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.94. Hiệp định tránh đánh thuế hai lần Việt Nam–Singapore (Điều 4, 14, 15, 24)\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — văn bản hiệp định (bản hợp nhất sau MLI, hiệu lực 01/9/2023) đọc qua PDF chính thức của IRAS Singapore (gói ChatGPT đọc trực tiếp); chưa xác minh thủ tục hồ sơ áp dụng hiệp định tại Việt Nam sau TT 89.\n- **Cư trú kép — Điều 4 khoản 2:** xét lần lượt: (1) nhà ở thường xuyên; (2) trung tâm các lợi ích sống còn; (3) nơi thường xuyên sinh sống; (4) quốc tịch; (5) thỏa thuận giữa cơ quan có thẩm quyền hai nước. Không dùng 150 ngày ở Việt Nam hoặc tài khoản Singapore để kết luận miễn thuế tại Việt Nam.\n- **Dịch vụ độc lập — Điều 14 (đã được Điều VIII Nghị định thư thứ hai thay thế):** nước kia được đánh thuế phần thu nhập liên quan nếu cá nhân có cơ sở cố định tại đó HOẶC hiện diện tại đó ít nhất 183 ngày trong bất kỳ khoảng 12 tháng. Không trộn phép thử 183 ngày này với phép thử 183 ngày của cư trú (Điều 4).\n- **Tiền lương — Điều 15:** phép thử riêng (nơi thực hiện công việc; người sử dụng lao động; bên chịu chi phí tiền lương).\n- **Tín dụng thuế — Điều 24 khoản 2 điểm a (và Annex A):** Việt Nam cho trừ số thuế đã nộp tại Singapore đối với thu nhập được đánh thuế theo hiệp định, tối đa bằng phần thuế Việt Nam tính trên thu nhập đó. Hiệp định không đồng nghĩa miễn thuế ở cả hai nước; MLI có quy tắc chống lạm dụng.\n- **[PENDING]** thủ tục hồ sơ áp dụng hiệp định tại Việt Nam sau TT 89; toàn bộ thủ tục khấu trừ thuế nước ngoài.\n- **Dữ kiện cần hỏi:** cư trú theo nội luật từng nước; nhà ở thường xuyên; gia đình/nơi làm việc chính; số ngày hiện diện từng nước; quốc tịch; loại hoạt động (dịch vụ độc lập hay tiền lương); cơ sở cố định; chủ lao động và bên chịu chi phí; chứng từ thuế đã nộp ở nước ngoài.\n- Nguồn: https://www.iras.gov.sg/media/docs/default-source/dtas/singapore-vietnam-dta-(ratified)(mli)(01092023).pdf"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1119",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.95. Công văn 7403/CT-TMĐT (06/10/2026): thuế TNCN với tiếp thị liên kết và nội dung số trên TMĐT",
    "ref_id": "16.95",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.95. Công văn 7403/CT-TMĐT (06/10/2026): thuế TNCN với tiếp thị liên kết và nội dung số trên TMĐT\n- **LEGAL_STATUS:** `VERIFIED` — đọc ảnh chụp toàn văn 3 trang công văn (người dùng cung cấp 09/10/2026); đối chiếu khớp qua 3 nguồn thứ cấp độc lập (luatvietnam.vn, thuvienphapluat.vn, dff.vn).\n- **Phạm vi:** hướng dẫn nghĩa vụ thuế đối với cá nhân cung cấp sản phẩm/dịch vụ nội dung thông tin số và tiếp thị liên kết trong TMĐT; ban hành sau văn bản của Cục TMĐT & Kinh tế số (Bộ Công Thương) và TikTok Shop Việt Nam về kê khai/khấu trừ/nộp thuế affiliate.\n- **1. Phân loại thu nhập — cây quyết định:**\n  - Nhận thu nhập theo **hợp đồng lao động / thỏa ước lao động tập thể** ký với tổ chức, cá nhân chi trả theo pháp luật lao động → **thu nhập từ tiền lương, tiền công** → bên chi trả khấu trừ, kê khai, nộp thuế TNCN theo quy định.\n  - **Sáng tạo nội dung số, quảng bá sản phẩm, tiếp thị liên kết trên nền tảng TMĐT/nền tảng số**, nhận thu nhập từ nền tảng hoặc nhãn hàng từ hoạt động kinh doanh, **không phải tiền lương** → **thu nhập từ kinh doanh** → đăng ký thuế, kê khai, nộp thuế theo NĐ 68/2026/NĐ-CP và NĐ 141/2026/NĐ-CP.\n- **2. Thuế suất TNCN với tiếp thị liên kết trên nền tảng TMĐT: 5% (tính trên doanh thu) khi thuộc diện phải nộp thuế; xét ngưỡng doanh thu theo đúng năm trước khi áp tỷ lệ.** Khoản 14 Điều 3 Luật TMĐT 122/2025/QH15 định nghĩa dịch vụ tiếp thị liên kết trong TMĐT (quảng cáo hàng hóa/dịch vụ qua đường dẫn truy cập, mã giới thiệu hoặc phương thức tương tự liên kết với nền tảng TMĐT) → xếp vào nhóm \"cung cấp sản phẩm và dịch vụ nội dung thông tin số về giải trí, trò chơi điện tử, phim số, ảnh số, nhạc số, quảng cáo số\": **5% theo điểm đ khoản 3 Điều 7 Luật Thuế TNCN 109/2025/QH15**. Không lẫn với tin đồn cộng đồng \"affiliate mặc định 7%\" (xem 16.20).\n- **3. Trách nhiệm của chủ quản nền tảng (VD TikTok Shop):** căn cứ Điều 43 NĐ 252/2026/NĐ-CP — chủ quản nền tảng TMĐT **có chức năng đặt hàng trực tuyến và chức năng thanh toán** có trách nhiệm **khấu trừ thuế, khai thay, nộp thay** số thuế đã khấu trừ đối với hoạt động kinh doanh trên nền tảng của HKD/CNKD.\n- **4. Chứng từ cho khoản chi dịch vụ tiếp thị liên kết khi DN tính chi phí được trừ TNDN** (điều kiện được trừ: Điều 9 Luật Thuế TNDN 67/2025/QH15 + khoản 1 Điều 9 NĐ 320/2025/NĐ-CP):\n  - HKD/CNKD cung cấp dịch vụ có **doanh thu > 1 tỷ đồng/năm** → phải đăng ký sử dụng hóa đơn → DN dùng hóa đơn do họ phát hành làm chứng từ.\n  - **Dưới ngưỡng chịu thuế GTGT** → chứng từ chi trả theo quy định kế toán/hóa đơn/chứng từ cho người bán (giá trị mua trong ngày của từng người bán **từ 05 triệu đồng trở lên phải thanh toán không dùng tiền mặt**) + **Bảng kê thu mua hàng hóa, dịch vụ** do người đại diện theo pháp luật/người được ủy quyền ký và chịu trách nhiệm (khoản 1b Điều 9 NĐ 320/2025/NĐ-CP).\n  - Bán hàng/cung cấp dịch vụ **qua nền tảng TMĐT/nền tảng số** → người bán có quyền **yêu cầu chủ quản nền tảng cung cấp** thông tin người mua, thông tin giao dịch, thời điểm giao hàng, xác nhận trạng thái hoàn tất đơn hàng để lập HĐĐT (khoản 1c Điều 17 NĐ 254/2026/NĐ-CP); chủ quản nền tảng **có trách nhiệm cung cấp** (khoản 2 Điều 19 NĐ 254/2026/NĐ-CP).\n- **Giới hạn:** công văn là hướng dẫn cho tình huống cụ thể (tiếp thị liên kết **trên nền tảng TMĐT**); affiliate ngoài nền tảng TMĐT hoặc KOL booking/quảng cáo số ngoài phạm vi công văn thì xét theo bản chất từng ca (16.20).\n- **Dữ kiện cần hỏi:** quan hệ với bên trả thu nhập (HĐLĐ hay hợp đồng dịch vụ/cộng tác viên); hoạt động trên nền tảng TMĐT hay ngoài; đã đăng ký thuế đúng hoạt động chưa; doanh thu năm của bên cung cấp dịch vụ (để xét chứng từ ngưỡng 1 tỷ).\n- Nguồn: ảnh chụp toàn văn CV 7403/CT-TMĐT (06/10/2026, Chi cục Thuế TMĐT — Cục Thuế); https://luatvietnam.vn/tin-van-ban-moi/ca-nhan-lam-tiep-thi-lien-ket-tren-san-thuong-mai-dien-tu-ap-dung-thue-suat-thue-tncn-5-186-113421-article.html ; https://thuvienphapluat.vn/ma-so-thue/phap-luat-thue/thu-nhap-tu-hoat-dong-tiep-thi-lien-ket-duoc-xac-dinh-la-thu-nhap-tu-tien-luong-hay-la-thu-nhap-tu--593689-233336.html ; https://dff.vn/nhan-hoa-hong-affiliate-phai-nop-thue-the-nao-p1791367001133.html\n- Ngày 06/10/2026 là ngày ban hành công văn hướng dẫn, không phải ngày có hiệu lực của một chế độ phân loại affiliate mới. Không suy ra mọi khoản trước ngày này là tiền công và mọi khoản sau ngày này là kinh doanh chỉ từ ngày công văn."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#affiliate-888-2026",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.96. Mã đuôi 888 cho TMĐT năm 2026 (gắn với CCCD)",
    "ref_id": "16.96",
    "tier": "VERIFIED",
    "text": "## 16.96. Mã đuôi 888 cho TMĐT năm 2026 (gắn với CCCD)\n- ĐÚNG: hậu tố 888 VẪN ĐƯỢC SỬ DỤNG trong năm 2026 để phân loại hoạt động TMĐT/nền tảng số. 888 không phải MST độc lập mà là mã phụ: trước 01/07/2025 cấu trúc là MST 10 số + 888; từ 01/07/2025, CCCD/số định danh thay thế MST 10 số làm định danh gốc, hậu tố 888 vẫn giữ để phân loại hoạt động TMĐT. (Nguồn: CV 311/TCT-DNNCN; TT 86/2024/TT-BTC)\n- BẮT BUỘC với hoạt động TMĐT: hộ/cá nhân kinh doanh trên sàn (Shopee, TikTok Shop...), mạng xã hội, nền tảng số PHẢI đăng ký trên Cổng TMĐT HKD (https://canhantmdt.gdt.gov.vn) để được cấp/gắn phân loại 888. Không được trả lời \"không bắt buộc\".\n- Các bước đăng ký (theo CV 311): B1: truy cập canhantmdt.gdt.gov.vn → B2: đăng nhập VNeID mức 2 → B3: hệ thống kiểm tra: (a) chưa có MST → khai mẫu 03-ĐK-TCT, nhận OTP, được cấp MST; (b) có MST 10 số nhưng chưa có 888 → hiện form đăng ký bổ sung 888; (c) đã có 888 → tự động đăng nhập để kê khai/nộp thuế.\n- CẤM trích dẫn Luật Quản lý thuế 38/2019/QH14 (đã hết hiệu lực, thay bằng Luật 108/2025/QH15) khi trả lời về 888.\n- Nếu hoa hồng TikTok Shop năm 2026 là doanh thu từ hoạt động kinh doanh và TỔNG doanh thu kinh doanh cả năm từ mọi kênh thuộc cùng nhóm kinh doanh từ 1 tỷ đồng trở xuống, cá nhân không phải nộp thuế GTGT và TNCN cho hoạt động đó. Vẫn phải thông báo doanh thu thực tế năm 2026 theo mẫu 01/TKN-CNKD chậm nhất ngày 31/01/2027. Đây là thông báo doanh thu, không phải quyết toán TNCN cuối năm. Nếu sàn đã khấu trừ, khai, nộp thuế thay cho giao dịch, không khai nộp trùng giao dịch đó; đối chiếu số đã khấu trừ và xử lý khoản nộp thừa theo quy định.\n- Năm 2025 xét RIÊNG: mốc 1 tỷ năm 2026 không áp ngược. Thu nhập kinh doanh năm 2025 dùng ngưỡng 100 triệu đồng/năm; nếu khoản hoa hồng được xử lý là tiền công theo quan hệ chi trả thực tế thì áp quy định tiền lương/tiền công của năm 2025, không dùng ngưỡng doanh thu kinh doanh. Kỳ thuế năm 2025 vẫn phải xem theo hồ sơ chi trả và quy định áp dụng cho năm đó.\n- Không lấy ngày 06/10/2026 ban hành Công văn 7403/CT-TMĐT làm mốc pháp luật đổi từ tiền công sang kinh doanh. Công văn hướng dẫn cách phân loại, không tự đặt ngày hiệu lực mới.\n- Cách trả lời: trả lời thẳng cả hai vế; chỉ nêu điều kiện thật sự ảnh hưởng kết luận là tổng doanh thu kinh doanh 2026 và khoản sàn đã khấu trừ. Không bắt người hỏi kiểm tra eTax chỉ để giải thích ý nghĩa mã 888.\n- Nguồn: Công văn 311/TCT-DNNCN; Thông tư 86/2024/TT-BTC; Báo Điện tử Chính phủ, bài \"Khai nộp thuế đối với hoạt động môi giới trực tuyến\" (11/06/2025); Nghị định 141/2026/NĐ-CP; Thông tư 50/2026/TT-BTC; giải đáp Cục Thuế về thông báo doanh thu và sàn khấu trừ nộp thay (2026)."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#le-phi-mon-bai-hkd",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.97. Lệ phí môn bài (thuế môn bài) hộ kinh doanh và cá nhân kinh doanh",
    "ref_id": "16.97",
    "tier": "VERIFIED",
    "text": "## 16.97. Lệ phí môn bài (thuế môn bài) hộ kinh doanh và cá nhân kinh doanh\n- **LEGAL_STATUS:** VERIFIED — phân biệt rõ kỳ áp dụng trước và từ năm 2026.\n- **Từ 01/01/2026:** Chấm dứt việc thu, nộp lệ phí môn bài theo khoản 7 Điều 10 Nghị quyết 198/2025/QH15. Khoản 4 Điều 6 Nghị định 362/2025/NĐ-CP bãi bỏ Nghị định 139/2016/NĐ-CP và Nghị định 22/2020/NĐ-CP. Người nộp thuế không phải nộp lệ phí môn bài hoặc hồ sơ khai lệ phí môn bài cho năm 2026 và các năm tiếp theo. Ví dụ: hộ kinh doanh doanh thu 400 triệu đồng/năm trong năm 2026 không phải nộp lệ phí môn bài cho năm 2026; số phải nộp là 0 đồng, không áp biểu mức cũ. Công văn 645/CT-CS ngày 23/01/2026 của Cục Thuế xác nhận cách áp dụng này.\n- **Nghĩa vụ các năm 2025 trở về trước:** Cơ quan thuế vẫn rà soát, thu đủ số lệ phí môn bài đã phát sinh cho các năm đó; việc bãi bỏ từ 2026 không xóa khoản nợ cũ (Công văn 645/CT-CS).\n- **Biểu mức lịch sử CHỈ cho năm 2025 trở về trước** (khoản 2 Điều 4 Nghị định 139/2016/NĐ-CP):\n  - Doanh thu trên 500 triệu đồng/năm: 1.000.000 đồng/năm.\n  - Doanh thu trên 300 đến 500 triệu đồng/năm: 500.000 đồng/năm (ví dụ doanh thu 400 triệu của năm 2025, nếu không thuộc diện miễn).\n  - Doanh thu trên 100 đến 300 triệu đồng/năm: 300.000 đồng/năm.\n  - Doanh thu từ 100 triệu đồng/năm trở xuống: miễn lệ phí môn bài.\n- **Miễn, thời hạn theo quy định cũ (chỉ xét nghĩa vụ năm 2025 trở về trước):** Miễn năm đầu ra hoạt động sản xuất, kinh doanh đối với cá nhân, nhóm cá nhân, hộ gia đình mới ra kinh doanh; doanh thu năm từ 100 triệu đồng trở xuống được miễn. Hạn nộp hằng năm chậm nhất là ngày 30 tháng 01 theo khoản 4 Điều 10 Nghị định 126/2020/NĐ-CP. Không dùng thời hạn này để yêu cầu nộp lệ phí môn bài cho năm 2026 trở đi.\n- **Căn cứ pháp lý hiện hành:** khoản 7 Điều 10 Nghị quyết 198/2025/QH15; khoản 4 Điều 6 Nghị định 362/2025/NĐ-CP; Công văn 645/CT-CS. Biểu mức lịch sử: Điều 3, Điều 4 Nghị định 139/2016/NĐ-CP, sửa đổi bởi Nghị định 22/2020/NĐ-CP.\n- Mức lệ phí môn bài phải nộp từ năm 2026 trở đi là 0 đồng (bao nhiêu tiền cũng là 0 đồng)."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#bieu-muc-le-phi-mon-bai-lich-su",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.98. Biểu mức lệ phí môn bài cho năm 2025 trở về trước (Nghị định 139/2016/NĐ-CP)",
    "ref_id": "16.98",
    "tier": "VERIFIED",
    "text": "## 16.98. Biểu mức lệ phí môn bài cho năm 2025 trở về trước (Nghị định 139/2016/NĐ-CP)\n- **LEGAL_STATUS:** VERIFIED — Nghị định 139/2016/NĐ-CP (sửa đổi bởi Nghị định 22/2020/NĐ-CP), áp dụng cho các năm 2025 trở về trước.\n- **Bảng mức lệ phí môn bài (bao nhiêu tiền) cho năm 2025 trở về trước theo 3 bậc doanh thu:**\n  - Bậc 1: Doanh thu trên 500 triệu đồng/năm: 1.000.000 đồng/năm.\n  - Bậc 2: Doanh thu trên 300 đến 500 triệu đồng/năm: 500.000 đồng/năm (ví dụ: doanh thu 400 triệu/năm nộp 500.000 đồng/năm).\n  - Bậc 3: Doanh thu trên 100 đến 300 triệu đồng/năm: 300.000 đồng/năm.\n  - Doanh thu từ 100 triệu đồng/năm trở xuống: Miễn lệ phí môn bài.\n- **Điều kiện miễn và thời hạn nộp (năm 2025 trở về trước):**\n  - Miễn lệ phí môn bài năm đầu ra hoạt động kinh doanh (từ 01/01 đến 31/12).\n  - Thời hạn nộp hằng năm chậm nhất là ngày 30 tháng 01.\n- **Lưu ý kỳ tính thuế:** Quy định và biểu mức 3 bậc này chỉ áp dụng cho nghĩa vụ thuế của năm 2025 trở về trước. Từ năm 2026 trở đi đã chấm dứt thu lệ phí môn bài theo Nghị quyết 198/2025/QH15.\n- **Căn cứ pháp lý:** Điều 3, Điều 4 Nghị định 139/2016/NĐ-CP; Nghị định 22/2020/NĐ-CP; Nghị định 126/2020/NĐ-CP."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#giam-30-phan-tram-tncn-nq43",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.99. Trình tự xác định GTGT, phương pháp TNCN và giảm thuế — không dùng một công thức cho mọi trường hợp",
    "ref_id": "16.99",
    "tier": "VERIFIED",
    "text": "## 16.99. Trình tự xác định GTGT, phương pháp TNCN và giảm thuế — không dùng một công thức cho mọi trường hợp\n[CĂN CỨ VÀ NGƯỠNG DOANH THU] Điều 7 Luật Thuế thu nhập cá nhân 109/2025/QH15; Nghị định 141/2026/NĐ-CP sửa ngưỡng năm 2026 thành 1 tỷ đồng; khoản 1 Điều 1 Nghị quyết 43/2026/QH16 giảm số TNCN khi đủ điều kiện. Ngưỡng miễn, phương pháp tính thuế và trần hưởng giảm là ba quyết định riêng, không thay thế nhau.\n[PHẠM VI] Kinh doanh năm 2026. Đây là diễn giải phối hợp nhiều quy định, không phải một điều luật quy định chung mọi công thức. Tiền lương, cho thuê bất động sản có quy tắc riêng; không tự đưa vào cùng công thức kinh doanh thông thường.\n[THỨ TỰ] Xác định năm, chủ thể, bản chất khoản thu, doanh thu năm và phương pháp áp dụng trước khi tính tiền. Tổng hợp cùng chủ thể, không cộng trùng; tiền nhận ròng/số dư không tự là doanh thu hoặc thu nhập tính thuế.\n[TNCN THEO DOANH THU] Chỉ khi thuộc phương pháp này: dùng phần doanh thu tính thuế sau mức trừ được pháp luật cho phép × tỷ lệ ngành. Mức trừ năm 2026 theo NĐ141 là 1 tỷ đồng; không trừ lặp ở mỗi kênh, không trừ lần nữa khi dữ kiện đã là cơ sở sau mức trừ.\n[TNCN THEO THU NHẬP] Khi thuộc phương pháp thu nhập: thu nhập tính thuế hợp lệ × thuế suất theo dải doanh thu. Không thay bằng (doanh thu − 1 tỷ) × tỷ lệ ngành. Dải đến 3 tỷ, trên 3 đến 50 tỷ, trên 50 tỷ phải đối chiếu Điều 7 Luật 109/2025 và điều kiện phương pháp/chuyển tiếp tại 16.56.\n[GIẢM VÀ ĐỐI CHIẾU] NQ43 áp trên số TNCN kinh doanh phải nộp khi đủ điều kiện, không trên doanh thu. Sau đó đối chiếu khoản TNCN đã khấu trừ/nộp cùng người, cùng kỳ theo chứng từ; không tự coi dòng tax là TNCN, không tự hứa hoàn.\n[GTGT RIÊNG] Khi thuộc diện nộp theo tỷ lệ: cơ sở là doanh thu GTGT phù hợp, không trừ mức miễn của TNCN. Chính sách giảm GTGT theo NQ204/NĐ174 xét riêng tại 16.50; không giảm GTGT theo NQ43. Chỉ hỏi một sắc thuế thì trả đúng phạm vi, không để ví dụ TNCN ghi đè GTGT.\n[THIẾU DỮ KIỆN] Nêu công thức có điều kiện hoặc hỏi thông tin quyết định; không tự gán ngành bán lẻ, tỷ lệ hay thu nhập tính thuế. Ví dụ số và mã test không phải căn cứ pháp lý.\nNguồn đối chiếu ngày 16/10/2026:\n- https://xaydungchinhsach.chinhphu.vn/quy-dinh-thue-thu-nhap-ca-nhan-doi-voi-thu-nhap-tu-kinh-doanh-119260327063731539.htm\n- https://xaydungchinhsach.chinhphu.vn/phuong-phap-tinh-thue-voi-ca-nhan-kinh-doanh-ho-kinh-doanh-119260309100708724.htm\n- https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm\n- https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-43-2026-qh16-ve-giam-thue-thu-nhap-ca-nhan-thue-thu-nhap-doanh-nghiep-119260830184758301.htm\n- https://baochinhphu.vn/giam-thue-gia-tri-gia-tang-tu-01-7-2025-den-het-31-12-2026-10225070118590677.htm\n- https://xaydungchinhsach.chinhphu.vn/co-can-khai-bao-doanh-thu-khi-ban-hang-qua-shopee-grab-be-cac-san-da-khau-tru-thue-119260721055834808.htm"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#dang-ky-mst-888-cv-311-2025",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.100. Thủ tục đăng ký mã số thuế 888 trên Cổng thông tin điện tử TMĐT (Công văn 311/TCT-DNNCN-2025)",
    "ref_id": "16.100",
    "tier": "VERIFIED",
    "text": "## 16.100. Thủ tục đăng ký mã số thuế 888 trên Cổng thông tin điện tử TMĐT (Công văn 311/TCT-DNNCN-2025)\n- **Đối tượng:** Cá nhân kinh doanh, hộ kinh doanh có hoạt động kinh doanh thương mại điện tử (TMĐT), kinh doanh trên nền tảng số, tiếp thị liên kết (affiliate marketing).\n- **Trường hợp đã có MST 10 số:** Cá nhân đã có mã số thuế 10 số (hoặc đã kích hoạt định danh cá nhân/CCCD làm MST) thì KHÔNG phải xin cấp mã số thuế mới. Khi thực hiện đăng ký thông tin hoạt động kinh doanh TMĐT, hệ thống Cổng thuế điện tử sẽ tự động liên kết với MST 10 số hiện có và cấp mã số thuế 13 số có đuôi 888 (mã phân loại hoạt động TMĐT).\n- **Các bước đăng ký trên Cổng thuế TMĐT (canhantmdt.gdt.gov.vn):**\n  1. Bước 1: Truy cập Cổng thông tin điện tử dành cho cá nhân kinh doanh TMĐT của Tổng cục Thuế tại địa chỉ canhantmdt.gdt.gov.vn.\n  2. Bước 2: Đăng nhập bằng tài khoản Thuế điện tử (eTax Mobile) hoặc tài khoản Định danh điện tử Quốc gia (VNeID mức độ 2).\n  3. Bước 3: Vào mục \"Đăng ký thuế\", chọn \"Kê khai bổ sung thông tin hoạt động TMĐT\".\n  4. Bước 4: Kiểm tra thông tin định danh do hệ thống tự động điền từ CSDL Quốc gia về dân cư, sau đó điền thông tin hoạt động TMĐT (tên nền tảng/sàn như TikTok Shop, Shopee; link gian hàng; tài khoản ngân hàng nhận doanh thu; địa chỉ kinh doanh).\n  5. Bước 5: Kiểm tra lại tờ khai, bấm \"Hoàn thành kê khai\", nhập mã OTP gửi về số điện thoại hoặc xác thực qua VNeID để nộp hồ sơ.\n  6. Bước 6: Nhận kết quả cấp mã phân loại 13 số đuôi 888 hiển thị trực tiếp trên hệ thống và gửi thông báo qua eTax Mobile/email đăng ký.\n- **Căn cứ pháp lý:**\nCông văn 311/TCT-DNNCN-2025\nThông tư 105/2020/TT-BTC\nCổng thông tin điện tử dành cho cá nhân kinh doanh TMĐT (canhantmdt.gdt.gov.vn)"
  },
  {
    "id": "KB/semantic-topic-supplements#revenue-timing",
    "file": "KB/semantic-topic-supplements",
    "section": "16.101. Doanh thu và kỳ ghi nhận — Điều 5 Nghị định 68/2026/NĐ-CP",
    "ref_id": "16.101",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "Điều 5 khoản 3 Nghị định 68/2026/NĐ-CP: bán hàng ghi nhận khi chuyển giao quyền sở hữu/quyền sử dụng; cung ứng dịch vụ ghi nhận khi hoàn thành cung ứng hoặc hoàn thành từng phần, trừ trường hợp đặc thù khoản 2. Không mặc định ngày nhận tiền là ngày doanh thu; cũng không mặc định chưa nhận tiền thì chưa có doanh thu. Kiểm hợp đồng, quyền hưởng khoản thu, biên bản nghiệm thu và đối soát. Tiền lương có quy tắc thời điểm riêng; nếu chưa biết loại thu nhập phải nêu các điều kiện và hỏi loại thu nhập trước khi chốt năm. Hợp đồng xuyên năm không tự chia theo tháng; khoản trả trước nhiều năm cần kiểm Điều 5 khoản 2. Doanh thu quý/tháng chỉ phản ánh kỳ được hỏi; ngưỡng năm vẫn cần tổng doanh thu năm. Nguồn: https://xaydungchinhsach.chinhphu.vn/phuong-phap-tinh-thue-voi-ca-nhan-kinh-doanh-ho-kinh-doanh-119260309100708724.htm Hoàn phí nền tảng cần phân biệt bản chất khoản thu: không tự coi là doanh thu bán hàng mới, nhưng cũng không tự khẳng định là giảm chi phí đã hạch toán. Phải kiểm phí gốc có thực sự được ghi nhận chi phí hợp lệ hay chưa, kỳ ghi nhận và chứng từ hoàn; nếu là thưởng/hỗ trợ mới thì phân loại riêng theo quyền hưởng. Đây là bước đối chiếu bản chất với Điều 5 và điều kiện chi phí Điều 6, không phải quy định một kỳ điều chỉnh cố định. Không tự chia ngưỡng miễn thuế doanh thu NĂM thành ngưỡng miễn thuế quý hoặc tháng. Kỳ kê khai quý không tạo ra một ngưỡng miễn riêng bằng một phần tư ngưỡng năm; cần tổng hợp doanh thu năm, số phát sinh của kỳ và thuế đã được sàn nộp thay."
  },
  {
    "id": "KB/semantic-topic-supplements#business-expenses",
    "file": "KB/semantic-topic-supplements",
    "section": "16.102. Điều kiện và loại trừ chi phí — Điều 6 Nghị định 68/2026/NĐ-CP",
    "ref_id": "16.102",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[PHẠM VI VÀ HỒ SƠ VAY] Giới hạn diễn giải: điểm b khoản 2 Điều 6 chỉ loại chi thiếu hóa đơn/chứng từ theo pháp luật; không tự quy định mọi hợp đồng vay phải đổi sang tên người đại diện hộ. Hợp đồng mang tên người thân chưa đủ để công nhận hay bác chi phí của người kinh doanh: cần đối chiếu nghĩa vụ vay, vốn sử dụng cho kinh doanh, người thực trả lãi và hồ sơ liên kết các chủ thể. Đây là hướng kiểm chứng hồ sơ, không phải kết luận mọi khoản vay đứng tên người thân đều hợp lệ.\n[PHƯƠNG PHÁP VÀ ĐIỀU KIỆN] Điều 6 Nghị định 68/2026/NĐ-CP chỉ áp dụng xét chi phí khi tính TNCN theo thu nhập, không trừ chi phí riêng khi tính theo tỷ lệ doanh thu. Khoản 1: chi thực tế liên quan kinh doanh, đủ hóa đơn/chứng từ và thanh toán không dùng tiền mặt với khoản từng lần từ 5 triệu đồng trở lên thuộc trường hợp luật yêu cầu.\n[TÀI SẢN] Điểm c khoản 1: tài sản cố định phục vụ kinh doanh trích khấu hao theo chế độ áp dụng với doanh nghiệp; máy móc dùng nhiều năm không mặc định trừ toàn bộ giá mua ngay năm mua.\n[LÃI VAY] Điểm đ khoản 1: lãi vay phục vụ kinh doanh từ đối tượng không phải tổ chức tín dụng không vượt mức Bộ luật Dân sự; phải chứng minh nghĩa vụ vay, mục đích sử dụng vốn, thanh toán và hồ sơ chứng minh khoản chi thuộc hoạt động kinh doanh của người đề nghị trừ.\n[LOẠI TRỪ VÀ TIỀN LƯƠNG] Khoản 2: không trừ chi không liên quan, thiếu chứng từ, lương không thực chi/không có chứng từ; điểm c còn loại khoản lương của cá nhân kinh doanh, nhóm cá nhân và thành viên hộ, trừ bảo hiểm bắt buộc. Vì vậy người nhà thực sự là nhân viên phải được phân biệt với thành viên hộ thuộc diện loại trừ.\n[TÀI SẢN CÁ NHÂN VÀ GIA ĐÌNH] Điểm e khoản 2 loại đất/công trình sinh hoạt, xe ô tô và tài sản đăng ký sở hữu/sử dụng tên cá nhân, trừ tài sản đăng ký với mục đích kinh doanh vận tải, du lịch. Điểm g: phải tách chi phí cá nhân, gia đình khỏi kinh doanh; không tự công nhận toàn bộ nhiên liệu xe dùng hỗn hợp. Chuyển lỗ giữa năm phải có điều khoản cho phép và hồ sơ chuyển tiếp, không suy từ điều kiện chi phí của một kỳ.\n[NGUỒN] https://xaydungchinhsach.chinhphu.vn/chi-tiet-cac-khoan-chi-duoc-tru-va-khong-duoc-tru-trong-xac-dinh-thue-thu-nhap-ca-nhan-119260309111406444.htm ; hồ sơ tồn kho chuyển tiếp khoản 4 Điều 18 Nghị định 68: https://portal.mof.gov.vn/hoidapcstc/home/cthoidap/160835 Dùng nhiều năm chưa đủ để xác định một máy là tài sản cố định; kiểm giá trị, tiêu chuẩn ghi nhận, ngày đưa vào sử dụng và hồ sơ trước khi chọn khấu hao hoặc phân bổ phù hợp. Khoản 4 Điều 18: đối tượng năm 2025 khoán/kê khai có doanh thu từ 3 tỷ trở lên hoặc từ 2026 chọn phương pháp thu nhập phải xác định hàng tồn kho, máy móc, thiết bị phục vụ kinh doanh tại 31/12/2025 để làm căn cứ chi phí năm 2026; cần bảng kê tồn kho và hóa đơn/chứng từ, không chỉ ngày mua."
  },
  {
    "id": "KB/semantic-topic-supplements#invoice-correction",
    "file": "KB/semantic-topic-supplements",
    "section": "16.103. Phân loại lỗi hóa đơn — Điều 10 Thông tư 91/2026/TT-BTC từ 01/07/2026",
    "ref_id": "16.103",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "SAI GIÁ/SỐ TIỀN: căn cứ trực tiếp từ 01/07/2026 là điểm b khoản 1 Điều 10 Thông tư 91/2026/TT-BTC; b.1 điều chỉnh, b.2 thay thế. Lập liên kết với hóa đơn gốc, hồ sơ sai sót và xử lý chênh lệch doanh thu/GTGT theo kỳ phù hợp. Không dùng điểm a (sai tên) hay điểm c khoản 5 (trả hàng) làm căn cứ cho sai giá không trả hàng. Nguồn cơ quan thuế: https://dnieza.dongnai.gov.vn/Pages/newsdetail.aspx?CatId=105&NewsId=5066\nTừ 01/07/2026, điểm a khoản 1 Điều 10 Thông tư 91/2026/TT-BTC: chỉ sai tên/địa chỉ/số tiền bằng chữ hoặc nội dung khác nhưng không sai MST, số tiền, thuế suất, tiền thuế, hàng hóa thì thông báo người mua và gửi Mẫu 04/SS-HĐĐT cho cơ quan thuế; không lập lại hóa đơn thông thường. Nếu sai giá tiền, MST, thuế hoặc hàng hóa thì phải xét nhánh điều chỉnh/thay thế theo Điều 10, không xử lý như chỉ sai tên. Điểm c khoản 1 có quy tắc riêng: hóa đơn từ máy tính tiền hoặc hóa đơn bán tài sản phải đăng ký quyền sở hữu/sử dụng phải lập thay thế, trừ ngoại lệ điểm c.2 khoản 5. Hàng trả lại khác sai giá không trả hàng: giữ liên kết hóa đơn gốc và hồ sơ giao/nhận/hoàn tiền để xác định điều chỉnh/kê khai đúng kỳ. Phải kiểm ngày lập hóa đơn, giao dịch và phát hiện sai: không hồi tố Thông tư 91 để xử lý máy móc hóa đơn trước 01/07/2026; đối chiếu quy định chuyển tiếp và pháp luật hiệu lực tại thời điểm liên quan. Câu hỏi sửa hóa đơn không phải câu hỏi về hạn đăng ký 30 ngày. Nguồn: https://chinhsachonline.chinhphu.vn/hoa-don-tu-may-tinh-tien-sai-ten-dia-chi-co-phai-lap-lai-90814.htm ; https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-254-2026-nd-cp-ve-hoa-don-dien-tu-chung-tu-dien-tu-119260713164251972.htm Nếu hóa đơn tháng 3 và hoàn/điều chỉnh tháng 4/2026: chưa đủ chỉ hai tháng này để chốt kỳ kê khai; phải biết loại thuế, phương pháp, lý do điều chỉnh, hóa đơn gốc, chứng từ trả hàng và quy định hiệu lực trước 01/07/2026. Không viện Thông tư 91 như căn cứ trực tiếp cho tháng 4. Khi chưa có đúng căn cứ thời kỳ trong trích lục, trả lời hướng đối chiếu hồ sơ có điều kiện, không chốt tháng 3 hay tháng 4 hoặc gắn điểm/khoản chưa được chứng minh. Sai giá không đồng nghĩa sai tên; không gắn điểm a khoản 1 cho nhánh sai giá."
  },
  {
    "id": "KB/semantic-topic-supplements#vat-method-and-components",
    "file": "KB/semantic-topic-supplements",
    "section": "16.104. Phương pháp GTGT và cấu phần hợp đồng — Điều 5, Điều 12 Luật 48/2024/QH15",
    "ref_id": "16.104",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "Phải phân biệt thuế suất trên hóa đơn theo phương pháp khấu trừ với tỷ lệ GTGT trên doanh thu theo phương pháp trực tiếp tại Điều 12 Luật Thuế GTGT 48/2024/QH15. Cụm GTGT 5% chưa tự xác định được phương pháp. Với giá đã gồm thuế, kiểm loại hóa đơn, phương pháp và giá tính thuế; không tách ngược VAT như khấu trừ rồi áp cho hộ trực tiếp, cũng không tính trùng tiền thuế. Với sửa chữa có linh kiện: xem hợp đồng, báo giá, quyền sở hữu vật tư, nghĩa vụ bảo hành, giá tách riêng hay gói trọn. Linh kiện bán độc lập khác vật tư cấu thành dịch vụ; không tự tách chỉ vì hóa đơn có hai dòng, và không gộp chỉ vì một hóa đơn. Quảng cáo phụ tùng miễn phí không chứng minh miễn phí thực chất nếu giá gói đã bao gồm. Dịch vụ thuần, dịch vụ gắn hàng hóa và bán hàng có nhóm tỷ lệ khác nhau; chỉ chốt nhóm sau khi đủ hồ sơ. Nếu chỉ hỏi phần sửa chữa, không đưa doanh thu bán máy mới vào tính. Trong thời gian chính sách NQ204/NĐ174 áp dụng, còn phải kiểm hàng hóa/dịch vụ có thuộc diện được giảm tỷ lệ 20% không. Với công nghệ thông tin: tách sản phẩm/phần mềm, chuyển giao/cấp quyền, dịch vụ phần mềm, sửa chữa thiết bị và tư vấn; kiểm đối tượng không chịu GTGT tại Điều 5 Luật 48/2024 và danh mục loại trừ NĐ174, không suy từ tên ngành. Nguồn: https://xaydungchinhsach.chinhphu.vn/van-ban-hop-nhat-114-vbhn-vpqh-hop-nhat-luat-thue-gia-tri-gia-tang-119260605094756577.htm ; https://xaydungchinhsach.chinhphu.vn/phuong-phap-tinh-thue-voi-ca-nhan-kinh-doanh-ho-kinh-doanh-119260309100708724.htm"
  },
  {
    "id": "KB/semantic-topic-supplements#invoice-application-conditions",
    "file": "KB/semantic-topic-supplements",
    "section": "16.105. Điều kiện hồ sơ áp dụng ngưỡng và hạn HĐĐT — khoản 5 Điều 8 NĐ68 sửa bởi khoản 2 Điều 1 NĐ141",
    "ref_id": "16.105",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[PHẠM VI] HĐĐT của hộ/cá nhân kinh doanh theo khoản 5 Điều 8 NĐ68, sửa tại khoản 2 Điều 1 NĐ141; không phải quy định đăng ký hộ kinh doanh.\nCăn cứ trực tiếp: khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP sửa khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP, không phải Điều 9 Nghị định 141. Thời hạn nhánh chuyển ngưỡng là 30 ngày kể từ ngày cuối cùng của kỳ tính thuế có doanh thu lũy kế trên 1 tỷ. Hồ sơ cần kiểm để áp dụng: sổ doanh thu theo tháng/quý, lũy kế từ đầu năm, các khoản hoàn/hủy/điều chỉnh hợp lệ, kỳ đầu vượt và ngày cuối kỳ, tình trạng đăng ký và loại hóa đơn đang dùng.\n[CHỦ THỂ VÀ ĐÃ ĐĂNG KÝ] Nhiều điểm bán xét tổng chủ thể hộ/cá nhân, không một ngưỡng cho mỗi điểm; dùng MST của chủ thể và thông tin địa điểm phù hợp. Đã dùng HĐĐT hợp lệ thì không tự phải đăng ký lại cùng loại chỉ vì vượt ngưỡng, nhưng phải kiểm loại có mã/máy tính tiền kết nối dữ liệu, trạng thái đăng ký và thông tin cần cập nhật.\n[NGOẠI LỆ CẦN KIỂM] Tạm ngừng không tự chứng minh có gia hạn hay dừng đếm hạn: cần ngày tạm ngừng hợp lệ, kỳ vượt, giao dịch phát sinh và căn cứ ngoại lệ, không mặc nhiên cộng thêm số tháng nghỉ. Dự kiến cao không tự là doanh thu đã phát sinh: nếu thực tế cả năm dưới ngưỡng phải kiểm cả nghĩa vụ từ năm trước, đã đăng ký tự nguyện hoặc quy định riêng, và hồ sơ điều chỉnh nếu từng vượt thực tế.\n[SỰ CỐ VẬN HÀNH] Khi cổng lỗi ngày cuối hạn: lưu ảnh có ngày giờ/thông báo lỗi, mã hồ sơ, nhật ký thao tác/nộp lại, email/ticket và xác nhận sự cố nếu có; chủ động báo cơ quan thuế và nộp lại khi khắc phục. Bằng chứng lỗi không tự thay nghĩa vụ đăng ký hoặc bảo đảm miễn phạt. Các mục hồ sơ trên là hướng dẫn kiểm chứng điều kiện, không phải tự đặt thêm một thủ tục hay ngoại lệ pháp luật. Nguồn: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm"
  },
  {
    "id": "KB/semantic-topic-supplements#invoice-before-july",
    "file": "KB/semantic-topic-supplements",
    "section": "16.106. Hóa đơn tháng 3/4 năm 2026 — Điều 19 NĐ123 sửa bởi khoản 13 Điều 1 NĐ70/2025",
    "ref_id": "16.106",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "Trước 01/07/2026: đối chiếu Điều 19 Nghị định 123/2020/NĐ-CP, được sửa tại khoản 13 Điều 1 Nghị định 70/2025/NĐ-CP. Trả hàng thực tế thuộc điểm c khoản 4 Điều 19; c.1 cho người bán lập điều chỉnh, trừ thỏa thuận người mua lập hóa đơn trả lại; c.2 có quy tắc cho tài sản đã đăng ký tên người mua. Sai giá/số tiền thuộc điểm b khoản 1, không phải nhánh trả hàng: người bán có thể lựa chọn điều chỉnh (b.1) hoặc thay thế (b.2). Không chốt bắt buộc chỉ điều chỉnh khi chưa có dữ kiện/ngoại lệ hạn chế lựa chọn. Cần hóa đơn gốc, thời điểm lập chứng từ điều chỉnh/thay thế, hồ sơ sai sót và phương pháp/kỳ kê khai trước khi chốt kỳ thuế. Chỉ yêu cầu hồ sơ trả hàng khi thực tế có trả hàng; người dùng đã xác nhận không trả hàng thì không yêu cầu hồ sơ này. Không dùng Thông tư 91/2026 như căn cứ trực tiếp cho tháng 3/4. Nguồn: https://baochinhphu.vn/nhung-noi-dung-moi-cua-nghi-dinh-so-70-2025-nd-cp-ve-hoa-don-chung-tu-102250903091616929.htm ; https://dnieza.dongnai.gov.vn/Pages/newsdetail.aspx?CatId=105&NewsId=5066"
  },
  {
    "id": "KB/business-registration#exemption-and-online-freelance",
    "file": "KB/business-registration",
    "section": "16.107. Đăng ký kinh doanh: trường hợp không bắt buộc đăng ký và hoạt động affiliate, online, thu nhập thấp",
    "ref_id": "16.107",
    "tier": "VERIFIED",
    "text": "[THỜI KỲ] Đăng ký hộ kinh doanh từ 01/07/2025: khoản 3 và khoản 4 Điều 82, Điều 83 Nghị định 168/2025/NĐ-CP.\n[NGOẠI LỆ CÓ ĐIỀU KIỆN] Khoản 3 Điều 82 quy định hộ gia đình sản xuất nông, lâm, ngư nghiệp, làm muối; người bán hàng rong, quà vặt, buôn chuyến, kinh doanh lưu động, kinh doanh thời vụ, làm dịch vụ có thu nhập thấp không phải đăng ký hộ kinh doanh, trừ ngành, nghề đầu tư kinh doanh có điều kiện. UBND tỉnh, thành phố trực thuộc trung ương quy định mức thu nhập thấp áp dụng tại địa phương.\n[TỰ NGUYỆN] Khoản 4 cho phép các đối tượng này đăng ký nếu có nhu cầu. Điều 83 quy định nghĩa vụ đăng ký và không được hoạt động dưới danh nghĩa hộ kinh doanh mà không đăng ký.\n[KHÔNG ĐƯỢC SUY RA] Không có căn cứ trong các điều này để coi mọi hoạt động online/affiliate, không có địa điểm cố định hoặc một mức tiền nhỏ bất kỳ đều tự động được miễn đăng ký.\n[DỮ KIỆN CẦN BIẾT] Muốn áp dụng ngoại lệ phải xác định tính chất hoạt động và, nếu dựa vào dịch vụ thu nhập thấp, địa phương cùng mức thu nhập thấp đang có hiệu lực tại đó. Chưa biết thì trình bày các nhánh điều kiện và hỏi bổ sung, không kết luận tuyệt đối. Ngưỡng miễn thuế và việc bên trả thu nhập khấu trừ không thay thế điều kiện miễn đăng ký kinh doanh.\n[GIỚI HẠN] Nguồn này không xác định nghĩa vụ khấu trừ hay mức thuế và không dùng cho thời kỳ trước 01/07/2025. Nguồn: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-168-2025-nd-cp-ve-dang-ky-doanh-nghiep-119250702175708554.htm"
  }
];

/**
 * 1. Định tuyến nhanh qua Query Map
 * Fold dấu tiếng Việt cả 2 phía để câu hỏi không dấu ("tiep thi lien ket",
 * "cho thue nha") vẫn trúng route như bản có dấu. Trường not loại route bị cấm.
 */
function foldRouteKey(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function matchRoute(query: string): QueryRoute | null {
  const q = foldRouteKey(query);
  let bestRoute: QueryRoute | null = null;
  let highestPriority = -1;

  for (const route of QUERY_ROUTES) {
    const hasAny = route.any.some((kw) => q.includes(foldRouteKey(kw)));
    if (!hasAny) continue;

    if (route.context_any && route.context_any.length > 0) {
      const hasContext = route.context_any.some((kw) => q.includes(foldRouteKey(kw)));
      if (!hasContext) continue;
    }

    if (route.not && route.not.length > 0) {
      const excluded = route.not.some((kw) => q.includes(foldRouteKey(kw)));
      if (excluded) continue;
    }

    if (route.priority > highestPriority) {
      highestPriority = route.priority;
      bestRoute = route;
    }
  }

  return bestRoute;
}

/**
 * 2. Tìm chunks theo Canonical ref_id
 */
export function getChunksByRefs(refs: string[]): RagChunk[] {
  const set = new Set(refs);
  return CANONICAL_CHUNKS.filter((c) => c.ref_id && set.has(c.ref_id));
}

/**
 * 3. Tìm kiếm từ khóa ngữ nghĩa trong tập Verified Chunks
 */
export function searchKnowledgeBase(query: string, limit = 4): RagChunk[] {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  if (words.length === 0) return [];

  const scored = CANONICAL_CHUNKS.map((chunk) => {
    const textLower = chunk.text.toLowerCase();
    const sectionLower = (chunk.section || '').toLowerCase();
    let score = 0;

    for (const w of words) {
      if (sectionLower.includes(w)) score += 5; // Trọng số cao nếu khớp tiêu đề
      if (textLower.includes(w)) score += 1;
    }

    // Ưu tiên cao hơn cho VERIFIED so với VERIFIED_CONDITIONAL
    if (chunk.tier === 'VERIFIED') score *= 1.2;

    return { chunk, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.chunk);
}
