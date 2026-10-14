import os
import glob
import shutil
import json
import re

SOURCE_DIR = r"c:\Users\engin\Downloads\van-ban-goc-thue-2026-10-13"
DEST_DIR = r"public\documents"
OUTPUT_JSON = r"src\data\legalDocuments.json"

os.makedirs(DEST_DIR, exist_ok=True)
os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)

# Comprehensive metadata mapping for all 59 tax documents
LEGAL_DOCS_METADATA = {
    "ND-141-2026-ND-CP.pdf": {
        "code": "Nghị định 141/2026/NĐ-CP",
        "title": "Sửa đổi Nghị định 68/2026/NĐ-CP - Nâng ngưỡng doanh thu miễn thuế HKD lên 1 tỷ đồng/năm",
        "issuer": "Chính Phủ",
        "date": "29/04/2026",
        "category": "Nghị định"
    },
    "NQ-43-2026-QH16.pdf": {
        "code": "Nghị quyết 43/2026/QH16",
        "title": "Giảm 30% số thuế TNCN phải nộp năm 2026–2027 cho cá nhân cư trú doanh thu đến 10 tỷ đồng",
        "issuer": "Quốc Hội",
        "date": "01/01/2026",
        "category": "Nghị quyết"
    },
    "311-TCT-DNNCN-2025-goc.pdf": {
        "code": "Công văn 311/TCT-DNNCN",
        "title": "Quy trình cấp và quản lý mã số thuế 13 số phân loại 888 trên Cổng TMĐT qua VNeID mức 2",
        "issuer": "Tổng Cục Thuế",
        "date": "20/01/2025",
        "category": "Công văn"
    },
    "TT-86-2024-TT-BTC.pdf": {
        "code": "Thông tư 86/2024/TT-BTC",
        "title": "Sử dụng số định danh cá nhân (CCCD 12 số) thay thế mã số thuế từ ngày 01/07/2025",
        "issuer": "Bộ Tài Chính",
        "date": "01/07/2025",
        "category": "Thông tư"
    },
    "Luat-48-2024-QH15.pdf": {
        "code": "Luật Thuế GTGT 48/2024/QH15",
        "title": "Luật Thuế Giá trị gia tăng (sửa đổi) - Không chịu thuế GTGT cho doanh thu từ 1 tỷ đồng/năm trở xuống",
        "issuer": "Quốc Hội",
        "date": "01/01/2026",
        "category": "Luật"
    },
    "Luat-109-2025-QH15.pdf": {
        "code": "Luật Thuế TNCN 109/2025/QH15",
        "title": "Luật Thuế Thu nhập cá nhân mới - Bãi bỏ biểu lũy tiến cũ đối với thu nhập từ kinh doanh",
        "issuer": "Quốc Hội",
        "date": "01/01/2026",
        "category": "Luật"
    },
    "ND-68-2026-ND-CP.pdf": {
        "code": "Nghị định 68/2026/NĐ-CP",
        "title": "Chính sách thuế và quản lý thuế đối với Hộ kinh doanh, Cá nhân kinh doanh & Sàn TMĐT khấu trừ nộp thay",
        "issuer": "Chính Phủ",
        "date": "01/01/2026",
        "category": "Nghị định"
    },
    "TT-40-2021-TT-BTC.pdf": {
        "code": "Thông tư 40/2021/TT-BTC",
        "title": "Hướng dẫn thuế GTGT, TNCN và quản lý thuế đối với Hộ kinh doanh, Cá nhân kinh doanh",
        "issuer": "Bộ Tài Chính",
        "date": "01/08/2021",
        "category": "Thông tư"
    },
    "TT-100-2021-TT-BTC.pdf": {
        "code": "Thông tư 100/2021/TT-BTC",
        "title": "Sửa đổi, bổ sung Thông tư 40/2021/TT-BTC về thuế cho thuê tài sản và thời điểm xác định doanh thu",
        "issuer": "Bộ Tài Chính",
        "date": "01/01/2022",
        "category": "Thông tư"
    },
    "TT-88-2021-TT-BTC.pdf": {
        "code": "Thông tư 88/2021/TT-BTC",
        "title": "Hướng dẫn chế độ chứng từ và sổ sách kế toán đơn giản đối với Hộ kinh doanh",
        "issuer": "Bộ Tài Chính",
        "date": "01/01/2022",
        "category": "Thông tư"
    },
    "ND-123-2020-ND-CP.pdf": {
        "code": "Nghị định 123/2020/NĐ-CP",
        "title": "Quy định về hóa đơn, chứng từ điện tử khởi tạo từ máy tính tiền đối với Hộ kinh doanh",
        "issuer": "Chính Phủ",
        "date": "01/07/2022",
        "category": "Nghị định"
    },
    "Luat-108-2025-QH15.pdf": {
        "code": "Luật Quản lý Thuế 108/2025/QH15",
        "title": "Luật Quản lý Thuế mới - Thay thế Luật 38/2019/QH14 từ 01/07/2026 (rút hạn khai bổ sung xuống 5 năm)",
        "issuer": "Quốc Hội",
        "date": "01/07/2026",
        "category": "Luật"
    },
    "Luat-09-2026-QH16.pdf": {
        "code": "Luật 09/2026/QH16",
        "title": "Luật sửa đổi, bổ sung một số điều của Luật Thuế TNCN, Luật Thuế GTGT và các luật về thuế",
        "issuer": "Quốc Hội",
        "date": "27/05/2026",
        "category": "Luật"
    },
    "ND-168-2025-ND-CP.pdf": {
        "code": "Nghị định 168/2025/NĐ-CP",
        "title": "Quy định về đăng ký kinh doanh, quản lý hộ kinh doanh và liên thông dữ liệu thuế điện tử",
        "issuer": "Chính Phủ",
        "date": "2025",
        "category": "Nghị định"
    },
    "ND-181-2025-ND-CP.pdf": {
        "code": "Nghị định 181/2025/NĐ-CP",
        "title": "Quy định chi tiết thi hành một số điều của Luật Thuế và kiểm tra, giám sát thuế",
        "issuer": "Chính Phủ",
        "date": "2025",
        "category": "Nghị định"
    },
    "1241-CTCBA-TTHT-2024-goc.pdf": {
        "code": "Công văn 1241/CTCBA-TTHT",
        "title": "Thuế TNCN đối với hoạt động tiếp thị liên kết (Affiliate marketing) trên sàn TMĐT",
        "issuer": "Cục Thuế",
        "date": "2024",
        "category": "Công văn"
    },
    "1296-CT-NVT-2026-goc.pdf": {
        "code": "Công văn 1296/CT-NVT",
        "title": "Hướng dẫn nghiệp vụ quản lý thuế đối với cá nhân và hộ kinh doanh",
        "issuer": "Cục Thuế",
        "date": "2026",
        "category": "Công văn"
    },
    "2792-BHXH-QLT-2026-goc.pdf": {
        "code": "Công văn 2792/BHXH-QLT",
        "title": "Thu, đóng bảo hiểm xã hội (BHXH) bắt buộc đối với chủ hộ kinh doanh",
        "issuer": "Bảo Hiểm Xã Hội",
        "date": "2026",
        "category": "Công văn"
    },
    "3405-CT-CS-2026-goc.pdf": {
        "code": "Công văn 3405/CT-CS",
        "title": "Hướng dẫn chính sách áp dụng hóa đơn điện tử đối với hộ, cá nhân kinh doanh",
        "issuer": "Cục Thuế",
        "date": "26/05/2026",
        "category": "Công văn"
    },
    "4915-CT-NVT-2026-goc.pdf": {
        "code": "Công văn 4915/CT-NVT",
        "title": "Tạm hoãn xuất cảnh đối với cá nhân, đại diện hộ kinh doanh chưa hoàn thành nghĩa vụ nộp thuế",
        "issuer": "Cục Thuế",
        "date": "17/07/2026",
        "category": "Công văn"
    },
    "5622-CT-NVT-2026-goc.pdf": {
        "code": "Công văn 5622/CT-NVT",
        "title": "Triển khai quy trình tạm hoãn xuất cảnh theo quy định Luật Quản lý thuế",
        "issuer": "Cục Thuế",
        "date": "2026",
        "category": "Công văn"
    },
    "5947-CT-KTr-2026-goc.pdf": {
        "code": "Công văn 5947/CT-KTr",
        "title": "Chấn chỉnh công tác xử lý hồ sơ làm sạch mã số thuế và định danh điện tử",
        "issuer": "Cục Thuế",
        "date": "2026",
        "category": "Công văn"
    },
    "6101-BHXH-QLT-2026-goc.pdf": {
        "code": "Công văn 6101/BHXH-QLT",
        "title": "Hướng dẫn chế độ bảo hiểm xã hội bắt buộc đối với chủ hộ kinh doanh cá thể",
        "issuer": "Bảo Hiểm Xã Hội",
        "date": "31/07/2026",
        "category": "Công văn"
    },
    "6480-CT-QLNT-2026-goc.pdf": {
        "code": "Công văn 6480/CT-QLNT",
        "title": "Giải đáp kiến nghị của Hội Tư vấn Thuế về quản lý nợ và cưỡng chế nợ thuế HKD",
        "issuer": "Cục Thuế",
        "date": "2026",
        "category": "Công văn"
    },
    "Luat-122-2025-QH15.pdf": {
        "code": "Luật 122/2025/QH15",
        "title": "Luật sửa đổi, bổ sung một số điều của các Luật về Thuế và phí",
        "issuer": "Quốc Hội",
        "date": "2025",
        "category": "Luật"
    },
    "Luat-38-2019-QH14.pdf": {
        "code": "Luật Quản lý Thuế 38/2019/QH14",
        "title": "Luật Quản lý Thuế 2019 (Hiệu lực đến trước 01/07/2026, được thay thế bởi Luật 108/2025/QH15)",
        "issuer": "Quốc Hội",
        "date": "01/07/2020",
        "category": "Luật"
    },
    "Luat-56-2024-QH15.pdf": {
        "code": "Luật 56/2024/QH15",
        "title": "Luật sửa đổi, bổ sung một số điều của Luật Kế toán, Luật Kiểm toán độc lập, Luật Quản lý thuế...",
        "issuer": "Quốc Hội",
        "date": "01/01/2025",
        "category": "Luật"
    },
    "Luat-67-2025-QH15.pdf": {
        "code": "Luật Thuế TNDN 67/2025/QH15",
        "title": "Luật Thuế Thu nhập doanh nghiệp (sửa đổi) và quy định liên quan thuế kinh doanh",
        "issuer": "Quốc Hội",
        "date": "2025",
        "category": "Luật"
    },
    "Luat-91-2015-QH13.pdf": {
        "code": "Bộ luật Dân sự 91/2015/QH13",
        "title": "Bộ luật Dân sự quy định về địa vị pháp lý, quyền và nghĩa vụ dân sự của hộ kinh doanh, cá nhân kinh doanh",
        "issuer": "Quốc Hội",
        "date": "01/01/2017",
        "category": "Luật"
    },
    "ND-118-2025-ND-CP.pdf": {
        "code": "Nghị định 118/2025/NĐ-CP",
        "title": "Quy định về thủ tục kinh doanh và điều kiện kinh doanh trong lĩnh vực số",
        "issuer": "Chính Phủ",
        "date": "10/06/2025",
        "category": "Nghị định"
    },
    "ND-125-2020-ND-CP.pdf": {
        "code": "Nghị định 125/2020/NĐ-CP",
        "title": "Quy định xử phạt vi phạm hành chính về thuế, hóa đơn đối với tổ chức, cá nhân, HKD",
        "issuer": "Chính Phủ",
        "date": "05/12/2020",
        "category": "Nghị định"
    },
    "ND-144-2026-ND-CP.pdf": {
        "code": "Nghị định 144/2026/NĐ-CP",
        "title": "Quy định về xử phạt vi phạm hành chính trong quản lý thuế và hoạt động kinh doanh",
        "issuer": "Chính Phủ",
        "date": "07/05/2026",
        "category": "Nghị định"
    },
    "ND-174-2025-ND-CP.pdf": {
        "code": "Nghị định 174/2025/NĐ-CP",
        "title": "Quy định xử phạt vi phạm hành chính trong lĩnh vực tài chính, kế toán và kiểm toán",
        "issuer": "Chính Phủ",
        "date": "2025",
        "category": "Nghị định"
    },
    "ND-245-2026-ND-CP.pdf": {
        "code": "Nghị định 245/2026/NĐ-CP",
        "title": "Quy định về quản lý giao dịch điện tử và định danh điện tử trong dịch vụ công và thuế",
        "issuer": "Chính Phủ",
        "date": "30/06/2026",
        "category": "Nghị định"
    },
    "ND-248-2026-ND-CP.pdf": {
        "code": "Nghị định 248/2026/NĐ-CP",
        "title": "Quy định về chia sẻ, kết nối dữ liệu giữa ngân hàng thương mại, sàn TMĐT và cơ quan thuế",
        "issuer": "Chính Phủ",
        "date": "06/07/2026",
        "category": "Nghị định"
    },
    "ND-252-2026-ND-CP.pdf": {
        "code": "Nghị định 252/2026/NĐ-CP",
        "title": "Hướng dẫn áp dụng hóa đơn điện tử khởi tạo từ máy tính tiền và kết nối dữ liệu cơ quan thuế",
        "issuer": "Chính Phủ",
        "date": "03/07/2026",
        "category": "Nghị định"
    },
    "ND-253-2026-ND-CP.pdf": {
        "code": "Nghị định 253/2026/NĐ-CP",
        "title": "Quy định chi tiết thi hành Luật Thuế Thu nhập cá nhân và Luật Thuế GTGT cho hoạt động TMĐT",
        "issuer": "Chính Phủ",
        "date": "06/07/2026",
        "category": "Nghị định"
    },
    "ND-254-2026-ND-CP.pdf": {
        "code": "Nghị định 254/2026/NĐ-CP",
        "title": "Quy định chi tiết về kê khai thuế, nộp thuế và quyết toán thuế của cá nhân, hộ kinh doanh",
        "issuer": "Chính Phủ",
        "date": "03/07/2026",
        "category": "Nghị định"
    },
    "ND-291-2026-ND-CP.pdf": {
        "code": "Nghị định 291/2026/NĐ-CP",
        "title": "Quy định tiêu chí quản lý rủi ro và các biện pháp cưỡng chế thi hành quyết định hành chính thuế",
        "issuer": "Chính Phủ",
        "date": "2026",
        "category": "Nghị định"
    },
    "ND-310-2025-ND-CP.pdf": {
        "code": "Nghị định 310/2025/NĐ-CP",
        "title": "Sửa đổi, bổ sung Nghị định 125/2020/NĐ-CP về xử phạt vi phạm hành chính thuế, hóa đơn",
        "issuer": "Chính Phủ",
        "date": "2025",
        "category": "Nghị định"
    },
    "ND-320-2025-ND-CP.pdf": {
        "code": "Nghị định 320/2025/NĐ-CP",
        "title": "Quy định chi tiết và biện pháp tổ chức, hướng dẫn thi hành các chính sách thuế kinh doanh",
        "issuer": "Chính Phủ",
        "date": "28/12/2025",
        "category": "Nghị định"
    },
    "NQ-204-2025-QH15.pdf": {
        "code": "Nghị quyết 204/2025/QH15",
        "title": "Nghị quyết về một số cơ chế, chính sách tài khóa đặc thù hỗ trợ phát triển kinh tế tư nhân",
        "issuer": "Quốc Hội",
        "date": "30/06/2025",
        "category": "Nghị quyết"
    },
    "TT-103-2014-TT-BTC.pdf": {
        "code": "Thông tư 103/2014/TT-BTC",
        "title": "Hướng dẫn thực hiện nghĩa vụ thuế áp dụng đối với tổ chức, cá nhân nước ngoài kinh doanh tại Việt Nam (Thuế nhà thầu)",
        "issuer": "Bộ Tài Chính",
        "date": "26/08/2014",
        "category": "Thông tư"
    },
    "TT-110-2026-TT-BTC.pdf": {
        "code": "Thông tư 110/2026/TT-BTC",
        "title": "Hướng dẫn giao dịch điện tử, nộp hồ sơ thuế trực tuyến và trao đổi thông tin người nộp thuế",
        "issuer": "Bộ Tài Chính",
        "date": "2026",
        "category": "Thông tư"
    },
    "TT-111-2013-TT-BTC.pdf": {
        "code": "Thông tư 111/2013/TT-BTC",
        "title": "Hướng dẫn thực hiện Luật Thuế Thu nhập cá nhân và các điều kiện giảm trừ gia cảnh",
        "issuer": "Bộ Tài Chính",
        "date": "15/08/2013",
        "category": "Thông tư"
    },
    "TT-121-2026-TT-BTC.pdf": {
        "code": "Thông tư 121/2026/TT-BTC",
        "title": "Sửa đổi, bổ sung biểu mẫu sử dụng trong quản lý thuế, chứng từ khấu trừ thuế điện tử",
        "issuer": "Bộ Tài Chính",
        "date": "08/09/2026",
        "category": "Thông tư"
    },
    "TT-126-2026-TT-BTC.pdf": {
        "code": "Thông tư 126/2026/TT-BTC",
        "title": "Quy định quy trình kiểm tra thuế, xác minh nguồn thông tin đối với hộ kinh doanh",
        "issuer": "Bộ Tài Chính",
        "date": "2026",
        "category": "Thông tư"
    },
    "TT-152-2025-TT-BTC.pdf": {
        "code": "Thông tư 152/2025/TT-BTC",
        "title": "Hướng dẫn về thuế tài nguyên và phí bảo vệ môi trường đối với cá nhân, hộ khai thác kinh doanh",
        "issuer": "Bộ Tài Chính",
        "date": "06/01/2026",
        "category": "Thông tư"
    },
    "TT-18-2026-TT-BTC.pdf": {
        "code": "Thông tư 18/2026/TT-BTC",
        "title": "Hướng dẫn quản lý thuế và chính sách thuế đối với cá nhân, hộ kinh doanh nền tảng số",
        "issuer": "Bộ Tài Chính",
        "date": "12/03/2026",
        "category": "Thông tư"
    },
    "TT-19-2021-TT-BTC.pdf": {
        "code": "Thông tư 19/2021/TT-BTC",
        "title": "Hướng dẫn giao dịch điện tử trong lĩnh vực thuế qua Cổng thông tin điện tử Tổng cục Thuế",
        "issuer": "Bộ Tài Chính",
        "date": "03/05/2021",
        "category": "Thông tư"
    },
    "TT-20-2026-TT-BTC.pdf": {
        "code": "Thông tư 20/2026/TT-BTC",
        "title": "Ban hành hệ thống biểu mẫu kê khai thuế dành cho hộ, cá nhân kinh doanh TMĐT",
        "issuer": "Bộ Tài Chính",
        "date": "13/03/2026",
        "category": "Thông tư"
    },
    "TT-50-2026-TT-BTC.pdf": {
        "code": "Thông tư 50/2026/TT-BTC",
        "title": "Hướng dẫn phối hợp quản lý thuế giữa cơ quan thuế và các nền tảng thương mại điện tử xuyên biên giới",
        "issuer": "Bộ Tài Chính",
        "date": "15/05/2026",
        "category": "Thông tư"
    },
    "TT-78-2021-TT-BTC.pdf": {
        "code": "Thông tư 78/2021/TT-BTC",
        "title": "Hướng dẫn thực hiện một số điều về hóa đơn, chứng từ điện tử theo Nghị định 123/2020/NĐ-CP",
        "issuer": "Bộ Tài Chính",
        "date": "01/07/2022",
        "category": "Thông tư"
    },
    "TT-87-2026-TT-BTC.pdf": {
        "code": "Thông tư 87/2026/TT-BTC",
        "title": "Quy định chi tiết thi hành một số điều của Luật Thuế TNCN và Nghị định 253/2026/NĐ-CP",
        "issuer": "Bộ Tài Chính",
        "date": "2026",
        "category": "Thông tư"
    },
    "TT-89-2026-TT-BTC.pdf": {
        "code": "Thông tư 89/2026/TT-BTC",
        "title": "Hướng dẫn nộp thuế điện tử và hoàn thuế tự động qua ứng dụng eTax Mobile",
        "issuer": "Bộ Tài Chính",
        "date": "15/07/2026",
        "category": "Thông tư"
    },
    "TT-90-2026-TT-BTC.pdf": {
        "code": "Thông tư 90/2026/TT-BTC",
        "title": "Quy định về quy trình giải quyết hồ sơ hoàn thuế TNCN nộp thừa đối với cá nhân",
        "issuer": "Bộ Tài Chính",
        "date": "09/07/2026",
        "category": "Thông tư"
    },
    "TT-91-2026-TT-BTC.pdf": {
        "code": "Thông tư 91/2026/TT-BTC",
        "title": "Quy trình quản lý nợ và áp dụng biện pháp cưỡng chế trích tiền từ tài khoản người nộp thuế",
        "issuer": "Bộ Tài Chính",
        "date": "28/07/2026",
        "category": "Thông tư"
    },
    "TT-92-2015-TT-BTC.pdf": {
        "code": "Thông tư 92/2015/TT-BTC",
        "title": "Hướng dẫn thực hiện thuế GTGT và thuế TNCN đối với cá nhân cư trú có hoạt động kinh doanh",
        "issuer": "Bộ Tài Chính",
        "date": "30/07/2015",
        "category": "Thông tư"
    },
    "TT-94-2026-TT-BTC.pdf": {
        "code": "Thông tư 94/2026/TT-BTC",
        "title": "Hướng dẫn kê khai bổ sung hồ sơ thuế và xử lý tiền chậm nộp theo Luật Quản lý thuế mới",
        "issuer": "Bộ Tài Chính",
        "date": "07/07/2026",
        "category": "Thông tư"
    }
}

def format_size(bytes_num):
    if bytes_num < 1024 * 1024:
        return f"{bytes_num / 1024:.0f} KB"
    return f"{bytes_num / (1024 * 1024):.1f} MB"

def main():
    files = glob.glob(os.path.join(DEST_DIR, "*.pdf"))
    print(f"Total PDFs in destination: {len(files)}")
    
    docs_metadata = []

    for dest_path in sorted(files):
        fname = os.path.basename(dest_path)
        size_bytes = os.path.getsize(dest_path)
        
        if fname in LEGAL_DOCS_METADATA:
            meta = LEGAL_DOCS_METADATA[fname]
            code = meta["code"]
            title = meta["title"]
            issuer = meta["issuer"]
            date = meta["date"]
            category = meta["category"]
        else:
            code = os.path.splitext(fname)[0]
            title = code
            issuer = "Cơ quan Nhà nước"
            date = "2026"
            category = "Văn bản khác"
            
        item = {
            "id": os.path.splitext(fname)[0],
            "code": code,
            "title": title,
            "issuer": issuer,
            "date": date,
            "category": category,
            "fileName": fname,
            "fileSize": format_size(size_bytes),
            "downloadUrl": f"/documents/{fname}"
        }
        docs_metadata.append(item)
    
    # Priority sorting: Core HKD documents first
    def priority(d):
        c = d["code"].lower()
        if "141/2026" in c: return 1
        if "43/2026" in c: return 2
        if "311" in c: return 3
        if "86/2024" in c: return 4
        if "48/2024" in c: return 5
        if "109/2025" in c: return 6
        if "68/2026" in c: return 7
        if "40/2021" in c: return 8
        if "100/2021" in c: return 9
        if "88/2021" in c: return 10
        if "123/2020" in c: return 11
        if "108/2025" in c: return 12
        if "09/2026" in c: return 13
        if "125/2020" in c: return 14
        if "310/2025" in c: return 15
        if "168/2025" in c: return 16
        if "181/2025" in c: return 17
        if "1241" in c: return 18
        if d["category"] == "Nghị định": return 30
        if d["category"] == "Thông tư": return 40
        if d["category"] == "Công văn": return 50
        if d["category"] == "Luật": return 60
        return 100
    
    docs_metadata.sort(key=priority)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(docs_metadata, f, ensure_ascii=False, indent=2)
    
    print(f"Recorded {len(docs_metadata)} documents in {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
