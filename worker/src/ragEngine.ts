/**
 * RAG KNOWLEDGE BASE ENGINE (Compiled for Cloudflare Workers Edge)
 * Generated at: 2026-10-22T03:50:59.870Z
 * Chunks: 153 verified | Routes: 61
 */

export interface RagChunk {
  id: string;
  file: string;
  section: string;
  ref_id: string | null;
  tier: string;
  text: string;
  purpose_passages?: Record<string, string>;
  context_passage?: string;
  context_passage_period?: {applies_from_year?:number;applies_to_year?:number|null};
  evidence_mode?: 'COMPLETE_RULE';
  retrieval_facets?: {policy_focus?:string[];eligibility_topics?:string[];revenue_contexts?:string[];topics?:string[];intents?:string[];subject_contexts?:string[];answer_purposes?:string[];income_types?:string[];tax_focuses?:string[]};
  subject_scope?: string[];
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
  },
  {
    "id": "DEPENDENT_REG_ETAX",
    "any": [
      "người phụ thuộc",
      "nguoi phu thuoc",
      "1.008499",
      "đăng ký giảm trừ gia cảnh",
      "dang ky giam tru gia canh"
    ],
    "refs": [
      "16.12",
      "16.82"
    ],
    "expand": [
      "thủ tục đăng ký người phụ thuộc trên eTax Mobile mã 1.008499"
    ],
    "priority": 90
  },
  {
    "id": "BANK_ACCOUNT_ETAX",
    "any": [
      "thông báo tài khoản ngân hàng",
      "thong bao tai khoan ngan hang",
      "đăng ký tài khoản ngân hàng",
      "dang ky tai khoan ngan hang",
      "tài khoản ngân hàng kinh doanh",
      "tai khoan ngan hang kinh doanh",
      "ví điện tử kinh doanh"
    ],
    "refs": [
      "16.9"
    ],
    "expand": [
      "thông báo tài khoản ngân hàng ví điện tử trên eTax Mobile trong 10 ngày Điều 13 NĐ 68/2026"
    ],
    "priority": 88
  },
  {
    "id": "MST_STATUS_03_06",
    "any": [
      "trạng thái 03",
      "trang thai 03",
      "trạng thái 06",
      "trang thai 06",
      "khóa mã số thuế",
      "khoa ma so thue",
      "khóa mst",
      "khoa mst",
      "khôi phục mst",
      "khoi phuc mst",
      "đóng mã số thuế",
      "dong ma so thue",
      "chấm dứt hiệu lực mã số thuế",
      "tự ý nghỉ kinh doanh"
    ],
    "refs": [
      "16.25"
    ],
    "expand": [
      "tạm ngừng hoạt động chấm dứt hiệu lực MST trạng thái 03 06 Điều 19 20 Luật 108/2025"
    ],
    "priority": 88
  },
  {
    "id": "PORTAL_EINVOICE_OUTAGE",
    "any": [
      "cổng lỗi",
      "cong loi",
      "lỗi cổng",
      "loi cong",
      "sập cổng",
      "sap cong",
      "quá tải",
      "qua tai",
      "ngày cuối hạn",
      "ngay cuoi han"
    ],
    "refs": [
      "16.105",
      "16.41",
      "16.24"
    ],
    "expand": [
      "sự cố vận hành cổng thuế ngày cuối hạn 30 ngày lưu bằng chứng"
    ],
    "priority": 88
  },
  {
    "id": "INVOICE_ERROR_04SS",
    "any": [
      "04/ss-hđđt",
      "04/ss-hddt",
      "sai sót hóa đơn",
      "sai sot hoa don",
      "hóa đơn viết sai",
      "hoa don viet sai",
      "điều chỉnh hóa đơn",
      "dieu chinh hoa don",
      "thay thế hóa đơn",
      "thay the hoa don"
    ],
    "refs": [
      "16.103",
      "16.106",
      "16.21"
    ],
    "expand": [
      "xử lý hóa đơn điện tử có sai sót Mẫu 04/SS-HĐĐT điều chỉnh thay thế"
    ],
    "priority": 88
  },
  {
    "id": "TAX_PORTAL_SYSTEMS",
    "any": [
      "thuedientu",
      "canhantmdt",
      "etax mobile",
      "itaxviewer",
      "01/cnkd",
      "01/tkn-cnkd",
      "chỉ tiêu 14",
      "chi tieu 14"
    ],
    "refs": [
      "16.100",
      "16.12",
      "16.9",
      "16.55",
      "16.40",
      "16.52"
    ],
    "expand": [
      "hệ thống phần mềm cơ quan thuế eTax Mobile canhantmdt HTKK 01/CNKD"
    ],
    "priority": 72
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
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.3. Mua heo hơi, thuê lò mổ rồi bán thịt\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Nếu HKD **tự chăn nuôi** và bán sản phẩm chăn nuôi chưa chế biến thành sản phẩm khác hoặc chỉ qua sơ chế thông thường, cần kiểm tra điều kiện ưu đãi dành cho người trực tiếp sản xuất.\n- Nếu HKD **mua heo của người khác**, không được tự áp dụng ưu đãi dành cho người trực tiếp chăn nuôi.\n- Việc thuê lò mổ không làm doanh thu của HKD trở thành “dịch vụ giết mổ”. Lò mổ cung cấp dịch vụ cho HKD; doanh thu bán thịt của HKD phải phân loại theo hoạt động thực tế của HKD:\n  - chỉ mua/bán hàng hóa sau thao tác thông thường → hướng phân phối;\n  - tổ chức quá trình sản xuất/chế biến đầu vào thành sản phẩm bán ra → hướng sản xuất/chế biến.\n- Vì vậy không được chốt 1,5% hay 4,5% chỉ từ câu “thuê giết mổ”; cần xem quy trình, hợp đồng, hóa đơn đầu vào và sản phẩm đầu ra.\n- Nguồn: VBHN 114/VBHN-VPQH Luật GTGT và bảng tỷ lệ ngành của chính sách HKD 2026.\n- CROSS_REFERENCE: 16.77 (bảng tỷ lệ ngành theo NĐ 68/2026, có nguồn chính thức); nguyên tắc doanh thu TNCN theo Điều 5 NĐ 68/2026: https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm"
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
    "text": "[PHẠM VI CHỦ THỂ] Quy tắc sau thuộc hình thức hộ kinh doanh; không biến người chỉ tự nhận cá nhân kinh doanh thành người đã thành lập hộ. Chưa rõ trạng thái thì cần xác minh trước khi kết luận riêng cho họ.\n16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.7. Một cá nhân có được đứng tên 2 HKD?\n- **LEGAL_STATUS:** `VERIFIED`.\n- **Không.** Khoản 1 Điều 83 Nghị định 168/2025/NĐ-CP: cá nhân/thành viên hộ gia đình thuộc đối tượng thành lập HKD **chỉ được đăng ký một hộ kinh doanh trong phạm vi toàn quốc**.\n- Một HKD có thể đăng ký nhiều ngành nghề và có nhiều địa điểm kinh doanh theo quy định; không cần tạo HKD thứ hai chỉ để tách kênh bán.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-168-2025-nd-cp-ve-dang-ky-doanh-nghiep-119250702175708554.htm\n- **Hồ sơ và thời hạn đăng ký HKD mới (Điều 99 NĐ 168/2025/NĐ-CP, đọc cùng NĐ 296/2026/NĐ-CP):** Gồm Giấy đề nghị đăng ký hộ kinh doanh, bản sao văn bản ủy quyền của thành viên hộ gia đình cho một thành viên làm chủ hộ (nếu các thành viên hộ gia đình đăng ký HKD), giấy tờ pháp lý/ủy quyền người nộp; nộp tại Cơ quan đăng ký kinh doanh cấp xã nơi đặt trụ sở; thời hạn giải quyết cấp Giấy chứng nhận đăng ký HKD (đồng thời là Giấy chứng nhận đăng ký thuế liên thông) là **03 ngày làm việc** kể từ ngày nhận hồ sơ hợp lệ.\n- **Mở thêm địa điểm kinh doanh, cửa hàng, kho hàng ngoài trụ sở:** Không đăng ký HKD mới và không cấp MST mới; phải thông báo cho **cơ quan thuế quản lý trực tiếp trụ sở trong thời hạn 10 ngày làm việc** kể từ ngày địa điểm kinh doanh đi vào hoạt động theo **điểm đ khoản 2 Điều 8 Nghị định 68/2026/NĐ-CP**.\n- **Tạm ngừng kinh doanh (khoản 1 Điều 103 NĐ 168/2025/NĐ-CP, đọc cùng NĐ 296/2026/NĐ-CP):** Tạm ngừng từ 15 ngày trở lên (như 6 tháng) phải gửi thông báo bằng văn bản cho Cơ quan ĐKKD cấp xã **chậm nhất 03 ngày làm việc trước ngày tạm ngừng** (NĐ 296/2026 không đổi khoản 1 Điều 103 thành 02 ngày). Thời gian tạm ngừng **mỗi lần thông báo không quá 01 năm (12 tháng)** nên **không được duyệt tạm ngừng 14 tháng liên tục trong một lần**; hết 01 năm nếu nghỉ tiếp phải thông báo tiếp chậm nhất 03 ngày làm việc trước ngày nghỉ tiếp.",
    "subject_scope": [
      "HOUSEHOLD_FORM",
      "COMPARISON"
    ]
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
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.9. Tài khoản ngân hàng/ví điện tử của HKD\n- **LEGAL_STATUS:** `VERIFIED`.\n- HKD **có thể sử dụng nhiều tài khoản ngân hàng hoặc ví điện tử** để nhận tiền; pháp luật thuế không bắt buộc chỉ dùng một tài khoản duy nhất.\n- HKD phải thông báo với cơ quan thuế **tất cả tài khoản/ví liên quan đến hoạt động sản xuất, kinh doanh** và kê khai đầy đủ doanh thu từ mọi kênh.\n- Chuyển tiền giữa tài khoản dùng cho kinh doanh và tài khoản của chủ hộ không tự động là doanh thu mới; phải ghi nội dung và lưu chứng từ để phân biệt doanh thu, góp vốn, rút tiền, hoàn ứng, chi hộ...\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-co-the-su-dung-nhieu-tai-khoan-ngan-hang-nhan-tien-tu-cac-kenh-ban-hang-khac-nhau-11926072216591801.htm\n  https://xaydungchinhsach.chinhphu.vn/huong-dan-ho-kinh-doanh-thong-bao-so-tai-khoan-ngan-hang-so-hieu-vi-dien-tu-tren-ung-dung-etax-mobile-119260413154428966.htm\n- **Căn cứ pháp lý và biểu mẫu thông báo tài khoản kinh doanh:** Căn cứ trực tiếp là **khoản 4 Điều 13 Nghị định 68/2026/NĐ-CP** (không viện dẫn nhầm sang khoản 3 Điều 13 và không tự gán thời hạn cố định 10 ngày nếu văn bản không quy định mốc 10 ngày cho tài khoản ngân hàng). Hướng dẫn trên Cổng Chính phủ tháng 4/2026 nêu thao tác trên eTax Mobile theo mẫu **01/BK-STK**; từ 01/07/2026 đối chiếu hệ thống biểu mẫu hiện hành theo **Thông tư 89/2026/TT-BTC** (không dùng Thông tư 86/2024/TT-BTC đã hết hiệu lực).\n- **Phân biệt 2 chức năng khác nhau trên eTax Mobile:** Chức năng **liên kết tài khoản ngân hàng để nộp thuế điện tử** là kết nối phương thức thanh toán với ngân hàng; chức năng này **không thay thế** thủ tục **thông báo số tài khoản ngân hàng/ví điện tử phục vụ sản xuất, kinh doanh** với cơ quan thuế theo khoản 4 Điều 13 Nghị định 68/2026/NĐ-CP."
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
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.12. Đăng ký/thay đổi người phụ thuộc trên eTax Mobile\n- **LEGAL_STATUS:** `VERIFIED` cho quy trình được cơ quan thuế công bố; giao diện có thể thay đổi nên phải ghi ngày kiểm tra.\n- Quy trình trong hướng dẫn được công bố trên Cổng Chính phủ (không phải xác nhận đã kiểm tra giao diện ứng dụng hiện tại):\n  1. `Đăng ký thuế`\n  2. `Kê khai hồ sơ đăng ký thuế` – mã TTHC `1.008499`\n  3. Chọn đăng ký lần đầu hoặc thay đổi thông tin nếu đã có mã số thuế\n  4. Nhập thông tin người phụ thuộc\n  5. Xác nhận OTP\n  6. Kiểm tra thông báo nộp hồ sơ thành công.\n- Nếu chỉ cập nhật thông tin định danh người phụ thuộc, có thể dùng chức năng tra cứu/cập nhật thông tin người phụ thuộc theo hướng dẫn eTax Mobile.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/huong-dan-dang-ky-moi-thay-doi-thong-tin-nguoi-phu-thuoc-tren-etax-mobile-119260317091940213.htm\n  https://xaydungchinhsach.chinhphu.vn/huong-dan-cap-nhat-thong-tin-nguoi-phu-thuoc-tren-etax-mobile-119260316170710976.htm\n- **Biểu mẫu và quy tắc từ 01/07/2026 (Thông tư 90/2026/TT-BTC thay thế TT 86/2024/TT-BTC):** Cá nhân tự đăng ký trực tiếp người phụ thuộc dùng **Mẫu số 20-ĐKT**; trường hợp ủy quyền qua cơ quan chi trả thu nhập tổng hợp dùng **Mẫu số 20-ĐKT-TH** (không dùng ký hiệu cũ 20-ĐK-TCT cho hồ sơ từ 01/07/2026).\n- **Trẻ em dưới 14 tuổi chưa có thẻ căn cước:** Nếu trẻ đã được cấp **số định danh cá nhân 12 số trên Giấy khai sinh** thì dùng ngay số định danh cá nhân 12 số và thông tin Giấy khai sinh để kê khai đăng ký người phụ thuộc, **tuyệt đối không phải chờ trẻ đủ 14 tuổi làm thẻ căn cước mới được đăng ký**.\n- **Tránh nộp trùng hồ sơ:** Người nộp thuế chỉ chọn một luồng (ủy quyền cho công ty nộp hoặc tự nộp trên eTax Mobile). Nếu người phụ thuộc đã được cấp MST/định danh người phụ thuộc trước đó thì chọn hình thức **Thay đổi thông tin đăng ký thuế** để cập nhật, không chọn đăng ký mới trùng lặp; phân biệt thủ tục đăng ký định danh người phụ thuộc với việc đủ điều kiện giảm trừ gia cảnh thực tế."
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
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.17. Giao dịch cũ chưa lập hóa đơn / lập hóa đơn muộn\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Việc đã bỏ sót thời điểm lập hóa đơn **không làm mất nghĩa vụ lập hóa đơn**. Không được backdate hoặc xóa dấu vết giao dịch để “làm cho đúng ngày”.\n- Phải xử lý hóa đơn bỏ sót và nghĩa vụ khai bổ sung, nhưng trước hết xác định ngày giao dịch, thời điểm phải lập, thời điểm phát hiện và điều khoản chuyển tiếp. Từ 01/07/2026 kiểm NĐ 254/2026 và TT 91/2026; kỳ trước đó kiểm NĐ 123/2020 đã sửa bởi NĐ 70/2025 (16.106). Không áp hồi tố máy móc văn bản mới hoặc mức phạt mới cho hành vi cũ.\n- Cách xử lý chi tiết phụ thuộc giao dịch xảy ra trước hay sau 01/07/2026 và loại hóa đơn; AI phải hỏi ngày giao dịch/ngày hoàn thành dịch vụ trước khi hướng dẫn thao tác.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-254-2026-nd-cp-ve-hoa-don-dien-tu-chung-tu-dien-tu-119260713164251972.htm"
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
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.19. Mua hàng từ người dân/cá nhân không có hóa đơn\n- **LEGAL_STATUS:** `VERIFIED`.\n- HKD được phép lập **bảng kê mua hàng hóa/dịch vụ** trong các trường hợp người bán không thuộc diện lập hóa đơn theo hướng dẫn áp dụng; bảng kê cần có tối thiểu thông tin định danh người bán, địa chỉ, hàng hóa, số lượng, giá trị và hình thức thanh toán.\n- Phải lưu chứng từ thanh toán và hồ sơ liên quan. Bảng kê **không phải giấy phép hợp thức hóa hàng không rõ nguồn gốc**; vẫn phải chứng minh giao dịch thực tế và nguồn gốc theo pháp luật chuyên ngành.\n- Với khoản thanh toán từng lần từ ngưỡng pháp luật yêu cầu thanh toán không dùng tiền mặt để được tính chi phí, phải đáp ứng điều kiện thanh toán tương ứng.\n- Nguồn:\n  https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-mua-hang-tu-ca-nhan-kinh-doanh-co-doanh-thu-duoi-500-trieu-dong-nam-khong-hoa-don-co-duoc-phep-lap-bang-ke-mua-hang-119260312204259799.htm\n  https://xaydungchinhsach.chinhphu.vn/quy-dinh-moi-ve-thue-va-hoa-don-dien-tu-trong-thuong-mai-dien-tu-va-ban-hang-da-kenh-119260717133903995.htm\n- Bài tháng 4 dùng ngưỡng thuế cũ: khi xét người bán trong kỳ 2026, đối chiếu NĐ 141/2026 nâng ngưỡng của NĐ 68 lên 1 tỷ. Không thay mọi số 500 triệu trong văn bản khác một cách tự động.\n- Bảng kê là chứng từ kế toán theo TT 152; việc được trừ chi phí TNCN của HKD còn phải đáp ứng Điều 6 NĐ 68 và chỉ xét khi dùng phương pháp thu nhập. Không lấy quy tắc chi phí TNDN của doanh nghiệp mua dịch vụ làm quy tắc TNCN của HKD; ngưỡng thanh toán theo tổng từng người bán trong ngày tại CV7403 có phạm vi riêng (16.95)."
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1027",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.20. Affiliate: phân loại theo quan hệ lao động và bản chất kinh doanh theo mục 1 Công văn 7403/CT-TMĐT",
    "ref_id": "16.20",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "## 16.20. Affiliate: phân loại theo quan hệ lao động và bản chất kinh doanh theo mục 1 Công văn 7403/CT-TMĐT\n[TIỀN LƯƠNG] Cá nhân nhận thu nhập theo hợp đồng lao động hoặc thỏa ước lao động tập thể ký với bên chi trả theo pháp luật lao động: thu nhập từ tiền lương, tiền công; bên trả khấu trừ, kê khai, nộp TNCN theo quy định. Không loại nhánh này chỉ vì hoạt động có tên affiliate hoặc diễn ra trên TikTok.\n[KINH DOANH] Cá nhân sáng tạo nội dung số, quảng bá sản phẩm, tiếp thị liên kết trên nền tảng TMĐT/nền tảng số, nhận thu nhập từ nền tảng hoặc nhãn hàng từ hoạt động kinh doanh, không phải tiền lương: thu nhập kinh doanh; thực hiện đăng ký thuế, kê khai, nộp thuế theo Nghị định 68/2026/NĐ-CP và Nghị định 141/2026/NĐ-CP.\n[KHÔNG SUY TỪ ĐĂNG KÝ] Phải đối chiếu cả tình trạng đăng ký và bản chất khoản thù lao theo Điều 7, điểm c khoản 2 Điều 8 NĐ253 ở phần bổ sung; không bỏ qua điều kiện đăng ký hoặc suy mọi khoản mang tên affiliate cùng một loại thu nhập. Không suy mọi người làm affiliate đều là bán hàng của chính họ.\n[TỶ LỆ CÓ PHẠM VI] Mục 1 công văn dẫn mức TNCN 5% cho tiếp thị liên kết trên nền tảng TMĐT theo điểm đ khoản 3 Điều 7 Luật Thuế thu nhập cá nhân 109/2025/QH15. Không coi 5% là tổng GTGT+TNCN hoặc áp cho mọi creator/booking. Chọn đúng kỳ, ngưỡng và phương pháp; xem 16.56, 16.95.\n[ĐĂNG KÝ HỘ] Công văn yêu cầu đăng ký THUẾ ở nhánh kinh doanh, không tự kết luận mọi người phải lập hộ hoặc đều được miễn lập hộ. Nghĩa vụ đăng ký kinh doanh xét riêng theo 16.107; thu nhập ít/đã khấu trừ không tự giải quyết câu hỏi đó.\n[THỜI KỲ VÀ THIẾU DỮ KIỆN] Ngày 06/10/2026 là ngày công văn, không phải tự động mốc luật đổi phân loại. Thu nhập 2025 xét luật và bản chất của kỳ 2025; không hồi tố kết luận cho mọi năm. Chưa rõ quan hệ lao động, nguồn trả hay vai trò thì hỏi điều kiện quyết định, không đoán từ chữ affiliate.\nNguồn trực tiếp đối chiếu: Công văn 7403/CT-TMĐT ngày 06/10/2026, bản DOCX người dùng cung cấp ngày 16/10/2026; lưu tại /documents/7403-CT-TMDT-2026.docx. Căn cứ định nghĩa: khoản 12 Điều 3 Luật Thương mại điện tử 122/2025/QH15, đối chiếu /documents/Luat-122-2025-QH15.pdf.\n[THÙ LAO DỊCH VỤ VÀ TÌNH TRẠNG ĐĂNG KÝ] Điểm c khoản 2 Điều 8 NĐ253/2026/NĐ-CP xếp vào tiền lương, tiền công khoản thù lao cung cấp dịch vụ của cá nhân không đăng ký kinh doanh, không đăng ký thuế cho hoạt động kinh doanh, dù có hay không giấy phép/chứng chỉ hành nghề. Điều 7 đồng thời quy định thu nhập kinh doanh, gồm môi giới và kinh doanh nền tảng. Không có HĐLĐ chưa đủ để chốt nhánh kinh doanh: phải hỏi/đối chiếu tình trạng đăng ký, bản chất hợp đồng và khoản thu cụ thể; có mã số thuế cá nhân chưa tự chứng minh đã đăng ký thuế cho hoạt động kinh doanh. Công văn7403 hướng dẫn affiliate trong phạm vi của công văn, không thay thế quy định của NĐ253 hoặc tự chứng minh mọi khoản thu trên các nền tảng cùng bản chất. Khi có nhiều khoản, phân loại từng khoản trước khi gộp doanh thu kinh doanh. Đã đọc bản NĐ253 gốc tại /documents/ND-253-2026-ND-CP.pdf, Điều 7 và Điều 8 trang 4; không dùng câu hỏi của người dân trên trang hỏi đáp làm kết luận cơ quan thuế.",
    "evidence_mode": "COMPLETE_RULE"
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
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.24. Hồ sơ thuế điện tử: “đã gửi/ghi nhận” khác với “tiếp nhận hồ sơ hợp lệ”\n- **LEGAL_STATUS:** `VERIFIED`.\n- Từ 01/07/2026, TT 89/2026/TT-BTC quy định: thời điểm xác nhận người nộp thuế nộp hồ sơ thuế điện tử là **ngày Hệ thống thông tin quản lý thuế tiếp nhận đầy đủ hồ sơ hợp lệ** và ngày đó được ghi trên **Thông báo tiếp nhận hồ sơ thuế điện tử** gửi cho người nộp thuế. Cơ quan thuế căn cứ thời điểm này để xác định có nộp chậm hay không.\n- Hệ thống/cổng gửi hồ sơ có thể ghi nhận thao tác gửi trước khi cơ quan thuế phát hành thông báo tiếp nhận hoặc không tiếp nhận. Vì vậy **không được coi một email kỹ thuật “đã gửi/đã ghi nhận” là bằng chứng cuối cùng rằng hồ sơ hợp lệ đã nộp đúng hạn**.\n- Nếu cơ quan thuế phát hành **Thông báo không tiếp nhận**, người nộp thuế phải sửa/nộp lại. Ngày của lần gửi lỗi không tự động được dùng làm ngày nộp hợp lệ cho hồ sơ thay thế.\n- Với hồ sơ phát sinh trước 01/07/2026, phải áp quy định giao dịch điện tử tương ứng của thời kỳ đó (ví dụ TT 19/2021/TT-BTC), không dùng TT 89 hồi tố.\n- **Cấm khuyến nghị cố ý nộp số liệu sai để “giữ hạn”.**\n- Nguồn: TT 89/2026/TT-BTC, quy định về thời điểm xác nhận nộp hồ sơ và thông báo tiếp nhận/không tiếp nhận: https://vanban.chinhphu.vn/?classid=1&docid=218974&orggroupid=4&pageid=27160\n- **Tài khoản giao dịch thuế điện tử và VNeID (Điều 5, Điều 7 Thông tư 89/2026/TT-BTC):** Cá nhân/HKD đã có tài khoản định danh điện tử **VNeID mức độ 2** được sử dụng để đăng nhập các cổng thuế điện tử/eTax Mobile; trường hợp đối tượng không thuộc diện cấp định danh điện tử thì đăng ký tài khoản giao dịch thuế điện tử theo luồng xác thực riêng tại Điều 5 TT 89/2026. Lưu ý: việc dùng VNeID của cá nhân để đăng nhập không tự động thay thế mọi chữ ký số/xác thực điện tử của mọi loại chủ thể hoặc mọi loại hồ sơ chuyên biệt.\n- **Xử lý các sự cố thường gặp trên cổng thuế / eTax Mobile:**\n  1. **Lỗi không tìm thấy chứng thư số / eSigner không chạy / mới gia hạn chữ ký số vẫn lỗi:** Kiểm tra kết nối USB Token, bộ cài/extension ký số trên trình duyệt; phân biệt việc đã đóng tiền gia hạn hợp đồng với nhà cung cấp CA và **thời hạn hiệu lực của chứng thư số mới** — sau khi gia hạn tạo ra sê-ri chứng thư số mới thì phải **cập nhật/thay đổi thông tin chứng thư số mới trên tài khoản thuế điện tử** trước khi ký nộp.\n  2. **Lỗi nộp thuế trên eTax Mobile đã trừ tiền ngân hàng nhưng vẫn báo còn nợ:** Lưu biên lai/mã tham chiếu giao dịch ngân hàng, chờ hệ thống ngân hàng – Kho bạc – cơ quan thuế đối soát truyền dữ liệu, kiểm tra mục tra cứu chứng từ/tra soát trên ứng dụng; **tuyệt đối không bấm nộp lại ngay** để tránh bị trừ tiền nộp trùng 2 lần.\n  3. **Lỗi đổi số điện thoại mất OTP / lỗi CCCD không khớp:** Thực hiện cập nhật số điện thoại trong thông tin đăng ký thuế hoặc đăng nhập qua VNeID mức 2; nếu báo lỗi CCCD/số định danh không tồn tại hoặc lệch thông tin thì đối chiếu dữ liệu CSDL quốc gia về dân cư và liên hệ cơ quan thuế quản lý để đồng bộ định danh.\n  4. **Xác thực OTP thành công / Đổi điện thoại mất lịch sử / Bảo mật (C20):** OTP thành công mới là bước gửi hồ sơ điện tử, chưa phải đã được chấp nhận hay đã duyệt hoàn thuế (phải chờ Thông báo tiếp nhận trong 03 ngày làm việc và Quyết định giải quyết hoàn thuế 06 ngày hoàn trước hoặc 10 ngày kiểm tra trước theo Điều 31 NĐ 252/2026). Đổi điện thoại không thấy tờ khai cũ trên app chỉ là vấn đề hiển thị/đồng bộ tài khoản hoặc bộ lọc thời gian, dữ liệu và nghĩa vụ thuế vẫn lưu trên hệ thống cơ quan thuế theo MST/số định danh. Tuyệt đối không cung cấp mật khẩu, mã OTP, mã PIN chữ ký số cho bất kỳ ai; khi chụp ảnh lỗi gửi hỗ trợ cần che thông tin nhạy cảm cá nhân và giữ rõ mã lỗi, thời gian, bước thao tác."
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
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.29. Vừa kinh doanh thông thường vừa cho thuê bất động sản: tách riêng ngưỡng và mức trừ\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- **Phần đã xác minh chắc chắn về GTGT/TNCN:** hoạt động **cho thuê bất động sản (BĐS)** được kê khai và tính thuế riêng, không nhập chung doanh thu với hoạt động kinh doanh khác để dùng một mức trừ duy nhất. Cục Thuế đã hướng dẫn rõ doanh thu cho thuê BĐS được kê khai, tính thuế riêng và mức doanh thu không chịu thuế/không phải nộp TNCN được trừ riêng cho nhóm BĐS và nhóm hoạt động kinh doanh khác. NĐ 141/2026 đã nâng mốc 500 triệu trong NĐ 68/2026 lên **1 tỷ đồng** từ 01/01/2026.\n- Vì vậy:\n  - nhóm bán hàng, dịch vụ, affiliate... áp dụng ngưỡng/mức trừ 1 tỷ theo quy định dành cho hoạt động kinh doanh thông thường; nếu có nhiều ngành trong nhóm này thì mức trừ 1 tỷ chỉ dùng **một lần trong chính nhóm đó** và phân bổ theo quy định;\n  - nhóm **cho thuê BĐS** có cơ chế riêng; tổng doanh thu các hợp đồng cho thuê BĐS được xét riêng trong nhóm BĐS và mốc 1 tỷ của nhóm này không được lấy sang bù cho bán hàng/affiliate, cũng không lấy mức trừ của bán hàng/affiliate sang bù cho BĐS.\n- **Ví dụ chuẩn để AI tránh gộp sai:** bán mỹ phẩm 780 triệu + affiliate 420 triệu + cho thuê căn hộ 360 triệu. Khi xét GTGT/TNCN, nhóm kinh doanh thông thường là **1,20 tỷ**, còn nhóm cho thuê BĐS là **360 triệu**. Không tạo một “rổ” 1,56 tỷ rồi phân bổ một mức trừ 1 tỷ cho cả ba hoạt động. Với BĐS 360 triệu/năm, phần cho thuê nằm dưới ngưỡng 1 tỷ của chính nhóm BĐS.\n- **Affiliate phải phân loại riêng trước khi tính:** không mặc định affiliate luôn có cùng một tỷ lệ; áp decision tree tại mục 16.20.\n- **Hóa đơn điện tử:** Điều 7 NĐ 254/2026 quy định HKD/CNKD có thu nhập từ **cho thuê BĐS thuộc trường hợp không phải sử dụng HĐĐT**. Tuy nhiên, ngoại lệ HĐĐT của BĐS **không được suy diễn** thành kết luận rằng doanh thu BĐS chắc chắn bị loại khỏi mọi phép xác định ngưỡng HĐĐT của các hoạt động khác.\n  - Nếu riêng các hoạt động kinh doanh không phải BĐS đã trên 1 tỷ (ví dụ 780 + 420 = 1,20 tỷ) thì nghĩa vụ HĐĐT của các hoạt động đó đã rõ theo quy định chung; phần cho thuê BĐS vẫn thuộc ngoại lệ riêng.\n  - Nếu các hoạt động không phải BĐS từ 1 tỷ trở xuống nhưng **chỉ khi cộng thêm BĐS mới vượt 1 tỷ**, nguồn chính thức công khai được rà soát đến V4.3 chưa giải thích trực tiếp cách xét ngưỡng HĐĐT trong tình huống hỗn hợp này. AI **không được tự chốt**; phải kiểm tra hướng dẫn hiện hành của cơ quan thuế cho đúng tình huống.\n- **Cấm suy luận sai:**\n  1. không lấy `bán hàng + affiliate + tiền thuê BĐS` rồi dùng một mức trừ 1 tỷ cho TNCN;\n  2. không tính GTGT tiền thuê BĐS dưới ngưỡng riêng bằng cách máy móc lấy toàn bộ doanh thu thuê × 5%;\n  3. không coi “BĐS không phải dùng HĐĐT” là miễn HĐĐT cho các hoạt động bán hàng/dịch vụ khác.\n- Nguồn:\n  - Cục Thuế hướng dẫn kê khai tách riêng BĐS và hoạt động khác: https://xaydungchinhsach.chinhphu.vn/huong-dan-ho-kinh-doanh-ke-khai-thue-khi-vua-cho-thue-bat-dong-san-vua-cho-thue-tai-san-119260323160131075.htm\n  - NĐ 141/2026/NĐ-CP nâng mốc tại Điều 3, Điều 4 NĐ 68/2026 từ 500 triệu lên 1 tỷ: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm\n  - Điều 7 NĐ 254/2026/NĐ-CP - trường hợp cho thuê BĐS không phải sử dụng HĐĐT: https://xaydungchinhsach.chinhphu.vn/truong-hop-nao-khong-phai-su-dung-hoa-don-dien-tu-119260716095423868.htm\n- Tách ngưỡng/mức trừ 1 tỷ ở đây không đồng nghĩa tách chủ thể hay ngưỡng 10 tỷ của NQ43. Ngưỡng NQ43 phải xét riêng theo doanh thu kinh doanh năm của cá nhân (16.39). Bài giải đáp cũ có cả số thuế suất/500 triệu của thời điểm công bố; chỉ dùng phần giải thích tách hoạt động, không chép các số cũ vào tính thuế hiện hành.\n"
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
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.37. “Doanh thu” phải xác định theo mục đích pháp lý: TNCN, GTGT và HĐĐT không được dùng chung máy móc\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Trước câu hỏi có thưởng/hỗ trợ/bồi thường/thu tài chính/thanh lý tài sản, AI phải lập **ba cột riêng**: `TNCN`, `GTGT`, `HĐĐT`.\n- **TNCN:** doanh thu có danh mục rộng theo Điều 5 NĐ 68/2026, bao gồm nhiều khoản thưởng, hỗ trợ, chiết khấu thanh toán và bồi thường liên quan kinh doanh.\n- **GTGT/HĐĐT cho khoản thu không liên quan bán hàng/cung cấp dịch vụ:** NĐ 254/2026 liệt kê các khoản thu như bồi thường bằng tiền, tiền thưởng, thu đòi người thứ ba của bảo hiểm, các khoản thu hộ và các khoản thu tài chính trong nhóm **không phải sử dụng HĐĐT** theo trường hợp được dẫn chiếu từ pháp luật GTGT. Điều này chứng minh không được lấy cách xử lý TNCN rồi áp nguyên xi cho GTGT/hóa đơn.\n- **Ngưỡng HĐĐT 1 tỷ:** NĐ 141/2026 hiện dùng câu chữ **“doanh thu năm trên 01 tỷ đồng”**, thay cho cách diễn đạt cũ trong NĐ 68 trước sửa đổi. Nếu chỉ các khoản “doanh thu khác”/thưởng/bồi thường làm tổng vượt ngưỡng, AI **không được tự chọn** doanh thu TNCN hoặc doanh thu GTGT làm mẫu số thay thế; phải kiểm tra hướng dẫn hiện hành cho đúng loại khoản thu.\n- Với bán tài sản phải đăng ký quyền sở hữu/quyền sử dụng, áp quy tắc riêng tại 16.36.\n- **Cấm kết luận:** “TNCN = 920 triệu, GTGT = 920 triệu nên HĐĐT cũng = 920 triệu” chỉ vì ba con số tình cờ giống nhau.\n- Nguồn:\n  - Doanh thu TNCN: https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm\n  - Khoản thu không liên quan bán hàng/cung cấp dịch vụ không phải sử dụng HĐĐT: https://xaydungchinhsach.chinhphu.vn/truong-hop-nao-khong-phai-su-dung-hoa-don-dien-tu-119260716095423868.htm\n  - NĐ 141/2026 về ngưỡng HĐĐT hiện hành: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm\n[BỒI THƯỜNG LIÊN QUAN KINH DOANH] Điều 5 NĐ68/2026: khoản bồi thường vi phạm hợp đồng và bồi thường khác liên quan hoạt động kinh doanh thuộc doanh thu xác định TNCN; không bỏ chỉ vì không phải tiền bán hàng. Xác minh bản chất/quyền hưởng, tránh cộng trùng khoản đã nằm trong tổng. Xử lý GTGT và hóa đơn của bồi thường bằng tiền là vấn đề riêng, không đồng nhất ba cơ sở. Nguồn Cục Thuế: https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm",
    "evidence_mode": "COMPLETE_RULE"
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
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.39. Nghị quyết 43/2026/QH16: giảm 30% số thuế TNCN phải nộp kỳ 2026–2027\n- **LEGAL_STATUS:** `VERIFIED` (đối chiếu toàn văn trên Cổng Chính phủ ngày 26/09/2026).\n- **Điều 1 khoản 1:** giảm 30% **số thuế thu nhập cá nhân phải nộp** của kỳ tính thuế năm 2026 và năm 2027 đối với thu nhập từ kinh doanh của cá nhân cư trú có mức doanh thu hằng năm của năm 2026, năm 2027 **không quá 10 tỷ đồng**.\n- Giảm trên **số thuế phải nộp**, không giảm doanh thu tính thuế, không giảm thuế suất. **Không áp dụng cho thuế GTGT.**\n- **Điều 2 khoản 1:** hiệu lực từ **24/8/2026**, áp dụng cho **kỳ tính thuế năm 2026, năm 2027** — tức cả năm 2026, không chỉ các tháng sau ngày hiệu lực.\n- **Điều 2 khoản 2:** Chính phủ quy định chi tiết → nguồn Chính phủ ngày 08/10/2026 vẫn yêu cầu hoàn thiện nghị định hướng dẫn. Đây là bằng chứng tại thời điểm nguồn công bố, không chứng minh chưa có văn bản mới vào mọi ngày sau đó. Trước khi hướng dẫn thủ tục phải kiểm tra văn bản đã ban hành; không dùng dự thảo làm luật hiện hành.\n- **ĐÃ XÁC MINH (chính sách):** HKD/CNKD cư trú có doanh thu năm không quá 10 tỷ được giảm 30% số TNCN phải nộp của năm 2026 và 2027.\n- **Thủ tục kê khai (PENDING):** xem danh sách PENDING duy nhất tại **16.78** (thay thế đoạn liệt kê chi tiết trước đây để giữ single source of truth). Cấm hướng dẫn người dùng điền mẫu/chỉ tiêu dựa trên dự thảo.\n- Nguồn: toàn văn NQ 43/2026/QH16 (Cổng Chính phủ): https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-43-2026-qh16-ve-giam-thue-thu-nhap-ca-nhan-thue-thu-nhap-doanh-nghiep-119260830184758301.htm\nDiễn giải đơn vị xét ngưỡng: quy định xét doanh thu hằng năm của cá nhân cư trú. Khi nhiều cửa hàng hoặc hoạt động thực sự thuộc cùng cá nhân, xét tổng doanh thu kinh doanh của cá nhân; sổ sách độc lập không biến mỗi hoạt động thành cá nhân khác. Không tự cộng doanh thu của các cá nhân độc lập chỉ vì cùng gia đình. Phải xác định chủ thể trước khi cộng; không cộng trùng tổng với các phần của tổng.\n[RANH GIỚI CHÍNH SÁCH] Khoản 1 Điều 1 xét quyền giảm một phần số TNCN phải nộp, khác với ngưỡng không phải nộp thuế và nghĩa vụ sử dụng hóa đơn. Tổng doanh thu dùng đối chiếu phải thuộc đúng cá nhân và đúng kỳ; số đúng trần thuộc điều kiện doanh thu, số lớn hơn trần không thuộc điều kiện này. Không làm tròn số tiền trước khi so sánh. Đạt tiêu chí doanh thu chưa xác nhận điều kiện cư trú hoặc loại thu nhập. Khi chưa biết người hỏi muốn xét chính sách nào, tổng doanh thu vẫn tính được, còn kết luận quyền lợi phải giữ giả định về chính sách. Đây là diễn giải phạm vi, không phải câu trả lời sẵn cho một tình huống. Nguồn: khoản 1 Điều 1 và khoản 1 Điều 2 Nghị quyết 43/2026/QH16; đã đối chiếu Cổng Chính phủ ngày 21/10/2026.\n[NQ43 — ĐỦ PHẠM VI]\nKhoản 1 Điều 1 Nghị quyết 43/2026/QH16: cá nhân cư trú có thu nhập từ kinh doanh, doanh thu hằng năm không quá 10 tỷ đồng được giảm 30% số TNCN phải nộp của từng kỳ năm 2026 và 2027. Đúng trần thuộc điều kiện doanh thu; trên trần không thuộc, không làm tròn trước so sánh. Giảm trên số thuế, không trên doanh thu/thuế suất, không áp GTGT. Tổng hợp kinh doanh cùng cá nhân, không cộng trùng tổng với chi tiết hay tự cộng người độc lập vì cùng gia đình.\nKhoản 1 Điều 2: hiệu lực 24/8/2026, áp dụng cả kỳ 2026 và 2027, không chỉ thời gian sau hiệu lực. Đạt doanh thu chưa tự xác nhận cư trú/loại thu nhập; sống tại Việt Nam chưa tự chứng minh cư trú thuế. Phương pháp và tỷ lệ ngành phải có nguồn riêng. Tính nghĩa vụ sau giảm trước rồi mới đối chiếu PIT đã thực nộp đúng người/kỳ/loại. Không lấy GTGT hoặc môn bài để tự trừ trực tiếp vào PIT; xử lý nộp thừa cần hồ sơ, không hứa hoàn tự động. Thủ tục cần văn bản hiệu lực, không lấy dự thảo làm luật.\nNguồn: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-43-2026-qh16-ve-giam-thue-thu-nhap-ca-nhan-thue-thu-nhap-doanh-nghiep-119260830184758301.htm ; đối chiếu khoản 1 Điều 8, Điều 11–12 NĐ68 về tổng hợp/nộp thay.",
    "retrieval_facets": {
      "policy_focus": [
        "PIT_RELIEF"
      ],
      "eligibility_topics": [
        "REVENUE_THRESHOLD",
        "REVENUE_OWNERSHIP"
      ],
      "topics": [
        "TAX_AMOUNT",
        "PLATFORM_WITHHOLDING"
      ],
      "tax_focuses": [
        "pit",
        "both",
        "unspecified"
      ],
      "intents": [
        "PLATFORM_WITHHOLDING"
      ]
    },
    "evidence_mode": "COMPLETE_RULE",
    "context_passage": "[NQ43 — ĐỦ PHẠM VI]\nKhoản 1 Điều 1 Nghị quyết 43/2026/QH16: cá nhân cư trú có thu nhập từ kinh doanh, doanh thu hằng năm không quá 10 tỷ đồng được giảm 30% số TNCN phải nộp của từng kỳ năm 2026 và 2027. Đúng trần thuộc điều kiện doanh thu; trên trần không thuộc, không làm tròn trước so sánh. Giảm trên số thuế, không trên doanh thu/thuế suất, không áp GTGT. Tổng hợp kinh doanh cùng cá nhân, không cộng trùng tổng với chi tiết hay tự cộng người độc lập vì cùng gia đình.\nKhoản 1 Điều 2: hiệu lực 24/8/2026, áp dụng cả kỳ 2026 và 2027, không chỉ thời gian sau hiệu lực. Đạt doanh thu chưa tự xác nhận cư trú/loại thu nhập; sống tại Việt Nam chưa tự chứng minh cư trú thuế. Phương pháp và tỷ lệ ngành phải có nguồn riêng. Tính nghĩa vụ sau giảm trước rồi mới đối chiếu PIT đã thực nộp đúng người/kỳ/loại. Không lấy GTGT hoặc môn bài để tự trừ trực tiếp vào PIT; xử lý nộp thừa cần hồ sơ, không hứa hoàn tự động. Thủ tục cần văn bản hiệu lực, không lấy dự thảo làm luật.\nNguồn: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-43-2026-qh16-ve-giam-thue-thu-nhap-ca-nhan-thue-thu-nhap-doanh-nghiep-119260830184758301.htm ; đối chiếu khoản 1 Điều 8, Điều 11–12 NĐ68 về tổng hợp/nộp thay.",
    "context_passage_period": {
      "applies_from_year": 2026,
      "applies_to_year": 2027
    }
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1047",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.40. Chỉ tiêu [14] Mẫu 01/CNKD (TT 50/2026): được CHỌN ngành/địa điểm áp mức trừ 1 tỷ theo phương án có lợi nhất",
    "ref_id": "16.40",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.40. Chỉ tiêu [14] Mẫu 01/CNKD (TT 50/2026): được CHỌN ngành/địa điểm áp mức trừ 1 tỷ theo phương án có lợi nhất\n- **LEGAL_STATUS:** `VERIFIED` (nguyên văn trong bản công bố thủ tục của Bộ Tài chính trên Cổng Chính phủ, kiểm chứng 26/09/2026).\n- Nguyên văn: *\"Đối với cá nhân kinh doanh nộp thuế thu nhập cá nhân trên doanh thu tính thuế có nhiều ngành, nghề kinh doanh áp dụng thuế suất thuế thu nhập cá nhân khác nhau, có nhiều địa điểm kinh doanh thì được lựa chọn một (01) ngành, nghề hoặc một (01) địa điểm kinh doanh để áp dụng mức trừ 01 tỷ đồng trước khi tính thuế thu nhập cá nhân theo phương án có lợi nhất. Trường hợp ngành, nghề, địa điểm kinh doanh được lựa chọn chưa trừ đủ 01 tỷ đồng, cá nhân được tiếp tục lựa chọn thêm ngành, nghề, địa điểm kinh doanh khác để tiếp tục được trừ cho đến khi đủ 01 tỷ đồng.\"*\n- **Cấm phân bổ pro-rata theo tỷ trọng doanh thu** khi văn bản không quy định cơ chế đó (xem guardrail G1).\n- **Hiệu lực TT 50/2026:** từ ngày ký ban hành **13/5/2026** (Cổng Chính phủ; đối chiếu 26/09/2026).\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/huong-dan-thu-tuc-khai-thue-doi-voi-ho-kinh-doanh-ca-nhan-kinh-doanh-119260530072620314.htm\n- [14] là số chỉ tiêu trong phiên bản mẫu được công bố theo TT 50. Không khẳng định mọi phiên bản biểu mẫu hiện hành đều dùng cùng số chỉ tiêu; kiểm đúng mẫu và phụ lục áp dụng cho kỳ kê khai, gồm TT 89/2026 và bản đính chính nếu thuộc phạm vi thay thế. Quy tắc chỉ được trừ tổng cộng 1 tỷ không biến thành nhiều mức trừ khi có nhiều địa điểm.\n\n[MỨC TRỪ TNCN THEO DOANH THU — NHIỀU NGÀNH/ĐỊA ĐIỂM]\nHướng dẫn chỉ tiêu [14] Mẫu 01/CNKD công bố theo TT50/2026/TT-BTC (hiệu lực 13/05/2026): cá nhân kinh doanh nộp TNCN trên doanh thu có nhiều ngành áp tỷ lệ khác nhau hoặc nhiều địa điểm được chọn một ngành hoặc địa điểm áp mức trừ 1 tỷ theo phương án có lợi nhất; chưa trừ đủ thì tiếp tục chọn ngành/địa điểm khác đến đủ tổng 1 tỷ. Không chia pro-rata theo tỷ trọng, không nhân số mức trừ theo địa điểm, không áp mức trừ này vào GTGT hay phương pháp thu nhập. Phải dùng tỷ lệ đúng hoạt động.\nSố [14] thuộc phiên bản mẫu được công bố theo TT50; kiểm mẫu hiện hành theo kỳ, gồm TT89 và đính chính nếu thay thế, không khẳng định mọi mẫu đều cùng số chỉ tiêu.\nNguồn: https://xaydungchinhsach.chinhphu.vn/huong-dan-thu-tuc-khai-thue-doi-voi-ho-kinh-doanh-ca-nhan-kinh-doanh-119260530072620314.htm",
    "retrieval_facets": {
      "topics": [
        "TAX_AMOUNT",
        "PLATFORM_WITHHOLDING"
      ],
      "tax_focuses": [
        "pit",
        "both",
        "unspecified"
      ],
      "intents": [
        "PLATFORM_WITHHOLDING"
      ]
    },
    "context_passage": "[MỨC TRỪ TNCN THEO DOANH THU — NHIỀU NGÀNH/ĐỊA ĐIỂM]\nHướng dẫn chỉ tiêu [14] Mẫu 01/CNKD công bố theo TT50/2026/TT-BTC (hiệu lực 13/05/2026): cá nhân kinh doanh nộp TNCN trên doanh thu có nhiều ngành áp tỷ lệ khác nhau hoặc nhiều địa điểm được chọn một ngành hoặc địa điểm áp mức trừ 1 tỷ theo phương án có lợi nhất; chưa trừ đủ thì tiếp tục chọn ngành/địa điểm khác đến đủ tổng 1 tỷ. Không chia pro-rata theo tỷ trọng, không nhân số mức trừ theo địa điểm, không áp mức trừ này vào GTGT hay phương pháp thu nhập. Phải dùng tỷ lệ đúng hoạt động.\nSố [14] thuộc phiên bản mẫu được công bố theo TT50; kiểm mẫu hiện hành theo kỳ, gồm TT89 và đính chính nếu thay thế, không khẳng định mọi mẫu đều cùng số chỉ tiêu.\nNguồn: https://xaydungchinhsach.chinhphu.vn/huong-dan-thu-tuc-khai-thue-doi-voi-ho-kinh-doanh-ca-nhan-kinh-doanh-119260530072620314.htm",
    "context_passage_period": {
      "applies_from_year": 2026,
      "applies_to_year": null
    }
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1048",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.41. HĐĐT bắt buộc khi doanh thu năm hiện tại >1 tỷ; doanh thu năm trước chỉ dùng xác định nhánh chuyển ngưỡng và thời",
    "ref_id": "16.41",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.41. HĐĐT bắt buộc khi doanh thu năm hiện tại >1 tỷ; doanh thu năm trước chỉ dùng xác định nhánh chuyển ngưỡng và thời hạn đăng ký 30 ngày (khoản 5 Điều 8 NĐ 68/2026, NĐ 141/2026 sửa đổi)\n- **LEGAL_STATUS:** `VERIFIED` (toàn văn sửa đổi trên Cổng Chính phủ, kiểm chứng 26/09/2026).\n- **Biểu mẫu đăng ký sử dụng HĐĐT hiện hành (từ 01/07/2026):** Hồ sơ đăng ký hoặc thay đổi thông tin sử dụng HĐĐT lập theo **Mẫu số 01/ĐKTĐ-HĐĐT tại Phụ lục III Thông tư 91/2026/TT-BTC** (hướng dẫn Nghị định 254/2026/NĐ-CP); chỉ được xuất hóa đơn sau khi cơ quan thuế gửi **Thông báo chấp nhận** (phân biệt với Thông báo tiếp nhận hồ sơ).\n- Nguyên văn: *\"Hộ kinh doanh, cá nhân kinh doanh mới ra kinh doanh tại Điều 9 Nghị định này hoặc hộ kinh doanh, cá nhân kinh doanh có doanh thu năm trước chưa trên 01 tỷ đồng (trừ trường hợp đã đăng ký sử dụng hóa đơn điện tử theo điểm b khoản này) nhưng trong năm tính thuế có doanh thu trên 01 tỷ đồng trở lên thì phải áp dụng hóa đơn điện tử có mã của cơ quan thuế, hóa đơn điện tử khởi tạo từ máy tính tiền có kết nối dữ liệu với cơ quan thuế. Hộ kinh doanh, cá nhân kinh doanh đăng ký sử dụng hóa đơn điện tử trong thời gian 30 ngày kể từ ngày cuối cùng của kỳ tính thuế có doanh thu lũy kế trên 01 tỷ đồng.\"*\n- Hai điều kiện cộng dồn của nhánh chuyển ngưỡng: (a) mới ra kinh doanh (Điều 9) **hoặc** doanh thu năm trước chưa trên 01 tỷ (trừ đã tự nguyện đăng ký); **và** (b) trong năm tính thuế doanh thu trên 01 tỷ trở lên. Doanh thu năm trước không cộng vào doanh thu năm nay nhưng là **điều kiện áp dụng trực tiếp**.\n- **Phạm vi dữ kiện:** quy định sử dụng doanh thu năm và doanh thu lũy kế của kỳ; một dự báo cả năm chưa chứng minh doanh thu thực tế đã vượt ngưỡng. Khi số thực tế đã đủ căn cứ, đối chiếu nghĩa vụ sử dụng hóa đơn; để xác định nhánh và thời điểm đăng ký phải kiểm tra thêm tình trạng hoạt động, năm trước và đăng ký tự nguyện theo đúng khoản 5. Không lấy số tiền mới thu được làm doanh thu ghi nhận nếu chưa đối chiếu bản chất giao dịch.\n- Mốc 30 ngày tính từ **ngày cuối cùng của kỳ tính thuế** có doanh thu lũy kế vượt ngưỡng — không phải từ ngày thực tế vượt; kỳ khai tháng/quý cho mốc khác nhau.\n- **Cảnh báo câu chữ:** nhánh chuyển ngưỡng dùng \"trên 01 tỷ đồng trở lên\", câu đầu khoản dùng \"trên 01 tỷ đồng\", diện tự nguyện là \"từ 01 tỷ đồng trở xuống\". Khi doanh thu chạm đúng 1 tỷ, phải đối chiếu nguyên văn và hỏi cán bộ thuế quản lý.\n- **Hiệu lực NĐ 141/2026:** từ **01/01/2026** (Công văn 3509/QNG-NVDTPC của Thuế tỉnh Quảng Ngãi; đối chiếu 26/09/2026).\n- **Guardrail chống chia năm 2026 (bổ sung 2026-10-06):** ngưỡng 1 tỷ áp dụng cho **cả năm 2026** — cấm diễn giải \"từ 29/04/2026 (ngày ban hành NĐ 141) mới áp 1 tỷ, quý 1/2026 vẫn 500 triệu\". NĐ 141/2026 quy định hiệu lực từ 01/01/2026.\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm\n[DỰ BÁO VÀ NGHĨA VỤ] Khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP sửa khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP không quy định cứ dự báo doanh thu vượt ngưỡng là đã bắt đầu thời hạn đăng ký thực tế. Có thể lập kế hoạch chuẩn bị theo giả định, nhưng kết luận nghĩa vụ và mốc hạn phải gắn đúng dữ kiện thực tế và nhánh áp dụng trong nguồn. Đây là giới hạn suy luận từ văn bản, không phải miễn nghĩa vụ cho người đã thuộc diện áp dụng. Nguồn toàn văn: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm ; đối chiếu ngày 21/10/2026.\n[NHIỀU ĐỊA ĐIỂM TRÊN HÓA ĐƠN] Khoản 5 Điều 8 NĐ68 được NĐ141/2026 sửa: nhiều địa điểm dùng chung mã số thuế của hộ/cá nhân kinh doanh cho các cửa hàng và phải ghi rõ mã địa điểm kinh doanh trên hóa đơn. Không tách chủ thể hoặc nhân ngưỡng miễn chỉ do nhiều cửa hàng. Nguồn: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm",
    "retrieval_facets": {
      "policy_focus": [
        "EINVOICE"
      ],
      "eligibility_topics": [
        "REVENUE_THRESHOLD",
        "REVENUE_OWNERSHIP"
      ]
    },
    "evidence_mode": "COMPLETE_RULE"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1049",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.42. Sàn khấu trừ/nộp thay: không nộp trùng giao dịch nhưng vẫn xét nghĩa vụ tổng hợp năm",
    "ref_id": "16.42",
    "tier": "VERIFIED",
    "text": "## 16.42. Sàn khấu trừ/nộp thay: không nộp trùng giao dịch nhưng vẫn xét nghĩa vụ tổng hợp năm\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Chỉ áp dụng cơ chế khấu trừ/khai/nộp thay khi nền tảng và giao dịch thuộc phạm vi pháp luật quy định; không phải mọi website, nền tảng hoặc bên trả hoa hồng đều nộp thay.\n- Giao dịch đã được sàn khấu trừ, khai, nộp thay đúng nghĩa vụ thì cá nhân không khai nộp trùng khoản thuế của giao dịch đó. Điều này không miễn thông báo doanh thu năm, tổng hợp ngưỡng hoặc quyết toán TNCN khi thuộc diện.\n- Doanh thu năm từ 1 tỷ trở xuống: thông báo doanh thu thực tế chậm nhất 31/01 năm sau. Phương pháp thu nhập có nghĩa vụ quyết toán năm; TNCN sàn đã nộp thay được trừ khi xác định số còn phải nộp, nộp thừa được xử lý theo quy định. Không trừ GTGT đã nộp vào TNCN.\n- Hàng hoàn/hủy phải đối soát việc nền tảng điều chỉnh/bù trừ số đã khấu trừ và hồ sơ giao dịch; không vừa giảm doanh thu hai lần vừa yêu cầu hoàn cùng khoản thuế.\n- Thời kỳ: NĐ 117/2025 dùng cho giai đoạn từ 01/07/2025 đến trước 01/07/2026; từ 01/07/2026 đối chiếu Điều 43 NĐ 252/2026. Phương pháp cả năm và chuyển phương pháp xem 16.56/16.57.\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/co-can-khai-bao-doanh-thu-khi-ban-hang-qua-shopee-grab-be-cac-san-da-khau-tru-thue-119260721055834808.htm ; https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-252-2026-nd-cp-huong-dan-thi-hanh-luat-quan-ly-thue-119260715155021635.htm\n\n[NỘP THAY VÀ ĐỐI TRỪ — ĐỦ PHẠM VI]\nKhoản 1 Điều 8, Điều 11–12 NĐ68/2026 đã sửa NĐ141; Điều 43 NĐ252/2026 từ 01/07/2026: nền tảng thuộc phạm vi có trách nhiệm khấu trừ/khai/nộp thay; không suy mọi bên trả đều như sàn. Giao dịch đã khai/nộp thay hợp lệ không nộp trùng, nhưng vẫn tổng hợp doanh thu năm, xét phương pháp và nghĩa vụ thông báo/quyết toán tương ứng. Thông báo doanh thu năm ở nhóm đến 1 tỷ có hạn 31/01 năm sau.\nKiểm loại thuế, chủ thể/MST, kỳ, chứng từ và trạng thái thực nộp/điều chỉnh; dòng tax hoặc tiền bị giữ chưa chứng minh đã nộp. Không lấy doanh thu trừ số đã nộp thay; tính nghĩa vụ đúng của từng sắc thuế, áp giảm đúng điều kiện rồi đối trừ cùng loại đúng người/kỳ, tránh chứng từ trùng. Không tự trừ GTGT vào PIT. Kết quả nộp thừa xử lý theo hồ sơ, không đồng nghĩa hoàn ngay; hoàn/hủy hàng cần đối soát điều chỉnh số sàn đã nộp, không giảm hai lần.\nNguồn: https://xaydungchinhsach.chinhphu.vn/co-can-khai-bao-doanh-thu-khi-ban-hang-qua-shopee-grab-be-cac-san-da-khau-tru-thue-119260721055834808.htm ; https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-252-2026-nd-cp-huong-dan-thi-hanh-luat-quan-ly-thue-119260715155021635.htm",
    "retrieval_facets": {
      "topics": [
        "PLATFORM_WITHHOLDING",
        "TAX_PAYMENT_RECONCILIATION"
      ],
      "intents": [
        "PLATFORM_WITHHOLDING"
      ]
    },
    "context_passage": "[NỘP THAY VÀ ĐỐI TRỪ — ĐỦ PHẠM VI]\nKhoản 1 Điều 8, Điều 11–12 NĐ68/2026 đã sửa NĐ141; Điều 43 NĐ252/2026 từ 01/07/2026: nền tảng thuộc phạm vi có trách nhiệm khấu trừ/khai/nộp thay; không suy mọi bên trả đều như sàn. Giao dịch đã khai/nộp thay hợp lệ không nộp trùng, nhưng vẫn tổng hợp doanh thu năm, xét phương pháp và nghĩa vụ thông báo/quyết toán tương ứng. Thông báo doanh thu năm ở nhóm đến 1 tỷ có hạn 31/01 năm sau.\nKiểm loại thuế, chủ thể/MST, kỳ, chứng từ và trạng thái thực nộp/điều chỉnh; dòng tax hoặc tiền bị giữ chưa chứng minh đã nộp. Không lấy doanh thu trừ số đã nộp thay; tính nghĩa vụ đúng của từng sắc thuế, áp giảm đúng điều kiện rồi đối trừ cùng loại đúng người/kỳ, tránh chứng từ trùng. Không tự trừ GTGT vào PIT. Kết quả nộp thừa xử lý theo hồ sơ, không đồng nghĩa hoàn ngay; hoàn/hủy hàng cần đối soát điều chỉnh số sàn đã nộp, không giảm hai lần.\nNguồn: https://xaydungchinhsach.chinhphu.vn/co-can-khai-bao-doanh-thu-khi-ban-hang-qua-shopee-grab-be-cac-san-da-khau-tru-thue-119260721055834808.htm ; https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-252-2026-nd-cp-huong-dan-thi-hanh-luat-quan-ly-thue-119260715155021635.htm",
    "context_passage_period": {
      "applies_from_year": 2026,
      "applies_to_year": null
    }
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
    "section": "16.46. Ví dụ phân bổ mức trừ, giảm TNCN và đối chiếu sàn đã nộp thay",
    "ref_id": "16.46",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "## 16.46. Ví dụ phân bổ mức trừ, giảm TNCN và đối chiếu sàn đã nộp thay\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — ví dụ tính toán có giả định, không phải quy định pháp luật độc lập.\n- Giả định cá nhân cư trú năm 2026 đủ điều kiện phương pháp TNCN theo doanh thu và giảm NQ43; doanh thu hợp lệ 1.180 triệu gồm bán hàng 1.010 triệu và sửa chữa 170 triệu. Trong tổng có 130 triệu qua sàn, không cộng lại lần nữa. Giả định nhóm sửa chữa có tỷ lệ TNCN cao hơn bán hàng.\n- Trừ 170 triệu ở sửa chữa trước và 830 triệu ở bán hàng: doanh thu tính TNCN còn 180 triệu bán hàng. TNCN trước giảm = 180 triệu × 0,5% = 900.000 đồng.\n- Nếu đủ điều kiện NQ43 (cư trú, thu nhập kinh doanh, kỳ 2026–2027, doanh thu cá nhân không quá 10 tỷ): nghĩa vụ sau giảm = 900.000 × 70% = 630.000 đồng. Sau đó mới đối chiếu/trừ TNCN thực tế đã nộp thay có chứng từ hợp lệ, không lấy 70% của phần còn thiếu sau đối trừ.\n- Chưa biết số TNCN sàn thực nộp thay nên chưa chốt số còn nộp hoặc hoàn; không đồng nhất 130 triệu doanh thu với tiền thuế. Thủ tục theo đúng phương pháp và văn bản hiện hành, không tự điền mẫu dự thảo.\n- GTGT tính riêng trên doanh thu thuộc diện chịu thuế; không trừ 1 tỷ. Nếu đủ điều kiện giảm tỷ lệ GTGT theo NQ204/NĐ174 thì còn phải tính bước giảm này, không dùng NQ43 để giảm GTGT.\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/co-can-khai-bao-doanh-thu-khi-ban-hang-qua-shopee-grab-be-cac-san-da-khau-tru-thue-119260721055834808.htm ; chính sách và cơ sở xem 16.39, 16.40, 16.44, 16.48, 16.50.\n"
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
    "text": "## 16.50. Giảm GTGT theo NQ204/NĐ174: đúng phương pháp, đối tượng và giai đoạn\n[PHẠM VI] Nghị định 174/2025/NĐ-CP thực hiện Nghị quyết 204/2025/QH15 trong giai đoạn 01/07/2025–31/12/2026. Xét hàng hóa/dịch vụ thực tế và nhóm loại trừ tại khoản 1 Điều 1, Phụ lục I, II; tên ngành chung chưa đủ xác nhận.\n[PHƯƠNG PHÁP] Khoản 2 Điều 1 NĐ174 phân biệt: khấu trừ áp thuế suất 8% cho đối tượng đủ điều kiện; trực tiếp trên doanh thu giảm 20% mức tỷ lệ. Thuế suất 5% trên hóa đơn không đồng nghĩa tỷ lệ trực tiếp 5%.\n[TÍNH TRỰC TIẾP] Đã xác nhận đủ điều kiện: tỷ lệ sau giảm = tỷ lệ gốc × 80%; 1% thành 0,8%, 5% thành 4%, không phải trừ 20 điểm phần trăm hoặc mặc định trừ 2 điểm. GTGT = doanh thu chịu thuế từng nhóm × tỷ lệ tương ứng.\n[NGOẠI LỆ] Không áp giảm cho nhóm bị loại trừ; không biến thuế suất 5% hoặc không chịu thuế thành diện được giảm. Có cả nhóm được và không được giảm thì tách doanh thu; thiếu phân bổ thì chưa chốt số cuối.\n[DỮ KIỆN] Cần thời điểm, phương pháp, tỷ lệ gốc, loại hàng/dịch vụ và cơ sở tính thuế. Người dùng đã giả định rõ đủ điều kiện thì tính theo giả định, ghi điều kiện ngắn gọn; không hỏi lại điều đã được xác nhận.\n[PHÂN BIỆT] NQ43 không giảm GTGT; phần trừ TNCN không khấu trừ khỏi cơ sở GTGT. Trình tự hóa đơn theo khoản 3 Điều 1 NĐ174; không suy nghĩa vụ hóa đơn từ phép tính đơn thuần.\nNguồn đối chiếu ngày 16/10/2026:\n- https://baochinhphu.vn/giam-thue-gia-tri-gia-tang-tu-01-7-2025-den-het-31-12-2026-10225070118590677.htm",
    "retrieval_facets": {
      "policy_focus": [
        "VAT_RELIEF"
      ]
    }
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1059",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.51. Biểu mẫu HKD và hoàn nộp thừa: xác định đúng phương pháp, kỳ và thủ tục",
    "ref_id": "16.51",
    "tier": "VERIFIED",
    "text": "## 16.51. Biểu mẫu HKD và hoàn nộp thừa: xác định đúng phương pháp, kỳ và thủ tục\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — mẫu và thủ tục phải kiểm theo kỳ hồ sơ.\n- Thông báo doanh thu thực tế dùng 01/TKN-CNKD. Nguồn Cục Thuế tháng 7/2026 xác nhận mẫu quyết toán TNCN theo phương pháp thu nhập là **02/QTT-TNCN-CNKD** kèm TT 89/2026; không viết 02/CNKD-TNCN-QTT. Không lấy mẫu thông báo doanh thu thay mọi hồ sơ khai/hoàn.\n- Chuỗi phiên bản 01/TKN-CNKD từng qua TT 18 → TT 50 → TT 89; dùng mẫu đúng kỳ và kiểm quy định chuyển tiếp, bản đính chính. Chưa đọc đúng phụ lục thì không tự chốt mã chỉ tiêu đề nghị hoàn.\n- Khoản 2 Điều 29 NĐ 252 bao gồm hoàn nộp thừa của HKD/CNKD theo Điều 12 NĐ 68 đã sửa bởi NĐ 141. Khoản 4 Điều 29: số nộp thừa cả năm trên hồ sơ khai/quyết toán từ 50.000 đồng trở xuống được bù trừ kỳ sau, không hoàn trả riêng theo nhánh này.\n- **Khoản 1 Điều 31 NĐ 252:** thông báo tiếp nhận/không tiếp nhận trong 03 ngày làm việc từ khi nhận hồ sơ. Nếu hồ sơ hoàn đồng thời là hồ sơ khai thuế, thông báo tiếp nhận hồ sơ khai cũng là thông báo tiếp nhận hồ sơ hoàn.\n- **Khoản 2 Điều 31:** hoàn trước: chậm nhất 06 ngày làm việc từ thông báo tiếp nhận; kiểm tra trước hoàn: chậm nhất 10 ngày làm việc từ ngày ban hành kết luận hoặc quyết định xử lý vi phạm sau kiểm tra tại trụ sở. Không tính thời gian người nộp thuế giải trình/bổ sung theo yêu cầu; không hứa toàn bộ kiểm tra hoàn tất trong 10 ngày kể từ nộp hồ sơ.\n- Không dùng mốc 40 ngày của Điều 75 Luật 38/2019 như thời hạn hiện hành mặc định sau 01/07/2026. Không đồng nhất tiếp nhận, chấp nhận hoàn và tiền đã về tài khoản.\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/co-can-khai-bao-doanh-thu-khi-ban-hang-qua-shopee-grab-be-cac-san-da-khau-tru-thue-119260721055834808.htm ; https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-252-2026-nd-cp-huong-dan-thi-hanh-luat-quan-ly-thue-119260715155021635.htm ; bản PDF trong public/documents/ND-252-2026-ND-CP.pdf, Điều 29–31, trang 57–60.\n"
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1060",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.52. Chọn sổ kế toán 2026: S1a/S2a/S2b–S2e theo trạng thái và phương pháp thuế; không bắt buộc mua “sổ in sẵn” — VERIF",
    "ref_id": "16.52",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.52. Chọn sổ kế toán 2026: S1a/S2a/S2b–S2e theo trạng thái và phương pháp thuế; không bắt buộc mua “sổ in sẵn” — VERIFIED\n- **LEGAL_STATUS:** `VERIFIED` (Thông tư 152/2025/TT-BTC, nguồn hướng dẫn chính thức Bộ Tài chính, kiểm chứng 27/09/2026).\n- **Tổng số mẫu sổ kế toán HKD năm 2026 (từ S1a-HKD đến S2e-HKD):** Theo Điều 4, Điều 5 và Điều 6 Thông tư 152/2025/TT-BTC, hệ thống sổ kế toán gồm **tổng cộng 6 mẫu sổ thuộc 3 nhánh** nghĩa vụ thuế (không bắt buộc mọi hộ kinh doanh dùng cả 6 sổ mà chọn theo nhánh tương ứng).\n- **Quy tắc chọn sổ:**\n  1. HKD/CNKD thuộc đối tượng **không chịu thuế GTGT, không phải nộp thuế TNCN** → dùng **Sổ doanh thu bán hàng hóa, dịch vụ mẫu S1a-HKD**.\n  2. HKD/CNKD nộp **GTGT và TNCN theo tỷ lệ % trên doanh thu** → dùng **S2a-HKD** để ghi doanh thu theo nhóm ngành có cùng tỷ lệ/mức thuế suất.\n  3. HKD/CNKD nộp GTGT theo tỷ lệ % doanh thu và TNCN theo **thu nhập tính thuế** → dùng bộ sổ **S2b-HKD (doanh thu), S2c-HKD (doanh thu/chi phí), S2d-HKD (vật liệu/dụng cụ/sản phẩm/hàng hóa), S2e-HKD (tiền)** theo hướng dẫn.\n  4. Có thuế đặc thù khác thì mở thêm sổ theo dõi nghĩa vụ thuế khác theo Thông tư.\n- **Guardrail:** không chọn sổ chỉ bằng câu “doanh thu dưới 1 tỷ”. Năm 2026, ngưỡng 1 tỷ thường giúp xác định nhóm không chịu GTGT/không phải nộp TNCN đối với hoạt động kinh doanh thông thường, nhưng AI vẫn phải xác nhận **trạng thái/phương pháp thuế** trước khi chốt mẫu sổ nếu case có ngoại lệ hoặc đang trong chuyển tiếp.\n- **Vở thường có dùng được không?** Pháp luật cho phép lưu sổ bằng **bản giấy hoặc điện tử**, đồng thời cho phép bổ sung/sửa đổi biểu mẫu sổ cho phù hợp. Vì vậy không có yêu cầu phải mua một cuốn sổ in sẵn tại nhà sách. Một cuốn vở giấy chỉ nên dùng khi được lập thành sổ với nội dung/cột cần thiết và thông tin nhận diện theo quy định; ghi tự do không theo cấu trúc mẫu không phải cách an toàn.\n- **Mẫu trả lời ngắn:** “Nếu bạn thuộc nhóm không chịu GTGT/không phải nộp TNCN thì dùng S1a-HKD. Không bắt buộc mua sổ in sẵn; có thể in mẫu, làm Excel hoặc lập sổ giấy có đủ nội dung theo mẫu.”\n- Nguồn chính thức Bộ Tài chính: https://www.mof.gov.vn/bo-tai-chinh/thong-tin-tham-dinh-gia/huong-dan-ke-toan-cho-ho-va-ca-nhan-kinh-doanh-tu-nam-2026\n- Nguồn Cổng Chính phủ: https://xaydungchinhsach.chinhphu.vn/huong-dan-ke-toan-cho-ho-kinh-doanh-ca-nhan-kinh-doanh-khong-chiu-thue-gtgt-khong-phai-nop-thue-tncn-11926011214502446.htm\n- Điều 8 TT 152: hiệu lực 01/01/2026 và TT 88/2021 hết hiệu lực từ ngày đó; không tạo nhóm tiếp tục dùng TT 88 chỉ vì chọn phương pháp kê khai. Điều 3: tài liệu kế toán lưu tối thiểu **05 năm**; riêng thời hạn lưu hóa đơn theo pháp luật thuế. Đây là nghĩa vụ lưu trữ, không chỉ khuyến nghị. Nguồn gốc: https://xaydungchinhsach.chinhphu.vn/toan-van-thong-tu-152-2025-tt-bt-huong-dan-ke-toan-cho-cac-ho-kinh-doanh-ca-nhan-kinh-doanh-119260112105136458.htm\n"
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
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.54. Kỳ 2022–2025: ngưỡng 100 triệu/năm; trường hợp lịch sử không trọn năm phải xác định đúng phương pháp trước khi “quy đổi 12 tháng” — VERIFIED_CONDITIONAL\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Với kỳ **2022–2025**, quy tắc chung theo TT 40/2021/TT-BTC là hộ/cá nhân kinh doanh có doanh thu trong năm dương lịch **từ 100 triệu đồng trở xuống** thuộc trường hợp không phải nộp GTGT và TNCN từ kinh doanh. Không lấy ngưỡng 1 tỷ của năm 2026 trả lời ngược.\n- **Nếu kinh doanh đủ 12 tháng:** xét tổng doanh thu của năm theo ngưỡng 100 triệu. Ví dụ năm 2023 tổng doanh thu 80 triệu → dưới ngưỡng.\n- **Nếu không trọn năm:** không được tự áp một công thức cho mọi trường hợp. TT 40 bản gốc (khoản 3 Điều 7, áp dụng 01/08/2021–31/12/2021) quy định việc quy đổi doanh thu tương ứng 12 tháng đối với **hộ khoán kinh doanh không trọn năm**; doanh thu thực tế dùng tính số thuế là doanh thu của số tháng thực tế kinh doanh. Ví dụ chính thức trong TT 40: bắt đầu kinh doanh, 9 tháng dự kiến 90 triệu (10 triệu/tháng) → quy đổi 12 tháng = 120 triệu nên thuộc diện phải nộp thuế trên doanh thu thực tế 90 triệu. **Lưu ý thời gian:** từ 01/01/2022, TT 100/2021/TT-BTC đã sửa khoản 3 Điều 7 TT 40 — hộ khoán mới ra kinh doanh trong năm xét theo doanh thu kinh doanh thực tế trong năm so với 100 triệu, không quy đổi 12 tháng nữa. Chi tiết tại 16.60.\n- Hoạt động **cho thuê tài sản** không đủ 12 tháng cũng có quy tắc 12 tháng riêng trong TT 40 bản gốc (điểm c khoản 1 Điều 9); từ 01/01/2022, TT 100/2021 sửa điểm này: xét theo doanh thu cho thuê thực tế phát sinh trong năm so với 100 triệu (trường hợp trả trước nhiều năm thì phân bổ theo năm dương lịch).\n- **Guardrail:** trước khi annualize một case lịch sử, phải biết người hỏi thuộc hộ khoán/cho thuê tài sản hay cơ chế khác; không mang logic annualize lịch sử sang năm 2026.\n- Nguồn chính thức Cục Thuế — TT 40/2021/TT-BTC và ví dụ không trọn năm: https://binhduong.gdt.gov.vn/wps/portal/home/documents/detail?1dmy=&current=true&urile=wcm%3Apath%3AGDT+Content%2Fsa_gdt%2Fcctthc%2Ftthchh%2Fsa_tthc_vanban%2Fsa_tthc_vb_vbqd%2Fbad3a9ff-6e52-4bb5-a14b-293ae4d44026\nCăn cứ tính số thuế: Điều 10 Thông tư 40/2021/TT-BTC quy định doanh thu tính thuế, tỷ lệ và công thức; khoản 2 dẫn Phụ lục I theo ngành nghề. Không dùng Điều 8 (nộp thay) hoặc Điều 9 (trường hợp đặc thù) làm căn cứ chung cho phép tính bán hàng thông thường khi không có tình tiết tương ứng. Nguồn: https://chinhsachonline.chinhphu.vn/kinh-doanh-thuong-mai-dien-tu-xac-dinh-doanh-thu-tinh-thue-the-nao-79191.htm ; https://portal.mof.gov.vn/hoidapcstc/home/cthoidap/152386\n[TỶ LỆ HÀNG HÓA LỊCH SỬ] Khoản 2 Điều 4, Điều 10 và mục 1 Phụ lục I Thông tư 40/2021/TT-BTC: với hoạt động phân phối, cung cấp hàng hóa chịu thuế theo tỷ lệ trên doanh thu, tỷ lệ gốc GTGT 1%, TNCN 0,5%. Doanh thu năm vượt 100 triệu thì tính trên toàn bộ doanh thu chịu thuế, không chỉ phần vượt 100 triệu; tiền lãi/chi phí không thay cơ sở này. Xét riêng điều kiện giảm GTGT của từng giai đoạn; các tỷ lệ gốc không tự chứng minh hàng được giảm. Phải đối trừ số đã nộp/đã được nộp thay có chứng từ phù hợp, không coi đây là nghĩa vụ nộp thêm. Nguồn gốc: https://congbao.chinhphu.vn/van-ban/thong-tu-so-40-2021-tt-btc-33850/36037.htm ; bản tại public/documents/TT-40-2021-TT-BTC.pdf. Kỳ nghĩa vụ quyết định quy tắc, không lấy năm hiện tại lúc hỏi thay năm doanh thu.\n[THỜI ĐIỂM DOANH THU LỊCH SỬ] Khoản 1 Điều 10 TT40/2021/TT-BTC xác định doanh thu tính thuế từ tiền bán hàng, gia công, hoa hồng, cung ứng dịch vụ phát sinh trong kỳ, không phân biệt đã thu được tiền hay chưa. Không tự chuyển doanh thu giao dịch đã phát sinh sang năm nhận tiền; đối chiếu thời điểm giao hàng/hoàn thành dịch vụ và hồ sơ thực tế của kỳ đó. Không viện NĐ68/2026 như căn cứ trực tiếp cho doanh thu kỳ 2025. Nguồn: https://congbao.chinhphu.vn/van-ban/thong-tu-so-40-2021-tt-btc-33850/36037.htm",
    "evidence_mode": "COMPLETE_RULE",
    "retrieval_facets": {
      "topics": [
        "REVENUE_TIMING"
      ]
    }
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
    "text": "## 16.56. Phương pháp TNCN theo dải doanh thu và ngoại lệ chuyển từ năm tiếp theo\n[CĂN CỨ] Điều 7 Luật Thuế thu nhập cá nhân 109/2025/QH15; khoản 5 Điều 4 Nghị định 68/2026/NĐ-CP, cập nhật ngưỡng theo Nghị định 141/2026/NĐ-CP.\n[PHẠM VI] Cá nhân kinh doanh thông thường theo Điều 7 Luật 109/2025/QH15, Điều 4 NĐ68/2026 đã sửa bởi NĐ141/2026. Không áp bảng này máy móc cho tiền lương hoặc cho thuê bất động sản có quy tắc riêng.\n[DẢI DOANH THU] Sau cập nhật ngưỡng NĐ141: trên 1 tỷ đến đúng 3 tỷ thuộc dải lựa chọn tỷ lệ doanh thu hoặc thu nhập tính thuế ×15%; trên 3 tỷ đến đúng 50 tỷ là dải thu nhập tính thuế ×17%; trên 50 tỷ là ×20%. Đây là thuế suất trên thu nhập tính thuế, không nhân trực tiếp với doanh thu.\n[CHUYỂN TIẾP] Điểm d khoản 5 Điều 4 NĐ68: trường hợp đang áp dụng tỷ lệ doanh thu ở dải được lựa chọn, cuối năm mới xác định thực tế vượt 3 tỷ thì chuyển phương pháp thu nhập từ năm tiếp theo. Không chỉ thấy tổng cuối năm >3 tỷ rồi hồi tố 17% cho năm đó.\n[ỔN ĐỊNH] Phương pháp thu nhập thuộc trường hợp quy định được áp dụng ổn định 2 năm liên tục. Cần biết phương pháp đang áp dụng và năm bắt đầu; doanh thu giảm không tự chứng minh được đổi phương pháp ngay.\n[DỮ KIỆN] Nếu chỉ nêu doanh thu vượt 3 tỷ mà chưa rõ phương pháp đang áp dụng hoặc tình huống vượt cuối năm, trình bày nhánh phù hợp/hỏi thêm. Thiếu thu nhập tính thuế hợp lệ thì không suy số thuế từ chi phí ước lượng, tiền còn lại hay số dư.\n[RANH GIỚI] Bảo toàn đến đồng, không làm tròn qua 3 tỷ hoặc 50 tỷ. Giảm NQ43 là bước riêng, không quyết định phương pháp.\nNguồn đối chiếu ngày 16/10/2026:\n- https://xaydungchinhsach.chinhphu.vn/quy-dinh-thue-thu-nhap-ca-nhan-doi-voi-thu-nhap-tu-kinh-doanh-119260327063731539.htm\n- https://xaydungchinhsach.chinhphu.vn/phuong-phap-tinh-thue-voi-ca-nhan-kinh-doanh-ho-kinh-doanh-119260309100708724.htm\n- https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-du-kien-dau-nam-doanh-thu-duoi-3-ty-dong-cuoi-nam-vuot-3-ty-dong-ap-dung-phuong-phap-tinh-thue-tncn-nao-119260722111045417.htm\n- https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm\n[PHƯƠNG PHÁP TNCN — ĐỦ PHẠM VI]\nĐiều 7 Luật Thuế TNCN 109/2025/QH15; Điều 4 khoản 5 Nghị định 68/2026/NĐ-CP, cập nhật Nghị định 141/2026/NĐ-CP: kinh doanh thông thường của cá nhân cư trú, doanh thu trên 1 tỷ đến đúng 3 tỷ được chọn tỷ lệ doanh thu hoặc thu nhập tính thuế ×15%; trên 3 tỷ đến đúng 50 tỷ dùng thu nhập ×17%; trên 50 tỷ ×20%. Không nhân các mức 15%/17%/20% vào doanh thu. Không áp máy móc cho lương/cho thuê BĐS có quy tắc riêng.\nĐiểm d khoản 5 Điều 4: đang áp hợp pháp tỷ lệ trong dải được chọn, cuối năm mới vượt 3 tỷ thì chuyển thu nhập từ năm tiếp theo, không hồi tố 17% năm vượt. Phương pháp thu nhập thuộc trường hợp quy định ổn định 2 năm; giảm doanh thu không tự cho đổi ngay. Cần phương pháp hiện tại/năm bắt đầu; chưa biết thì tính các nhánh có điều kiện, không ép một số duy nhất. Chưa biết ngành thì không gán nhóm hàng hóa từ nhãn tổng quát; thiếu chi phí chỉ ngăn chốt nhánh thu nhập, không ngăn tính nhánh tỷ lệ đủ dữ kiện.\nNguồn: https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-du-kien-dau-nam-doanh-thu-duoi-3-ty-dong-cuoi-nam-vuot-3-ty-dong-ap-dung-phuong-phap-tinh-thue-tncn-nao-119260722111045417.htm",
    "retrieval_facets": {
      "topics": [
        "TAX_AMOUNT",
        "BUSINESS_EXPENSES",
        "PLATFORM_WITHHOLDING"
      ],
      "tax_focuses": [
        "pit",
        "both",
        "unspecified"
      ],
      "intents": [
        "PLATFORM_WITHHOLDING"
      ]
    },
    "context_passage": "[PHƯƠNG PHÁP TNCN — ĐỦ PHẠM VI]\nĐiều 7 Luật Thuế TNCN 109/2025/QH15; Điều 4 khoản 5 Nghị định 68/2026/NĐ-CP, cập nhật Nghị định 141/2026/NĐ-CP: kinh doanh thông thường của cá nhân cư trú, doanh thu trên 1 tỷ đến đúng 3 tỷ được chọn tỷ lệ doanh thu hoặc thu nhập tính thuế ×15%; trên 3 tỷ đến đúng 50 tỷ dùng thu nhập ×17%; trên 50 tỷ ×20%. Không nhân các mức 15%/17%/20% vào doanh thu. Không áp máy móc cho lương/cho thuê BĐS có quy tắc riêng.\nĐiểm d khoản 5 Điều 4: đang áp hợp pháp tỷ lệ trong dải được chọn, cuối năm mới vượt 3 tỷ thì chuyển thu nhập từ năm tiếp theo, không hồi tố 17% năm vượt. Phương pháp thu nhập thuộc trường hợp quy định ổn định 2 năm; giảm doanh thu không tự cho đổi ngay. Cần phương pháp hiện tại/năm bắt đầu; chưa biết thì tính các nhánh có điều kiện, không ép một số duy nhất. Chưa biết ngành thì không gán nhóm hàng hóa từ nhãn tổng quát; thiếu chi phí chỉ ngăn chốt nhánh thu nhập, không ngăn tính nhánh tỷ lệ đủ dữ kiện.\nNguồn: https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-du-kien-dau-nam-doanh-thu-duoi-3-ty-dong-cuoi-nam-vuot-3-ty-dong-ap-dung-phuong-phap-tinh-thue-tncn-nao-119260722111045417.htm",
    "context_passage_period": {
      "applies_from_year": 2026,
      "applies_to_year": null
    }
  },
  {
    "id": "KB/16-kien-thuc-da-xac-minh-v5.1.md#1065",
    "file": "KB/16-kien-thuc-da-xac-minh-v5.1.md",
    "section": "16.57. Sàn đã khấu trừ theo giao dịch nhưng doanh thu năm >3 tỷ: vẫn quyết toán TNCN theo phương pháp thu nhập; số sàn n",
    "ref_id": "16.57",
    "tier": "VERIFIED",
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.57. Sàn đã khấu trừ theo giao dịch nhưng doanh thu năm >3 tỷ: vẫn quyết toán TNCN theo phương pháp thu nhập; số sàn nộp thay được đối trừ; phí sàn/quảng cáo có thể là chi phí được trừ nếu đủ điều kiện — VERIFIED\n- **LEGAL_STATUS:** `VERIFIED`.\n- Khấu trừ/nộp thay của nền tảng theo từng giao dịch là cơ chế thực hiện nghĩa vụ tại nguồn; **không làm thay đổi phương pháp TNCN phải áp dụng cho cả năm**.\n- Nếu doanh thu năm **trên 3 tỷ đến 50 tỷ**, HKD/CNKD bắt buộc tính TNCN theo `thu nhập tính thuế × 17%` và khai quyết toán TNCN năm. Số TNCN nền tảng đã khấu trừ/nộp thay **được trừ** khi xác định số còn phải nộp theo quyết toán.\n- Với doanh thu >3 tỷ, **phí sàn và phí quảng cáo** có thể là chi phí được trừ nếu thực tế liên quan hoạt động kinh doanh và đáp ứng điều kiện hóa đơn/chứng từ, thanh toán theo Điều 6 NĐ 68/2026. Không tự trừ các khoản này khỏi doanh thu nếu đang ở phương pháp `% × doanh thu`.\n- GTGT vẫn xử lý theo cơ chế riêng; không lấy việc quyết toán TNCN 17% để suy rằng GTGT cũng tính trên lợi nhuận.\n- Nguồn:\n  - Cục Thuế trả lời case sàn >3 tỷ và quyết toán/đối trừ: https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-tren-san-thuong-mai-dien-tu-co-doanh-thu-tren-3-50-ty-dong-nam-cuoi-nam-co-phai-quyet-toan-thue-tncn-theo-loi-nhuan-11926072106422835.htm\n  - Phí sàn/quảng cáo được trừ nếu đủ điều kiện: https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-qua-thuong-mai-dien-tu-co-doanh-thu-tren-3-ti-dong-phi-san-va-phi-quang-cao-co-duoc-tru-khi-tinh-thue-tncn-119260722171402469.htm\n- Phải kiểm phương pháp đang áp dụng và thời điểm chuyển. Trường hợp đầu năm thuộc nhóm trên 1 đến 3 tỷ, đang tính theo doanh thu và cuối năm thực tế vượt 3 tỷ: hướng dẫn Cục Thuế cho chuyển phương pháp từ **năm tiếp theo** (16.56); không tự hồi tố 17% chỉ từ số cuối năm. Khi đã thuộc phương pháp thu nhập của năm đang hỏi thì thực hiện quyết toán như trên. Nguồn: https://xaydungchinhsach.chinhphu.vn/ho-kinh-doanh-du-kien-dau-nam-doanh-thu-duoi-3-ty-dong-cuoi-nam-vuot-3-ty-dong-ap-dung-phuong-phap-tinh-thue-tncn-nao-119260722111045417.htm\n"
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
    "text": "16 — KIẾN THỨC ĐÃ XÁC MINH V5.1 (lớp canonical cho AI)\n## 16.60. Temporal canonical: ngưỡng GTGT/TNCN của hộ/cá nhân kinh doanh theo từng kỳ 2021–2026 — VERIFIED_HISTORICAL + VERIFIED_CURRENT\n- **LEGAL_STATUS:** `VERIFIED_HISTORICAL` cho 2021–2025; `VERIFIED_CURRENT` cho 2026 (tại ngày 27/09/2026).\n- Bảng thời gian tối thiểu khi trả lời câu hỏi có nhiều năm:\n  - **2021:** 100 triệu đồng/năm trở xuống (TT 92 trước 01/08/2021 và TT 40 từ 01/08/2021; có quy định chuyển tiếp — xem 16.62).\n  - **2022–2025:** 100 triệu đồng/năm trở xuống. Không áp mức 200 triệu của Luật GTGT 2024 cho năm 2025.\n  - **2026:** 01 tỷ đồng/năm trở xuống (NĐ 141/2026/NĐ-CP sửa NĐ 68/2026/NĐ-CP, hiệu lực áp dụng từ 01/01/2026).\n- Các mốc trung gian dễ gây nhầm: Luật GTGT 2024 từng quy định mốc 200 triệu có hiệu lực từ 01/01/2026; NĐ 68/2026 dùng mốc 500 triệu; NĐ 141/2026 ngày 29/04/2026 sửa thành 01 tỷ và quy định hiệu lực từ 01/01/2026. Tại ngày 27/09/2026, câu trả lời hiện hành cho năm 2026 không được dừng ở mốc 200 triệu hoặc 500 triệu.\n- **Hộ khoán kinh doanh không trọn năm — xét ngưỡng theo từng kỳ (bổ sung 27/09/2026 theo review của Việt):**\n  - Trước 01/08/2021 (TT 92: điểm b khoản 1 Điều 2) và 01/08/2021–31/12/2021 (TT 40 bản gốc, khoản 3 Điều 7): hộ khoán kinh doanh không đủ 12 tháng trong năm dương lịch (mới ra kinh doanh, kinh doanh thường xuyên theo thời vụ, ngừng/tạm ngừng kinh doanh) thì mức 100 triệu đồng/năm để xét không phải nộp thuế GTGT/TNCN là doanh thu tính thuế TNCN của một năm 12 tháng; doanh thu tính thuế thực tế để xác định số thuế khoán phải nộp trong năm là doanh thu tương ứng với số tháng thực tế kinh doanh. Ví dụ trong TT 40: kinh doanh 9 tháng, doanh thu thực tế 90 triệu → quy đổi tương ứng 120 triệu/12 tháng → thuộc diện phải nộp thuế trên doanh thu thực tế 90 triệu.\n  - Từ 01/01/2022 (TT 100/2021/TT-BTC sửa khoản 3 Điều 7 TT 40): hộ khoán mới ra kinh doanh trong năm (kinh doanh không đủ 12 tháng trong năm dương lịch) xét trên doanh thu kinh doanh thực tế trong năm so với 100 triệu — trên 100 triệu thì thuộc diện phải nộp thuế GTGT/TNCN, từ 100 triệu trở xuống thì không phải nộp.\n  - **Câu chặn:** không kết luận \"doanh thu thực tế dưới 100 triệu thì không phải nộp\" trước khi xác định phương pháp tính thuế (khoán/kê khai/từng lần phát sinh), số tháng kinh doanh thực tế và kỳ áp dụng. Không lấy cách quy đổi của hộ khoán áp cho mọi trường hợp.\n- **LEGAL_STATUS (mục bổ sung):** `VERIFIED_HISTORICAL` (đối chiếu văn bản gốc 27/09/2026).\n- Nguồn mục bổ sung: khoản 3 Điều 7 TT 40/2021/TT-BTC (bản gốc và bản sửa bởi khoản 1 Điều 1 TT 100/2021/TT-BTC); điểm b khoản 1 Điều 2 TT 92/2015/TT-BTC; https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Circular-40-2021-TT-BTC-value-added-tax-personal-income-tax-479507.aspx\n- Rule cho RAG/AI: nếu truy xuất được nhiều chunk có các số 100 triệu / 200 triệu / 500 triệu / 1 tỷ, phải đọc ngày hiệu lực và kỳ áp dụng, ưu tiên văn bản sửa đổi mới nhất có hiệu lực cho đúng kỳ, không chọn con số xuất hiện nhiều nhất; nêu rõ đây là thay đổi theo thời gian nếu người dùng hỏi nhiều năm.\n- Nguồn: NĐ 141/2026/NĐ-CP ngày 29/04/2026; thông tin triển khai của Cục Thuế/Cổng TTĐT Chính phủ về việc nâng ngưỡng lên 01 tỷ đồng/năm.\n[VAI TRÒ SỐ LIỆU] Mỗi số phải giữ vai trò trong câu hỏi: dự kiến cả năm, thực tế đủ kỳ, lũy kế một phần năm hoặc tiền đã thu. Không dùng dự kiến làm xác nhận doanh thu thực tế, không mặc định tiền đã thu là doanh thu phải ghi nhận. Có thể tính số dự báo theo giả định nhưng nghĩa vụ cuối kỳ cần cơ sở thực tế của đúng kỳ. Ngưỡng trong mục này dùng xét không phải nộp thuế; không thay trần giảm một phần thuế hay điều kiện hóa đơn. Xem phạm vi riêng tại NQ43 và khoản 5 Điều 8 NĐ68 được NĐ141 sửa đổi.\n[HIỆU LỰC KHÔNG ĐỒNG NGHĨA HẾT NĂM] NĐ141/2026 sửa ngưỡng của NĐ68 có hiệu lực từ 01/01/2026, không quy định ngưỡng 1 tỷ tự hết hạn ngày 31/12/2026. Hỏi dự kiến năm tiếp theo: nêu ngưỡng theo pháp luật hiện hành tại ngày tư vấn, có điều kiện không có sửa đổi mới; không khẳng định chắc pháp luật tương lai. Phân biệt với giảm thuế có thời hạn riêng như NQ43 hoặc chính sách giảm GTGT. Nguồn: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm",
    "retrieval_facets": {
      "policy_focus": [
        "ANNUAL_EXEMPTION"
      ],
      "eligibility_topics": [
        "REVENUE_THRESHOLD",
        "REVENUE_OWNERSHIP"
      ],
      "revenue_contexts": [
        "PROJECTED",
        "PARTIAL_PERIOD"
      ]
    },
    "evidence_mode": "COMPLETE_RULE"
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
    "text": "16C — Đăng ký thuế lần đầu & xử phạt vi phạm hành chính về thuế, hóa đơn (VERIFIED 2026-10-06)\n## 16.64. Thời hạn đăng ký thuế lần đầu từ 01/07/2026 (NĐ 252/2026, Điều 6)\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — kết luận đúng chỉ khi xác định được loại đăng ký (liên thông hay trực tiếp).\n- Căn cứ: khoản 3 Điều 10 Luật Quản lý thuế 108/2025/QH15, chi tiết tại điểm a khoản 3 Điều 6 NĐ 252/2026/NĐ-CP (hiệu lực 01/07/2026).\n- **Đăng ký thuế liên thông** (thực hiện đăng ký thuế cùng với đăng ký kinh doanh theo cơ chế một cửa liên thông): thời hạn theo thời hạn đăng ký hộ kinh doanh/doanh nghiệp.\n- **Đăng ký thuế trực tiếp** với cơ quan thuế (không liên thông): **10 ngày làm việc** kể từ mốc tương ứng, trong đó:\n  - ngày được cấp giấy phép thành lập và hoạt động / quyết định thành lập (tổ chức thuộc diện đăng ký hoạt động, kinh doanh);\n  - **ngày bắt đầu hoạt động kinh doanh** (tổ chức, cá nhân kinh doanh không thuộc diện đăng ký kinh doanh);\n  - ngày ký hợp đồng nhận thầu (nhà thầu nước ngoài), ngày ký hợp đồng dầu khí;\n  - ngày phát sinh nghĩa vụ thuế TNCN (cá nhân trực tiếp đăng ký theo nghĩa vụ TNCN);\n  - ngày phát sinh nghĩa vụ với ngân sách nhà nước (trường hợp khác chưa có mã số thuế).\n- **Áp dụng cho HKD:** HKD đăng ký kinh doanh và đăng ký thuế liên thông thì không tính mốc 10 ngày làm việc ở trên; cá nhân kinh doanh không thuộc diện đăng ký kinh doanh (buôn bán lưu động, nhỏ lẻ) thì tính 10 ngày làm việc từ ngày bắt đầu hoạt động.\n- **Điểm AI phải hỏi trước khi chốt:** người hỏi đăng ký thuế liên thông cùng đăng ký HKD hay đăng ký trực tiếp; ngày được cấp Giấy CN ĐKKD / ngày bắt đầu hoạt động thực tế.\n- Nguồn đối chiếu ngày16/10/2026: Cổng Chính phủ công bố nội dung Điều6 NĐ252: https://xaydungchinhsach.chinhphu.vn/quy-dinh-thoi-han-dang-ky-thue-119260703104520919.htm . Mốc cho từng đối tượng phải đúng phạm vi; không tự gán mẫu đăng ký khi chưa kiểm TT90/2026 và phụ lục. Các nguồn thứ cấp cũ chỉ để tra cứu lịch sử:\n  - https://luatvietnam.vn/thue-phi-le-phi/thoi-han-dang-ky-thue-565-111315-article.html\n  - https://www.myvietnamtax.com/2026/07/cau-hoi-FAQs-thue-ho-kinh-doanh-2026.html\n  - https://www.meinvoice.vn/tin-tuc/18392/dang-ky-thue-la-gi/\n  - https://thuvienphapluat.vn/hoi-dap-phap-luat/khi-nao-ho-kinh-doanh-phai-dang-ky-thue-138096388.html"
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
    "section": "16.71. Sổ sách và lưu trữ của nhóm không chịu GTGT, không phải nộp TNCN",
    "ref_id": "16.71",
    "tier": "VERIFIED",
    "text": "## 16.71. Sổ sách và lưu trữ của nhóm không chịu GTGT, không phải nộp TNCN\n- **LEGAL_STATUS:** `VERIFIED` — Điều 3, Điều 4 và Điều 8 TT 152/2025/TT-BTC, đọc bản PDF gốc ngày 16/10/2026.\n- Nhóm không chịu GTGT, không phải nộp TNCN sử dụng **Sổ doanh thu bán hàng hóa, dịch vụ S1a-HKD** để ghi doanh thu và đối chiếu thông báo doanh thu. Dưới ngưỡng thuế không đồng nghĩa miễn ghi sổ.\n- Điều 3 cho lưu bằng giấy hoặc điện tử; tài liệu kế toán lưu tối thiểu **05 năm**, riêng hóa đơn theo thời hạn pháp luật thuế. Không bắt buộc mua sổ in sẵn; sổ sửa đổi/bổ sung phải có thông tin nhận diện, ngày lập và ký theo quy định.\n- Không bắt nhóm này mở toàn bộ bộ sổ của phương pháp thu nhập khi không thuộc đối tượng đó. Chọn mẫu theo trạng thái/phương pháp thực tế tại 16.52.\n- TT 152 hiệu lực 01/01/2026, thay TT 88/2021. Không có nhánh tiếp tục dùng TT 88 cho năm 2026 chỉ vì tự chọn kê khai.\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/toan-van-thong-tu-152-2025-tt-bt-huong-dan-ke-toan-cho-cac-ho-kinh-doanh-ca-nhan-kinh-doanh-119260112105136458.htm ; public/documents/TT-152-2025-TT-BTC.pdf, trang 2–3 và14.\n- **Tổng quan hệ thống sổ kế toán 2026 (Điều 4–6 TT 152/2025/TT-BTC):** Từ `S1a-HKD` đến `S2e-HKD` có **tổng cộng 6 mẫu sổ chia theo 3 nhánh** (`S1a-HKD` cho nhóm không chịu GTGT/không nộp TNCN; `S2a-HKD` cho nhóm nộp theo tỷ lệ % doanh thu; bộ 4 sổ `S2b-HKD, S2c-HKD, S2d-HKD, S2e-HKD` cho nhóm nộp GTGT theo tỷ lệ % và TNCN theo thu nhập tính thuế); không bắt buộc mọi hộ phải mở đủ cả 6 sổ.\n"
  },
  {
    "id": "KB/16D-da-nguon-pham-vi-nguong.md#1089",
    "file": "KB/16D-da-nguon-pham-vi-nguong.md",
    "section": "16.72. Doanh thu năm: quyền được hưởng, phạm vi chủ thể và số liệu cần đối soát",
    "ref_id": "16.72",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "## 16.72. Doanh thu năm: quyền được hưởng, phạm vi chủ thể và số liệu cần đối soát\n[CĂN CỨ] Điều 5 Nghị định 68/2026/NĐ-CP về doanh thu; Nghị định 141/2026/NĐ-CP cập nhật ngưỡng. Checklist phân biệt GMV, tiền ròng và thu hộ là diễn giải áp dụng, không phải trích nguyên văn.\n[PHẠM VI] Kinh doanh năm 2026; Điều 5 NĐ68 về doanh thu và cơ chế tổng hợp của cùng người nộp thuế. Ngưỡng thuế hiện hành đối chiếu NĐ141; định nghĩa doanh thu không tự quyết định phương pháp.\n[QUY TẮC] Xét khoản phát sinh từ hoạt động kinh doanh mà người kinh doanh được hưởng, không chỉ tiền đã rút về ngân hàng. Thưởng, hỗ trợ hoặc hiện vật phải phân loại theo bản chất; chiết khấu thương mại, giảm giá, hàng trả lại phải có hồ sơ đúng.\n[GMV VÀ HOA HỒNG] Người chỉ tiếp thị hàng của người khác: GMV là giá trị giao dịch được giới thiệu, không tự là doanh thu của người tiếp thị. Xét hoa hồng/quyền hưởng và khoản doanh thu liên quan; khác người tự bán hàng sở hữu của mình.\n[GỘP VÀ RÒNG] Báo cáo gộp, số tiền sau phí/thuế và số tiền đã rút khác nhau. Phí sàn không tự giảm doanh thu; tiền vay, chuyển nội bộ, thu hộ có hồ sơ không tự là tiền bán hàng.\n[NGƯỠNG NĂM] Tổng hợp các kênh của cùng chủ thể, không cộng trùng tổng với chi tiết. Không đổi số một tháng thành doanh thu thực tế năm hoặc chia ngưỡng năm thành ngưỡng tháng. Tổng và chi tiết mâu thuẫn thì đối soát trước khi chốt.\n[CẦN BIẾT] Vai trò người bán/affiliate, hợp đồng, quyền hưởng, kỳ đối soát, phần phí/thu hộ/hủy hoàn, chủ thể và tổng doanh thu năm. Độc lập thực chất khác chia tài khoản hình thức.\nNguồn đối chiếu ngày 16/10/2026:\n- https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm\n- https://xaydungchinhsach.chinhphu.vn/ban-hang-da-kenh-hieu-dung-de-thuc-hien-dung-nghia-vu-thue-119260727151911181.htm\n[BỒI THƯỜNG LIÊN QUAN KINH DOANH] Điều 5 NĐ68/2026: khoản bồi thường vi phạm hợp đồng và bồi thường khác liên quan hoạt động kinh doanh thuộc doanh thu xác định TNCN; không bỏ chỉ vì không phải tiền bán hàng. Xác minh bản chất/quyền hưởng, tránh cộng trùng khoản đã nằm trong tổng. Xử lý GTGT và hóa đơn của bồi thường bằng tiền là vấn đề riêng, không đồng nhất ba cơ sở. Nguồn Cục Thuế: https://xaydungchinhsach.chinhphu.vn/doanh-thu-de-xac-dinh-thue-thu-nhap-ca-nhan-cuaho-kinh-doanh-la-gi-11926040709525945.htm",
    "evidence_mode": "COMPLETE_RULE"
  },
  {
    "id": "KB/16D-da-nguon-pham-vi-nguong.md#1090",
    "file": "KB/16D-da-nguon-pham-vi-nguong.md",
    "section": "16.73. Affiliate: giới hạn nguồn lịch sử và dữ kiện phân loại thu nhập",
    "ref_id": "16.73",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "## 16.73. Affiliate: giới hạn nguồn lịch sử và dữ kiện phân loại thu nhập\n[ƯU TIÊN PHẠM VI] Mục 1 Công văn 7403/CT-TMĐT ngày 06/10/2026 phân biệt thu nhập theo quan hệ lao động với thu nhập từ kinh doanh không phải tiền lương; xem 16.20 và 16.95. Không được bỏ điều kiện quan hệ lao động rồi kết luận mọi affiliate trên sàn là kinh doanh.\n[NGUỒN CŨ] Giải đáp Cục Thuế ngày 23/07/2026 và CV1241/CTCBA-TTHT năm 2024 phải đọc đúng tình huống, phạm vi và thời kỳ. Mệnh đề chưa đăng ký hộ/thuế nên luôn là tiền công KHÔNG phải quy tắc phân loại chung. Không tự chuyển hướng dẫn cho một tình huống thành luật cho mọi hoạt động ngoài sàn.\n[KHẤU TRỪ KHÁC NGHĨA VỤ CUỐI] Một khoản đã bị khấu trừ 10% không tự chứng minh loại thu nhập hoặc hoàn thành nghĩa vụ năm. Cần hợp đồng, nội dung công việc, bên trả, kỳ, loại thuế và chứng từ; không dùng tỷ lệ bị giữ để phân loại ngược.\n[DỮ KIỆN CẦN BIẾT] Có hợp đồng lao động/thỏa ước lao động hay cung cấp dịch vụ độc lập? Thu nhập do nền tảng, nhãn hàng hay người sử dụng lao động trả? Chỉ hưởng hoa hồng hay còn tự bán hàng/nội dung số? Hoạt động kỳ nào và thuộc phương pháp nào? Hỏi thông tin còn thiếu, không lặp điều người dùng đã xác nhận.\n[KHÔNG ĐƯỢC SUY RA] Công văn không tạo ngày đổi loại thu nhập vào 06/10, không tự chứng minh mọi tỷ lệ 5% là thuế cuối cùng, không thay quy định hoàn thuế hay đăng ký hộ. Checklist trên là hướng áp dụng theo bản chất, không phải thủ tục bắt buộc mới.\nNguồn trực tiếp đối chiếu: Công văn 7403/CT-TMĐT ngày 06/10/2026, bản DOCX người dùng cung cấp ngày 16/10/2026; lưu tại /documents/7403-CT-TMDT-2026.docx. Căn cứ định nghĩa: khoản 12 Điều 3 Luật Thương mại điện tử 122/2025/QH15, đối chiếu /documents/Luat-122-2025-QH15.pdf.\nNguồn giải đáp lịch sử để đối chiếu khi đúng phạm vi: https://xaydungchinhsach.chinhphu.vn/lam-tiep-thi-lien-ket-ban-hang-huong-hoa-hong-tren-san-tmdt-can-khai-thue-nhu-the-nao-119260723160309548.htm"
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
    "text": "16E — Vá lỗ hổng P0 (audit 20 vòng, 2026-10-06)\n## 16.77. Bảng tỷ lệ % GTGT và TNCN trên doanh thu theo nhóm ngành 2026 — ĐÃ CÓ NGUỒN (điền từ nguyên văn luật ngày 2026-10-06)\n- **LEGAL_STATUS:** `VERIFIED` — mọi con số dưới đây trích nguyên văn điều luật (xem Nguồn). Khung công thức, phạm vi áp dụng và guardrail giữ nguyên từ bản KHUNG.\n- **Nguồn (chuỗi dẫn chiếu đầy đủ):**\n  - GTGT: **Điều 12 khoản 2 điểm b Luật 48/2024/QH15** (b1 1%; b2 5%; b3 3%; b4 2%) — được **NĐ 68/2026 Điều 3 khoản 2** dẫn chiếu (\"tỷ lệ % ... thực hiện theo quy định của Luật Thuế GTGT 48/2024/QH15\").\n  - TNCN: **Điều 7 khoản 3 Luật 109/2025/QH15** (nguyên văn 5 gạch đầu dòng dưới đây) — được **NĐ 68/2026 Điều 4 khoản 2** dẫn chiếu (\"thực hiện nộp thuế theo quy định tại Điều 7 Luật Thuế TNCN 109/2025/QH15\").\n  - Cho thuê BĐS: **khoản 4 Điều 7 Luật 109/2025/QH15** (khoản 1 Điều 7 đã được Luật 09/2026/QH16 sửa thành mức Chính phủ quy định; NĐ 141/2026 cụ thể hóa 1 tỷ): TNCN = max(doanh thu năm − 1 tỷ, 0) × 5% (kỳ 2026).\n- **Lịch sử bảng đã điền (thay thế banner KHUNG CHƯA ĐIỀN):** bảng số liệu đã được điền từ nguyên văn luật ngày 2026-10-06. Chuỗi nguồn duy nhất từng tồn tại trong kho cho các tỷ lệ (dòng trong thân 16.49 trích file 03 tier CASE_EVIDENCE) đã được rút số và chuyển thành pointer về đây ngày 2026-10-06.\n- **Câu kết luận chuẩn:** Khi bảng đã có nguồn: thuế GTGT phải nộp = doanh thu tính thuế GTGT × tỷ lệ GTGT của nhóm ngành (không trừ 1 tỷ — xem 16.44); thuế TNCN phải nộp = (doanh thu tính thuế TNCN − phần mức trừ 1 tỷ theo cơ chế chọn ngành tại chỉ tiêu [14], xem 16.40) × tỷ lệ TNCN của nhóm ngành.\n- **Phạm vi thời gian:** chỉ áp dụng cho **kỳ tính thuế năm 2026**. Cấm dùng bảng này cho kỳ trước 2026 (tỷ lệ các năm trước theo văn bản của từng kỳ — xem temporal 16.60).\n- **Phạm vi doanh thu:** doanh thu năm **trên 1 tỷ đến 3 tỷ đồng** (sau **NĐ 141/2026**; luật gốc Điều 7 khoản 1 Luật 109/2025 ghi 500 triệu — NĐ 141 nâng ngưỡng miễn lên 1 tỷ, xem 16.49).\n- **Điều kiện áp dụng (khóa phạm vi — cả 4 phải đủ):**\n  1. Khoản thu đã được phân loại là **thu nhập từ kinh doanh**. Loại trừ nhánh tiền lương/tiền công theo bản chất quan hệ lao động và hồ sơ thực tế. Không dùng việc affiliate chưa đăng ký để mặc định là tiền công; xem 16.20/16.73/16.95 và CV7403.\n  2. Đang áp dụng **phương pháp TNCN = tỷ lệ % trên doanh thu**. Loại trừ phương pháp thu nhập tính thuế × thuế suất (mốc 3 tỷ — xem 16.56).\n  3. Đã phân loại đúng nhóm ngành của **từng hoạt động** (mỗi hoạt động một dòng).\n  4. Đã tách doanh thu theo 3 cột TNCN / GTGT / HĐĐT (16.37) — tỷ lệ trong bảng chỉ dùng cho đúng cột của nó.\n- **Bảng tỷ lệ GTGT (Điều 12 khoản 2 điểm b Luật 48/2024/QH15 — nguyên văn):**\n\n  | Nhóm ngành | Tỷ lệ GTGT |\n  |---|---|\n  | b1) Phân phối, cung cấp hàng hóa | 1% |\n  | b2) Dịch vụ, xây dựng không bao thầu nguyên vật liệu | 5% |\n  | b3) Sản xuất, vận tải, dịch vụ có gắn với hàng hóa, xây dựng có bao thầu nguyên vật liệu | 3% |\n  | b4) Hoạt động kinh doanh khác | 2% |\n\n- **Bảng tỷ lệ TNCN (Điều 7 khoản 3 Luật 109/2025/QH15 — nguyên văn, giữ đúng cấu trúc luật):**\n\n  | Nhóm ngành | Tỷ lệ TNCN |\n  |---|---|\n  | Phân phối, cung cấp hàng hoá | 0,5% |\n  | Dịch vụ, xây dựng không bao thầu nguyên vật liệu | 2% |\n  | ↳ Riêng: hoạt động cho thuê tài sản, đại lý bảo hiểm, đại lý xổ số, đại lý bán hàng đa cấp | 5% |\n  | Sản xuất, vận tải, dịch vụ có gắn với hàng hoá, xây dựng có bao thầu nguyên vật liệu | 1,5% |\n  | Hoạt động cung cấp sản phẩm và dịch vụ nội dung thông tin số về giải trí, trò chơi điện tử, phim số, ảnh số, nhạc số, quảng cáo số | 5% |\n  | Hoạt động kinh doanh khác | 1% |\n\n  Lưu ý cấu trúc: luật đặt \"cho thuê tài sản, đại lý...\" là **mệnh đề Riêng trong gạch dịch vụ**, không phải nhóm độc lập — bảng trên giữ đúng cấu trúc này (đây chính là điểm các bài thứ cấp trình bày khác nhau: có bài tách thành dòng riêng, có bài không).\n- **[VERIFIED]** [Cho thuê BĐS — đính chính 06/10/2026 theo chuỗi văn bản chính thức] TNCN = max(doanh thu năm − 1 tỷ, 0) × thuế suất 5% (kỳ 2026; chỉ cho thuê, trừ lưu trú). Chuỗi: khoản 4 Điều 7 Luật 109/2025 → Luật 09/2026/QH16 Điều 1 (24/4/2026, hiệu lực 01/01/2026) sửa khoản 1 Điều 7 thành 'mức Chính phủ quy định' → NĐ 141/2026 (29/4/2026, hiệu lực 01/01/2026) Điều 1 khoản 1 thay '500 triệu' → '01 tỷ' tại Điều 3, 4 NĐ 68/2026. Lập luận cũ 'NĐ không sửa được luật nên giữ 500 triệu' đã bị bác bỏ (bỏ sót Luật 09/2026/QH16). Không nhân mức trừ theo từng hợp đồng. Cộng/tách với hoạt động kinh doanh khác xem 16.29.\n- Giới hạn trên 1 đến 3 tỷ và lựa chọn phương pháp doanh thu là giới hạn của **TNCN**, không phải giới hạn chung cho bảng GTGT. GTGT vẫn xét riêng khi doanh thu trên 3 tỷ; không dùng bảng TNCN doanh thu thay phương pháp thu nhập bắt buộc. Chuyển phương pháp theo đúng trường hợp tại16.56.\n\n[PHÂN NHÓM GTGT CHI TIẾT] Điều 5 và Phụ lục I TT69/2025/TT-BTC: sửa chữa máy vi tính, đồ dùng gia đình ở mục 2(k), GTGT gốc 5%; sửa chữa, bảo dưỡng máy móc thiết bị và phương tiện vận tải ở mục 3(e), gốc 3%. Tên chung sửa máy hoặc nhãn SERVICE chưa xác định được tiểu nhóm. Mục 3(d) là dịch vụ kèm bán hàng hóa; phải xét hợp đồng/thực tế, không suy chỉ từ chữ miễn phí vật tư trên quảng cáo. Khoản 2 Điều 5: nhiều hoạt động phải tách doanh thu theo tỷ lệ; không xác định được từng mức thì dùng mức cao nhất của hàng hóa/dịch vụ cơ sở thực tế kinh doanh trên toàn bộ doanh thu tính GTGT kỳ đó, không phải mức cao nhất tùy ý của cả danh mục. Đây là tỷ lệ GTGT gốc, xét giảm riêng; không tự suy tỷ lệ TNCN từ GTGT. Nguồn: https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/7/69-btc.signed.pdf (trang 4, Phụ lục I trang 14–15).\n[BẢNG TỶ LỆ GỐC — KHÓA ĐIỀU KIỆN]\nGTGT: điểm b khoản 2 Điều 12 Luật 48/2024/QH15, Điều 5/Phụ lục I TT69/2025/TT-BTC: phân phối hàng hóa 1%; dịch vụ, xây dựng không bao vật liệu 5%; sản xuất, vận tải, dịch vụ gắn hàng hóa, xây dựng bao vật liệu 3%; kinh doanh khác 2%. GTGT tính trên doanh thu chịu thuế, không trừ mức 1 tỷ TNCN, không trừ chi phí. Giảm GTGT phải xét chính sách và danh mục loại trừ riêng, không tự xác nhận được giảm.\nTNCN: khoản 3 Điều 7 Luật109/2025/QH15, Điều 4 NĐ68 đã cập nhật NĐ141: CHỈ khi áp phương pháp tỷ lệ doanh thu, sau mức trừ chung 1 tỷ theo cơ chế chọn ngành/địa điểm: hàng hóa 0,5%; dịch vụ/xây dựng không bao vật liệu 2%; riêng cho thuê tài sản, đại lý bảo hiểm/xổ số/bán hàng đa cấp 5%; sản xuất/vận tải/dịch vụ gắn hàng hóa/xây dựng bao vật liệu 1,5%; cung cấp nội dung thông tin số về giải trí, trò chơi, phim, ảnh, nhạc, quảng cáo số 5%; kinh doanh khác 1%. Phải phân loại từng khoản thu thực, không coi mọi thù lao là kinh doanh. Phương pháp thu nhập và chuyển phương pháp theo Điều 4 khoản 5 NĐ68; không lấy trừ 1 tỷ nhân tỷ lệ thay phương pháp thu nhập. Cho thuê BĐS có quy tắc riêng khoản 4 Điều 7 Luật109, không áp bảng chung máy móc. Bảng TNCN này cho kỳ 2026, không hồi tố kỳ trước.\n[PHÂN NHÓM GTGT CHI TIẾT] Phụ lục I TT69: sửa máy vi tính/đồ dùng gia đình mục 2(k) là 5%; sửa chữa/bảo dưỡng máy móc thiết bị, phương tiện vận tải mục 3(e) là 3%. SERVICE hay sửa máy chung chưa chứng minh tiểu nhóm. Dịch vụ kèm bán hàng hóa mục 3(d) cần xét hợp đồng/thực tế. Khoản 2 Điều 5: tách doanh thu từng mức; không xác định được thì dùng tỷ lệ cao nhất của hoạt động thực tế kinh doanh trên toàn bộ doanh thu tính GTGT kỳ đó, không phải mức cao nhất của mọi ngành trong danh mục.\nNguồn: https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/7/69-btc.signed.pdf ; Điều 7 Luật109/2025/QH15; NĐ141/2026 cập nhật ngưỡng của NĐ68.",
    "evidence_mode": "COMPLETE_RULE",
    "retrieval_facets": {
      "topics": [
        "TAX_AMOUNT",
        "VAT_METHOD_CLASSIFICATION",
        "REVENUE_COMPOSITION",
        "BUSINESS_EXPENSES",
        "PLATFORM_WITHHOLDING"
      ],
      "intents": [
        "PLATFORM_WITHHOLDING"
      ]
    },
    "context_passage": "[BẢNG TỶ LỆ GỐC — KHÓA ĐIỀU KIỆN]\nGTGT: điểm b khoản 2 Điều 12 Luật 48/2024/QH15, Điều 5/Phụ lục I TT69/2025/TT-BTC: phân phối hàng hóa 1%; dịch vụ, xây dựng không bao vật liệu 5%; sản xuất, vận tải, dịch vụ gắn hàng hóa, xây dựng bao vật liệu 3%; kinh doanh khác 2%. GTGT tính trên doanh thu chịu thuế, không trừ mức 1 tỷ TNCN, không trừ chi phí. Giảm GTGT phải xét chính sách và danh mục loại trừ riêng, không tự xác nhận được giảm.\nTNCN: khoản 3 Điều 7 Luật109/2025/QH15, Điều 4 NĐ68 đã cập nhật NĐ141: CHỈ khi áp phương pháp tỷ lệ doanh thu, sau mức trừ chung 1 tỷ theo cơ chế chọn ngành/địa điểm: hàng hóa 0,5%; dịch vụ/xây dựng không bao vật liệu 2%; riêng cho thuê tài sản, đại lý bảo hiểm/xổ số/bán hàng đa cấp 5%; sản xuất/vận tải/dịch vụ gắn hàng hóa/xây dựng bao vật liệu 1,5%; cung cấp nội dung thông tin số về giải trí, trò chơi, phim, ảnh, nhạc, quảng cáo số 5%; kinh doanh khác 1%. Phải phân loại từng khoản thu thực, không coi mọi thù lao là kinh doanh. Phương pháp thu nhập và chuyển phương pháp theo Điều 4 khoản 5 NĐ68; không lấy trừ 1 tỷ nhân tỷ lệ thay phương pháp thu nhập. Cho thuê BĐS có quy tắc riêng khoản 4 Điều 7 Luật109, không áp bảng chung máy móc. Bảng TNCN này cho kỳ 2026, không hồi tố kỳ trước.\n[PHÂN NHÓM GTGT CHI TIẾT] Phụ lục I TT69: sửa máy vi tính/đồ dùng gia đình mục 2(k) là 5%; sửa chữa/bảo dưỡng máy móc thiết bị, phương tiện vận tải mục 3(e) là 3%. SERVICE hay sửa máy chung chưa chứng minh tiểu nhóm. Dịch vụ kèm bán hàng hóa mục 3(d) cần xét hợp đồng/thực tế. Khoản 2 Điều 5: tách doanh thu từng mức; không xác định được thì dùng tỷ lệ cao nhất của hoạt động thực tế kinh doanh trên toàn bộ doanh thu tính GTGT kỳ đó, không phải mức cao nhất của mọi ngành trong danh mục.\nNguồn: https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/7/69-btc.signed.pdf ; Điều 7 Luật109/2025/QH15; NĐ141/2026 cập nhật ngưỡng của NĐ68.",
    "context_passage_period": {
      "applies_from_year": 2026,
      "applies_to_year": null
    }
  },
  {
    "id": "KB/16E-va-lo-hong-p0.md#1098",
    "file": "KB/16E-va-lo-hong-p0.md",
    "section": "16.78. NQ43: tách quyền giảm thuế khỏi thủ tục triển khai",
    "ref_id": "16.78",
    "tier": "VERIFIED",
    "text": "## 16.78. NQ43: tách quyền giảm thuế khỏi thủ tục triển khai\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL`.\n- Chính sách giảm TNCN kinh doanh của cá nhân cư trú năm 2026–2027, doanh thu không quá 10 tỷ, xem16.39. Khi đủ giả định có thể tính số thuế sau giảm; không cần đợi thủ tục để giải thích phép tính.\n- Nguồn Chính phủ ngày08/10/2026 còn yêu cầu hoàn thiện nghị định. Thông tin này không xác nhận chưa có văn bản mới sau ngày đó. Chưa đối chiếu văn bản đã ban hành thì không chỉ định mẫu/chỉ tiêu, hạn riêng hoặc cơ chế tự động áp giảm dựa trên dự thảo.\n- Tính quyền lợi trên nghĩa vụ thuế trước khi đối chiếu đã nộp; phải xác định phương pháp, cư trú, kỳ, tổng doanh thu cá nhân và chứng từ đã nộp. Không áp giảm GTGT hoặc tiền lương.\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/hoan-thanh-xay-dung-02-chi-tieu-tong-hop-cap-xa-trong-thang-10-2026-119261008055915953.htm ; chính sách tại16.39.\n"
  },
  {
    "id": "KB/16E-va-lo-hong-p0.md#1101",
    "file": "KB/16E-va-lo-hong-p0.md",
    "section": "16.79. Phạm vi doanh thu xét ngưỡng HĐĐT 1 tỷ: nguyên tắc và giới hạn khi có doanh thu đặc thù",
    "ref_id": "16.79",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16E — Vá lỗ hổng P0 (audit 20 vòng, 2026-10-06)\n## 16.79. Phạm vi doanh thu xét ngưỡng HĐĐT 1 tỷ: nguyên tắc và giới hạn khi có doanh thu đặc thù\n[Nguyên tắc] Ngưỡng HĐĐT xét theo \"doanh thu năm trên 01 tỷ đồng\" (NĐ 141/2026/NĐ-CP, hiệu lực 01/01/2026). Nếu **riêng doanh thu bán hàng/cung cấp dịch vụ thông thường** đa kênh (gồm cả phần sàn đã khấu trừ/nộp thay — xem 16.35) **đã trên 01 tỷ đồng** → thuộc diện bắt buộc HĐĐT, trả lời \"có\" dứt khoát theo 16.41, không đòi thêm dữ kiện.\n- Nếu chỉ nhờ cộng cho thuê BĐS, thanh lý tài sản phải đăng ký quyền hoặc khoản thu đặc thù mới vượt ngưỡng, phải đối chiếu phạm vi doanh thu/ngoại lệ hóa đơn của từng loại; không suy từ ngưỡng miễn thuế. Với BĐS xem16.29; tài sản xem16.36/16.38. Chưa có nguồn trực tiếp cho cách cộng ở tình huống hỗn hợp thì chỉ giữ kết luận có điều kiện, không tự khẳng định bao gồm hoặc loại trừ.\n"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1105",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.81. Biểu thuế lũy tiến tiền lương, tiền công 2026 (Điều 9 Luật 109/2025/QH15)",
    "ref_id": "16.81",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.81. Biểu thuế lũy tiến tiền lương, tiền công 2026 (Điều 9 Luật 109/2025/QH15)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc ngày 06/10/2026.\n- 5 bậc (thu nhập tính thuế/tháng): đến 10 triệu → 5%; trên 10–30 triệu → 10%; trên 30–60 triệu → 20%; trên 60–100 triệu → 30%; trên 100 triệu → 35%. (Theo năm: đến 120 / trên 120–360 / trên 360–720 / trên 720–1.200 / trên 1.200 triệu.)\n- **Hiệu lực:** Điều 29 — Luật hiệu lực chung 01/7/2026; riêng quy định về tiền lương, tiền công của cá nhân cư trú áp dụng từ **kỳ tính thuế năm 2026**.\n- **Chuyển tiếp:** kỳ 2025 áp Luật 04/2007 — biểu 7 bậc (đến 5tr 5%; 5–10tr 10%; 10–18tr 15%; 18–32tr 20%; 32–52tr 25%; 52–80tr 30%; trên 80tr 35%); giảm trừ 11 triệu / 4,4 triệu.\n- Các kỳ trước 2025 phải đối chiếu mức giảm trừ của đúng kỳ, không mặc định 11/4,4 triệu cho mọi năm trước đó.\n- **Dữ kiện cần hỏi:** kỳ tính thuế (năm nào); thu nhập tính thuế/tháng sau mọi giảm trừ.\n- Nguồn: https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-Thue-thu-nhap-ca-nhan-2025-so-109-2025-QH15-665870.aspx\n- **Đối chiếu chính thức 06/10/2026:** đã đọc trực tiếp toàn văn trên Cổng TTĐT Chính phủ (vanban.chinhphu.vn, docid=216495; PDF: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat109-2025.pdf) — nội dung điều khoản dưới đây khớp nguyên văn."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1106",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.82. Giảm trừ gia cảnh và thu nhập tính thuế tiền lương (Điều 8, 10 Luật 109/2025/QH15)",
    "ref_id": "16.82",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.82. Giảm trừ gia cảnh và thu nhập tính thuế tiền lương (Điều 8, 10 Luật 109/2025/QH15)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc ngày 06/10/2026 (Điều 8, 10). Mức thu nhập NPT không quá3triệu/tháng đã đối chiếu thêm giải thích Chính phủ về Điều3 TT87 ngày16/10/2026; việc áp dụng vẫn cần đủ điều kiện người phụ thuộc.\n- Giảm trừ bản thân: **15,5 triệu đồng/tháng** (186 triệu/năm); mỗi người phụ thuộc: **6,2 triệu đồng/tháng** (khoản 1 Điều 10). Mỗi NPT chỉ được tính giảm trừ **một lần cho một NNT** (khoản 3).\n- NPT gồm (khoản 4): con chưa thành niên / mất năng lực hành vi / khuyết tật / không khả năng lao động; con thành niên đang học ĐH-CĐ-THCN-học nghề, vợ/chồng không khả năng lao động, bố mẹ hết tuổi lao động hoặc không khả năng lao động, người không nơi nương tựa do NNT nuôi dưỡng — với điều kiện **không có thu nhập hoặc thu nhập không vượt mức Bộ Tài chính quy định** (Điều 3 TT 87/2026/TT-BTC: bình quân **03 triệu đồng/tháng** từ mọi nguồn — PDF chính thức https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/7/87-btc.signed.pdf, gói ChatGPT đọc trực tiếp đủ 6 trang). Điều 4 quy định hồ sơ theo nhóm (con; vợ/chồng; cha mẹ; người khác) kèm điều kiện tuổi/khả năng lao động — không có thu nhập không đồng nghĩa tự động đủ điều kiện. Không áp ngưỡng 3 triệu này thay cho mức giảm trừ 6,2 triệu/người — hai đại lượng khác nhau.\n- Thu nhập tính thuế = tổng thu nhập chịu thuế − BHXH/BHYT/BHTN và bảo hiểm bắt buộc khác − giảm trừ Điều 10, 11 (khoản 2 Điều 8). Thời điểm xác định: khi trả thu nhập hoặc khi NNT nhận được (khoản 3 Điều 8).\n- Đăng ký NPT: hồ sơ trước **31/12** năm tính thuế (điểm a khoản 2 Điều 48 NĐ 253/2026 — thứ cấp).\n- **Kỳ áp dụng:** 2026. **Dữ kiện cần hỏi:** số NPT đã đăng ký; thu nhập của NPT; các khoản bảo hiểm đã đóng.\n- Nguồn: Luật 109/2025 (URL như 16.81); TT 87: https://thuvienphapluat.vn/ma-so-thue/phap-luat-thue/nam-2026-nguoi-phu-thuoc-co-thu-nhap-bao-nhieu-thi-duoc-dang-ky-giam-tru-gia-canh-238632-230086.html\n- Nguồn chính thức bổ sung về mức thu nhập NPT: https://baochinhphu.vn/quy-dinh-moi-ve-thue-thu-nhap-ca-nhan-102260707165524772.htm\n"
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
    "section": "16.84. Freelancer/thù lao dịch vụ: phân loại bằng quan hệ và hoạt động thực tế",
    "ref_id": "16.84",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "## 16.84. Freelancer/thù lao dịch vụ: phân loại bằng quan hệ và hoạt động thực tế\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — điểm c khoản2 Điều8 NĐ253 đã đọc ở trang4 bản PDF; việc áp vào hợp đồng cần đủ dữ kiện.\n- Điều8 bao gồm tiền lương/công theo quan hệ với người sử dụng lao động và thù lao cung cấp dịch vụ của cá nhân không đăng ký kinh doanh, không đăng ký thuế cho hoạt động kinh doanh, kể cả có/không chứng chỉ hành nghề. Không lấy tên contractor/freelancer hoặc một mã số thuế của hoạt động khác làm kết luận duy nhất.\n- Đồng thời phải xét Điều7 về hoạt động kinh doanh. Với affiliate, sáng tạo nội dung, quảng cáo trên nền tảng số phải đọc hướng dẫn chuyên biệt CV7403 cùng16.20/16.73/16.95: không có đăng ký không tự biến mọi khoản thành tiền công. Thu nhập theo hợp đồng lao động/thỏa ước vẫn phân loại theo nhánh lao động dù chi trả qua nền tảng.\n- Đăng ký thuế khác đăng ký hộ kinh doanh. Việc thiếu đăng ký có thể là nghĩa vụ cần hoàn thiện, không tự đủ chứng minh bản chất thu nhập. Khi dữ kiện chưa rõ, hỏi loại hợp đồng, nghĩa vụ công việc, hoạt động kinh doanh thực tế và phạm vi đăng ký.\n- Nếu đã xác định là tiền lương: áp quy tắc tiền lương, không dùng ngưỡng kinh doanh1tỷ. Nếu kinh doanh: chọn đúng phương pháp và ngành. Thu nhập nước ngoài còn xét cư trú, nơi thực hiện, hiệp định và chứng từ thuế nước ngoài; tài khoản nhận tiền không quyết định miễn thuế.\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/nghi-dinh-253-2026-nd-cp-huong-dan-thi-hanh-luat-thue-thu-nhap-ca-nhan-119260713171348107.htm ; public/documents/7403-CT-TMDT-2026.docx ; phạm vi đăng ký hộ tại16.107.\n"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1109",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.85. Quyết toán và ủy quyền quyết toán thuế TNCN (Điều 51 NĐ 253/2026/NĐ-CP)",
    "ref_id": "16.85",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.85. Quyết toán và ủy quyền quyết toán thuế TNCN (Điều 51 NĐ 253/2026/NĐ-CP)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc Điều 51 ngày 06/10/2026.\n- **Ai phải quyết toán (khoản 1):** tổ chức/cá nhân trả thu nhập; cá nhân cư trú có thu nhập từ tiền lương, tiền công — quyết toán theo năm, **trừ**: (a) số thuế phải nộp **nhỏ hơn** số đã nộp mà **không yêu cầu hoàn hoặc bù trừ** kỳ sau; (b) có thêm thu nhập nơi khác mà phần này **bình quân tháng trong năm không quá 15 triệu đồng**, đã bị khấu trừ 10% → không phải quyết toán phần đó (nếu tự quyết toán, hệ thống hỗ trợ tổng hợp và trừ số thuế đã khấu trừ).\n- **Được ủy quyền (khoản 2**, kể cả không làm đủ 12 tháng): (a) chỉ có **một nguồn** thu nhập lương, **HĐLĐ từ 3 tháng trở lên** tại một tổ chức và **đang làm việc tại đó vào thời điểm quyết toán** (kể cả điều chuyển do sáp nhập/hợp nhất/chia/tách/chuyển đổi hoặc cùng hệ thống); (b) như (a) + có nguồn thu nhập khác đã bị khấu trừ theo điểm b khoản 1 (≤15 triệu/tháng bình quân).\n- **Không được ủy quyền (khoản 3 Điều 51 NĐ253, đọc PDF trang39 ngày16/10/2026):** cá nhân đề nghị giảm thuế do thiên tai, dịch bệnh, hỏa hoạn, tai nạn, bệnh hiểm nghèo theo Điều40, hoặc có khoản giảm trừ Điều49 và yêu cầu thực hiện giảm trừ, phải tự quyết toán. Điều49 có điều kiện chứng từ, không do nguồn khác chi trả và không tính trùng; không mặc định toàn bộ chi y tế/giáo dục thực trả đều được trừ.\n- **Thời hạn (thứ cấp):** tổ chức trả thu nhập: chậm nhất **31/3**; cá nhân trực tiếp: **30/4** (Điều 10 NĐ 252/2026 — 3 nguồn thứ cấp trích nguyên văn). **Hồ sơ (thứ cấp):** tờ khai 02/QTT-TNCN, phụ lục 02-1/BK-QTT-TNCN, chứng từ khấu trừ (Công văn 1296/CT-NVT 04/3/2026).\n- Mẫu 08/UQ-QTT-TNCN từng được công bố theo TT80/2021; trước khi chỉ định mẫu hiện hành phải đối chiếu TT89 và phiên bản cho đúng kỳ hồ sơ.\n- **Dữ kiện cần hỏi:** số nơi trả thu nhập; loại HĐLĐ; còn làm việc tại thời điểm quyết toán không; có đề nghị giảm thuế (thiên tai/hỏa hoạn/tai nạn/bệnh hiểm nghèo) không; có yêu cầu giảm trừ Điều49 không.\n- Nguồn: NĐ 253/2026 (URL như 16.83).\n- **Đối chiếu chính thức 06/10/2026:** đã đọc trực tiếp toàn văn trên Cổng TTĐT Chính phủ (vanban.chinhphu.vn, docid=218684; PDF: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/7/253m-ndcp.signed.pdf) — nội dung điều khoản dưới đây khớp nguyên văn."
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1110",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.86. Hoàn thuế TNCN (Điều 6 Luật 109/2025; Điều 15 Luật 108/2025)",
    "ref_id": "16.86",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.86. Hoàn thuế TNCN (Điều 6 Luật 109/2025; Điều 15 Luật 108/2025)\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — điều kiện hoàn đọc toàn văn gốc (Điều 6 Luật 109/2025); thủ tục/thời hạn qua thứ cấp.\n- **Điều kiện (Điều 6 Luật 109/2025, nguyên văn ý):** hoàn thuế khi cá nhân có **số thuế đã nộp lớn hơn số thuế phải nộp** hoặc **chưa đến mức phải nộp**.\n- **Xử lý nộp thừa (Điều 15 Luật Quản lý thuế 108/2025 — thứ cấp):** được **bù trừ** với số phải nộp hoặc **hoàn trả** khi không còn nợ thuế; **không hoàn** nếu NNT từ chối nhận hoặc quá **10 năm** kể từ ngày nộp mà không bù trừ/đề nghị hoàn.\n- **Thủ tục:** đề nghị hoàn theo Điều 18 Luật 108/2025 (PDF chính thức https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf — gói ChatGPT đọc trực tiếp Điều 18, trang 24–25). Điều 18 phân biệt hoàn theo luật thuế với hoàn trả nộp thừa theo Điều 15; hồ sơ đủ điều kiện mới xử lý tự động; có phân loại hoàn trước/kiểm tra trước — không phải mọi hồ sơ cá nhân đều tự động hoàn ngay. Không đồng nhất 03 ngày tiếp nhận hồ sơ với 03 ngày nhận tiền. Khoản4 Điều29 NĐ252: số nộp thừa sau quyết toán tiền lương từ50.000 đồng trở xuống thực hiện bù trừ kỳ sau. Khoản2 Điều31: hoàn trước06 ngày làm việc từ thông báo tiếp nhận; kiểm tra trước hoàn10 ngày làm việc từ kết luận/quyết định xử lý sau kiểm tra, không phải từ ngày nộp hồ sơ; xem16.51. Nguồn: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-252-2026-nd-cp-huong-dan-thi-hanh-luat-quan-ly-thue-119260715155021635.htm\n- **Dữ kiện cần hỏi:** đã quyết toán chưa (trực tiếp/ủy quyền); có MST không; còn nợ thuế không.\n- Nguồn: Luật 109/2025 (URL như 16.81); thủ tục: https://xcyber.vn/cong-ty-hoan-thue-thu-nhap-ca-nhan-cho-nhan-vien/"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1111",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.87. Cư trú thuế: ngày hiện diện, nơi ở thường xuyên và chứng nhận cư trú nước ngoài",
    "ref_id": "16.87",
    "tier": "VERIFIED",
    "text": "## 16.87. Cư trú thuế: ngày hiện diện, nơi ở thường xuyên và chứng nhận cư trú nước ngoài\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — Điều2 Luật109, Điều3–6 NĐ253, đọc trang2–3 bản PDF ngày16/10/2026.\n- Cư trú khi hiện diện tại Việt Nam từ183 ngày trong năm dương lịch hoặc12 tháng liên tục từ ngày đầu có mặt; ngày đến/đi tính theo hồ sơ xuất nhập cảnh, đến và đi cùng ngày tính một ngày.\n- Nơi ở thường xuyên gồm đăng ký thường trú hoặc nhà thuê theo điều kiện Điều4. Nhánh thuê: tổng thời hạn hợp đồng từ183 ngày trong năm tính thuế, có thể nhiều nơi; không phải bất kỳ hợp đồng có thời hạn nào cũng đủ.\n- Khoản3 Điều4: có nơi ở thường xuyên nhưng thực tế dưới183 ngày, nếu không chứng minh được là cá nhân cư trú của nước nào thì là cư trú Việt Nam. Cần xét giấy chứng nhận cư trú nước ngoài; trường hợp nước/vùng có hiệp định nhưng không cấp giấy này thì hồ sơ chứng minh theo quy định. Không kết luận dứt khoát chỉ từ150 ngày hiện diện và hợp đồng thuê12tháng.\n- Cư trú chịu thuế đối với thu nhập trong/ngoài Việt Nam; không cư trú xét thu nhập phát sinh Việt Nam, không phụ thuộc nơi trả/nhận. Nếu hai nước cùng coi là cư trú phải xét hiệp định, không chỉ chọn một quy tắc183ngày.\n- Dữ kiện: kỳ thuế, lịch xuất nhập cảnh, nơi ở, thời hạn thuê, chứng nhận cư trú nước ngoài, loại thu nhập và hiệp định. Không mặc định mức thuế suất của cá nhân cư trú cho người chưa xác định cư trú.\n- Nguồn: https://xaydungchinhsach.chinhphu.vn/nghi-dinh-253-2026-nd-cp-huong-dan-thi-hanh-luat-thue-thu-nhap-ca-nhan-119260713171348107.htm ; hiệp định Việt Nam–Singapore xem16.94.\n"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1112",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.88. Chuyển nhượng bất động sản: thuế suất và miễn thuế (Điều 14, Điều 4 Luật 109/2025/QH15)",
    "ref_id": "16.88",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.88. Chuyển nhượng bất động sản: thuế suất và miễn thuế (Điều 14, Điều 4 Luật 109/2025/QH15)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc ngày 06/10/2026 (qua nghiên cứu độc lập).\n- **Điều 14 khoản 1 (nguyên văn):** *\"thuế thu nhập cá nhân đối với thu nhập từ chuyển nhượng bất động sản của cá nhân cư trú được xác định bằng giá chuyển nhượng nhân (x) với thuế suất 2%.\"*\n- **Miễn thuế nhà ở duy nhất — Điều 4 khoản 2 (nguyên văn):** *\"Thu nhập từ chuyển nhượng nhà ở, quyền sử dụng đất ở và tài sản gắn liền với đất ở của cá nhân trong trường hợp cá nhân chỉ có một nhà ở, đất ở duy nhất tại Việt Nam.\"* Điều kiện chi tiết phải xét theo NĐ253, không chỉ đọc luật khung. Nguồn Chính phủ đã công bố: sở hữu/sử dụng tối thiểu183ngày; chuyển nhượng toàn bộ; chỉ một nhà/đất ở tại thời điểm chuyển nhượng. Không áp miễn cho chuyển nhượng nhà/công trình hình thành trong tương lai; có thêm tài sản dạng này cũng ảnh hưởng điều kiện duy nhất. Đồng sở hữu xét từng người; cần kiểm kê khai và hồ sơ thực tế.\n- **Miễn BĐS giữa thân nhân — Điều 4 khoản 1:** vợ chồng; cha mẹ đẻ/nuôi–con; cha mẹ chồng/vợ–con dâu/rể; ông bà–cháu nội/ngoại; anh chị em ruột (toàn văn gốc).\n- **Hiệu lực:** 01/7/2026 (không thuộc nhóm áp dụng từ kỳ 2026 vì không phải thu nhập từ kinh doanh/tiền lương).\n- **Dữ kiện cần hỏi:** số lượng nhà/đất đang sở hữu tại VN; quan hệ thân nhân (nếu có); chuyển nhượng toàn bộ hay một phần.\n- Nguồn: https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-Thue-thu-nhap-ca-nhan-2025-so-109-2025-QH15-665870.aspx ; điều kiện chi tiết: https://doanhnhan.baophapluat.vn/ban-nha-duy-nhat-duoc-mien-thue-thu-nhap-ca-nhan-trong-truong-hop-nao-744f8fa2.html\n- **Đối chiếu chính thức 06/10/2026:** đã đọc trực tiếp toàn văn trên Cổng TTĐT Chính phủ (vanban.chinhphu.vn, docid=216495; PDF: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat109-2025.pdf) — nội dung điều khoản dưới đây khớp nguyên văn.\n- Nguồn Chính phủ đã đối chiếu ngày16/10/2026: https://xaydungchinhsach.chinhphu.vn/ca-nhan-chuyen-nhuong-co-duy-nhat-mot-nha-o-quyen-su-dung-dat-o-tai-viet-nam-duoc-mien-thue-thu-nhap-ca-nhan-11926070309365282.htm\n"
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
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.90. Thừa kế, quà tặng, trúng thưởng, bản quyền, thu nhập khác (Điều 15, 18, 19, 27 Luật 109/2025/QH15)\n- **LEGAL_STATUS:** `VERIFIED` — đọc toàn văn gốc ngày 06/10/2026 (qua nghiên cứu độc lập).\n- **Trúng thưởng — Điều 15:** thuế = **10%** × phần giá trị giải thưởng vượt trên 20 triệu đồng/lần.\n- **Thừa kế, quà tặng — Điều 18:** thuế = **10%** × phần giá trị tài sản thừa kế, quà tặng vượt trên 20 triệu đồng/lần phát sinh. Phạm vi tài sản chịu thuế (Điều 3 khoản 9): chứng khoán, phần vốn trong tổ chức kinh tế, cơ sở kinh doanh, BĐS và tài sản phải đăng ký sở hữu/sử dụng. Miễn: thừa kế/quà tặng BĐS giữa thân nhân (Điều 4 khoản 1).\n- Tên miền \".vn\", tín chỉ carbon, biển số trúng đấu giá: **5%** × phần vượt 20 triệu (Điều 19, 27). Tài sản số, vàng miếng: Điều19 nêu **0,1%** × giá chuyển nhượng, nhưng riêng vàng miếng khoản10 Điều3 giao Chính phủ quy định ngưỡng giá trị, thời điểm áp dụng thu và điều chỉnh thuế suất; không tự kết luận mọi giao dịch vàng từ01/07/2026 đã phải thu0,1% nếu chưa đối chiếu văn bản triển khai.\n- **Hiệu lực:** 01/7/2026.\n- **Đối chiếu chính thức 06/10/2026** (PDF Cổng Chính phủ): Điều 15 = \"Thuế TNCN đối với thu nhập từ trúng thưởng\" (cá nhân cư trú); Điều 18 = \"Thuế TNCN đối với thu nhập từ nhận thừa kế, quà tặng\" (cá nhân cư trú) — khớp ánh xạ của thẻ này. **Bác bỏ** ánh xạ trong gói ChatGPT P15 (\"Đ15 gộp thừa kế/quà tặng; Đ18 là thu nhập của cá nhân không cư trú\"): không đúng văn bản, không nhập.\n- Nguồn: https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-Thue-thu-nhap-ca-nhan-2025-so-109-2025-QH15-665870.aspx ; PDF chính thức: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat109-2025.pdf\n- Bản quyền (Điều16) và nhượng quyền thương mại (Điều17), cá nhân cư trú:5% × phần vượt20 triệu theo từng hợp đồng, không phải từng đợt thanh toán. Không nhầm thu nhập bản quyền với bán dịch vụ/nội dung số trong hoạt động kinh doanh. Nguồn gốc: public/documents/Luat-109-2025-QH15.pdf, trang11.\n"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1115",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.91. Cho thuê BĐS — công thức và hiệu lực (khoản 4 Điều 7 Luật 109/2025; Luật 09/2026/QH16; NĐ 141/2026)",
    "ref_id": "16.91",
    "tier": "VERIFIED",
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.91. Cho thuê BĐS — công thức và hiệu lực (khoản 4 Điều 7 Luật 109/2025; Luật 09/2026/QH16; NĐ 141/2026)\n- **LEGAL_STATUS:** `VERIFIED` — chuỗi văn bản đã đối chiếu trực tiếp 06/10/2026 (Cổng TTĐT Chính phủ + Công báo 152).\n- **Chuỗi căn cứ:**\n  - Khoản 4 Điều 7 Luật 109/2025/QH15: TNCN cho thuê BĐS (trừ lưu trú) = (doanh thu − mức tại khoản 1 Điều 7) × 5%.\n  - Luật 09/2026/QH16 Điều 1 (Quốc hội khóa XVI thông qua 24/4/2026; Điều 1 hiệu lực từ 01/01/2026): sửa khoản 1 Điều 7 — bãi bỏ mức cứng 500 triệu, thay bằng \"mức doanh thu do Chính phủ quy định\".\n  - NĐ 141/2026/NĐ-CP (ký 29/4/2026, hiệu lực 01/01/2026) Điều 1 khoản 1: thay cụm \"500 triệu đồng\" → \"01 tỷ đồng\" tại Điều 3, Điều 4, khoản 1 Điều 8, Điều 9, 10, khoản 3 Điều 11, khoản 1–2 Điều 12, khoản 4 Điều 17, khoản 3 Điều 18 NĐ 68/2026.\n- **Kết luận cho kỳ 2026 (chỉ cho thuê BĐS, không phải lưu trú): TNCN = max(doanh thu năm − 1 tỷ, 0) × 5%.**\n- Mức trừ tính trên tổng doanh thu cho thuê BĐS năm của cá nhân — không nhân mức trừ theo từng hợp đồng/nhà.\n- Dưới 1 tỷ: vẫn phải khai báo thuế (baochinhphu.vn 12/06/2026, thứ cấp) — khai nhưng không phát sinh số thuế phải nộp.\n- **Ghi chú lịch sử (đính chính 06/10/2026):** công thức (DT − 500 triệu) × 5% theo nguyên văn Luật 109 ban đầu đã được thay thế cho kỳ 2026 — cấm áp cho kỳ 2026. Lập luận cũ \"NĐ không sửa được luật nên giữ 500 triệu\" là sai vì bỏ sót Luật 09/2026/QH16 (luật sửa luật). Cho thuê trước 2026: TT 40/2021.\n- Cộng/tách với hoạt động kinh doanh khác xem16.29: hướng dẫn Cục Thuế cho kê khai/tính riêng nhóm BĐS; không tạo mức trừ riêng cho mỗi nhà. Quy tắc này không tự tách ngưỡng10tỷ của NQ43.\n- Nguồn chính thức: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/luat109-2025.pdf ; NĐ 141: https://xdcs.cdnchinhphu.vn/446259493575335936/2026/5/4/141-ndcp-signed-1777883675606599215477.pdf ; NĐ 68 tại Công báo 152: https://congbaocdn.chinhphu.vn/180507251028987904/2026/3/18/cong-bao-so-152-ngay-19-03-47065_1773803455_signed.pdf"
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
    "text": "16F — Thuế TNCN cá nhân mở rộng (tiền lương, cư trú, BĐS, chứng khoán, thừa kế) — bổ sung 06/10/2026\n## 16.94. Hiệp định tránh đánh thuế hai lần Việt Nam–Singapore (Điều 4, 14, 15, 24)\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — văn bản hiệp định (bản hợp nhất sau MLI, hiệu lực 01/9/2023) đọc qua PDF chính thức của IRAS Singapore (gói ChatGPT đọc trực tiếp); chưa xác minh thủ tục hồ sơ áp dụng hiệp định tại Việt Nam sau TT 89.\n- **Cư trú kép — Điều 4 khoản 2:** xét lần lượt: (1) nhà ở thường xuyên; (2) trung tâm các lợi ích sống còn; (3) nơi thường xuyên sinh sống; (4) quốc tịch; (5) thỏa thuận giữa cơ quan có thẩm quyền hai nước. Không dùng 150 ngày ở Việt Nam hoặc tài khoản Singapore để kết luận miễn thuế tại Việt Nam.\n- **Dịch vụ độc lập — Điều 14 (đã được Điều VIII Nghị định thư thứ hai thay thế):** nước kia được đánh thuế phần thu nhập liên quan nếu cá nhân có cơ sở cố định tại đó HOẶC hiện diện tại đó **trên 183 ngày** trong bất kỳ khoảng 12 tháng. Không trộn phép thử 183 ngày này với phép thử 183 ngày của cư trú (Điều 4).\n- **Tiền lương — Điều 15:** phép thử riêng (nơi thực hiện công việc; người sử dụng lao động; bên chịu chi phí tiền lương).\n- **Tín dụng thuế — Điều 24 khoản 2 điểm a (và Annex A):** Việt Nam cho trừ số thuế đã nộp tại Singapore đối với thu nhập được đánh thuế theo hiệp định, tối đa bằng phần thuế Việt Nam tính trên thu nhập đó. Hiệp định không đồng nghĩa miễn thuế ở cả hai nước; MLI có quy tắc chống lạm dụng.\n- **[PENDING]** thủ tục hồ sơ áp dụng hiệp định tại Việt Nam sau TT 89; toàn bộ thủ tục khấu trừ thuế nước ngoài.\n- **Dữ kiện cần hỏi:** cư trú theo nội luật từng nước; nhà ở thường xuyên; gia đình/nơi làm việc chính; số ngày hiện diện từng nước; quốc tịch; loại hoạt động (dịch vụ độc lập hay tiền lương); cơ sở cố định; chủ lao động và bên chịu chi phí; chứng từ thuế đã nộp ở nước ngoài.\n- Nguồn: https://www.iras.gov.sg/media/docs/default-source/dtas/singapore-vietnam-dta-(ratified)(mli)(01092023).pdf\n- Ranh giới Điều14 sau Nghị định thư thứ hai: nguyên văn “exceeding ...183 days”, không phải từ183ngày. Đúng183ngày không tự kích hoạt nhánh hiện diện của Điều14; vẫn kiểm cơ sở cố định và các điều kiện khác. Không trộn với cư trú nội luật từ183ngày hoặc Điều15 tiền lương. Đối chiếu IRAS trang22 ngày16/10/2026.\n"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#1119",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.95. Công văn 7403/CT-TMĐT ngày 06/10/2026: phân loại thu nhập, khấu trừ và chứng từ affiliate",
    "ref_id": "16.95",
    "tier": "VERIFIED",
    "text": "## 16.95. Công văn 7403/CT-TMĐT ngày 06/10/2026: phân loại thu nhập, khấu trừ và chứng từ affiliate\n[NGUỒN VÀ GIỚI HẠN] Đã đọc toàn văn DOCX do người dùng cung cấp ngày 16/10/2026. Đây là đối chiếu nội dung bản được cung cấp, không xác nhận bản điện tử có chữ ký số. Công văn do Cục Thuế hướng dẫn cho Cục TMĐT và Kinh tế số, TikTok Shop Việt Nam.\n[MỤC 1 — PHÂN LOẠI] Nhận thu nhập theo hợp đồng lao động/thỏa ước lao động tập thể theo pháp luật lao động là tiền lương, tiền công. Sáng tạo nội dung số, quảng bá sản phẩm, tiếp thị liên kết trên nền tảng TMĐT/nền tảng số, nhận thu nhập từ nền tảng/nhãn hàng từ kinh doanh không phải tiền lương là thu nhập kinh doanh; đăng ký thuế, kê khai, nộp theo Nghị định 68/2026/NĐ-CP và Nghị định 141/2026/NĐ-CP. Không phân loại chỉ từ tình trạng đã đăng ký hộ.\n[MỤC 1 — TNCN 5%] Công văn hướng dẫn tiếp thị liên kết trên nền tảng TMĐT áp dụng tỷ lệ TNCN 5% của nhóm nội dung thông tin số theo điểm đ khoản 3 Điều 7 Luật Thuế thu nhập cá nhân 109/2025/QH15. Đây không phải tổng hai sắc thuế, không phải thuế suất tiền lương và không tự thay thế việc xác định phương pháp, ngưỡng hoặc số thuế cuối cùng; xem 16.56.\n[MỤC 2 — NỀN TẢNG] Điều 43 Nghị định 252/2026/NĐ-CP: TikTok Shop là chủ quản nền tảng có cả chức năng đặt hàng trực tuyến và thanh toán thì khấu trừ, khai thay, nộp thay số thuế đã khấu trừ đối với hoạt động kinh doanh trên nền tảng. Không suy mọi nhãn hàng trả tiền đều thực hiện cơ chế như sàn.\n[MỤC 3 — CHI PHÍ CỦA DOANH NGHIỆP MUA DỊCH VỤ] Điều 9 Luật Thuế thu nhập doanh nghiệp 67/2025/QH15 và khoản 1 Điều 9 Nghị định 320/2025/NĐ-CP: bên cung cấp vượt 1 tỷ/năm phải đăng ký sử dụng hóa đơn; doanh nghiệp dùng hóa đơn làm chứng từ. Nhánh mua từ hộ/cá nhân dưới ngưỡng GTGT: chứng từ chi trả và bảng kê theo điều kiện nguồn; giá trị mua trong NGÀY của TỪNG người bán từ 5 triệu trở lên cần thanh toán không dùng tiền mặt. Không đổi thành ngưỡng từng lần hoặc đánh đồng với điều kiện chi phí TNCN của người bán.\n[MỤC 3 — THÔNG TIN HÓA ĐƠN] Điểm c khoản 1 Điều 17 và khoản 2 Điều 19 Nghị định 254/2026/NĐ-CP: bên bán được yêu cầu, nền tảng có trách nhiệm cung cấp thông tin người mua, giao dịch, thời điểm giao và xác nhận hoàn tất để lập HĐĐT. Không suy khấu trừ thuế đồng nghĩa xuất hóa đơn thay.\n[VIỆN DẪN CẦN PHÂN BIỆT] Bản DOCX dẫn khoản 12 Điều 3 Luật TMĐT ở phần căn cứ nhưng dẫn khoản 14 ở đoạn tỷ lệ. Luật 122/2025/QH15 trong kho đặt định nghĩa DỊCH VỤ tiếp thị liên kết tại khoản 12 Điều 3; không sao chép khoản 14 làm căn cứ định nghĩa này. Giữ nguyên bản công văn, ghi nhận bất nhất bản được cung cấp; không tự sửa nội dung nguồn.\n[THỜI KỲ VÀ ĐĂNG KÝ] Ngày công văn không tự là ngày bắt đầu chế độ thuế mới. Đăng ký thuế khác đăng ký hộ; câu hỏi miễn đăng ký kinh doanh xem 16.107. Thuế suất theo ngành, cơ chế khấu trừ và số phải nộp năm là các bước riêng.\nNguồn trực tiếp đối chiếu: Công văn 7403/CT-TMĐT ngày 06/10/2026, bản DOCX người dùng cung cấp ngày 16/10/2026; lưu tại /documents/7403-CT-TMDT-2026.docx. Căn cứ định nghĩa: khoản 12 Điều 3 Luật Thương mại điện tử 122/2025/QH15, đối chiếu /documents/Luat-122-2025-QH15.pdf.\n[THÙ LAO DỊCH VỤ VÀ TÌNH TRẠNG ĐĂNG KÝ] Điểm c khoản 2 Điều 8 NĐ253/2026/NĐ-CP xếp vào tiền lương, tiền công khoản thù lao cung cấp dịch vụ của cá nhân không đăng ký kinh doanh, không đăng ký thuế cho hoạt động kinh doanh, dù có hay không giấy phép/chứng chỉ hành nghề. Điều 7 đồng thời quy định thu nhập kinh doanh, gồm môi giới và kinh doanh nền tảng. Không có HĐLĐ chưa đủ để chốt nhánh kinh doanh: phải hỏi/đối chiếu tình trạng đăng ký, bản chất hợp đồng và khoản thu cụ thể; có mã số thuế cá nhân chưa tự chứng minh đã đăng ký thuế cho hoạt động kinh doanh. Công văn7403 hướng dẫn affiliate trong phạm vi của công văn, không thay thế quy định của NĐ253 hoặc tự chứng minh mọi khoản thu trên các nền tảng cùng bản chất. Khi có nhiều khoản, phân loại từng khoản trước khi gộp doanh thu kinh doanh. Đã đọc bản NĐ253 gốc tại /documents/ND-253-2026-ND-CP.pdf, Điều 7 và Điều 8 trang 4; không dùng câu hỏi của người dân trên trang hỏi đáp làm kết luận cơ quan thuế.\n[AFFILIATE — PHÂN LOẠI VÀ TỶ LỆ CÓ ĐIỀU KIỆN]\nMục 1 Công văn7403/CT-TMĐT ngày06/10/2026: khoản nhận theo quan hệ lao động là tiền lương/tiền công; affiliate, quảng bá/sáng tạo nội dung từ hoạt động kinh doanh trên nền tảng khác tiền lương thì theo NĐ68/2026/NĐ-CP và NĐ141/2026/NĐ-CP. Khi đúng affiliate TMĐT kinh doanh và áp phương pháp tỷ lệ, PIT 5% thuộc nhóm nội dung/quảng cáo số theo điểm đ khoản 3 Điều 7 Luật109/2025/QH15. Không phải tổng GTGT+PIT, không thay ngưỡng/phương pháp/thuế cuối; không áp cho mọi khoản mang tên creator/booking.\nĐiều 7 và điểm c khoản 2 Điều 8 NĐ253/2026: thù lao cung cấp dịch vụ của cá nhân không đăng ký kinh doanh, không đăng ký thuế cho hoạt động kinh doanh phải xét nhánh tiền lương/tiền công, dù có hay không giấy phép/chứng chỉ. Không có HĐLĐ chưa đủ chốt kinh doanh; có mã thuế cá nhân chưa chứng minh đã đăng ký thuế cho hoạt động. Xét hợp đồng, bản chất, bên trả, đăng ký và kỳ; nhiều khoản phân loại từng khoản trước gộp. CV không thay quy định NĐ253 hay tạo mốc đổi loại thu nhập vào ngày công văn.\nMục 2 dẫn Điều43 NĐ252: TikTokShop có cả đặt hàng và thanh toán thực hiện khấu trừ/khai/nộp thay theo phạm vi; không lấy tỷ lệ bị giữ10% để suy bản chất hay nghĩa vụ cuối. Không suy khấu trừ là lập hóa đơn thay. Đăng ký thuế khác đăng ký hộ.\nNguồn: bản DOCX người dùng cung cấp đã đọc tại /documents/7403-CT-TMDT-2026.docx (không xác nhận chữ ký số); /documents/ND-253-2026-ND-CP.pdf Điều7/8; Luật109 Điều7. Bản CV dẫn khoản14 Điều3 LuậtTMĐT không nhất quán; định nghĩa tiếp thị liên kết ở khoản12 Điều3 Luật122/2025/QH15, không sao chép sai khoản. Chi phí của doanh nghiệp mua dịch vụ thuộc phạm vi khác, không áp tự động cho TNCN người bán.",
    "evidence_mode": "COMPLETE_RULE",
    "retrieval_facets": {
      "topics": [
        "TAX_AMOUNT",
        "PLATFORM_WITHHOLDING",
        "REVENUE_THRESHOLD",
        "REVENUE_COMPOSITION"
      ],
      "income_types": [
        "AFFILIATE_COMMISSION",
        "CONTENT_ADS"
      ],
      "intents": [
        "PLATFORM_WITHHOLDING"
      ]
    },
    "context_passage": "[AFFILIATE — PHÂN LOẠI VÀ TỶ LỆ CÓ ĐIỀU KIỆN]\nMục 1 Công văn7403/CT-TMĐT ngày06/10/2026: khoản nhận theo quan hệ lao động là tiền lương/tiền công; affiliate, quảng bá/sáng tạo nội dung từ hoạt động kinh doanh trên nền tảng khác tiền lương thì theo NĐ68/2026/NĐ-CP và NĐ141/2026/NĐ-CP. Khi đúng affiliate TMĐT kinh doanh và áp phương pháp tỷ lệ, PIT 5% thuộc nhóm nội dung/quảng cáo số theo điểm đ khoản 3 Điều 7 Luật109/2025/QH15. Không phải tổng GTGT+PIT, không thay ngưỡng/phương pháp/thuế cuối; không áp cho mọi khoản mang tên creator/booking.\nĐiều 7 và điểm c khoản 2 Điều 8 NĐ253/2026: thù lao cung cấp dịch vụ của cá nhân không đăng ký kinh doanh, không đăng ký thuế cho hoạt động kinh doanh phải xét nhánh tiền lương/tiền công, dù có hay không giấy phép/chứng chỉ. Không có HĐLĐ chưa đủ chốt kinh doanh; có mã thuế cá nhân chưa chứng minh đã đăng ký thuế cho hoạt động. Xét hợp đồng, bản chất, bên trả, đăng ký và kỳ; nhiều khoản phân loại từng khoản trước gộp. CV không thay quy định NĐ253 hay tạo mốc đổi loại thu nhập vào ngày công văn.\nMục 2 dẫn Điều43 NĐ252: TikTokShop có cả đặt hàng và thanh toán thực hiện khấu trừ/khai/nộp thay theo phạm vi; không lấy tỷ lệ bị giữ10% để suy bản chất hay nghĩa vụ cuối. Không suy khấu trừ là lập hóa đơn thay. Đăng ký thuế khác đăng ký hộ.\nNguồn: bản DOCX người dùng cung cấp đã đọc tại /documents/7403-CT-TMDT-2026.docx (không xác nhận chữ ký số); /documents/ND-253-2026-ND-CP.pdf Điều7/8; Luật109 Điều7. Bản CV dẫn khoản14 Điều3 LuậtTMĐT không nhất quán; định nghĩa tiếp thị liên kết ở khoản12 Điều3 Luật122/2025/QH15, không sao chép sai khoản. Chi phí của doanh nghiệp mua dịch vụ thuộc phạm vi khác, không áp tự động cho TNCN người bán.",
    "context_passage_period": {
      "applies_from_year": 2026,
      "applies_to_year": null
    }
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#affiliate-888-2026",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.96. Mã đuôi888 và số định danh cá nhân: phân biệt mã quản lý với nghĩa vụ thuế",
    "ref_id": "16.96",
    "tier": "VERIFIED",
    "text": "## 16.96. Mã đuôi888 và số định danh cá nhân: phân biệt mã quản lý với nghĩa vụ thuế\n- CV311/TCT-DNNCN ngày20/01/2025 mô tả mã888 cho hoạt động kinh doanh trực tuyến của cá nhân/phân loại hoạt động TMĐT: MST10số +888 thành13số. Khi CCCD thay MST, không tự ghép12số+888 rồi gọi13số; kiểm thông báo tài khoản hiện tại, không xin MST cá nhân mới.\n- Năm2026: nếu là doanh thu kinh doanh, tổng nhóm từ1tỷ trở xuống thì không nộp GTGT/TNCN theo ngưỡng; thông báo doanh thu01/TKN-CNKD chậm nhất **31/01/2027**, khác quyết toán. Không khai nộp trùng khoản sàn đã thực hiện đúng; đối soát chứng từ tax.\n- Năm2025: ngưỡng kinh doanh100triệu; khoản thực chất tiền công xét riêng theo đúng kỳ. Ngày06/10/2026 của CV7403 không tự là ngày đổi luật/phân loại.\n- CV311 là hướng dẫn cổng2025, không chứng minh mọi thao tác/mã hiển thị2026 giữ nguyên; xem16.100. Nguồn: public/documents/311-TCT-DNNCN-2025-goc.pdf trang4–6; TT86/2024; nghĩa vụ năm xem16.42/16.51, phân loại16.95.\n"
  },
  {
    "id": "KB/16F-thue-tncn-ca-nhan-mo-rong.md#le-phi-mon-bai-hkd",
    "file": "KB/16F-thue-tncn-ca-nhan-mo-rong.md",
    "section": "16.97. Lệ phí môn bài (thuế môn bài) hộ kinh doanh và cá nhân kinh doanh",
    "ref_id": "16.97",
    "tier": "VERIFIED",
    "text": "## 16.97. Lệ phí môn bài (thuế môn bài) hộ kinh doanh và cá nhân kinh doanh\n- **LEGAL_STATUS:** VERIFIED — phân biệt rõ kỳ áp dụng trước và từ năm 2026.\n- **Từ 01/01/2026:** Chấm dứt việc thu, nộp lệ phí môn bài theo khoản 7 Điều 10 Nghị quyết 198/2025/QH15. Khoản 4 Điều 6 Nghị định 362/2025/NĐ-CP bãi bỏ Nghị định 139/2016/NĐ-CP và Nghị định 22/2020/NĐ-CP. Người nộp thuế không phải nộp lệ phí môn bài hoặc hồ sơ khai lệ phí môn bài cho năm 2026 và các năm tiếp theo. Ví dụ: hộ kinh doanh doanh thu 400 triệu đồng/năm trong năm 2026 không phải nộp lệ phí môn bài cho năm 2026; số phải nộp là 0 đồng, không áp biểu mức cũ. Công văn 645/CT-CS ngày 23/01/2026 của Cục Thuế xác nhận cách áp dụng này.\n- **Nghĩa vụ các năm 2025 trở về trước:** Cơ quan thuế vẫn rà soát, thu đủ số lệ phí môn bài đã phát sinh cho các năm đó; việc bãi bỏ từ 2026 không xóa khoản nợ cũ (Công văn 645/CT-CS).\n- **Biểu mức lịch sử CHỈ cho năm 2025 trở về trước** (khoản 2 Điều 4 Nghị định 139/2016/NĐ-CP):\n  - Doanh thu trên 500 triệu đồng/năm: 1.000.000 đồng/năm.\n  - Doanh thu trên 300 đến 500 triệu đồng/năm: 500.000 đồng/năm (ví dụ doanh thu 400 triệu của năm 2025, nếu không thuộc diện miễn).\n  - Doanh thu trên 100 đến 300 triệu đồng/năm: 300.000 đồng/năm.\n  - Doanh thu từ 100 triệu đồng/năm trở xuống: miễn lệ phí môn bài.\n- **Miễn, thời hạn theo quy định cũ (chỉ xét nghĩa vụ năm 2025 trở về trước):** Miễn năm đầu ra hoạt động sản xuất, kinh doanh đối với cá nhân, nhóm cá nhân, hộ gia đình mới ra kinh doanh; doanh thu năm từ 100 triệu đồng trở xuống được miễn. Hạn nộp hằng năm chậm nhất là ngày 30 tháng 01 theo khoản 4 Điều 10 Nghị định 126/2020/NĐ-CP. Không dùng thời hạn này để yêu cầu nộp lệ phí môn bài cho năm 2026 trở đi.\n- **Căn cứ pháp lý hiện hành:** khoản 7 Điều 10 Nghị quyết 198/2025/QH15; khoản 4 Điều 6 Nghị định 362/2025/NĐ-CP; Công văn 645/CT-CS. Biểu mức lịch sử: Điều 3, Điều 4 Nghị định 139/2016/NĐ-CP, sửa đổi bởi Nghị định 22/2020/NĐ-CP.\n- Mức lệ phí môn bài phải nộp từ năm 2026 trở đi là 0 đồng (bao nhiêu tiền cũng là 0 đồng).\n[MÔN BÀI TỪ 2026 VÀ NỢ CŨ]\nKhoản 7 Điều10 Nghị quyết198/2025/QH15 chấm dứt thu/nộp lệ phí môn bài từ01/01/2026. Khoản4 Điều6 NĐ362/2025 bãi bỏ NĐ139/2016 và NĐ22/2020; CV645/CT-CS ngày23/01/2026 hướng dẫn không nộp hồ sơ khai và không nộp lệ phí môn bài cho2026 và các năm tiếp theo. Nghĩa vụ2025 trở về trước vẫn đối chiếu/thu đủ, không xóa nợ cũ. Chấm dứt môn bài khác giảm TNCN; không có khoản môn bài mới để tự trừ vào PIT.\nNguồn Cục Thuế: https://xaydungchinhsach.chinhphu.vn/tu-thang-1-2026-nguoi-nop-thue-khong-phai-nop-le-phi-mon-bai-119260126110926562.htm",
    "retrieval_facets": {
      "policy_focus": [
        "PIT_RELIEF"
      ],
      "tax_focuses": [
        "pit",
        "both",
        "unspecified"
      ]
    },
    "context_passage": "[MÔN BÀI TỪ 2026 VÀ NỢ CŨ]\nKhoản 7 Điều10 Nghị quyết198/2025/QH15 chấm dứt thu/nộp lệ phí môn bài từ01/01/2026. Khoản4 Điều6 NĐ362/2025 bãi bỏ NĐ139/2016 và NĐ22/2020; CV645/CT-CS ngày23/01/2026 hướng dẫn không nộp hồ sơ khai và không nộp lệ phí môn bài cho2026 và các năm tiếp theo. Nghĩa vụ2025 trở về trước vẫn đối chiếu/thu đủ, không xóa nợ cũ. Chấm dứt môn bài khác giảm TNCN; không có khoản môn bài mới để tự trừ vào PIT.\nNguồn Cục Thuế: https://xaydungchinhsach.chinhphu.vn/tu-thang-1-2026-nguoi-nop-thue-khong-phai-nop-le-phi-mon-bai-119260126110926562.htm",
    "context_passage_period": {
      "applies_from_year": 2026,
      "applies_to_year": null
    }
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
    "section": "16.100. Đăng ký thuế TMĐT: quy trình CV311 và giới hạn khi giao diện thay đổi",
    "ref_id": "16.100",
    "tier": "VERIFIED",
    "text": "## 16.100. Đăng ký thuế TMĐT: quy trình CV311 và giới hạn khi giao diện thay đổi\n- **LEGAL_STATUS:** `VERIFIED_CONDITIONAL` — hướng dẫn CV311/TCT-DNNCN ngày20/01/2025; chưa kiểm tra giao diện live2026.\n- Truy cập canhantmdt.gdt.gov.vn, đăng nhập VNeID mức2 theo hướng dẫn. Hệ thống kiểm tra trạng thái đăng ký: chưa có MST thì hiển thị tờ khai; đã có MST10số nhưng chưa có mã888 thì khai bổ sung theo hướng dẫn hệ thống; đã có mã888 thì dùng thông tin hiện có để khai/nộp.\n- Kiểm tra dữ liệu định danh, địa chỉ hiện tại và thông tin hồ sơ, xác thực OTP, giữ thông báo kết quả. Không đặt tên menu/nút hoặc cam kết tự gửi email nếu tài liệu không mô tả; ưu tiên mục Hướng dẫn sử dụng trên cổng hiện hành khi giao diện khác.\n- CV311 viện TT105/2020 hoặc văn bản thay thế ở thời điểm2025; không coi TT105 và các mẫu cũ trong công văn là mẫu hiện hành vĩnh viễn. Khi CCCD làm định danh thuế, không tự tạo MST độc lập mới hoặc ghép12số+888 và gọi13số; xem16.96.\n- Đăng ký thuế, thông báo doanh thu, quyết toán và nghĩa vụ sàn nộp thay là các việc khác nhau; không yêu cầu nộp lại khoản đã được sàn thực hiện đúng. Xác định loại nghĩa vụ và kỳ trước khi chọn hồ sơ.\n- Nguồn: public/documents/311-TCT-DNNCN-2025-goc.pdf trang4–6; quy định hiện hành về thông báo/quyết toán tại16.42/16.51.\n- **Phân biệt 3 cổng thuế điện tử và ứng dụng eTax Mobile:** (1) `thuedientu.gdt.gov.vn` là cổng dịch vụ thuế điện tử chung (có phân hệ Doanh nghiệp và điều hướng phân hệ Cá nhân); (2) `canhan.gdt.gov.vn` (Thuế điện tử phân hệ Cá nhân) phục vụ cá nhân/HKD kê khai thuế thông thường, cho thuê tài sản, quyết toán TNCN tiền lương; (3) `canhantmdt.gdt.gov.vn` là Cổng thông tin điện tử chuyên biệt dành cho hộ, cá nhân kinh doanh thương mại điện tử và nền tảng số (đăng ký mã phân loại 888, kê khai/tra cứu thuế TMĐT theo CV 311/TCT-DNNCN). Ứng dụng **eTax Mobile** trên điện thoại và các cổng web cùng kết nối hệ thống quản lý thuế của Cục Thuế theo cùng MST/số định danh cá nhân (eTax Mobile tiện tra cứu nghĩa vụ, thông báo tài khoản kinh doanh, đăng ký người phụ thuộc, nộp thuế; cổng web tiện lập tờ khai nhiều phụ lục, tải XML/bảng kê và ký số).\n- **Vai trò của cổng `canhantmdt.gdt.gov.vn` khi sàn TMĐT đã khấu trừ, nộp thuế thay:** Theo Nghị định 252/2026/NĐ-CP và Nghị định 68/2026/NĐ-CP (sửa bởi NĐ 141/2026), đối với các giao dịch đã được sàn TMĐT khấu trừ, kê khai và nộp thuế thay đúng quy định thì người bán không phải tự khai nộp trùng khoản thuế của chính các đơn hàng đó; tuy nhiên cổng `canhantmdt.gdt.gov.vn` vẫn dùng để đăng ký/quản lý mã 888, tra cứu đối soát số thuế sàn đã khấu trừ nộp thay, thông báo doanh thu năm, kê khai doanh thu từ các kênh mạng xã hội/website chưa được khấu trừ thay hoặc thực hiện quyết toán/hoàn thuế nộp thừa khi thuộc diện.\n"
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
    "text": "SAI GIÁ/SỐ TIỀN: căn cứ trực tiếp từ 01/07/2026 là điểm b khoản 1 Điều 10 Thông tư 91/2026/TT-BTC; b.1 điều chỉnh, b.2 thay thế. Lập liên kết với hóa đơn gốc, hồ sơ sai sót và xử lý chênh lệch doanh thu/GTGT theo kỳ phù hợp. Không dùng điểm a (sai tên) hay điểm c khoản 5 (trả hàng) làm căn cứ cho sai giá không trả hàng. Nguồn cơ quan thuế: https://dnieza.dongnai.gov.vn/Pages/newsdetail.aspx?CatId=105&NewsId=5066\nTừ 01/07/2026, điểm a khoản 1 Điều 10 Thông tư 91/2026/TT-BTC: chỉ sai tên/địa chỉ/số tiền bằng chữ hoặc nội dung khác nhưng không sai MST, số tiền, thuế suất, tiền thuế, hàng hóa thì thông báo người mua và gửi Mẫu 04/SS-HĐĐT cho cơ quan thuế; không lập lại hóa đơn thông thường. Nếu sai giá tiền, MST, thuế hoặc hàng hóa thì phải xét nhánh điều chỉnh/thay thế theo Điều 10, không xử lý như chỉ sai tên. Điểm c khoản 1 có quy tắc riêng: hóa đơn từ máy tính tiền hoặc hóa đơn bán tài sản phải đăng ký quyền sở hữu/sử dụng phải lập thay thế, trừ ngoại lệ điểm c.2 khoản 5. Hàng trả lại khác sai giá không trả hàng: giữ liên kết hóa đơn gốc và hồ sơ giao/nhận/hoàn tiền để xác định điều chỉnh/kê khai đúng kỳ. Phải kiểm ngày lập hóa đơn, giao dịch và phát hiện sai: không hồi tố Thông tư 91 để xử lý máy móc hóa đơn trước 01/07/2026; đối chiếu quy định chuyển tiếp và pháp luật hiệu lực tại thời điểm liên quan. Câu hỏi sửa hóa đơn không phải câu hỏi về hạn đăng ký 30 ngày. Nguồn: https://chinhsachonline.chinhphu.vn/hoa-don-tu-may-tinh-tien-sai-ten-dia-chi-co-phai-lap-lai-90814.htm ; https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-254-2026-nd-cp-ve-hoa-don-dien-tu-chung-tu-dien-tu-119260713164251972.htm Nếu hóa đơn tháng 3 và hoàn/điều chỉnh tháng 4/2026: chưa đủ chỉ hai tháng này để chốt kỳ kê khai; phải biết loại thuế, phương pháp, lý do điều chỉnh, hóa đơn gốc, chứng từ trả hàng và quy định hiệu lực trước 01/07/2026. Không viện Thông tư 91 như căn cứ trực tiếp cho tháng 4. Khi chưa có đúng căn cứ thời kỳ trong trích lục, trả lời hướng đối chiếu hồ sơ có điều kiện, không chốt tháng 3 hay tháng 4 hoặc gắn điểm/khoản chưa được chứng minh. Sai giá không đồng nghĩa sai tên; không gắn điểm a khoản 1 cho nhánh sai giá.\n[PHẠM VI KỲ KÊ KHAI] Đã đối chiếu trực tiếp Thông tư 91/2026/TT-BTC, Điều 10, trang 17–22 của PDF chính thức tại public/documents/TT-91-2026-TT-BTC.pdf. Điểm b khoản 1 xử lý hóa đơn sai số tiền/giá bằng điều chỉnh hoặc thay thế. Điểm c khoản 6 yêu cầu điều chỉnh tăng ghi dương, giảm ghi âm theo thực tế. Điểm d khoản 6 CHỈ quy định hóa đơn điều chỉnh thuộc KHOẢN 5: người bán kê khai vào kỳ phát sinh hóa đơn điều chỉnh, người mua vào kỳ nhận được. Khoản 5 có các tình huống thay đổi giá trị/khối lượng qua quyết toán, chiết khấu thương mại, trả lại hàng hóa/dịch vụ, hoàn phí và các tình huống đặc thù được liệt kê. Không tự đồng nhất lỗi sai giá lúc lập hóa đơn thuộc khoản 1 với mọi tình huống tại khoản 5, không ép áp kỳ hiện tại hoặc kỳ gốc chỉ từ chữ điều chỉnh. Với lỗi giá không trả hàng, nêu quy trình/chứng từ và giảm số tiền đúng thực tế trước; để chốt kỳ thuế cụ thể phải đối chiếu thời điểm, phương pháp thuế và quy định khai thuế áp dụng. Thiếu căn cứ chốt kỳ không phải thiếu toàn bộ quy trình. Nguồn chính thức: https://vanban.chinhphu.vn/?docid=219006&pageid=27160 ; hướng dẫn giới hạn khoản 5: https://chinhsachonline.chinhphu.vn/thoi-diem-ke-khai-hoa-don-dieu-chinh-thue-gtgt-91057.htm\n[CHUYỂN TIẾP KHI XỬ LÝ] Khi xử lý sau khi chuyển sang NĐ254/TT91, khoản 2 Điều 24 TT91/2026 phân biệt: hóa đơn theo NĐ51/2010, NĐ04/2014 sai thì thỏa thuận bằng văn bản và lập hóa đơn điện tử thay thế; hóa đơn theo NĐ123/2020, NĐ70/2025, TT32/2025 được điều chỉnh hoặc thay thế theo quy định. Không chỉ dùng ngày hóa đơn gốc để khóa thủ tục cũ. Cần biết thời điểm xử lý, chế độ hóa đơn đang dùng, loại hóa đơn và lỗi. Nguồn: https://congbaocdn.chinhphu.vn/180507251028987904/2026/8/6/470171-1785986965_v1_1786011300_signed.pdf (Điều 24 khoản 2, Điều 25).\n[TRẢ HÀNG KHÁC LỖI GỐC] Điểm c.1 khoản 5 Điều 10 TT91: người bán lập điều chỉnh khi trả hàng; nếu có thỏa thuận người mua lập hóa đơn trả lại thì người mua lập HĐĐT giao người bán. Tài sản đã đăng ký tên người mua xét riêng c.2; giữ hồ sơ trả hàng. Không mặc định trả hàng là sai sót ban đầu để tùy chọn thay thế. Nguồn TT91 chính thức nêu trên.",
    "evidence_mode": "COMPLETE_RULE"
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
    "text": "[PHẠM VI] HĐĐT của hộ/cá nhân kinh doanh theo khoản 5 Điều 8 NĐ68, sửa tại khoản 2 Điều 1 NĐ141; không phải quy định đăng ký hộ kinh doanh.\nCăn cứ trực tiếp: khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP sửa khoản 5 Điều 8 Nghị định 68/2026/NĐ-CP, không phải Điều 9 Nghị định 141. Thời hạn nhánh chuyển ngưỡng là 30 ngày kể từ ngày cuối cùng của kỳ tính thuế có doanh thu lũy kế trên 1 tỷ. Hồ sơ cần kiểm để áp dụng: sổ doanh thu theo tháng/quý, lũy kế từ đầu năm, các khoản hoàn/hủy/điều chỉnh hợp lệ, kỳ đầu vượt và ngày cuối kỳ, tình trạng đăng ký và loại hóa đơn đang dùng.\n[MẪU ĐĂNG KÝ VÀ SỰ CỐ MÁY TÍNH TIỀN] Từ 01/07/2026 theo Điều 6 và Phụ lục III Thông tư 91/2026/TT-BTC (hướng dẫn Nghị định 254/2026/NĐ-CP), hồ sơ đăng ký hoặc thay đổi thông tin sử dụng hóa đơn điện tử dùng Mẫu số 01/ĐKTĐ-HĐĐT tại Phụ lục III Thông tư 91/2026/TT-BTC (nộp qua cổng hóa đơn điện tử hoặc qua tổ chức cung cấp dịch vụ HĐĐT). Phải phân biệt Thông báo tiếp nhận với Thông báo chấp nhận/không chấp nhận: chỉ được xuất hóa đơn sau khi cơ quan thuế có Thông báo chấp nhận đăng ký sử dụng HĐĐT. Khi máy tính tiền (POS) mất mạng hoặc lỗi đường truyền không gửi được dữ liệu HĐĐT về cơ quan thuế: phải tách rõ lỗi kết nối tại điểm bán, lỗi tổ chức cung cấp giải pháp HĐĐT và sự cố hệ thống của cơ quan thuế; giữ nguyên log giao dịch, mã hóa đơn và thời điểm bán hàng trên POS, phối hợp nhà cung cấp giải pháp và thông báo cơ quan thuế theo nhánh sự cố để truyền dữ liệu ngay khi khôi phục; tách nghĩa vụ lập hóa đơn khi bán hàng với nghĩa vụ truyền dữ liệu, không xuất lại hóa đơn mới trùng lặp hoặc lùi ngày hóa đơn.\n[CHỦ THỂ VÀ ĐÃ ĐĂNG KÝ] Nhiều điểm bán xét tổng chủ thể hộ/cá nhân, không một ngưỡng cho mỗi điểm; dùng MST của chủ thể và thông tin địa điểm phù hợp. Đã dùng HĐĐT hợp lệ thì không tự phải đăng ký lại cùng loại chỉ vì vượt ngưỡng, nhưng phải kiểm loại có mã/máy tính tiền kết nối dữ liệu, trạng thái đăng ký và thông tin cần cập nhật.\n[NGOẠI LỆ CẦN KIỂM] Tạm ngừng không tự chứng minh có gia hạn hay dừng đếm hạn: cần ngày tạm ngừng hợp lệ, kỳ vượt, giao dịch phát sinh và căn cứ ngoại lệ, không mặc nhiên cộng thêm số tháng nghỉ. Dự kiến cao không tự là doanh thu đã phát sinh: nếu thực tế cả năm dưới ngưỡng phải kiểm cả nghĩa vụ từ năm trước, đã đăng ký tự nguyện hoặc quy định riêng, và hồ sơ điều chỉnh nếu từng vượt thực tế.\n[SỰ CỐ VẬN HÀNH] Khi cổng lỗi ngày cuối hạn: lưu ảnh có ngày giờ/thông báo lỗi, mã hồ sơ, nhật ký thao tác/nộp lại, email/ticket và xác nhận sự cố nếu có; chủ động báo cơ quan thuế và nộp lại ngay khi khắc phục. Theo khoản 4 Điều 9 Nghị định 125/2020/NĐ-CP, trường hợp vi phạm do sự cố kỹ thuật của hệ thống công nghệ thông tin cơ quan thuế được xác định là sự kiện bất khả kháng và không bị xử phạt vi phạm hành chính về thuế. Nguồn: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm"
  },
  {
    "id": "KB/semantic-topic-supplements#invoice-before-july",
    "file": "KB/semantic-topic-supplements",
    "section": "16.106. Hóa đơn tháng 3/4 năm 2026 — Điều 19 NĐ123 sửa bởi khoản 13 Điều 1 NĐ70/2025",
    "ref_id": "16.106",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "Nếu việc xử lý sai sót thực hiện trước 01/07/2026: đối chiếu Điều 19 Nghị định 123/2020/NĐ-CP, được sửa tại khoản 13 Điều 1 Nghị định 70/2025/NĐ-CP. Trả hàng thực tế thuộc điểm c khoản 4 Điều 19; c.1 cho người bán lập điều chỉnh, trừ thỏa thuận người mua lập hóa đơn trả lại; c.2 có quy tắc cho tài sản đã đăng ký tên người mua. Sai giá/số tiền thuộc điểm b khoản 1, không phải nhánh trả hàng: người bán có thể lựa chọn điều chỉnh (b.1) hoặc thay thế (b.2). Không chốt bắt buộc chỉ điều chỉnh khi chưa có dữ kiện/ngoại lệ hạn chế lựa chọn. Cần hóa đơn gốc, thời điểm lập chứng từ điều chỉnh/thay thế, hồ sơ sai sót và phương pháp/kỳ kê khai trước khi chốt kỳ thuế. Chỉ yêu cầu hồ sơ trả hàng khi thực tế có trả hàng; người dùng đã xác nhận không trả hàng thì không yêu cầu hồ sơ này. Nếu cả việc lập và xử lý diễn ra tháng 3/4/2026 thì không dùng TT91 làm căn cứ trực tiếp; nếu xử lý sau chuyển chế độ thì phải xét chuyển tiếp bên dưới. Nguồn: https://baochinhphu.vn/nhung-noi-dung-moi-cua-nghi-dinh-so-70-2025-nd-cp-ve-hoa-don-chung-tu-102250903091616929.htm ; https://dnieza.dongnai.gov.vn/Pages/newsdetail.aspx?CatId=105&NewsId=5066\n[CHUYỂN TIẾP KHI XỬ LÝ] Khi xử lý sau khi chuyển sang NĐ254/TT91, khoản 2 Điều 24 TT91/2026 phân biệt: hóa đơn theo NĐ51/2010, NĐ04/2014 sai thì thỏa thuận bằng văn bản và lập hóa đơn điện tử thay thế; hóa đơn theo NĐ123/2020, NĐ70/2025, TT32/2025 được điều chỉnh hoặc thay thế theo quy định. Không chỉ dùng ngày hóa đơn gốc để khóa thủ tục cũ. Cần biết thời điểm xử lý, chế độ hóa đơn đang dùng, loại hóa đơn và lỗi. Nguồn: https://congbaocdn.chinhphu.vn/180507251028987904/2026/8/6/470171-1785986965_v1_1786011300_signed.pdf (Điều 24 khoản 2, Điều 25).",
    "evidence_mode": "COMPLETE_RULE"
  },
  {
    "id": "KB/business-registration#exemption-and-online-freelance",
    "file": "KB/business-registration",
    "section": "16.107. Đăng ký kinh doanh: trường hợp không bắt buộc đăng ký và hoạt động affiliate, online, thu nhập thấp",
    "ref_id": "16.107",
    "tier": "VERIFIED",
    "text": "[THỜI KỲ] Đăng ký hộ kinh doanh từ 01/07/2025: khoản 3 và khoản 4 Điều 82, Điều 83 Nghị định 168/2025/NĐ-CP.\n[NGOẠI LỆ CÓ ĐIỀU KIỆN] Khoản 3 Điều 82 quy định hộ gia đình sản xuất nông, lâm, ngư nghiệp, làm muối; người bán hàng rong, quà vặt, buôn chuyến, kinh doanh lưu động, kinh doanh thời vụ, làm dịch vụ có thu nhập thấp không phải đăng ký hộ kinh doanh, trừ ngành, nghề đầu tư kinh doanh có điều kiện. UBND tỉnh, thành phố trực thuộc trung ương quy định mức thu nhập thấp áp dụng tại địa phương.\n[TỰ NGUYỆN] Khoản 4 cho phép các đối tượng này đăng ký nếu có nhu cầu. Điều 83 quy định nghĩa vụ đăng ký và không được hoạt động dưới danh nghĩa hộ kinh doanh mà không đăng ký.\n[KHÔNG ĐƯỢC SUY RA] Không có căn cứ trong các điều này để coi mọi hoạt động online/affiliate, không có địa điểm cố định hoặc một mức tiền nhỏ bất kỳ đều tự động được miễn đăng ký.\n[DỮ KIỆN CẦN BIẾT] Muốn áp dụng ngoại lệ phải xác định tính chất hoạt động và, nếu dựa vào dịch vụ thu nhập thấp, địa phương cùng mức thu nhập thấp đang có hiệu lực tại đó. Chưa biết thì trình bày các nhánh điều kiện và hỏi bổ sung, không kết luận tuyệt đối. Ngưỡng miễn thuế và việc bên trả thu nhập khấu trừ không thay thế điều kiện miễn đăng ký kinh doanh.\n[GIỚI HẠN] Nguồn này không xác định nghĩa vụ khấu trừ hay mức thuế và không dùng cho thời kỳ trước 01/07/2025. Nguồn: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-168-2025-nd-cp-ve-dang-ky-doanh-nghiep-119250702175708554.htm"
  },
  {
    "id": "KB/semantic-topic-supplements#registration-subject-and-tax-path",
    "file": "KB/semantic-topic-supplements",
    "section": "16.108. Hộ kinh doanh và cá nhân kinh doanh: khái niệm, đăng ký hộ và đăng ký thuế",
    "ref_id": "16.108",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[RANH GIỚI ÁP DỤNG] Nội dung định nghĩa và thủ tục thuế trực tiếp không chứng minh người hỏi đã thành lập hộ. Phần thủ tục riêng của hình thức hộ được lưu riêng; chỉ áp khi đúng trạng thái hoặc người hỏi đang muốn thành lập hộ.\n[KHÁI NIỆM] Cá nhân kinh doanh là cá nhân có hoạt động sản xuất, kinh doanh hàng hóa hoặc cung cấp dịch vụ. Trong phạm vi thuế TNCN của cá nhân cư trú, khoản 1 Điều 4 Nghị định 68/2026/NĐ-CP bao gồm cả cá nhân đăng ký thành lập hộ kinh doanh và người được các thành viên hộ gia đình ủy quyền làm đại diện hộ kinh doanh. Đây là cách nhận diện chủ thể hoạt động kinh doanh trong quản lý thuế, không chỉ riêng người chưa đăng ký hộ. Không lấy mức doanh thu hay số người cùng làm để định nghĩa chủ thể; điều kiện nộp thuế và đăng ký là vấn đề riêng. Nguồn giải thích của Cục Thuế: https://xaydungchinhsach.chinhphu.vn/chinh-sach-thue-gia-tri-gia-tang-thue-thu-nhap-ca-nhan-cac-khoan-thue-khac-119260316093129828.htm .\n[PHÂN BIỆT CHỦ THỂ] Không coi HKD và CNKD là hai giấy phép thay thế tùy chọn. Khoản 1 Điều 82 NĐ168/2025: hộ kinh doanh có thể do một cá nhân hoặc các thành viên hộ gia đình thành lập. Vì vậy không phân loại làm riêng thành CNKD, làm chung gia đình thành HKD. Cá nhân có hoạt động kinh doanh là chủ thể quản lý thuế; việc gọi là CNKD chưa chứng minh được miễn đăng ký hộ.\n[LUỒNG THỦ TỤC] Khoản 1 Điều 85 NĐ168: giấy chứng nhận đăng ký hộ đồng thời là giấy chứng nhận đăng ký thuế. Hoạt động thuộc diện không phải đăng ký hộ theo khoản 3 Điều 82 vẫn phải xét đăng ký thuế trực tiếp; không phải giấy phép kinh doanh mới tên CNKD. Thông tư 90/2026/TT-BTC áp dụng đăng ký thuế từ 01/07/2026. Nguồn cơ quan thuế minh họa: hoạt động mới được miễn đăng ký hộ thì bổ sung thông tin đăng ký thuế; nếu phải đăng ký hộ thì thực hiện tại cơ quan đăng ký kinh doanh cấp xã.\n[ĐĂNG KÝ THUẾ TRỰC TIẾP LẦN ĐẦU] Theo khoản 3 Điều 6 Nghị định 252/2026/NĐ-CP và Điều 21 Thông tư 90/2026/TT-BTC (hiệu lực từ 01/07/2026, thay thế Thông tư 86/2024/TT-BTC): cá nhân kinh doanh thuộc diện không phải đăng ký hộ kinh doanh thực hiện đăng ký thuế trực tiếp trong 10 ngày làm việc kể từ ngày bắt đầu hoạt động kinh doanh hoặc phát sinh nghĩa vụ bằng tờ khai Mẫu số 03-ĐKT (hoặc hồ sơ khai thuế tích hợp đăng ký thuế); có địa điểm cố định thì nộp tại Thuế cơ sở nơi đặt địa điểm, không có địa điểm cố định thì nộp tại Thuế cơ sở nơi cá nhân cư trú, riêng cá nhân chỉ cho thuê bất động sản thì nộp tại Thuế cơ sở nơi có bất động sản cho thuê.\n[TRỌNG TÂM] Câu hỏi tổng quát cần đăng ký gì hoặc so sánh chưa rõ loại đăng ký: giải thích quan hệ và hai luồng trên trước khi hỏi lại, không chỉ liệt kê trường hợp miễn đăng ký hộ. Miễn đăng ký hộ không đồng nghĩa miễn thuế. Không tự suy nghĩa vụ từ riêng doanh thu hoặc kênh online. Nguồn: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-168-2025-nd-cp-ve-dang-ky-doanh-nghiep-119250702175708554.htm ; https://baochinhphu.vn/ke-khai-thue-doi-voi-ca-nhan-kinh-doanh-da-linh-vuc-102260929171744114.htm",
    "purpose_passages": {
      "DEFINITION": "[KHÁI NIỆM] Cá nhân kinh doanh là cá nhân có hoạt động sản xuất, kinh doanh hàng hóa hoặc cung cấp dịch vụ. Trong phạm vi thuế TNCN của cá nhân cư trú, khoản 1 Điều 4 Nghị định 68/2026/NĐ-CP bao gồm cả cá nhân đăng ký thành lập hộ kinh doanh và người được các thành viên hộ gia đình ủy quyền làm đại diện hộ kinh doanh. Đây là cách nhận diện chủ thể hoạt động kinh doanh trong quản lý thuế, không chỉ riêng người chưa đăng ký hộ. Không lấy mức doanh thu hay số người cùng làm để định nghĩa chủ thể; điều kiện nộp thuế và đăng ký là vấn đề riêng. Nguồn giải thích của Cục Thuế: https://xaydungchinhsach.chinhphu.vn/chinh-sach-thue-gia-tri-gia-tang-thue-thu-nhap-ca-nhan-cac-khoan-thue-khac-119260316093129828.htm .\n[PHÂN BIỆT CHỦ THỂ] Không coi HKD và CNKD là hai giấy phép thay thế tùy chọn. Khoản 1 Điều 82 NĐ168/2025: hộ kinh doanh có thể do một cá nhân hoặc các thành viên hộ gia đình thành lập. Vì vậy không phân loại làm riêng thành CNKD, làm chung gia đình thành HKD. Cá nhân có hoạt động kinh doanh là chủ thể quản lý thuế; việc gọi là CNKD chưa chứng minh được miễn đăng ký hộ.\n[LUỒNG THỦ TỤC] Khoản 1 Điều 85 NĐ168: giấy chứng nhận đăng ký hộ đồng thời là giấy chứng nhận đăng ký thuế. Hoạt động thuộc diện không phải đăng ký hộ theo khoản 3 Điều 82 vẫn phải xét đăng ký thuế trực tiếp; không phải giấy phép kinh doanh mới tên CNKD. Thông tư 90/2026/TT-BTC áp dụng đăng ký thuế từ 01/07/2026. Nguồn cơ quan thuế minh họa: hoạt động mới được miễn đăng ký hộ thì bổ sung thông tin đăng ký thuế; nếu phải đăng ký hộ thì thực hiện tại cơ quan đăng ký kinh doanh cấp xã."
    },
    "evidence_mode": "COMPLETE_RULE"
  },
  {
    "id": "KB/business-lifecycle#cessation",
    "file": "KB/business-lifecycle",
    "section": "16.109. Chấm dứt hoạt động cá nhân/hộ kinh doanh: hồ sơ, nghĩa vụ, thời hạn và mã thuế cá nhân",
    "ref_id": "16.109",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[PHẠM VI] Thủ tục kết thúc hoạt động kinh doanh đã đăng ký, thường được người dùng gọi hủy đăng ký cá nhân kinh doanh, nghỉ bán hẳn hoặc đóng mã thuế kinh doanh. Không phải đăng ký mới, không phải điều kiện miễn đăng ký hộ. Tạm nghỉ để bán lại, hủy hồ sơ đăng ký đang chờ duyệt, hủy tờ khai/hóa đơn là các việc khác; không tự áp thủ tục chấm dứt cho các việc này. Không khẳng định dễ hay chỉ nộp một đơn là xong khi chưa biết nghĩa vụ còn tồn.\n[CÁ NHÂN ĐĂNG KÝ THUẾ TRỰC TIẾP] Khoản 5 Điều 27 Thông tư 90/2026/TT-BTC: hồ sơ chấm dứt hiệu lực mã số thuế của hộ gia đình, cá nhân kinh doanh thuộc điểm a, d khoản 1 Điều 27 là Văn bản đề nghị chấm dứt hiệu lực mã số thuế mẫu số 24/ĐKT. Gửi cơ quan thuế quản lý trực tiếp để thực hiện thủ tục, phối hợp đối soát các nghĩa vụ; không bắt người không có giấy hộ đi trả giấy hộ. Không nhầm mẫu 03-ĐKT đăng ký lần đầu với mẫu 24/ĐKT chấm dứt.\n[NGHĨA VỤ] Khoản 1 Điều 28: hoàn thành nghĩa vụ hóa đơn nếu có sử dụng; hoàn thành nộp hồ sơ khai thuế, nộp thuế và xử lý số tiền thuế nộp thừa theo điểm d.1 khoản 1 Điều 7 Nghị định 252/2026/NĐ-CP. Cần đối soát hồ sơ còn thiếu, số còn nợ/tiền chậm nộp, tiền phạt nếu có và số nộp thừa, không tự coi đã dừng bán là hết nghĩa vụ.\n[MÃ THUẾ CÁ NHÂN] Khoản 4 Điều 28: chấm dứt hiệu lực sử dụng mã số thuế đối với hoạt động kinh doanh không chấm dứt mã số thuế của chủ hộ/cá nhân; mã cá nhân tiếp tục dùng cho nghĩa vụ thuế khác. Không nói nghỉ affiliate làm mất mã thuế tiền lương hay hủy số định danh cá nhân.\n[THỜI HẠN CÓ ĐIỀU KIỆN] Điểm a.1 khoản 1 Điều 29: trong 02 ngày làm việc kể từ nhận đủ hồ sơ theo quy định hoặc thông tin đăng ký kinh doanh, cơ quan thuế ban hành mẫu 17/TB-ĐKT về ngừng hoạt động và đang làm thủ tục; đây chưa phải hoàn tất. Điểm a.5 khoản 1 Điều 29: mẫu 18/TB-ĐKT được ban hành trong 03 ngày làm việc kể từ khi người nộp thuế đã hoàn thành nghĩa vụ thuế đối với hoạt động kinh doanh. Không hứa toàn bộ thủ tục xong trong 03 ngày từ lúc nộp hồ sơ; thời gian xử lý tồn đọng/kiểm tra khác thời hạn ra thông báo sau đủ điều kiện.\n[NẾU CÓ GIẤY HỘ] Khoản 4 Điều 27 Thông tư 90: trước hồ sơ chấm dứt tại cơ quan đăng ký kinh doanh, hộ kinh doanh nộp mẫu 24/ĐKT đến cơ quan thuế quản lý trực tiếp và hoàn thành nghĩa vụ. Sau đó thực hiện chấm dứt hộ tại cơ quan đăng ký kinh doanh cấp xã theo Điều 104 Nghị định 168/2025/NĐ-CP, đọc cùng văn bản sửa đổi hiện hành. Chỉ nêu nhánh này khi người dùng có giấy hộ hoặc cần phân biệt thủ tục; không biến câu hỏi cá nhân trực tiếp thành bài đăng ký hộ.\n[ĐỊA ĐIỂM VÀ KÊNH NỘP] Khoản 8 Điều 27, khoản 5 Điều 28: dừng một địa điểm phải thông báo cơ quan thuế quản lý trực tiếp trụ sở, hoàn thành nghĩa vụ liên quan địa điểm; dừng toàn bộ thì chấm dứt tại trụ sở và tất cả địa điểm. Nếu chỉ bỏ trụ sở nhưng còn điểm khác thì làm thay đổi trụ sở, không tự đóng toàn bộ. Kho tri thức này chưa xác minh thao tác và khả năng nộp mẫu 24/ĐKT trên từng cổng/app hiện tại; không khẳng định nút bấm hay cổng nào chắc chắn hỗ trợ. Không tự nói nợ môn bài các năm trước được xóa vì bỏ thu từ năm 2026.\n[THỜI KỲ] Thông tư 90/2026/TT-BTC hiệu lực 01/07/2026; hồ sơ cũ phải đối chiếu quy định chuyển tiếp, không hồi tố quy trình này. Đã đọc bản PDF trong public/documents/TT-90-2026-TT-BTC.pdf trang 61–64 và đối chiếu bản công bố chính thức ngày 18/10/2026. Nguồn: https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/7/90-btc.signed.pdf ; https://chinhphu.vn/?classid=1&docid=218839&orggroupid=4&pageid=27160 ; hướng dẫn nhánh hộ: https://xaydungchinhsach.chinhphu.vn/huong-dan-chi-tiet-ho-kinh-doanh-trang-thai-06-thuoc-dien-lien-thong-muon-giai-the-cham-dut-hoat-dong-119260806104617053.htm"
  },
  {
    "id": "KB/operational-expansion#16.80",
    "file": "KB/operational-expansion",
    "ref_id": "16.80",
    "section": "16.80. Đăng ký sử dụng HĐĐT: mẫu 01/ĐKTĐ-HĐĐT và tiếp nhận khác chấp thuận",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[PHẠM VI] Thủ tục đăng ký sử dụng hóa đơn điện tử từ 01/07/2026, khác nghĩa vụ phải đăng ký trong 30 ngày khi vượt ngưỡng. Điều 6 Thông tư 91/2026/TT-BTC: hộ/cá nhân kinh doanh không thuộc diện ngừng, tạm ngừng sử dụng hóa đơn đăng ký qua tổ chức cung cấp dịch vụ HĐĐT; nhánh được miễn phí dịch vụ có kênh cơ quan thuế theo điều kiện nguồn.\n[HỒ SƠ] Nội dung đăng ký theo Mẫu số 01/ĐKTĐ-HĐĐT Phụ lục III Thông tư 91. Đối chiếu thông tin chủ thể, mã số thuế/số định danh, địa chỉ, hình thức hóa đơn, chứng thư số/phương thức xác thực và thông tin liên hệ theo mẫu; không tự mặc định mọi hộ dùng cùng loại hóa đơn hoặc đều được miễn phí.\n[KẾT QUẢ] Thông báo 01/TB-TNĐT là tiếp nhận/không tiếp nhận hồ sơ; không phải Thông báo chấp nhận/không chấp nhận đăng ký 01/TB-ĐKĐT. Khoản 2 Điều 6 có bước đối chiếu dữ liệu và xác thực liên hệ trong 01 ngày làm việc, nhánh phù hợp được chấp nhận; nhánh rủi ro/không khớp có thể phải giải trình hoặc xác minh. Không hứa tất cả hồ sơ được duyệt trong một ngày. Nếu bị từ chối, đọc lý do trong thông báo, sửa dữ liệu thật và gửi đúng thủ tục, không tự lập mã mới để lách.\n[GIỚI HẠN] Không bịa màn hình/nút bấm của nhà cung cấp, không xem mua gói hóa đơn là đã được cơ quan thuế chấp thuận. Thủ tục không tự hợp thức hóa hóa đơn lập muộn hay nguồn gốc hàng hóa.\n[NGUỒN] https://vanban.chinhphu.vn/?docid=219006&pageid=27160. Đối chiếu public/documents/TT-91-2026-TT-BTC.pdf, trang 6–9; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.110",
    "file": "KB/operational-expansion",
    "ref_id": "16.110",
    "section": "16.110. Tạm ngừng và tiếp tục kinh doanh: trực tiếp với thuế khác liên thông",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[PHÂN BIỆT] Tạm ngừng để sau đó tiếp tục không phải chấm dứt hẳn hoặc xóa mã thuế. Điều 25–26 Thông tư 90/2026/TT-BTC tách người không thuộc diện đăng ký kinh doanh với hộ đăng ký liên thông.\n[TRỰC TIẾP] Hộ gia đình/cá nhân kinh doanh thuộc diện không phải đăng ký kinh doanh gửi Thông báo mẫu 23/ĐKT đến cơ quan thuế quản lý trực tiếp theo thời hạn tại điểm đ.2 khoản 4 hoặc khoản 3 Điều 5 Nghị định 252/2026/NĐ-CP. Khoản 1 Điều 26: cơ quan thuế gửi thông báo chấp thuận/không chấp thuận mẫu 27/TB-ĐKT trong 02 ngày làm việc từ khi nhận đủ hồ sơ. Mốc này là xử lý hồ sơ, không tự thay thời hạn báo trước.\n[LIÊN THÔNG] Hộ đăng ký thuế cùng đăng ký kinh doanh làm thủ tục tạm ngừng/tiếp tục theo luồng đăng ký kinh doanh; cơ quan thuế cập nhật từ giao dịch liên thông, không bắt gửi lại như cá nhân trực tiếp. Nếu đã bị thông báo không hoạt động tại địa chỉ thì phải xử lý khôi phục theo nhánh tương ứng trước, không dùng thông báo tạm ngừng để xóa trạng thái.\n[NGHĨA VỤ] Không tự suy ngừng bán hoặc tắt gian hàng là tạm ngừng hợp lệ; việc miễn nộp hồ sơ trong thời gian nghỉ còn phụ thuộc quy định, kỳ nghỉ và giao dịch thực tế. Nghĩa vụ các kỳ trước không tự mất. Hỏi loại đăng ký và khoảng thời gian dự kiến nghỉ nếu chưa rõ.\n[NGUỒN] https://chinhphu.vn/?classid=1&docid=218839&orggroupid=4&pageid=27160. Đối chiếu public/documents/TT-90-2026-TT-BTC.pdf, trang 60–61; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.111",
    "file": "KB/operational-expansion",
    "ref_id": "16.111",
    "section": "16.111. Chuyển địa chỉ và thay đổi cơ quan thuế: hồ sơ nơi đi/nơi đến",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[PHÂN LUỒNG] Điều 23–24 Thông tư 90/2026/TT-BTC: xác định đăng ký liên thông hay đăng ký thuế trực tiếp, đổi trụ sở hay một địa điểm, có đổi cơ quan thuế quản lý hay chỉ thay địa giới hành chính. Không tự kết luận mọi đổi địa chỉ phải đóng mã cũ và xin mã mới.\n[TRỰC TIẾP] Nếu đổi trụ sở làm đổi cơ quan thuế quản lý, tại nơi đi nộp tờ khai điều chỉnh/bổ sung thông tin đăng ký thuế mẫu 08-MST; tại nơi đến nộp Văn bản đăng ký chuyển địa điểm mẫu 30/ĐKT trong 10 ngày làm việc từ ngày nơi đi ban hành Thông báo chuyển địa điểm mẫu 09-MST (khoản 3 Điều 23). Không gán thời hạn này cho mọi thay đổi địa chỉ.\n[LIÊN THÔNG] Khoản 2 Điều 23: hộ nộp hồ sơ chuyển cơ quan quản lý tại nơi đi trước khi thay đổi trụ sở với cơ quan đăng ký kinh doanh; sau khi nhận 09-MST thì làm thay đổi đăng ký kinh doanh theo luồng của hộ.\n[NGHĨA VỤ] Điều 24 bỏ yêu cầu phải hoàn thành nghĩa vụ nơi đi trước khi chuyển, nhưng không xóa nợ; các khoản phải nộp/chưa hoàn thành và nộp thừa được chuyển, xử lý theo quy định. Dữ liệu dân cư/địa giới thay đổi không tự chứng minh địa điểm kinh doanh thực đã đổi. Khi dữ liệu hai cổng khác nhau, giữ hồ sơ thông báo và đề nghị đối soát, không tự bịa thao tác sửa ứng dụng.\n[NGUỒN] https://chinhphu.vn/?classid=1&docid=218839&orggroupid=4&pageid=27160. Đối chiếu public/documents/TT-90-2026-TT-BTC.pdf, trang 56–60; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.112",
    "file": "KB/operational-expansion",
    "ref_id": "16.112",
    "section": "16.112. Khôi phục mã thuế khi bị thông báo không hoạt động tại địa chỉ",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[ĐIỀU KIỆN] Hướng dẫn Cục Thuế về doanh nghiệp/hộ không hoạt động tại địa chỉ đã đăng ký: xác định còn đủ điều kiện khôi phục, tình trạng giấy đăng ký và trạng thái thực tế; không đồng nhất mã 03 đang chấm dứt với mã 06 hoặc mọi hồ sơ đã chấm dứt hoàn toàn.\n[HỒ SƠ VÀ TRÌNH TỰ] Người đại diện/chủ hộ hoặc người được ủy quyền hợp pháp nộp mẫu 25/ĐKT theo Thông tư 90/2026/TT-BTC tại cơ quan thuế quản lý trực tiếp. Phối hợp xác minh địa chỉ, cung cấp hồ sơ chứng minh hoạt động và hoàn thành nghĩa vụ còn tồn theo thông báo. Đổi địa chỉ thì đồng thời hoàn thiện đúng luồng đăng ký, không chỉ sửa tên trên ứng dụng.\n[THỜI GIAN] Trong 10 ngày làm việc từ khi nhận đủ hồ sơ, cơ quan thuế lập danh sách nghĩa vụ cần hoàn thành theo mẫu 19.1/TB-ĐKT. Đây không phải cam kết khôi phục xong sau 10 ngày. Khi hoàn thành nghĩa vụ và đủ điều kiện, cơ quan thuế ban hành 19/TB-ĐKT; kiểm tra cập nhật trạng thái và liên thông. Không coi hết nợ là tự động khôi phục hoặc bảo đảm được xuất hóa đơn ngay.\n[NGUỒN] https://xaydungchinhsach.chinhphu.vn/huong-dan-doanh-nghiep-ho-kinh-doanh-khong-hoat-dong-tai-dia-chi-da-dang-ky-khoi-phuc-ma-so-thue-11926080611345084.htm. Đối chiếu Hướng dẫn chính thức Cục Thuế công bố 06/08/2026; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.113",
    "file": "KB/operational-expansion",
    "ref_id": "16.113",
    "section": "16.113. Mã thuế cũ, số định danh và thông tin không khớp: sửa dữ liệu trước khi đăng ký lại",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[NGUYÊN TẮC] Khoản 1 Điều 11 Luật Quản lý thuế 108/2025/QH15 quy định mã số thuế của cá nhân, hộ/cá nhân kinh doanh là số định danh cá nhân tương ứng. Các mã/đuôi quản lý đang hiển thị không tự là nhiều cá nhân độc lập, không tự tạo nhiều ngưỡng miễn thuế.\n[ĐỐI SOÁT] Khi CCCD, mã cũ, tên hoặc địa chỉ trên eTax/cổng thuế/giấy đăng ký không khớp: xác định đúng người và vai trò của mỗi mã, trạng thái hoạt động, hồ sơ đã nộp và thông tin dân cư trước khi yêu cầu điều chỉnh theo Điều 23–24 Thông tư 90/2026. Không khuyên đóng mã bất kỳ hoặc xin thêm mã để vượt lỗi đăng nhập; việc đổi thông tin không tự xóa nghĩa vụ cũ.\n[HÓA ĐƠN] Điểm i khoản 1 Điều 8 Thông tư 91/2026: hộ/cá nhân đã được cấp mã trước 01/07/2025 mà thông tin không khớp/không đầy đủ được yêu cầu bổ sung trong 10 ngày làm việc; quá hạn không thực hiện có thể bị tạm ngừng sử dụng HĐĐT. Không biến mốc này thành hạn chung xử lý mọi lỗi CCCD. Không bịa quy trình OTP hoặc yêu cầu người dùng cung cấp mật khẩu.\n[NGUỒN] https://vanban.chinhphu.vn/?docid=219006&pageid=27160. Đối chiếu public/documents/TT-91-2026-TT-BTC.pdf, trang 12; đọc cùng Luật108 Điều11 và TT90 Điều23–24; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.114",
    "file": "KB/operational-expansion",
    "ref_id": "16.114",
    "section": "16.114. Thay đổi đăng ký hóa đơn và lý do hồ sơ bị yêu cầu giải trình",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[THAY ĐỔI] Khoản 4 Điều 6 Thông tư 91/2026/TT-BTC: thay đổi thông tin đăng ký sử dụng HĐĐT (không thuộc ngừng/tạm ngừng theo Điều 8) dùng Mẫu 01/ĐKTĐ-HĐĐT qua hệ thống quản lý thuế hoặc tổ chức dịch vụ; xử lý theo khoản 2 Điều 6. Sửa đăng ký không tự sửa các hóa đơn đã phát hành.\n[RỦI RO] Điều 7 quy định tiêu chí rủi ro trong đăng ký hóa đơn, gồm một số quan hệ về chủ sở hữu/người đại diện với chủ thể ngừng, chưa hoàn tất nghĩa vụ hoặc vi phạm; có trường hợp yêu cầu giải trình/xác minh. Không kết luận hồ sơ bị từ chối chắc chắn do lỗi phần mềm hoặc người dùng đã vi phạm chỉ từ một mã lỗi.\n[XỬ LÝ] Đọc thông báo chấp nhận/không chấp nhận hoặc yêu cầu giải trình, xác định thông tin nào không khớp và trạng thái liên quan; chuẩn bị tài liệu thực tế theo đúng yêu cầu. Nhánh yêu cầu giải trình ở điểm c khoản 2 Điều 6 có thời hạn 03 ngày làm việc từ nhận thông báo. Không hứa nộp lại nhiều lần sẽ tự được duyệt, không tự đổi MST để né đối chiếu.\n[NGUỒN] https://vanban.chinhphu.vn/?docid=219006&pageid=27160. Đối chiếu public/documents/TT-91-2026-TT-BTC.pdf, trang 7–11; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.115",
    "file": "KB/operational-expansion",
    "ref_id": "16.115",
    "section": "16.115. Ngừng/tạm ngừng hóa đơn và điều kiện tiếp tục sử dụng",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[PHẠM VI] Điều 8 Thông tư 91/2026/TT-BTC quy định ngừng/tạm ngừng HĐĐT do chấm dứt mã thuế, không hoạt động tại địa chỉ, tạm ngừng kinh doanh, cưỡng chế hoặc trường hợp vi phạm/rủi ro và thông tin định danh theo nguồn. Hủy hợp đồng với nhà cung cấp chữ ký số/phần mềm không tự hoàn thành thủ tục thuế.\n[KHÔNG ĐỒNG NHẤT] Giảm doanh thu xuống dưới ngưỡng không tự cho phép bỏ nghĩa vụ lập hóa đơn của người đã đăng ký. Chuyển hình thức máy tính tiền do đổi ngành phải xét điểm h khoản 1 Điều 8; không coi mọi hộ doanh thu nhỏ bị ngừng là đúng hay sai nếu chưa đọc thông báo.\n[TIẾP TỤC] Khoản 3 Điều 8: được tiếp tục sử dụng sau thông báo tiếp tục kinh doanh, khôi phục mã thuế, chấm dứt hiệu lực quyết định cưỡng chế hoặc điều kiện tương ứng được cơ quan thuế xác nhận. Chỉ trả lời đúng nhánh của thông báo; không hứa cứ nộp hết tiền là xuất được ngay. Trong thời gian giải trình có thể có cơ chế hóa đơn từng lần theo nguồn, không tự in hóa đơn thay thế.\n[NGUỒN] https://vanban.chinhphu.vn/?docid=219006&pageid=27160. Đối chiếu public/documents/TT-91-2026-TT-BTC.pdf, trang 11–14; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.116",
    "file": "KB/operational-expansion",
    "ref_id": "16.116",
    "section": "16.116. Ủy nhiệm lập HĐĐT cho bên thứ ba/nền tảng khác với sàn nộp thuế thay",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[ĐIỀU KIỆN] Điều 9 Thông tư 91/2026/TT-BTC: người bán được ủy nhiệm bên thứ ba đủ điều kiện sử dụng HĐĐT; các bên không thuộc diện ngừng/tạm ngừng sử dụng hóa đơn. Việc ủy nhiệm phải bằng văn bản và thông báo với cơ quan thuế khi đăng ký/thay đổi đăng ký; không tự phát sinh chỉ vì sàn đã thu tiền hoặc khấu trừ thuế.\n[THỎA THUẬN] Khoản 2 yêu cầu thông tin các bên, loại/ký hiệu/mẫu hóa đơn, mục đích, thời hạn, phương thức thanh toán hóa đơn ủy nhiệm và trách nhiệm theo quy định. Các bên lưu văn bản, cung cấp khi cơ quan có thẩm quyền yêu cầu.\n[HÓA ĐƠN] Hóa đơn thể hiện thông tin bên ủy nhiệm và bên nhận ủy nhiệm; phải phù hợp phương pháp GTGT của bên ủy nhiệm. Không biến hóa đơn bán hàng của hộ thành hóa đơn GTGT khấu trừ chỉ vì bên lập thay là công ty. Với hộ/cá nhân ủy nhiệm tổ chức kinh tế, đọc cơ chế thông báo tại điểm c khoản 3 Điều 9. Không khẳng định mọi sàn đã có dịch vụ này cho mọi tài khoản.\n[NGUỒN] https://vanban.chinhphu.vn/?docid=219006&pageid=27160. Đối chiếu public/documents/TT-91-2026-TT-BTC.pdf, trang 15–16; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.117",
    "file": "KB/operational-expansion",
    "ref_id": "16.117",
    "section": "16.117. Hóa đơn máy tính tiền và hóa đơn có mã thông thường: xác định đúng đối tượng",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Điểm c khoản 1 Điều 6 Nghị định 254/2026/NĐ-CP quy định nhóm bán hàng/cung cấp dịch vụ trực tiếp đến người tiêu dùng, gồm bán lẻ theo phạm vi loại trừ, ăn uống, nhà hàng, khách sạn, vận tải hành khách và các nhóm được liệt kê, sử dụng HĐĐT từ máy tính tiền. Không áp chỉ vì hoạt động được gọi bán online hoặc có số tiền lớn.\n[NGOẠI LỆ] Cùng điểm c: người có hoạt động trực tiếp đến người tiêu dùng đã đăng ký sử dụng HĐĐT có mã hoặc không có mã thì không bắt buộc đăng ký sử dụng hóa đơn từ máy tính tiền. Phải xác định loại hóa đơn đã đăng ký và trường hợp thực tế, không bỏ ngoại lệ rồi bắt mọi người chuyển.\n[TÁCH NGHĨA VỤ] Điểm d khoản 1 Điều 6 có quy định về hộ/cá nhân doanh thu năm trên 1 tỷ hoặc bán tài sản phải đăng ký quyền. Phân biệt có bắt buộc dùng HĐĐT với hình thức áp dụng, quyền tự nguyện và thời hạn chuyển ngưỡng ở nguồn riêng. Không dùng lựa chọn loại hóa đơn để kết luận phương pháp TNCN hay thuế suất ngành.\n[NGUỒN] https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-254-2026-nd-cp-ve-hoa-don-dien-tu-chung-tu-dien-tu-119260713164251972.htm. Đối chiếu public/documents/ND-254-2026-ND-CP.pdf, trang 8–9; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.118",
    "file": "KB/operational-expansion",
    "ref_id": "16.118",
    "section": "16.118. Hóa đơn theo từng lần khi tạm ngừng hoặc đang chấm dứt hoạt động",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[PHẠM VI] Khoản 2 Điều 6 Nghị định 254/2026/NĐ-CP phân nhánh cơ quan thuế cấp HĐĐT có mã theo từng lần phát sinh. Với hộ/cá nhân áp dụng GTGT trực tiếp: xét hóa đơn bán hàng theo điểm a.2; không mặc định hóa đơn GTGT của phương pháp khấu trừ.\n[TÌNH HUỐNG] Các nhánh gồm ngừng hoạt động nhưng chưa hoàn tất chấm dứt mã có thanh lý tài sản/hàng hóa cần hóa đơn; tạm ngừng nhưng cần hóa đơn thực hiện hợp đồng đã ký trước ngày cơ quan có thẩm quyền thông báo tạm ngừng; bị cưỡng chế ngừng hóa đơn; và trường hợp khác được liệt kê. Không tự suy mọi giao dịch mới trong kỳ nghỉ đều được cấp hóa đơn.\n[THỰC HIỆN] Đối chiếu trạng thái, hợp đồng, ngày ký và nghĩa vụ khai/nộp với cơ quan thuế trước khi xin cấp theo từng lần. Đây là cơ chế có điều kiện, không phải quyền tự xuất bằng phần mềm đang bị khóa; không hứa cấp tự động hoặc dùng một hóa đơn gộp để hợp thức hóa mọi giao dịch cũ.\n[NGUỒN] https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-254-2026-nd-cp-ve-hoa-don-dien-tu-chung-tu-dien-tu-119260713164251972.htm. Đối chiếu public/documents/ND-254-2026-ND-CP.pdf, trang 9–10; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.119",
    "file": "KB/operational-expansion",
    "ref_id": "16.119",
    "section": "16.119. Nội dung số cung cấp cho nước ngoài: ngoại lệ HĐĐT không đồng nghĩa miễn thuế",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[NGUỒN] Khoản 2 Điều 7 Nghị định 254/2026/NĐ-CP liệt kê hộ/cá nhân có thu nhập từ cho thuê bất động sản hoặc cung cấp sản phẩm, dịch vụ nội dung thông tin số về giải trí, trò chơi điện tử, phim, ảnh, số, nhạc số, quảng cáo số cho tổ chức/cá nhân ở nước ngoài trong trường hợp không phải sử dụng HĐĐT.\n[ĐÚNG BẢN CHẤT] Phải xác định sản phẩm/dịch vụ thật và bên nhận, không suy mọi việc trả bằng USD hoặc mọi nền tảng nước ngoài là nội dung số thuộc ngoại lệ. Freelance chuyên môn, xuất khẩu hàng vật chất hoặc bán cho khách trong nước không tự thuộc nhánh này.\n[BA NGHĨA VỤ] Không phải sử dụng HĐĐT ở nhánh nguồn không tự miễn GTGT/TNCN, không tự miễn đăng ký thuế hoặc loại khỏi doanh thu năm. Cần lưu hợp đồng, đối soát quyền được hưởng, chứng từ thanh toán và thuế đã khấu trừ nếu có. Nếu hỏi thuế suất/khấu trừ nước ngoài phải tìm thêm nguồn thuế đúng hoạt động và kỳ; không suy từ ngoại lệ hóa đơn.\n[NGUỒN] https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-254-2026-nd-cp-ve-hoa-don-dien-tu-chung-tu-dien-tu-119260713164251972.htm. Đối chiếu public/documents/ND-254-2026-ND-CP.pdf, trang 13; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.120",
    "file": "KB/operational-expansion",
    "ref_id": "16.120",
    "section": "16.120. Tiền chậm nộp thuế: cơ sở 0,03%/ngày khác tiền phạt vi phạm",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[CƠ SỞ] Khoản 1, điểm a khoản 2 Điều 16 Luật Quản lý thuế 108/2025/QH15: trường hợp thuộc diện chậm nộp, mức tính 0,03%/ngày trên số tiền thuế/khoản thu khác chậm nộp. Không tính tỷ lệ này trên doanh thu, không gọi là thuế suất TNCN hoặc mặc định chính là tiền phạt chậm tờ khai.\n[ĐỐI CHIẾU] Muốn tính tiền phải có số nợ đúng, hạn nộp/gia hạn, chứng từ và ngày nộp, các lần nộp một phần và điều kiện không tính/miễn. Thời gian tính do quy định hướng dẫn; không tự chốt ngày đầu/cuối khi chưa có nguồn cho nhánh. Khai bổ sung làm tăng số thuế có thể phát sinh chậm nộp tính theo kỳ gốc, không coi ngày nộp bổ sung là ngày bắt đầu mới.\n[NGOẠI LỆ] Điều 14 khoản 7 quy định trường hợp được gia hạn không tính chậm nộp trên khoản được gia hạn trong thời gian đó; khoản 5 Điều 16 có miễn do bất khả kháng theo điều kiện luật. Không tự miễn chỉ vì kinh doanh khó khăn, lần đầu vi phạm hoặc tự giác bổ sung. Khung phạt hành chính phải kiểm riêng văn bản đúng thời kỳ.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang Điều14,16; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.121",
    "file": "KB/operational-expansion",
    "ref_id": "16.121",
    "section": "16.121. Nộp tiền sai MST, trùng hoặc ngân hàng đã trừ nhưng thuế còn báo nợ",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[CĂN CỨ] Khoản 4–5 Điều 14 Luật Quản lý thuế 108/2025/QH15: sau nộp tiền được cấp chứng từ; khoản có mã định danh khoản phải nộp thì nộp theo mã. Ngày nộp điện tử là ngày tổ chức thanh toán trích tiền và ghi trên chứng từ nộp tiền. Không chỉ nhìn thông báo thành công/thất bại trên ứng dụng để kết luận hoàn tất.\n[ĐỐI SOÁT] Điểm q khoản 1 Điều 37 cho quyền yêu cầu tra soát/điều chỉnh thông tin sai trên chứng từ nộp ngân sách hoặc dữ liệu thuế. Giữ chứng từ nộp ngân sách, mã giao dịch, ngày trích tiền, số tiền, MST, kỳ, cơ quan thu và khoản phải nộp; đề nghị tổ chức thanh toán và cơ quan thuế đối soát. Đây là checklist thực hành, không phải danh mục hồ sơ bắt buộc mới.\n[KHÔNG NỘP TRÙNG MÙ QUÁNG] Chỉ có dòng trừ tiền ngân hàng chưa đủ chứng minh hạch toán đúng nghĩa vụ. Kiểm tra giao dịch đã vào ngân sách hay bị hoàn trước khi nộp lại; không bảo đảm luôn được miễn chậm nộp vì lỗi ứng dụng. Tiền thực nộp thừa xử lý theo Điều 15, không tự trừ khỏi doanh thu hoặc sửa tờ khai về 0 để xóa nợ.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang Điều14,15,37; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.122",
    "file": "KB/operational-expansion",
    "ref_id": "16.122",
    "section": "16.122. Không đồng ý thông báo nợ/ấn định: quyền giải thích, khiếu nại và nghĩa vụ nộp",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUYỀN] Điểm đ, e, g, l khoản 1 Điều 37 Luật Quản lý thuế 108/2025/QH15: được tra cứu nghĩa vụ, nhận văn bản xác định nghĩa vụ, yêu cầu giải thích việc tính/ấn định, bảo lưu ý kiến, giải trình, khiếu nại hoặc khởi kiện về quyền lợi của mình. Cần xác định đang có thông báo/quyết định nào, khoản thu và kỳ nào; lời nói hay ảnh số dư đơn lẻ không thay văn bản căn cứ.\n[CHỨNG MINH] Đối soát tờ khai đã chấp nhận, doanh thu thật, hợp đồng, chứng từ nộp và thông báo; gửi yêu cầu giải thích/sửa sai tới cơ quan quản lý theo hồ sơ. Không khuyên khai doanh thu 0 trái thực tế chỉ để ứng dụng hết báo nợ; nếu hồ sơ sai thì sửa bằng thủ tục phù hợp.\n[KHÔNG TỰ ĐÌNH CHỈ] Điểm b khoản 1 Điều 14 và điểm o khoản 2 Điều 37: khi đang khiếu nại/khởi kiện vẫn thực hiện nghĩa vụ phải nộp, trừ khi có quyết định tạm đình chỉ của cơ quan có thẩm quyền theo quy định. Không hứa cứ khiếu nại là được dừng nộp. Không đưa thời hiệu, cơ quan giải quyết từng cấp hoặc mẫu đơn khi chưa có căn cứ thủ tục tương ứng.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang Điều14,37; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.123",
    "file": "KB/operational-expansion",
    "ref_id": "16.123",
    "section": "16.123. Gia hạn thuế năm 2026 theo NĐ245: đúng đối tượng, đúng kỳ và vẫn khai đúng hạn",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[ĐỐI TƯỢNG] Điều 1 Nghị định 245/2026/NĐ-CP: hộ/cá nhân phải hoạt động trong ngành/lĩnh vực tại Phụ lục I và có khoản thuế/kỳ được gia hạn. Quy định doanh nghiệp nhỏ/siêu nhỏ không tự áp cho mọi hộ. Có nhiều ngành thì kiểm khoản 5 Điều 2; không kết luận chỉ từ tên ngành đăng ký hoặc doanh thu thấp.\n[MỐC] Khoản 1 Điều 2: TNCN hộ/cá nhân được gia hạn tối đa 05 tháng theo kỳ; tháng 5/2026 hạn 20/11/2026; tháng 6–9 hạn 21/12/2026; quý II hạn 02/11/2026; quý III hạn 30/12/2026. Không cộng thêm 5 tháng vào mọi ngày hạn, không chuyển các mốc này sang năm khác.\n[HỒ SƠ] Điều 3: vẫn khai GTGT/TNCN tháng/quý theo quy định; gia hạn nộp tiền khác gia hạn nộp tờ khai. Người trực tiếp kê khai đủ điều kiện gửi Văn bản đề nghị gia hạn theo Phụ lục II đến cơ quan quản lý trực tiếp, một lần cho các khoản thuộc diện; nếu không gửi cùng tờ khai thì chậm nhất 02/11/2026. Sau ngày đó không được gia hạn theo Nghị định này. Không hứa toàn bộ khoản sàn khấu trừ được hoàn do chính sách gia hạn.\n[TIỀN ĐÃ NỘP] Điều 4 không tính chậm nộp cho khoản đủ điều kiện trong thời gian gia hạn; không phải miễn thuế. Khoản 2 Điều 5: khoản đã nộp trước hiệu lực không điều chỉnh lại. Phải kiểm tra ngày hỏi, hồ sơ đã gửi và ngành thực trước khi hướng dẫn.\n[NGUỒN] https://xaydungchinhsach.chinhphu.vn/nghi-dinh-245-2026-nd-cp-gia-han-thoi-han-nop-thue-tien-thue-dat-trong-nam-2026-119260627180925528.htm. Đối chiếu public/documents/ND-245-2026-ND-CP.pdf, trang 1–4; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.124",
    "file": "KB/operational-expansion",
    "ref_id": "16.124",
    "section": "16.124. Lưu trữ sổ và chứng từ hộ kinh doanh: tối thiểu 5 năm không áp máy móc cho mọi hóa đơn",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[HÌNH THỨC] Khoản 1 Điều 3 Thông tư 152/2025/TT-BTC: hộ/cá nhân được chọn lưu tài liệu kế toán (hóa đơn, chứng từ, sổ...) điện tử hoặc giấy. Không bắt buộc chỉ mua sổ in sẵn hay in toàn bộ dữ liệu điện tử mới hợp lệ.\n[THỜI HẠN] Khoản 2 Điều 3: tài liệu kế toán hộ/cá nhân lưu tối thiểu 05 năm; riêng thời hạn lưu hóa đơn thực hiện theo pháp luật về thuế. Không trả lời mọi tài liệu/hóa đơn chỉ cần giữ 5 năm rồi được hủy, không dùng mốc này để kết luận hết thời hạn truy thu/kiểm tra.\n[THỰC HÀNH] Sao lưu dữ liệu gốc có thể đọc/tra cứu, sổ theo kỳ/ngành và chứng từ đối soát; dữ liệu mất trên máy HTKK không tự xóa nghĩa vụ đã kê khai. Nếu cần thời hạn một loại hóa đơn, hồ sơ lao động hay chứng từ chuyên ngành thì tìm thêm quy định tương ứng, không áp chung mốc của sổ hộ. Khoản 3 Điều 3 cho phép bổ sung/sửa biểu mẫu sổ phù hợp nhu cầu nhưng vẫn phải có các thông tin sổ theo quy định.\n[NGUỒN] https://vanban.chinhphu.vn/?docid=216533&pageid=27160&typegroupid=6. Đối chiếu public/documents/TT-152-2025-TT-BTC.pdf, trang 2; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.125",
    "file": "KB/operational-expansion",
    "ref_id": "16.125",
    "section": "16.125. Ấn định thuế phải có căn cứ: không tự lấy tiền vào tài khoản làm số thuế",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[LUẬT] Điều 24 Luật Quản lý thuế 108/2025/QH15: cơ quan quản lý có thể ấn định số thuế hoặc từng yếu tố tính thuế theo điều kiện, bảo đảm khách quan, công bằng và tuân thủ quy định. Khoản 2 liệt kê các trường hợp như không đăng ký/không khai hoặc không sửa theo yêu cầu, không phản ánh đầy đủ sổ sách, không cung cấp/giải trình dữ liệu theo yêu cầu và các hành vi cụ thể khác.\n[GIỚI HẠN SUY LUẬN] Có dòng tiền lớn, doanh thu dưới ngưỡng hoặc thiếu một hóa đơn không tự cho AI quyền ấn định một số thuế hay kết luận trốn thuế. Phải tách thu hộ, vay, chuyển nội bộ, tiền lương và doanh thu thực, đối chiếu văn bản yêu cầu/quyết định, kỳ và chủ thể.\n[QUYỀN] Điểm g khoản 1 và điểm o khoản 2 Điều 37: được giải thích, cung cấp hồ sơ chứng minh và khiếu nại/khởi kiện nhưng vẫn thực hiện nghĩa vụ theo quy định. Khoản 3 Điều 24 giao Chính phủ quy định căn cứ/phương pháp/thủ tục: nếu cần tính số ấn định cụ thể phải tra đúng quy định và hồ sơ, không bịa công thức hoặc lấy tỷ lệ một ngành mặc định.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang Điều24,37; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.126",
    "file": "KB/operational-expansion",
    "ref_id": "16.126",
    "section": "16.126. Doanh thu dưới ngưỡng vẫn có thể kiểm tra: quyền và hồ sơ liên quan",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[PHẠM VI] Điều 22 Luật Quản lý thuế 108/2025/QH15 có kiểm tra tại trụ sở cơ quan thuế và tại trụ sở người nộp thuế theo căn cứ/điều kiện khác nhau. Không suy không có thuế phải nộp nghĩa là không bao giờ được kiểm tra; cũng không suy mọi hộ đều phải kiểm tra thực tế trước khi đăng ký hóa đơn.\n[QUYỀN VÀ NGHĨA VỤ] Điểm r khoản 1 Điều 37: quyền từ chối kiểm tra tại trụ sở người nộp thuế khi không có quyết định có thẩm quyền; kiểm tra tại cơ quan thuế khi không có thông báo yêu cầu giải trình/bổ sung; từ chối thông tin không liên quan nội dung kiểm tra hoặc thuộc bí mật nhà nước theo điều kiện luật. Không mở rộng thành quyền từ chối mọi yêu cầu hợp pháp.\n[PHỐI HỢP] Người nộp thuế cung cấp chính xác hồ sơ liên quan, giải trình, ký biên bản theo quy định và được bảo lưu ý kiến/khiếu nại. Kiểm tra sổ, doanh thu, chứng từ theo kỳ và văn bản yêu cầu thực tế, không tự khai 0 vì nghĩ miễn thuế, không thêm giấy xác nhận hoặc toàn bộ sao kê mọi năm như điều kiện bắt buộc khi nguồn chưa quy định.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang Điều22,37; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.127",
    "file": "KB/operational-expansion",
    "ref_id": "16.127",
    "section": "16.127. Thuê dịch vụ/ủy quyền làm thuế: trách nhiệm không tự chuyển hết cho người làm hộ",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUYỀN] Điểm c khoản 1 Điều 37 Luật Quản lý thuế 108/2025/QH15 cho phép ký hợp đồng với đại lý thuế và ủy quyền khai/nộp thay theo quy định. Không đồng nhất mọi người rao dịch vụ cộng đồng với đại lý thuế đủ điều kiện; không lấy quảng cáo hoặc giá dịch vụ làm căn cứ pháp lý.\n[TRÁCH NHIỆM] Điểm i khoản 2 Điều 37: người nộp thuế chịu trách nhiệm thực hiện nghĩa vụ, bao gồm trường hợp đại diện theo pháp luật/ủy quyền thực hiện thủ tục sai quy định. Không cam kết thuê dịch vụ thì hộ hết trách nhiệm hoặc mọi lỗi của người làm đều tự được miễn phạt.\n[BÀN GIAO] Nên thỏa thuận phạm vi, kỳ, việc kiểm tra số liệu, quyền truy cập và bàn giao tờ khai/chứng từ/thông báo; kiểm tra kết quả tiếp nhận/chấp nhận và chứng từ nộp tiền. Đây là cách quản lý thực hành, không phải hồ sơ pháp luật bắt buộc mới. Không đưa mật khẩu/OTP vào chat; yêu cầu người làm sử dụng cơ chế ủy quyền hợp pháp thay vì tự cho mượn định danh để lập hộ khác.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang Điều37; rà soát 19/10/2026."
  },
  {
    "id": "KB/operational-expansion#16.128",
    "file": "KB/operational-expansion",
    "ref_id": "16.128",
    "section": "16.128. Bảo mật dữ liệu thuế, hồ sơ lạ và quyền yêu cầu giải thích",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[CĂN CỨ] Điều 7 Luật Quản lý thuế 108/2025/QH15 yêu cầu bảo mật dữ liệu người nộp thuế; cung cấp/công khai chỉ theo các trường hợp luật định. Không biến nguyên tắc bảo mật thành kết luận cơ quan thuế không được thu thập thông tin hoặc công khai nợ theo pháp luật.\n[HÀNH VI BỊ CẤM] Điều 8 cấm sử dụng mã thuế người khác/cho sử dụng sai quy định và truy cập, làm sai lệch dữ liệu trái phép. Phát hiện hồ sơ đăng ký, thông báo tài khoản hoặc nghĩa vụ lạ chưa đủ kết luận ai phạm tội; giữ thông báo/mã hồ sơ, đối chiếu với hoạt động thật và yêu cầu cơ quan quản lý giải thích, kiểm tra thông tin theo quyền tại Điều 37.\n[AN TOÀN THỰC HÀNH] Không cung cấp mật khẩu, OTP, bản căn cước đầy đủ cho người lạ trong hội thoại; xác minh yêu cầu qua kênh chính thức của cơ quan quản lý. Không hứa một cú điện thoại tự xóa hộ đã bị mạo danh, không khuyên nộp tiền vào tài khoản cá nhân để gỡ nợ. Khi có dấu hiệu bị sử dụng định danh trái phép cần thông báo cơ quan có thẩm quyền, không tự bỏ qua văn bản thuế đang tồn tại.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang Điều7,8,37; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.129",
    "file": "KB/depth-expansion",
    "ref_id": "16.129",
    "section": "16.129. Hóa đơn bán hàng của hộ tính GTGT trực tiếp khác hóa đơn GTGT",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Điều 8 Nghị định 254/2026/NĐ-CP: hóa đơn GTGT dành cho hoạt động khai thuế GTGT theo phương pháp khấu trừ; tổ chức, hộ/cá nhân kinh doanh tính GTGT theo phương pháp trực tiếp sử dụng hóa đơn bán hàng theo khoản 2. Tên loại hóa đơn phụ thuộc phương pháp và hoạt động, không phụ thuộc việc khách là công ty hay cá nhân.\n[ÁP DỤNG] Khách công ty yêu cầu “hóa đơn VAT” không làm hộ tính trực tiếp trở thành đơn vị khấu trừ; cần giải thích loại hóa đơn hợp pháp hộ được lập. Không tự thêm dòng thuế suất của phương pháp khấu trừ để đáp ứng yêu cầu khách, không nói hóa đơn bán hàng là hóa đơn không hợp lệ. Khả năng bên mua hạch toán chi phí và khấu trừ GTGT là hai vấn đề riêng, cần điều kiện của bên mua.\n[NGUỒN] https://vanban.chinhphu.vn/?classid=1&docid=218689&pageid=27160&typegroupid=4. Đối chiếu public/documents/ND-254-2026-ND-CP.pdf, trang 14–15; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.130",
    "file": "KB/depth-expansion",
    "ref_id": "16.130",
    "section": "16.130. Thời điểm hóa đơn bán hàng hóa: chuyển giao, không chờ sàn trả tiền",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Khoản 1 Điều 9 Nghị định 254/2026/NĐ-CP: bán hàng hóa trong nước lập hóa đơn tại thời điểm chuyển giao quyền sở hữu hoặc quyền sử dụng cho người mua, không phân biệt đã thu tiền hay chưa.\n[ĐỐI SOÁT] Ngày sàn chốt tiền, ngày đơn vị COD chuyển tiền, ngày ngân hàng báo có hoặc khách trả nợ không tự thay thời điểm chuyển giao hàng. Xác định thực tế giao dịch, hàng chưa giao/hủy/hoàn trả và chứng từ; không gọi mọi đơn tạo trên sàn là đã bán, không trì hoãn đến lúc rút tiền. Quy tắc ngoại lệ xuất khẩu phải tra riêng, không áp mốc bán trong nước cho mọi giao dịch xuyên biên giới.\n[NGUỒN] https://vanban.chinhphu.vn/?classid=1&docid=218689&pageid=27160&typegroupid=4. Đối chiếu public/documents/ND-254-2026-ND-CP.pdf, trang 16; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.131",
    "file": "KB/depth-expansion",
    "ref_id": "16.131",
    "section": "16.131. Thời điểm hóa đơn dịch vụ: hoàn thành hoặc thu tiền trước/trong khi cung cấp",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Khoản 2 Điều 9 Nghị định 254/2026/NĐ-CP: lập hóa đơn khi hoàn thành cung cấp dịch vụ, không phân biệt đã thu tiền; nếu thu tiền trước hoặc trong khi cung cấp thì thời điểm là thu tiền, trừ thu tiền đặt cọc hoặc tạm ứng để bảo đảm thực hiện hợp đồng theo quy định của Bộ Tài chính.\n[GIỚI HẠN] Không kết luận mọi khoản ghi “cọc” đều miễn lập hóa đơn, cũng không kết luận mọi khoản tạm ứng đều phải lập ngay. Phải xét hợp đồng, mục đích tiền, loại dịch vụ và ngoại lệ áp dụng. Khách nợ tiền sau khi hoàn thành dịch vụ không phải lý do chờ thu tiền mới lập. Hóa đơn và kỳ ghi nhận doanh thu thuế là hai phép kiểm tra riêng.\n[NGUỒN] https://vanban.chinhphu.vn/?classid=1&docid=218689&pageid=27160&typegroupid=4. Đối chiếu public/documents/ND-254-2026-ND-CP.pdf, trang 16; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.132",
    "file": "KB/depth-expansion",
    "ref_id": "16.132",
    "section": "16.132. Giao hàng nhiều lần, nghiệm thu từng phần: hóa đơn theo từng khối lượng",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Khoản 3 Điều 9 Nghị định 254/2026/NĐ-CP: giao hàng nhiều lần hoặc bàn giao từng hạng mục, công đoạn dịch vụ thì mỗi lần giao hàng/bàn giao phải lập hóa đơn cho khối lượng, giá trị tương ứng.\n[ÁP DỤNG] Đối chiếu hợp đồng, biên bản giao nhận/nghiệm thu và phần đã lập; không chờ thanh lý toàn bộ hợp đồng mới xuất cho tất cả, không lập trùng phần đã xuất. Việc khách trả một lần cuối kỳ không tự cho phép gộp các lần chuyển giao. Nếu thuộc một ngoại lệ đối soát chuyên ngành thì phải xác định đúng ngoại lệ trước.\n[NGUỒN] https://vanban.chinhphu.vn/?classid=1&docid=218689&pageid=27160&typegroupid=4. Đối chiếu public/documents/ND-254-2026-ND-CP.pdf, trang 16; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.133",
    "file": "KB/depth-expansion",
    "ref_id": "16.133",
    "section": "16.133. Lập hóa đơn sau đối soát: chỉ nhóm đủ điều kiện, không áp cho mọi cửa hàng",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[ĐIỀU KIỆN] Điểm a khoản 4 Điều 9 Nghị định 254/2026/NĐ-CP áp dụng các giao dịch số lượng lớn, phát sinh thường xuyên, cần thời gian đối soát thuộc danh mục được quy định, như một số dịch vụ thương mại điện tử, bưu chính/chuyển phát, logistic, công nghệ thông tin và nhóm khác ghi trong điều khoản.\n[MỐC] Nhánh này lập tại thời điểm hoàn thành đối soát nhưng chậm nhất ngày 07 của tháng sau tháng phát sinh cung cấp dịch vụ hoặc không quá 07 ngày kể từ ngày kết thúc kỳ quy ước. Không lấy việc cửa hàng bán qua sàn làm bằng chứng cửa hàng đang cung cấp “dịch vụ thương mại điện tử”. Cần xác định chủ thể, loại dịch vụ, hợp đồng và kỳ quy ước; bán hàng hóa thông thường vẫn kiểm tra khoản 1 Điều 9.\n[NGUỒN] https://vanban.chinhphu.vn/?classid=1&docid=218689&pageid=27160&typegroupid=4. Đối chiếu public/documents/ND-254-2026-ND-CP.pdf, trang 17; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.134",
    "file": "KB/depth-expansion",
    "ref_id": "16.134",
    "section": "16.134. Xây dựng, lắp đặt: nghiệm thu/bàn giao thay vì ngày khách thanh toán",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Điểm c khoản 4 Điều 9 Nghị định 254/2026/NĐ-CP: xây dựng, lắp đặt lập hóa đơn khi nghiệm thu, bàn giao công trình, hạng mục, khối lượng xây dựng/lắp đặt hoàn thành, không phân biệt đã thu tiền hay chưa.\n[ÁP DỤNG] Xác định đúng hoạt động xây dựng/lắp đặt và phần hoàn thành; đối chiếu biên bản nghiệm thu, hợp đồng, khoản đã lập hóa đơn. Không chờ khách trả nợ, không lập trùng giá trị của các giai đoạn đã lập. Hợp đồng kèm bán thiết bị cần phân biệt phần hàng hóa và phần lắp đặt, không tự đổi toàn bộ thành một ngành.\n[NGUỒN] https://vanban.chinhphu.vn/?classid=1&docid=218689&pageid=27160&typegroupid=4. Đối chiếu public/documents/ND-254-2026-ND-CP.pdf, trang 18; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.135",
    "file": "KB/depth-expansion",
    "ref_id": "16.135",
    "section": "16.135. Hóa đơn máy tính tiền: thông tin người mua và chữ ký khác hóa đơn thường",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Khoản 9 Điều 8 và khoản 4 Điều 10 Nghị định 254/2026/NĐ-CP: hóa đơn khởi tạo từ máy tính tiền kết nối cơ quan thuế không bắt buộc có chữ ký số; tên, địa chỉ, MST/số định danh/số điện thoại người mua được thể hiện nếu người mua yêu cầu; có mã hoặc dữ liệu để truy xuất, kê khai thông tin hóa đơn.\n[GIỚI HẠN] Đây là nhánh máy tính tiền, không được mở rộng thành mọi hóa đơn đều được bỏ thông tin người mua/chữ ký. Khách không lấy hóa đơn không tự miễn nghĩa vụ lập khi người bán thuộc diện phải lập. Khi khách doanh nghiệp yêu cầu thông tin, phải lấy đúng thông tin hợp pháp của giao dịch, không gán người mua khác để hợp thức chi phí.\n[NGUỒN] https://vanban.chinhphu.vn/?classid=1&docid=218689&pageid=27160&typegroupid=4. Đối chiếu public/documents/ND-254-2026-ND-CP.pdf, trang 16, 22; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.136",
    "file": "KB/depth-expansion",
    "ref_id": "16.136",
    "section": "16.136. Hóa đơn bán hàng không trình bày thuế suất và giá trị XML khác bản hiển thị",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Khoản 5 Điều 10 Nghị định 254/2026/NĐ-CP: hóa đơn bán hàng của hộ/cá nhân kinh doanh không thể hiện thuế suất GTGT. Các nội dung khuyến khích hiển thị thêm không làm thay đổi bản chất, loại hóa đơn.\n[DỮ LIỆU] Khoản 5 quy định dữ liệu hóa đơn dạng XML gửi cơ quan thuế về chiết khấu thương mại, khuyến mại và trường hợp hàng hóa/dịch vụ không chịu thuế; không suy từ bản PDF/ảnh khách nhận rằng dữ liệu gốc đã khai đúng. Cần đối chiếu XML, mã tra cứu và giao dịch; “không thể hiện thuế suất” không có nghĩa mọi doanh thu đều miễn GTGT.\n[NGUỒN] https://vanban.chinhphu.vn/?classid=1&docid=218689&pageid=27160&typegroupid=4. Đối chiếu public/documents/ND-254-2026-ND-CP.pdf, trang 22; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.137",
    "file": "KB/depth-expansion",
    "ref_id": "16.137",
    "section": "16.137. Sự cố hóa đơn điện tử: tách lỗi người bán, nhà cung cấp và hệ thống thuế",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[PHÂN LUỒNG] Điều 14 Nghị định 254/2026/NĐ-CP tách lỗi của người bán không dùng được hóa đơn có mã; lỗi hệ thống cấp mã; lỗi hạ tầng tổ chức cung cấp dịch vụ; lỗi cổng thuế nhận dữ liệu không có mã. Cách xử lý và đầu mối khác nhau, không áp một cách cho mọi lỗi.\n[XỬ LÝ] Người bán có mã gặp sự cố liên hệ cơ quan thuế hoặc nhà cung cấp để được hỗ trợ; có thể được hướng dẫn chuyển sang tổ chức đủ điều kiện hoặc cơ quan thuế cấp mã theo nhánh tương ứng. Khi lỗi cổng tiếp nhận dữ liệu không mã được khắc phục, người bán chuyển dữ liệu đến cơ quan thuế. Không tự xóa giao dịch, đổi ngày hoặc coi bản nháp là hóa đơn hợp lệ.\n[BẤT KHẢ KHÁNG] Khoản 5: trong trường hợp bất khả kháng theo khoản 21 Điều 4 Luật 108 dẫn đến không lập được đúng hạn, phải lưu chứng minh và ghi chép giao dịch; trong 03 ngày làm việc từ khi sự cố được khắc phục phải lập/gửi theo quy định. Không gọi mọi lỗi phần mềm hay quên thao tác là bất khả kháng.\n[NGUỒN] https://vanban.chinhphu.vn/?classid=1&docid=218689&pageid=27160&typegroupid=4. Đối chiếu public/documents/ND-254-2026-ND-CP.pdf, trang 24–25; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.138",
    "file": "KB/depth-expansion",
    "ref_id": "16.138",
    "section": "16.138. Dịch vụ hóa đơn miễn phí: điều kiện địa bàn và tự lựa chọn gói thương mại",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Điều 11 Nghị định 254/2026/NĐ-CP có nhánh doanh nghiệp nhỏ/vừa, hợp tác xã, liên hiệp hợp tác xã, hộ/cá nhân kinh doanh tại địa bàn khó khăn hoặc đặc biệt khó khăn sử dụng miễn phí hóa đơn có mã qua tổ chức được cơ quan thuế lựa chọn. Phải đối chiếu danh mục địa bàn theo quy định; không phải mọi hộ nhỏ đều được miễn phí.\n[LỰA CHỌN] Khoản 3: chủ thể không thuộc diện miễn phí trả phí dịch vụ theo thỏa thuận. Chủ thể đủ điều kiện nhưng chọn giải pháp trả phí cần xem hợp đồng, không hứa được Nhà nước hoàn mọi phí đã mua. Khoản 4 có kênh đăng ký/thay đổi trực tiếp qua hệ thống thuế cho đối tượng quy định; quyền miễn phí không thay thế đăng ký/chấp thuận sử dụng hóa đơn.\n[NGUỒN] https://vanban.chinhphu.vn/?classid=1&docid=218689&pageid=27160&typegroupid=4. Đối chiếu public/documents/ND-254-2026-ND-CP.pdf, trang 23; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.139",
    "file": "KB/depth-expansion",
    "ref_id": "16.139",
    "section": "16.139. Khấu hao máy móc: đã hết giá trị không trích tiếp, không trừ cả giá mua ngay",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[PHƯƠNG PHÁP] Chỉ xét khoản trừ chi phí trong phương pháp TNCN theo thu nhập tính thuế. Điểm c khoản 1, điểm d khoản 2 Điều 6 Nghị định 68/2026/NĐ-CP: tài sản cố định phục vụ kinh doanh được trích theo chế độ quản lý, sử dụng, khấu hao áp dụng doanh nghiệp; phần vượt mức hoặc tài sản không phục vụ kinh doanh không được trừ.\n[GIỚI HẠN] Tài sản đã khấu hao hết nhưng vẫn dùng thì không trích tiếp. Không tự lấy toàn bộ tiền mua máy trừ ngay trong kỳ, không tự đặt thời gian khấu hao; cần giá trị, hồ sơ, thời điểm đưa vào sử dụng và phân loại tài sản/công cụ. Không mang khấu hao trừ khỏi doanh thu GTGT hoặc cơ sở TNCN theo tỷ lệ doanh thu.\n[NGUỒN] https://xaydungchinhsach.chinhphu.vn/chi-tiet-cac-khoan-chi-duoc-tru-va-khong-duoc-tru-trong-xac-dinh-thue-thu-nhap-ca-nhan-119260309111406444.htm. Đối chiếu public/documents/ND-68-2026-ND-CP.pdf, trang 4–5 (Điều 6); rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.140",
    "file": "KB/depth-expansion",
    "ref_id": "16.140",
    "section": "16.140. Tiền lương chủ hộ, thành viên hộ và lao động thuê: không chỉ xét quan hệ họ hàng",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Điểm b khoản 1 và điểm c khoản 2 Điều 6 Nghị định 68/2026/NĐ-CP: phân biệt chi trả người lao động theo điều kiện luật với tiền lương, tiền công và khoản có tính chất lương của cá nhân kinh doanh, nhóm cá nhân kinh doanh, các thành viên trong hộ kinh doanh; nhóm sau không được trừ trừ các khoản đóng góp bảo hiểm bắt buộc.\n[ĐỐI CHIẾU] Không mặc định thuê vợ/chồng/con đều được trừ vì có hợp đồng, cũng không kết luận mọi người họ hàng là thành viên hộ kinh doanh. Cần xác định tư cách chủ thể, công việc thực tế, hồ sơ lao động, chứng từ thực trả và điều kiện bảo hiểm theo nguồn. Chi đã ghi sổ nhưng không thực trả hoặc không có chứng từ thanh toán thuộc khoản không được trừ. Chỉ xét trong phương pháp thu nhập, không trừ vào doanh thu GTGT.\n[NGUỒN] https://xaydungchinhsach.chinhphu.vn/chi-tiet-cac-khoan-chi-duoc-tru-va-khong-duoc-tru-trong-xac-dinh-thue-thu-nhap-ca-nhan-119260309111406444.htm. Đối chiếu public/documents/ND-68-2026-ND-CP.pdf, trang 4–5 (Điều 6); rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.141",
    "file": "KB/depth-expansion",
    "ref_id": "16.141",
    "section": "16.141. Lãi vay: ngân hàng khác người cho vay cá nhân và không phải toàn bộ gốc trả nợ",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Điểm đ khoản 1 Điều 6 Nghị định 68/2026/NĐ-CP: lãi tiền vay vốn sản xuất kinh doanh của tổ chức tín dụng theo lãi suất thực tế; vay đối tượng không phải tổ chức tín dụng thì phần lãi không vượt mức quy định Bộ luật Dân sự. Đồng thời cần giao dịch thực, phục vụ kinh doanh, hồ sơ và điều kiện thanh toán tại khoản 1.\n[GIỚI HẠN] Không lấy gốc trả nợ làm lãi vay được trừ, không áp trần cho vay dân sự thay lãi thực tế ngân hàng, không tự kết luận hợp đồng đứng tên người khác được trừ chỉ vì là tài sản chung vợ chồng. Cần xác minh bên vay, bên trả, sử dụng vốn và chứng từ; chưa khớp chủ thể thì hướng dẫn làm rõ, không bịa hình thức hợp thức hóa. Chỉ tính chi phí trong phương pháp thu nhập.\n[NGUỒN] https://xaydungchinhsach.chinhphu.vn/chi-tiet-cac-khoan-chi-duoc-tru-va-khong-duoc-tru-trong-xac-dinh-thue-thu-nhap-ca-nhan-119260309111406444.htm. Đối chiếu public/documents/ND-68-2026-ND-CP.pdf, trang 4–5 (Điều 6); rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.142",
    "file": "KB/depth-expansion",
    "ref_id": "16.142",
    "section": "16.142. Thanh toán từng lần từ 5 triệu: điều kiện chi phí, không phải ngưỡng miễn thuế",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Khoản 1 Điều 6 Nghị định 68/2026/NĐ-CP yêu cầu chi thực liên quan kinh doanh, đủ hóa đơn/chứng từ theo pháp luật hóa đơn/kế toán và chứng từ thanh toán không dùng tiền mặt đối với khoản thanh toán từng lần từ 05 triệu đồng trở lên theo pháp luật GTGT.\n[PHÂN BIỆT] Đúng 5 triệu đã nằm trong mốc từ 5 triệu; dưới mốc không tự được trừ nếu thiếu điều kiện còn lại. Đây là điều kiện chi phí TNCN theo phương pháp thu nhập; không tự biến hộ GTGT trực tiếp thành được khấu trừ GTGT đầu vào. Không khuyên chia nhỏ hóa đơn hoặc dòng tiền để lách; nếu hỏi trả góp, bù trừ hoặc cộng nhiều giao dịch phải tra quy tắc thanh toán tương ứng, không suy riêng từ con số từng lần.\n[NGUỒN] https://xaydungchinhsach.chinhphu.vn/chi-tiet-cac-khoan-chi-duoc-tru-va-khong-duoc-tru-trong-xac-dinh-thue-thu-nhap-ca-nhan-119260309111406444.htm. Đối chiếu public/documents/ND-68-2026-ND-CP.pdf, trang 4–5 (Điều 6); rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.143",
    "file": "KB/depth-expansion",
    "ref_id": "16.143",
    "section": "16.143. Nhà ở, xe và tài sản mang tên cá nhân: điều kiện riêng ngoài mục đích sử dụng",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Điểm e, g khoản 2 Điều 6 Nghị định 68/2026/NĐ-CP liệt kê đất ở/công trình phục vụ sinh hoạt, xe ô tô và tài sản đăng ký sở hữu hoặc sử dụng mang tên cá nhân, với ngoại lệ xe/tài sản đăng ký với mục đích kinh doanh vận tải, du lịch. Chi phí cá nhân/gia đình phải theo dõi riêng và không được trừ.\n[GIỚI HẠN] Không chỉ dựa việc thỉnh thoảng chở hàng hoặc đặt bàn làm việc trong nhà để mặc định toàn bộ tài sản/chi gia đình được trừ; cũng không tự loại mọi dịch vụ thuê tài sản có chứng từ. Cần phân biệt mua tài sản, khấu hao, thuê và chi vận hành; đối chiếu chủ thể, đăng ký, ngành và chứng từ thực tế. Không tự bịa một tỷ lệ phân bổ chi phí hỗn hợp khi thiếu căn cứ.\n[NGUỒN] https://xaydungchinhsach.chinhphu.vn/chi-tiet-cac-khoan-chi-duoc-tru-va-khong-duoc-tru-trong-xac-dinh-thue-thu-nhap-ca-nhan-119260309111406444.htm. Đối chiếu public/documents/ND-68-2026-ND-CP.pdf, trang 4–5 (Điều 6); rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.144",
    "file": "KB/depth-expansion",
    "ref_id": "16.144",
    "section": "16.144. Tiền phạt và bồi thường do lỗi cá nhân kinh doanh: trả thật vẫn có thể không được trừ",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Điểm đ khoản 2 Điều 6 Nghị định 68/2026/NĐ-CP loại các khoản phạt vi phạm hành chính, phạt vi phạm hợp đồng, bồi thường do lỗi của cá nhân kinh doanh khỏi chi phí được trừ khi tính TNCN theo thu nhập.\n[PHÂN BIỆT] Chứng từ đã trả hoặc chuyển khoản không tự làm khoản chi bị loại thành được trừ. Cần phân loại đúng tiền phạt, tiền bồi thường do lỗi với tiền hoàn khách, chiết khấu, giảm giá hoặc chi phí dịch vụ thông thường; không loại mọi khoản hoàn tiền theo một nhãn “phạt sàn”. Thuế/phạt và cơ sở tính doanh thu GTGT phải xử lý riêng.\n[NGUỒN] https://xaydungchinhsach.chinhphu.vn/chi-tiet-cac-khoan-chi-duoc-tru-va-khong-duoc-tru-trong-xac-dinh-thue-thu-nhap-ca-nhan-119260309111406444.htm. Đối chiếu public/documents/ND-68-2026-ND-CP.pdf, trang 4–5 (Điều 6); rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.145",
    "file": "KB/depth-expansion",
    "ref_id": "16.145",
    "section": "16.145. Nộp thừa: bù trừ khác trừ chi phí, thời hạn 10 năm khác khai bổ sung 5 năm",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Điều 15 Luật 108/2025/QH15: nộp thừa là số đã nộp lớn hơn nghĩa vụ phải nộp. Có thể bù trừ trong/giữa loại thuế, khoản thu khác, tiền chậm nộp, tiền phạt theo cơ chế tự động hoặc đề nghị; hoàn khi không còn tiền thuế nợ và theo thủ tục Điều 18.\n[GIỚI HẠN] Khoản 4 không hoàn nếu người nộp thuế từ chối nhận hoặc quá 10 năm từ ngày nộp mà không bù trừ và không đề nghị hoàn. Không nhầm mốc này với 05 năm khai bổ sung ở Điều 12. Một dòng “tax” nền tảng giữ chưa rõ loại thuế/chứng từ chưa đủ để tự bù trừ ngay; không trừ nộp thừa khỏi doanh thu hoặc chi phí thay cho xử lý nghĩa vụ.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang 16–17; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.146",
    "file": "KB/depth-expansion",
    "ref_id": "16.146",
    "section": "16.146. Gia hạn hồ sơ do bất khả kháng khác gia hạn nộp tiền thuế",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Khoản 4 Điều 12 Luật 108/2025/QH15: khi không có khả năng nộp hồ sơ đúng hạn do bất khả kháng theo khoản 21 Điều 4, nhánh tháng/quý/năm/từng lần được gia hạn không quá 30 ngày từ hết hạn; hồ sơ quyết toán không quá 60 ngày. Chính phủ quy định trường hợp cần kéo dài.\n[PHÂN BIỆT] Đây là gia hạn hồ sơ trong điều kiện luật, không phải quyền tự lùi hạn vì bận, quên hoặc thuê kế toán; cũng không tự là gia hạn tiền thuế. Gia hạn tiền theo chính sách riêng không mặc nhiên gia hạn tờ khai. Cần xác định sự kiện, chứng minh, kỳ và thủ tục áp dụng, không hứa hệ thống tự chấp nhận hoặc đặt ngày hết hạn nếu thiếu dữ kiện.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang 9–10; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.147",
    "file": "KB/depth-expansion",
    "ref_id": "16.147",
    "section": "16.147. Hết thời hiệu phạt không tự hết nghĩa vụ truy thu",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Khoản 7–8 Điều 44 Luật 108/2025/QH15: thời hiệu xử phạt thủ tục thuế là 02 năm; trốn thuế chưa đến hình sự hoặc khai sai dẫn tới thiếu thuế/tăng miễn giảm hoàn không thu là 05 năm. Thời điểm tính phải theo pháp luật xử lý vi phạm hành chính, không đơn giản tính từ lúc được gọi lên thuế.\n[TRUY THU] Quá thời hiệu phạt vẫn nộp thuế thiếu/trốn, miễn giảm hoàn không đúng và tiền chậm nộp trong 10 năm trở về trước từ phát hiện; trường hợp không đăng ký thuế thì cho toàn bộ thời gian trở về trước. Không kết luận cứ quá 5 hoặc 10 năm là xóa mọi nợ, không áp quy tắc năm 2026 máy móc thay quy định cho kỳ/hành vi lịch sử.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang 56–57; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.148",
    "file": "KB/depth-expansion",
    "ref_id": "16.148",
    "section": "16.148. Tự khai sửa trước khi phát hiện và quyết toán cá nhân được hoàn: giới hạn không xử phạt",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Điểm a khoản 2 Điều 44 Luật 108/2025/QH15: hành vi khai sai thuộc khoản 2 Điều 45 được khai bổ sung và tự giác nộp đủ trước các mốc công bố quyết định thanh tra/kiểm tra hoặc phát hiện theo điều khoản thuộc trường hợp không xử phạt. Điều khoản cũng nêu cá nhân trực tiếp quyết toán TNCN chậm nộp hồ sơ mà phát sinh thuế được hoàn.\n[GIỚI HẠN] Không mở rộng thành mọi vi phạm nộp tờ khai muộn, trốn thuế hoặc hóa đơn đều miễn phạt nếu tự lên cơ quan thuế. Việc không phạt không tự miễn thuế gốc và mọi tiền chậm nộp. Phải xác định loại sai phạm, thời điểm phát hiện/công bố, hồ sơ và chứng từ đã nộp; nếu có quyết định kiểm tra thì xử lý đúng phạm vi, không khuyên khai sửa để né điều tra.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang 56–57; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.149",
    "file": "KB/depth-expansion",
    "ref_id": "16.149",
    "section": "16.149. Trốn thuế khác chậm thủ tục: không kết luận tội chỉ từ nợ thuế hoặc dòng tiền",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[QUY TẮC] Khoản 4 Điều 45 Luật 108/2025/QH15 liệt kê hành vi như không ghi doanh thu trong sổ, không lập hóa đơn và không khai thuế, dùng hóa đơn/chứng từ trái quy định làm giảm thuế, tài liệu sai bản chất giao dịch, kinh doanh trong thời gian ngừng/tạm ngừng không thông báo và những trường hợp cụ thể khác.\n[NGOẠI LỆ] Điểm l khoản 4 phân biệt một số trường hợp không đăng ký/không khai hoặc khai quá 90 ngày nhưng không phát sinh thuế, hoặc đã nộp đủ thuế và tiền chậm nộp trước các mốc theo luật thì xử lý thủ tục thay vì trốn thuế. Phải đọc đủ điều kiện, không cứ quá 90 ngày là gọi trốn thuế.\n[CHẾ TÀI] Điều 44 khoản 3–4: phạt hành chính trốn thuế 01–03 lần số thuế trốn, không chia đôi vì là cá nhân; xử lý hình sự cần pháp luật hình sự và hồ sơ riêng. Nợ tiền, bị cảnh báo rủi ro hoặc doanh thu cao không tự chứng minh hành vi hay tội phạm.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang 58–59; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.150",
    "file": "KB/depth-expansion",
    "ref_id": "16.150",
    "section": "16.150. Cưỡng chế thuế: điều kiện, quyết định và nộp dần có bảo lãnh",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[ĐIỀU KIỆN] Điều 48 Luật 108/2025/QH15 quy định các nhánh như nợ quá 90 ngày, hết hạn gia hạn, có nợ nhưng không hoạt động tại địa chỉ/phát tán tài sản, không chấp hành quyết định xử phạt hoặc kiểm tra trong điều kiện luật. Không coi mọi khoản app báo nợ là đã bị cưỡng chế hoặc tự suy ngưỡng tiền cụ thể chỉ từ điều này.\n[NỘP DẦN] Khoản 6: trường hợp được chấp nhận nộp dần tối đa 12 tháng từ văn bản chấp nhận và trong thời gian thư bảo lãnh có hiệu lực, cần bảo lãnh tổ chức tín dụng; không tự trả góp mà được dừng cưỡng chế.\n[BIỆN PHÁP] Điều 49 có trích/phong tỏa tài khoản, khấu trừ thu nhập, ngừng hóa đơn và các biện pháp khác; quyết định phải gửi người nộp thuế và bên liên quan. Khoản 2 quy định chấm dứt hiệu lực khi đủ nhánh, gồm nộp đủ nợ bị cưỡng chế hoặc có văn bản có thẩm quyền. Việc mở lại hóa đơn còn phải theo quy trình hóa đơn, không hứa vừa chuyển tiền là mở ngay.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang 61–63; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.151",
    "file": "KB/depth-expansion",
    "ref_id": "16.151",
    "section": "16.151. Khoanh nợ và xóa nợ: đóng cửa lâu năm không tự xóa thuế",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[KHOANH] Điều 20 Luật 108/2025/QH15 quy định các trường hợp khoanh nợ như chết/mất tích theo quyết định, thủ tục giải thể/phá sản, không còn hoạt động tại địa chỉ và nhánh khác; phải có quyết định của cơ quan quản lý. Khoản 4: tạm chưa tính tiền chậm nộp trong thời gian khoanh; khi chấm dứt thì tính đủ từ hết hạn theo luật, trừ nhánh điểm e khoản 1. Không đồng nghĩa đã được xóa nợ.\n[XÓA] Điều 21 có điều kiện riêng; nhánh khoản nợ quá 10 năm đòi hỏi đã áp biện pháp tại điểm h khoản 1 Điều 49 và không có khả năng thu hồi, không phải chỉ đợi đủ 10 năm. Theo khoản 2, chủ thể đã được xóa nhánh điểm c khoản 1 phải hoàn trả nợ đã xóa trước khi quay lại kinh doanh/lập cơ sở mới. Không khuyên bỏ địa chỉ, đóng gian hàng hoặc chờ nợ tự mất.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang 24–26; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.152",
    "file": "KB/depth-expansion",
    "ref_id": "16.152",
    "section": "16.152. Chủ hộ qua đời: nghĩa vụ từ di sản và người nhận tiền thuế hoàn",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[NGHĨA VỤ] Khoản 3 Điều 17 Luật 108/2025/QH15: người thừa kế/người quản lý di sản thực hiện nghĩa vụ thuế người chết trong phần di sản hoặc phần tài sản thừa kế được chia tại thời điểm nhận; trường hợp không có hoặc tất cả từ chối nhận thì theo pháp luật dân sự. Không tự buộc người thân trả mọi nợ bằng tài sản riêng không giới hạn.\n[HOÀN] Điểm c khoản 1 Điều 18: người thừa kế hoặc người được Tòa án giao quản lý tài sản có thể nhận khoản thuế được hoàn theo luật dân sự khi đủ điều kiện. Cần đối chiếu tư cách người nộp, hồ sơ thừa kế/quản lý, thông báo nghĩa vụ và căn cứ hoàn; không dùng tài khoản người thân để tự nhận hay coi tử vong tự động xóa mọi nợ. Thủ tục đăng ký/thay chủ và chấm dứt hộ vẫn phải giải quyết riêng.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang 19–21; rà soát 19/10/2026."
  },
  {
    "id": "KB/depth-expansion#16.153",
    "file": "KB/depth-expansion",
    "ref_id": "16.153",
    "section": "16.153. Hiệu lực Luật Quản lý thuế 108 và chuyển tiếp nợ, kiểm tra trước tháng 7/2026",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[HIỆU LỰC] Khoản 1–2 Điều 52 Luật 108/2025/QH15: hiệu lực chung từ 01/07/2026; Điều 13 và việc sử dụng hóa đơn điện tử của hộ/cá nhân kinh doanh quy định tại Điều 26 có hiệu lực từ 01/01/2026. Ngoại lệ không có nghĩa toàn bộ mọi nội dung Điều 26 đều được áp sớm cho mọi chủ thể.\n[CHUYỂN TIẾP] Điều 53: khoản miễn/giảm/không thu phát sinh trước 01/07/2026 tiếp tục xử lý theo Luật 38/2019/QH14; khoản nợ đến hết 30/06/2026 xử lý theo Luật 108; cuộc kiểm tra có quyết định trước hiệu lực mà chưa có kết luận/quyết định xử lý tiếp tục theo Luật 38. Không chỉ nhìn năm được hỏi rồi thay mọi luật cũ bằng mới; cần ngày phát sinh, loại nghĩa vụ và ngày quyết định kiểm tra.\n[NGUỒN] https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf. Đối chiếu public/documents/Luat-108-2025-QH15.pdf, trang 64–65; rà soát 19/10/2026."
  },
  {
    "id": "KB/semantic-topic-supplements#business-subject-boundary",
    "ref_id": "16.154",
    "file": "KB/semantic-topic-supplements",
    "section": "16.154. Ranh giới cá nhân kinh doanh và hộ kinh doanh; xác nhận trạng thái trước khi áp thủ tục",
    "tier": "VERIFIED_CONDITIONAL",
    "evidence_mode": "COMPLETE_RULE",
    "text": "[RANH GIỚI KHÁI NIỆM] Cá nhân kinh doanh nhận diện một người có hoạt động kinh doanh trong quản lý thuế; hộ kinh doanh là hình thức đăng ký. Hai khái niệm không đồng nghĩa, cũng không loại trừ nhau hoàn toàn: cá nhân có thể là chủ hộ. Không phân biệt bằng làm một mình hay cùng gia đình.\n[TRẠNG THÁI CHƯA XÁC NHẬN] Tự gọi cá nhân kinh doanh, có mã thuế hoặc đăng ký thuế trực tiếp chưa chứng minh đã có hộ; chưa có hộ cũng chưa chứng minh được miễn đăng ký. Nếu thủ tục phụ thuộc hình thức, cần làm rõ đã có giấy chứng nhận hộ hay chỉ đăng ký thuế. Câu hỏi định nghĩa và phần thuế chung không cần chặn để hỏi hồ sơ.\n[PHẠM VI QUY TẮC RIÊNG] Khoản 1 Điều 83 Nghị định 168/2025/NĐ-CP giới hạn số hộ được đăng ký, không đặt giới hạn một ngành hay một hoạt động của mọi cá nhân kinh doanh. Khi chưa rõ hình thức, không dùng quy tắc riêng này để kết luận người hỏi bị cấm thêm ngành/địa điểm. Điều 82 và khoản 1 Điều 85 phân biệt việc thành lập hộ với thủ tục thuế.\n[PHÂN NHÁNH THỦ TỤC] Hướng dẫn của Thuế Hà Nội: khi hoạt động bổ sung thuộc diện không phải đăng ký hộ, người nộp thuế điều chỉnh/bổ sung thông tin đăng ký thuế bằng Mẫu 08-MST ban hành kèm Thông tư 90/2026/TT-BTC với cơ quan thuế quản lý trực tiếp. Nếu hoạt động mới phải đăng ký hộ thì thực hiện nhánh đăng ký hộ; thay đổi ngành của hộ đã có giấy là nhánh riêng. Không tự xác nhận hoạt động được miễn đăng ký hộ chỉ từ cách tự xưng.\n[NGUỒN VÀ GIỚI HẠN] Đối chiếu 21/10/2026: khoản 1 Điều 4 Nghị định 68/2026/NĐ-CP chỉ dùng cho phạm vi chủ thể, không dùng mức doanh thu cũ trong bài giới thiệu. https://xaydungchinhsach.chinhphu.vn/chinh-sach-thue-gia-tri-gia-tang-thue-thu-nhap-ca-nhan-cac-khoan-thue-khac-119260316093129828.htm ; Điều 82, khoản 1 Điều 83, khoản 1 Điều 85 Nghị định 168/2025/NĐ-CP: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-168-2025-nd-cp-ve-dang-ky-doanh-nghiep-119250702175708554.htm ; hướng dẫn phân nhánh thủ tục của Thuế Hà Nội, không mở rộng thành kết luận miễn đăng ký cho mọi người: https://baochinhphu.vn/ke-khai-thue-doi-voi-ca-nhan-kinh-doanh-da-linh-vuc-102260929171744114.htm",
    "retrieval_facets": {
      "topics": [
        "TAX_REGISTRATION",
        "BUSINESS_REGISTRATION",
        "REGISTRATION_COMPARISON",
        "REGISTRATION_REQUIREMENTS",
        "TAX_REGISTRATION_CHANGE"
      ],
      "subject_contexts": [
        "INDIVIDUAL_ACTIVITY",
        "COMPARISON"
      ]
    },
    "purpose_passages": {
      "DEFINITION": "[RANH GIỚI KHÁI NIỆM] Cá nhân kinh doanh nhận diện một người có hoạt động kinh doanh trong quản lý thuế; hộ kinh doanh là hình thức đăng ký. Hai khái niệm không đồng nghĩa, cũng không loại trừ nhau hoàn toàn: cá nhân có thể là chủ hộ. Không phân biệt bằng làm một mình hay cùng gia đình.\n[TRẠNG THÁI CHƯA XÁC NHẬN] Tự gọi cá nhân kinh doanh, có mã thuế hoặc đăng ký thuế trực tiếp chưa chứng minh đã có hộ; chưa có hộ cũng chưa chứng minh được miễn đăng ký. Nếu thủ tục phụ thuộc hình thức, cần làm rõ đã có giấy chứng nhận hộ hay chỉ đăng ký thuế. Câu hỏi định nghĩa và phần thuế chung không cần chặn để hỏi hồ sơ."
    }
  },
  {
    "id": "KB/semantic-topic-supplements#household-form-procedures",
    "ref_id": "16.155",
    "file": "KB/semantic-topic-supplements",
    "section": "16.155. Hồ sơ, địa điểm và tạm ngừng: thủ tục riêng của hình thức hộ kinh doanh",
    "tier": "VERIFIED_CONDITIONAL",
    "evidence_mode": "COMPLETE_RULE",
    "subject_scope": [
      "HOUSEHOLD_FORM",
      "COMPARISON"
    ],
    "text": "[PHẠM VI] Chỉ dùng cho người đang hỏi thành lập/hoạt động dưới hình thức hộ hoặc đã xác nhận có hộ; không tự áp cho người chỉ tự nhận cá nhân kinh doanh.\n[HỒ SƠ VÀ THỜI HẠN ĐĂNG KÝ HỘ KINH DOANH] Theo Điều 99 Nghị định 168/2025/NĐ-CP (đọc cùng Nghị định 296/2026/NĐ-CP): hồ sơ đăng ký hộ kinh doanh mới gồm Giấy đề nghị đăng ký hộ kinh doanh, bản sao văn bản ủy quyền của thành viên hộ gia đình cho một thành viên làm chủ hộ kinh doanh (đối với hộ kinh doanh do các thành viên hộ gia đình thành lập), kèm giấy tờ pháp lý/ủy quyền người nộp hồ sơ. Nộp tại Cơ quan đăng ký kinh doanh cấp xã nơi đặt trụ sở (trực tiếp, bưu chính hoặc trực tuyến qua Cổng dịch vụ công quốc gia). Trong 03 ngày làm việc kể từ ngày nhận hồ sơ hợp lệ, Cơ quan ĐKKD cấp xã cấp Giấy chứng nhận đăng ký hộ kinh doanh (đồng thời là Giấy chứng nhận đăng ký thuế liên thông, không phát sinh thêm hạn 10 ngày đăng ký thuế trực tiếp riêng); nếu chưa hợp lệ thì thông báo bằng văn bản nêu rõ lý do và yêu cầu sửa đổi, bổ sung trong 03 ngày làm việc.\n[MỞ THÊM ĐỊA ĐIỂM KINH DOANH] Theo khoản 1 Điều 83 Nghị định 168/2025/NĐ-CP, một cá nhân chỉ được đăng ký một hộ kinh doanh trên toàn quốc nhưng một hộ kinh doanh được hoạt động tại nhiều địa điểm. Khi mở thêm địa điểm kinh doanh, cửa hàng hoặc kho hàng ngoài trụ sở (cùng hoặc khác quận/tỉnh), hộ kinh doanh không được và không phải đăng ký hộ kinh doanh mới hay xin mã số thuế mới, mà phải thông báo cho cơ quan thuế quản lý trực tiếp trụ sở trong thời hạn 10 ngày làm việc kể từ ngày địa điểm kinh doanh đi vào hoạt động theo điểm đ khoản 2 Điều 8 Nghị định 68/2026/NĐ-CP.\n[TẠM NGỪNG KINH DOANH] Theo khoản 1 Điều 103 Nghị định 168/2025/NĐ-CP (đọc cùng Nghị định 296/2026/NĐ-CP): trường hợp hộ kinh doanh tạm ngừng kinh doanh từ 15 ngày trở lên (như tạm ngừng 6 tháng) hoặc tiếp tục kinh doanh trước thời hạn đã thông báo, phải gửi thông báo bằng văn bản cho Cơ quan đăng ký kinh doanh cấp xã nơi đã đăng ký chậm nhất 03 ngày làm việc trước ngày tạm ngừng hoặc tiếp tục kinh doanh (NĐ 296/2026 sửa một số thủ tục khác thành 02 ngày nhưng không đổi mốc 03 ngày làm việc tại khoản 1 Điều 103). Thời gian tạm ngừng mỗi lần thông báo không được quá 01 năm (12 tháng); do đó không được duyệt tạm ngừng 14 tháng liên tục trong một lần thông báo — nếu hết 01 năm vẫn muốn nghỉ tiếp thì phải gửi thông báo tiếp chậm nhất 03 ngày làm việc trước ngày tiếp tục tạm ngừng (tổng cộng các lần thông báo liên tiếp hoặc từng lần đều tuân theo quy định Điều 103, hồ sơ hợp lệ giải quyết trong 03 ngày làm việc và liên thông sang cơ quan thuế).",
    "retrieval_facets": {
      "subject_contexts": [
        "HOUSEHOLD_FORM"
      ],
      "answer_purposes": [
        "PROCEDURE",
        "ELIGIBILITY",
        "OTHER"
      ]
    }
  },
  {
    "id": "KB/semantic-topic-supplements#vat-base-adjustments",
    "file": "KB/semantic-topic-supplements",
    "section": "16.156. Cơ sở GTGT khi chiết khấu, trả hàng và thuế trực tiếp — tách khỏi cơ sở TNCN",
    "ref_id": "16.156",
    "tier": "VERIFIED_CONDITIONAL",
    "text": "[GTGT — CHIẾT KHẤU VÀ HÀNG TRẢ LẠI]\nKhoản2 Điều14 NĐ181/2025/NĐ-CP: khi áp chiết khấu thương mại cho khách, giá tính GTGT là giá bán đã chiết khấu, chưa GTGT. Khác chiết khấu thanh toán, phí marketing hay khoản sàn bù lại; kiểm đúng chủ thể chịu khoản giảm, hợp đồng và hóa đơn, không tự lấy Điều5 NĐ68 (doanh thu TNCN) thay căn cứ GTGT.\nĐiều12 khoản2 Luật48/2024/QH15, Điều3 NĐ68 cập nhật NĐ141: ở phương pháp trực tiếp, GTGT = doanh thu chịu GTGT × tỷ lệ đúng nhóm; phân phối hàng hóa gốc1%, không trừ mức1tỷ của TNCN, không trừ chi phí. Hàng trả lại thực, chứng từ/hóa đơn xử lý hợp lệ thì phản ánh giảm giá trị giao dịch/doanh thu chịu GTGT tương ứng; không giữ doanh thu đã được điều chỉnh hợp pháp, không giảm hai lần hoặc chỉ dựa tiền hoàn ví.\nTừ01/07/2026, điểm b khoản5 Điều10 TT91/2026 về chiết khấu theo lượng/doanh số; điểm c.1 khoản5 về trả hàng: người bán lập điều chỉnh, trừ thỏa thuận người mua lập HĐĐT trả lại; c.2 có quy tắc tài sản đã đăng ký tên người mua. Khoản6(c) giảm ghi âm/tăng ghi dương; khoản6(d) áp hóa đơn điều chỉnh thuộc khoản5: người bán kê khai kỳ phát sinh hóa đơn điều chỉnh, người mua kỳ nhận. Không áp kỳ này cho mọi lỗi giá gốc khoản1; hóa đơn cũ xử lý hiện nay còn xét khoản2 Điều24. Trước01/07/2026 dùng pháp luật của thời điểm xử lý, không hồi tố TT91.\nGiảm GTGT theo NĐ174/NQ204 phải xét ngành, kỳ và điều kiện riêng; kết quả theo tỷ lệ gốc chưa tự là số cuối sau giảm. Cần hóa đơn gốc, hồ sơ trả hàng/chiết khấu, số điều chỉnh và trạng thái nền tảng nếu có.\nNguồn gốc: https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/7/181nd.signed.pdf (Điều14 khoản2, trang15); https://congbaocdn.chinhphu.vn/180507251028987904/2026/8/6/470171-1785986965_v1_1786011300_signed.pdf (Điều10 khoản5, khoản6; Điều24); Luật48 Điều12 khoản2.",
    "evidence_mode": "COMPLETE_RULE",
    "retrieval_facets": {
      "topics": [
        "REVENUE_COMPOSITION",
        "VAT_METHOD_CLASSIFICATION",
        "TAX_AMOUNT"
      ],
      "tax_focuses": [
        "vat",
        "both",
        "unspecified"
      ]
    }
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
