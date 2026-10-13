<USER_REQUEST>
# ASK TAX AI — LỆNH SỬA CHỮA KỸ THUẬT SAU 40 VÒNG KIỂM THỬ

**Mã tài liệu:** ATAI-PATCH-40-2026-10  
**Phiên bản:** 2.0 — 14/10/2026  
**Dành cho:** AI Coding Agent / kỹ sư backend được quyền đọc và sửa repository Ask Tax AI  
**Phạm vi:** RAG pháp luật thuế Việt Nam, phân loại nghiệp vụ, Tax Engine, model router, trích dẫn, kiểm thử hồi quy  
**Trạng thái:** Chỉ thị triển khai và tiêu chí nghiệm thu. **Chưa có bản vá nào được xác nhận đã cài đặt vào hệ thống.**

> **LỆNH CHÍNH:** Hãy đọc repository thực tế, xác định nguyên nhân của các lỗi được ghi nhận qua 40 lượt gọi API, triển khai sửa chữa có kiểm thử, và xuất báo cáo diff + bằng chứng pass/fail. Không chỉ viết lại prompt. Không được coi các nhận xét của AI kiểm thử là chân lý pháp luật nếu chưa đối chiếu nguồn chính thức.
>
> **PHÁT HIỆN BỔ SUNG MỨC P0:** Cần áp dụng **Nghị quyết 43/2026/QH16 (24/08/2026)**: giảm **30% số thuế TNCN phải nộp** đối với thu nhập từ kinh doanh của cá nhân cư trú có doanh thu năm **không quá 10 tỷ đồng**, cho **kỳ tính thuế năm 2026 và 2027**. Lượt kiểm thử 1–40 đã bỏ sót lớp giảm thuế này. Khi sửa, phải phân biệt **thuế trước ưu đãi** và **thuế cuối cùng sau ưu đãi**, không lấy con số cũ làm đáp án cuối cùng.

---

## 0. HƯỚNG DẪN THỰC THI CHO AI LẬP TRÌNH

1. Khảo sát repo trước: runtime, API routes, cấu hình model, prompt templates, chunk/index RAG, BM25/vector, tool-calling, cache, logs, cơ chế lấy phiên bản pháp luật, unit/integration tests.
2. Tạo nhánh sửa riêng và snapshot: commit, model config, corpus/index checksum, prompt hash, luật/rule version. Không tự deploy production, không xóa dữ liệu gốc hoặc chỉnh nguồn luật đã duyệt mà không lưu lịch sử.
3. Chạy baseline trên 40 case bên dưới nếu có môi trường test, giữ nguyên raw answer, retrieved chunks, model ID, route, rule IDs, source IDs, latency và test outcome.
4. Sửa theo thứ tự **P0 → P1 → P2**. Nếu repo không hỗ trợ một module, xây adapter tối thiểu; không giả vờ đã sửa.
5. Viết test chạy tự động. Kết quả pháp lý chưa được chuyên gia duyệt phải là `PENDING_LEGAL_REVIEW`, không biến thành gold answer.
6. Không suy diễn một luật có hiệu lực năm 2027 chỉ vì đã đúng năm 2026: dùng rule theo kỳ áp dụng; với NQ43 đã có căn cứ áp dụng cho cả 2026–2027.
7. Báo cáo **thực sự đã sửa file nào, bằng chứng test nào pass/fail, tồn đọng nào và rollback ra sao**. Nếu không có quyền đọc hoặc chỉnh repo, chỉ nộp patch/diff đề xuất và nói rõ chưa triển khai.

**Không làm:** thay model như giải pháp duy nhất; viết một system prompt rất dài để chữa lỗi tính toán; ép AI chốt thuế suất affiliate 5% cho mọi trường hợp; viện dẫn văn bản bằng tên chung chung; coi dữ liệu từ câu hỏi người dùng là căn cứ luật; tự động sử dụng văn bản dự thảo như văn bản đã có hiệu lực.

---

## 1. CƠ SỞ KIỂM THỬ VÀ ĐỘ TIN CẬY

- Đã gọi công cụ Ask Tax AI **40 lượt** trong hai đợt, T01–T20 và T21–T40; mỗi câu được gọi một lần. Đây là **test khám phá**, không phải phép đo độ chính xác thống kê hay chứng nhận của chuyên gia pháp lý.
- Metadata từ một số câu cho thấy **Muse Spark 1.3** và **Llama 3.3 70B** cùng được sử dụng, với nhãn routing như `AFFILIATE`, `ONE_BILLION`, `HISTORICAL_YEAR_THRESHOLD`, `THUE_SUAT_NGANH`. Cần xác minh bằng logs vì footer do hệ thống tự sinh chưa đủ bằng chứng.
- Trường hợp T40 hiển thị Llama 3.3 và trả sai TNCN của hàng hóa 1,01 tỷ thành **5.050.000đ**; T21 hiển thị Muse và nhận ra khoản trừ 1 tỷ nhưng từ chối tính tiếp. Hai câu cùng bản chất nhưng khác kết luận. **Chưa thể quy trách nhiệm cho model**, vì RAG, prompt, cache và router chưa được kiểm toán.
- Nhãn RAG đôi khi lệch vấn đề: T10 và T39 đều liên quan doanh thu hoàn hàng, nhưng footer hiển thị `WAGE_WITHHOLD_10PCT`. Đây là tín hiệu đáng điều tra, không phải kết luận chắc chắn nguyên nhân.
- Phần “Căn cứ pháp lý & đối soát” do Ask Tax AI trả về **không phải chứng nhận** rằng từng trích dẫn đã được đối chiếu toàn văn.

### Lỗi đã quan sát

| Mức | Ca | Sai lệch / lỗ hổng quan sát | Tiêu chí sửa |
|---|---|---|---|
| **P0** | T06, T21, T40 | Hàng hóa 1,01 tỷ: lúc không tính được, lúc tính TNCN thành 5,05 triệu | Tính được căn cứ PIT 10 triệu, PIT gốc 50.000đ; xét tiếp giảm 30% theo NQ43 |
| **P0** | T27, T36, T40 | Đầu ra thiếu/không nhất quán về **giảm TNCN 30%** của 2026 | Tax Engine phải xuất base tax, reduction và payable tách biệt |
| **P0** | T07, T24, T36 | Hỗn hợp ngành/affiliate áp TNCN trên doanh thu chưa trừ ngưỡng | Phân bổ trần trừ theo quy định, xác định đúng loại thu nhập và rate |
| **P0** | T11, T22 | Có lượt nhầm ngưỡng 2025 = 500 triệu; lượt khác đúng 100 triệu nhưng không tính thuế | Sử dụng snapshot pháp lý năm 2025 và tỷ lệ hàng hóa phù hợp |
| **P0** | T05, T20, T23 | Mâu thuẫn về việc “bắt buộc xin mã mới 888” | Phân biệt MST cũ, định danh 12 số, nghĩa vụ cập nhật/đăng ký |
| **P0** | T18, T28, T35, T40 | Trích điều khoản/URL chưa xác minh hoặc thay đổi | Claim-to-source kiểm chứng thực sự đoạn nguồn |
| **P1** | T16 | Đọc nhầm 300 triệu trong ba tháng cùng năm sang năm sau | Chuẩn hóa mốc thời gian, hypothetical và kỳ doanh thu |
| **P1** | T12, T30, T37 | Freelancer chưa đăng ký được phân loại tiền công nhưng trích căn cứ chưa khớp yêu cầu | Decision tree có điều kiện, dẫn đúng căn cứ Điều 8 và chuyển tiếp Điều 69 NĐ253 |
| **P1** | T03, T13, T32 | Nghĩa vụ đăng ký affiliate nhỏ lẻ và ngưỡng miễn ĐKKD Hà Nội | Tách ĐKKD / đăng ký thuế / khai thuế / nộp thuế; không tự bịa địa phương |
| **P1** | T26 | Tình huống vượt ngưỡng **1 đồng**, xuất 0,005 đồng PIT | Chính sách làm tròn và bút toán được duyệt, không nhầm tax base |
| **P1** | T04, T17, T34, T39 | Chứng từ khấu trừ, tiền COD, hoàn hàng và phí sàn | Tính đúng gross, revenue reversals và thu hộ; tránh trừ trùng |
| **P2** | Nhiều ca | Hỏi lại dù đủ dữ kiện, câu “mình chốt luôn” khi chưa chắc | Phong cách ngắn và mức chắc chắn tương xứng bằng chứng |

### Quy tắc đánh giá

- `PASS_LEGAL`: chỉ khi có source span chính thức + thời điểm hiệu lực + người duyệt assertions cần thiết.
- `PASS_FUNCTIONAL`: đã xử lý đúng logic chương trình nhưng còn một số căn cứ pháp lý cần duyệt.
- `FAIL`: sai công thức/đọc sai dữ kiện/mâu thuẫn hoặc trích dẫn bịa.
- `PENDING_LEGAL_REVIEW`: tình huống chưa có đủ nguồn/thuế suất/chứng từ để đóng đáp án.
- Không gom `PENDING` vào `PASS` trong báo cáo chất lượng.

---

## 2. BỘ QUY TẮC PHÁP LÝ TỐI THIỂU PHẢI NẠP

**Snapshot đối chiếu ngày 14/10/2026.** Luôn kiểm tra nguồn gốc và mọi sửa đổi mới nhất trước khi phát hành; không dùng bài tổng hợp/dự thảo để thay văn bản chính thức.

| Rule ID | Nội dung đã đối chiếu ở mức nguyên tắc | Nguồn chính thức |
|---|---|---|
| `VN_2025_BIZ_THRESHOLD` | Năm 2025 hộ/cá nhân kinh doanh doanh thu **từ 100 triệu/năm trở xuống** không phải nộp GTGT và TNCN theo quy định tương ứng. | TT40/2021, TT100/2021; [Bộ Tài chính trả lời](https://tpcp.mof.gov.vn/hoidapcstc/home/cthoidap/156887) |
| `VN_2026_THRESHOLD` | NĐ141 thay “500 triệu” thành **“01 tỷ”** tại các điều liên quan của NĐ68; ban hành 29/04/2026, hiệu lực/áp dụng từ 01/01/2026. | [Công báo NĐ141](https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-141-2026-nd-cp-469455.htm); [toàn văn giới thiệu](https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm) |
| `VN_2026_PIT_BIZ` | Điều 7 Luật 109/2025: phương pháp thu nhập tính thuế × thuế suất, hoặc với điều kiện cho phép phương pháp **thuế suất × phần doanh thu vượt ngưỡng**. Thuế suất khác nhau theo ngành, có quy tắc riêng cho cho thuê. | [Luật Thuế TNCN 109/2025 — hướng dẫn Điều 7](https://xaydungchinhsach.chinhphu.vn/quy-dinh-thue-thu-nhap-ca-nhan-doi-voi-thu-nhap-tu-kinh-doanh-119260327063731539.htm) |
| `VN_2026_MULTI_ACTIVITY_ALLOWANCE` | Khoản 3 Điều 4 NĐ68 (sau sửa NĐ141): nhiều ngành/địa điểm được chọn nơi phân bổ mức trừ theo hướng có lợi nhất, **tổng không vượt 1 tỷ/năm** đối với diện áp dụng. | [NĐ68 — văn bản gốc](https://vanban.chinhphu.vn/?docid=217111&pageid=27160) + [NĐ141 sửa đổi](https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-141-2026-nd-cp-469455.htm) |
| `VN_2026_VAT_DIRECT` | GTGT theo phương pháp trực tiếp là **tỷ lệ GTGT × doanh thu chịu thuế**, không dùng mặc định phần vượt ngưỡng của TNCN làm cơ sở GTGT. Tỷ lệ bán hàng hóa thông thường: 1%; dịch vụ thông thường: 5%, nếu đúng nhóm và không có ngoại lệ. | Luật GTGT 48/2024 Điều 12; [Bộ Tài chính giải thích](https://portal.mof.gov.vn/hoidapcstc/home/cthoidap/160962) |
| `VN_2026_PIT_REDUCTION_NQ43` | **Giảm 30% TNCN phải nộp** cho thu nhập kinh doanh của **cá nhân cư trú, doanh thu năm không quá 10 tỷ**, áp dụng năm 2026–2027; **không tự áp giảm 30% lên GTGT hoặc tiền công**. | [Nghị quyết 43/2026/QH16](https://vanban.chinhphu.vn/?docid=219330&orggroupid=1&pageid=27160); [Bộ Tài chính giới thiệu](https://mof.gov.vn/bo-tai-chinh/thong-bao-chi-dao-dieu-hanh/tai-lieu-gioi-thieu-nhung-noi-dung-co-ban-cua-nghi-quyet-so-432026qh16-ve-giam-thue-thu-nhap-ca-nhan-thue-thu-nhap-doanh-nghiep-doi-voi-ca-nhan-va-doanh-nghiep) |
| `VN_EINVOICE_1B_30D` | NĐ141 Điều 1 sửa **khoản 5 Điều 8 NĐ68**: doanh thu năm trên 1 tỷ thuộc diện áp dụng HĐĐT; có trường hợp đăng ký trong **30 ngày kể từ ngày cuối cùng của kỳ tính thuế có doanh thu lũy kế trên 1 tỷ**. Cần xác minh kỳ tính thuế trước khi suy ra ngày cụ thể. | [Toàn văn nội dung NĐ141](https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm) |
| `VN_ID_REPLACES_TAX_ID` | Từ 01/07/2025 số định danh cá nhân thay MST của hộ/cá nhân theo phạm vi và điều kiện. Đã có MST, dữ liệu khớp thì chuyển đổi; dữ liệu lệch cần cập nhật; không áp quy tắc mỗi ngành có một MST 888 mới. | [TT86/2024/TT-BTC](https://congbao.chinhphu.vn/tai-ve-van-ban-so-86-2024-tt-btc-43707-53962); [Cục Thuế hướng dẫn](https://xaydungchinhsach.chinhphu.vn/huong-dan-mot-so-noi-dung-ve-su-dung-so-dinh-danh-ca-nhan-thay-cho-ma-so-thue-tu-1-7-119250621104848381.htm) |
| `VN_FREELANCE_CLASSIFICATION` | Kiểm tra phân loại thù lao cung cấp dịch vụ chưa đăng ký kinh doanh/đăng ký thuế theo **điểm c khoản 2 Điều 8 NĐ253/2026**, quy định áp dụng theo kỳ và Điều 69; không chỉ dựa tên hợp đồng. | [NĐ253/2026/NĐ-CP](https://chinhphu.vn/?classid=1&docid=218684&pageid=27160&typegroupid=4) |
| `VN_PLATFORM_WITHHOLDING` | Phải phân biệt nền tảng có vai trò đặt hàng/thanh toán, nghĩa vụ nộp thay, thuế thực tế đã khấu trừ và chứng từ. | [NĐ252/2026/NĐ-CP](https://vanban.chinhphu.vn/?docid=218690&orggroupid=2&pageid=27160) |
| `VN_EINVOICE_EXCEPTIONS` | Có ngoại lệ, tình huống hóa đơn tự nguyện, tài sản phải đăng ký. Không suy “không bắt buộc HĐĐT thường xuyên” = “không bao giờ có nghĩa vụ lập hóa đơn”. | NĐ68/NĐ141; [NĐ254/2026/NĐ-CP](https://vanban.chinhphu.vn/?classid=1&docid=218689&orggroupid=2&pageid=27160); [TT91/2026/TT-BTC](https://vanban.chinhphu.vn/?docid=219006&pageid=27160). Vẫn cần xác minh điều khoản cụ thể của từng ngoại lệ trước khi áp dụng. |

**Cảnh báo về NQ43:** Văn bản đã có hiệu lực. Có dự thảo nghị định hướng dẫn công bố tháng 09/2026; **dự thảo không được dùng như điều khoản đã có hiệu lực**. Tại thời điểm triển khai, kiểm tra lại đã có nghị định chính thức hướng dẫn hay chưa, quy tắc làm tròn, khai giảm và khấu trừ/nộp thay. Nếu chi tiết chưa được xác minh, giữ `NEEDS_LEGAL_REVIEW` cho thủ tục, nhưng không được âm thầm bỏ chính sách giảm 30% khỏi tính toán cơ bản.

### Phân biệt 3 tầng số thuế

1. `tax_base`: doanh thu chịu thuế của **từng sắc thuế**, từng hoạt động và từng kỳ.
2. `tax_before_relief`: thuế được tính trước ưu đãi.
3. `tax_after_relief`: thuế sau giảm/miễn, trước đối chiếu `withheld_amount` và các khoản đã nộp. Sau đó mới tính số còn phải nộp hoặc nộp thừa.

Không gộp `tax_before_relief` thành “số thuế phải nộp cuối cùng”. Không ghi chung `tax_rate` cho cả GTGT và TNCN. Không đồng nhất **phí sàn**, **tiền sàn gắn nhãn tax**, **thuế đã khấu trừ** và **thuế có chứng từ đã nộp thay**.

### Ví dụ gold tạm thời cho ca có dữ kiện rõ

**E01 — Bán hàng hóa thông thường, cá nhân cư trú, 2026, doanh thu 1.010.000.000đ, phương pháp TNCN tỷ lệ doanh thu, VAT 1%, PIT 0,5%:**

```text
revenue                             = 1.010.000.000 VND
VAT base (direct turnover method)  = 1.010.000.000 VND
VAT before/after NQ43             = 10.100.000 / 10.100.000 VND
PIT allowable deduction           = 1.000.000.000 VND
PIT base                          =    10.000.000 VND
PIT before NQ43                   =        50.000 VND
PIT relief 30%                    =        15.000 VND
PIT after relief                  =        35.000 VND
```

**E02 — Dịch vụ sửa máy tính thông thường, cá nhân cư trú, 2026, doanh thu 1,5 tỷ, phương pháp tỷ lệ 5% GTGT / 2% TNCN:**

```text
VAT base                          = 1.500.000.000 VND
VAT                               =    75.000.000 VND
PIT base                          =   500.000.000 VND
PIT before NQ43                   =    10.000.000 VND
PIT relief 30%                    =     3.000.000 VND
PIT after relief                  =     7.000.000 VND
```

**E03 — Bán hàng hóa thông thường năm 2025 doanh thu 300 triệu, VAT 1%, PIT 0,5% (không dùng NQ43):**

```text
VAT = 300.000.000 × 1%   = 3.000.000 VND
PIT = 300.000.000 × 0,5% = 1.500.000 VND
```

Các ví dụ đều cần giả định thuộc ngành/đối tượng chịu thuế tương ứng, không có miễn giảm khác, và phải được reviewer phê duyệt làm gold. **NQ43 không hồi tố cho năm 2025.**

**E04 — Affiliate 1,6 tỷ năm 2026:** chưa được mặc định tỷ lệ TNCN 5% cho mọi khoản hoa hồng. Nếu reviewer xác nhận giao dịch thuộc nhóm PIT 5% và đáp ứng điều kiện giảm NQ43 thì **PIT trước giảm = (1,6 − 1) tỷ × 5% = 30 triệu; sau giảm = 21 triệu**. Nếu thuộc nhóm thuế suất khác, phải tính lại và viện dẫn phân loại. Không đưa 80 triệu (1,6 tỷ × 5%) làm đáp án thuế sau giảm.

**E05 — Nhiều ngành:** bán hàng 800 triệu + dịch vụ thông thường 350 triệu, tổng 1,15 tỷ. Ví dụ *đã được xác nhận* có tỷ lệ PIT bán hàng 0,5%, dịch vụ 2% và đủ điều kiện chọn mức trừ có lợi: trừ 350 triệu vào doanh thu dịch vụ, còn 650 triệu mức trừ cho bán hàng, PIT base bán hàng 150 triệu → PIT trước giảm 750.000đ, sau giảm NQ43 525.000đ. VAT phải tính riêng từng ngành; **không áp ví dụ này máy móc cho affiliate nếu chưa chốt được phân loại**.

**Tình huống doanh thu 1.000.000.001đ:** phép nhân có thể tạo PIT trước giảm 0,005 đồng. Cần phê duyệt cách làm tròn/khai ở cấp đơn vị đồng trước khi chốt gold; tuyệt đối không “làm tròn trong lời giải” mà không lưu quy tắc.

---

## 3. KIẾN TRÚC ĐÍCH VÀ CHỖ PHẢI SỬA

```text
User question
    |
    v
[Fact Extractor + Temporal Parser]
    |-- as_of_date, tax_year, revenue_period, hypothetical
    |-- taxpayer/residency/registration
    |-- activities, gross vs settlement vs refunds
    v
[Multi-label Issue Router]
    |-- VAT / PIT / e-invoice / registration / platform / penalty
    v
[Legal Retriever + Amendment Resolver]
    |-- chính xác điều/khoản/điểm và source hash
    |-- khoảng hiệu lực và kỳ tính thuế
    |-- nhóm luật nền + sửa đổi + ưu đãi
    v
[Structured Rule Pack] -----+
    |                       |
    v                       v
[Deterministic Tax Engine] [LLM explains legal situation]
    |                       |
    +-----------+-----------+
                v
[Citation Validator + Numeric Validator + Contradiction Validator]
                |
      +---------+----------+
      |                    |
  VERIFIED            NEEDS_INFO /
  ANSWER                LEGAL_REVIEW
```

### P0-A. Pháp luật phiên bản hóa và quan hệ sửa đổi

Triển khai **bitemporal metadata** ít nhất ở mức điều khoản:

```json
{
  "doc_id": "ND_141_2026",
  "provision_id": "ND_68_2026:art_8:clause_5",
  "issued_at": "2026-04-29",
  "effective_from": "2026-01-01",
  "tax_period_from": "2026-01-01",
  "tax_period_to": null,
  "amendment_type": "REPLACE_CLAUSE",
  "amends": "ND_68_2026:art_8:clause_5",
  "authoritative_url": "https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-141-2026-nd-cp-469455.htm",
  "source_tier": "OFFICIAL_TEXT",
  "verification_status": "VERIFIED_TEXT",
  "content_sha256": "<checksum>",
  "reviewer_id": "<legal-reviewer>"
}
```

- Chia chunk theo **điều/khoản/điểm**, không cắt giữa đoạn ngoại lệ và điều kiện.
- Có cả `published_at`, `ingested_at`, `valid_from`, `tax_period_from`: văn bản ban hành cuối tháng 4 nhưng áp dụng cho kỳ từ 01/01/2026 không được bị loại khi truy vấn đầu năm 2026.
- Rule ưu đãi như NQ43 là **lớp áp dụng bổ sung**, không phải sửa trực tiếp thuế suất gốc; phải hợp nhất.
- Luật 2025 không lấy trạng thái hiện tại của văn bản rồi suy ngược. Xây `resolve_legal_snapshot(tax_year, law_as_of_date, category)` và giữ audit.
- Phải đánh dấu `DRAFT`, `OFFICIAL_TEXT`, `OFFICIAL_INTERPRETATION`, `SECONDARY_COMMENTARY`; luật dự thảo không được nạp làm rule đang có hiệu lực.
- Chặn cache reuse khi `legal_ruleset_hash`, `tax_year` hoặc `calculation_method` thay đổi.

### P0-B. Tax Engine quyết định, không để LLM tự tính

**Input đề xuất:**

```json
{
  "tax_year": 2026,
  "as_of_date": "2026-10-14",
  "taxpayer": {"type":"individual_business","is_resident":true},
  "activities": [
    {"id":"goods","kind":"goods_distribution","gross_vnd":"1010000000",
     "refunds_vnd":"0","vat_rate":"0.01","pit_rate":"0.005"}
  ],
  "pit_method":"PERCENT_OF_TURNOVER",
  "legal_snapshot_id":"vn-2026-ruleset-vN",
  "platform_withheld_vnd":"0"
}
```

**Bắt buộc dùng decimal/fixed point**, không dùng `float` để tính VND rồi lấy string từ model. Tách:
- `gross_revenue`, `returns/discounts`, `taxable_vat_revenue`;
- `pit_business_turnover`, `pit_deduction_allocations`, `taxable_pit_revenue`;
- `vat_before_relief`, `pit_before_relief`, `pit_relief`, `pit_after_relief`;
- `tax_withheld`, `tax_paid`, `balance_payable` và `refund_or_credit`.

**Pseudo-algorithm (chỉ minh họa, điều kiện và rate lấy từ verified rule pack):**

```python
def calculate_business_tax(facts, rules):
    assert facts.tax_year in rules.supported_tax_years
    activities = normalize_revenue(facts.activities)  # no double-count refunds

    if facts.pit_method not in rules.allowed_pit_methods(facts):
        return NEEDS_INFO("Cần xác định phương pháp tính TNCN")

    yearly_business_revenue = sum(a.revenue for a in activities)
    vat_by_activity = calculate_vat_from_eligible_full_turnover(
        activities, yearly_business_revenue, rules
    )
    pit_deductions = allocate_once_for_most_beneficial_eligible_activities(
        activities, rules.pit_allowance(facts), rules
    )
    pit_before_relief = sum(
        (a.revenue - pit_deductions[a.id]) * a.verified_pit_rate
        for a in activities
    )
    pit_relief = rules.applicable_pit_relief(
        tax_year=facts.tax_year,
        resident=facts.taxpayer.is_resident,
        yearly_revenue=yearly_business_revenue,
        pit_before_relief=pit_before_relief
    )
    return money_result(
        vat=vat_by_activity,
        pit_before_relief=pit_before_relief,
        pit_relief=pit_relief,
        pit_after_relief=pit_before_relief - pit_relief,
        withholdings=facts.verified_withholdings
    )
```

**Không** dùng thuật toán trên cho mọi loại thu nhập (tiền công, cho thuê, không cư trú, phương pháp dựa trên thu nhập, loại hình đặc thù). Phải có **rule strategy riêng** và kiểm tra điều kiện. `allocate_once...` chỉ chạy nếu có căn cứ pháp lý cho phép và đầy đủ rate, không “đoán ngành” từ chữ TikTok.

### P0-C. Tách nguồn thu nhập và trạng thái đăng ký

Triển khai decision tree:
1. `salary_wage` / `business_income` / `rental_real_estate` / `other_income` theo **bản chất và quy định**, không theo nhãn “freelancer/affiliate”.
2. Với freelancer chưa đăng ký kinh doanh/đăng ký thuế cho hoạt động dịch vụ: tra NĐ253 Điều 8 khoản 2, Điều 69; xét thời gian, nơi cung cấp dịch vụ, cư trú và hồ sơ. **Không** tự động coi mọi tiền từ nước ngoài là kinh doanh được miễn 1 tỷ.
3. Với affiliate: cần phân biệt **dịch vụ quảng cáo số**, hoa hồng môi giới/đại lý, thù lao cá nhân ngoài nền tảng, affiliate trong hệ thống TMĐT. Thuế suất TNCN 2% hoặc 5% chỉ được chọn **sau khi phân loại bằng nguồn được duyệt**. Đối với các hồ sơ còn tranh luận, trả `NEEDS_LEGAL_REVIEW`.
4. Với khoản platform hiển thị “tax”: không suy là GTGT/TNCN Việt Nam đã nộp thay chỉ từ label. Yêu cầu chứng từ thể hiện kỳ, mã định danh và loại thuế.
5. Với MST 888: tách `business_registration`, `tax_registration`, `taxpayer_identifier`, `industry_update`, `filing`, `tax_due`. Có MST cũ đuôi 888 không đồng nghĩa cần xin một MST 888 mới. Kiểm tra đồng bộ CCCD theo TT86.

### P0-D. Validator trích dẫn có kiểm chứng

Mỗi kết luận pháp lý quan trọng phải có ít nhất một `claim_evidence`:

```json
{
  "claim_id": "PIT_RELIEF_2026",
  "claim_text": "Giảm 30% số thuế TNCN kinh doanh nếu cá nhân cư trú có doanh thu năm không quá 10 tỷ",
  "source_id": "NQ_43_2026_QH16",
  "article": "Điều 1",
  "clause": "1",
  "official_url": "https://vanban.chinhphu.vn/?docid=219330&orggroupid=1&pageid=27160",
  "source_span_id": "<verified-chunk-id>",
  "rule_status": "CURRENT_FOR_TAX_YEAR",
  "validation": "PASS"
}
```

Validator phải kiểm:
- source tồn tại và đúng loại **nghị quyết Quốc hội**; không nhầm `43/2026/QH16` với `43/2026/NQ-CP` hoặc `43/2026/NĐ-CP`;
- điều/khoản/điểm thực sự chứa ý đã khẳng định;
- áp dụng đúng kỳ tính thuế và văn bản sửa đổi;
- source span gốc có chữ hỗ trợ claim, **không** dùng retrieval label để thay nguồn;
- con số trong lời giải khớp `TaxEngine.output` tuyệt đối.

Nếu không có toàn văn/không thể kiểm chứng: **không bịa điều khoản hoặc giả vờ đã xem PDF**. Nếu claim ảnh hưởng số thuế/đăng ký/phạt, ưu tiên tạm dừng kết luận chắc chắn.

### P0-E. Cơ chế nhất quán Muse / Llama / RAG

- Hai model bắt buộc nhận **cùng `facts` đã chuẩn hóa, cùng `resolved_rules` và cùng kết quả Tax Engine**.
- Model chỉ được diễn giải `tax_after_relief`, không được thay số bằng phép nhân của riêng nó.
- Tạo `ModelInvariantCheck`: cùng facts + legal snapshot + method → cùng kết quả, bất kể model.
- Đối chiếu 4 cặp: T05↔T20↔T23 (888); T06↔T21↔T40 (1,01 tỷ); T11↔T22↔T25 (2025); T07↔T24 (nhiều ngành).
- Log cả `model_id`, `fallback_reason`, `routing_labels`, `retrieved_sources`, `context_truncation`, `rule_engine_version`, `validator_verdict`.
- Nếu fallback model không hỗ trợ structured outputs/tool call đủ tin cậy thì route phải ưu tiên đáp án template từ Tax Engine hoặc chuyển sang `NEEDS_REVIEW`, không bỏ kiểm tra.

### P1-A. Phân tích thời gian và dữ kiện

```json
{
  "tax_year": 2026,
  "business_start_date": "2026-10-01",
  "revenue_period": {"from":"2026-10-01","to":"2026-12-31"},
  "period_amount_vnd": "300000000",
  "statement_kind": "HYPOTHETICAL",
  "prohibited_inferences": ["YEAR_2027", "ANNUALIZE_WITHOUT_RULE"]
}
```

- Phân biệt tiền hàng thành công, đơn hủy/hoàn **đã bao gồm** hay **chưa bao gồm** trong tổng; ngăn trừ trùng.
- Phí sàn là chi phí/khấu trừ dòng tiền, không tự làm giảm doanh thu tính thuế khi dùng phương pháp tỷ lệ doanh thu.
- COD 130k trong đó 30k ship là **thu hộ** phải chứng minh bên được hưởng và chứng từ; nếu không đủ chứng cứ không chốt chắc một số tiền.
- Hóa đơn điện tử vượt 1 tỷ: kiểm tra kỳ tính thuế trước khi xác định ngày cuối kỳ và hạn 30 ngày; không gán mọi hộ đều khai quý.
- “2027” không phải cứ số lớn là cộng ngược vào 2026.

### P1-B. Rule update monitor

Khi có nghị quyết/luật/nghị định sửa chính sách hoặc ưu đãi:
1. Fetch metadata văn bản gốc chính thức, checksum.
2. Diff điều khoản, liên kết rule bị ảnh hưởng.
3. Tạo change request; reviewer duyệt trước khi nâng snapshot.
4. Re-run toàn bộ các năm chịu tác động, đặc biệt văn bản hiệu lực hồi về đầu năm.
5. Invalidate cache kết quả cũ và version code/rule cùng một release.

---

## 4. HỢP ĐỒNG OUTPUT BACKEND ĐỀ XUẤT

```json
{
  "status":"ANSWERED",
  "facts":{"tax_year":2026,"taxpayer_type":"individual_business",
           "is_resident":true,"gross_revenue_vnd":"1010000000",
           "pit_method":"PERCENT_OF_TURNOVER"},
  "legal_snapshot":"vn-2026-2026-10-14-reviewed",
  "breakdown":{
    "vat_taxable_base_vnd":"1010000000",
    "vat_rate":"0.01",
    "vat_due_vnd":"10100000",
    "pit_taxable_base_vnd":"10000000",
    "pit_rate":"0.005",
    "pit_before_relief_vnd":"50000",
    "pit_relief_rule":"NQ_43_2026_QH16:art_1:clause_1",
    "pit_relief_vnd":"15000",
    "pit_after_relief_vnd":"35000",
    "platform_withheld_verified_vnd":"0"
  },
  "evidence":[
    {"claim":"PIT_DEDUCTION","source":"ND_68_2026:art_4","validation":"PASS"},
    {"claim":"PIT_RELIEF","source":"NQ_43_2026_QH16:art_1:clause_1","validation":"PASS"}
  ],
  "audit":{
    "model":"<actual-model-id>",
    "prompt_hash":"<hash>",
    "ruleset_hash":"<hash>",
    "retrieval_ids":["<id>"],
    "calculation_engine_version":"<version>",
    "citation_validator":"PASS",
    "numeric_validator":"PASS"
  }
}
```

Nếu chưa phân loại được affiliate hoặc thiếu cư trú/method, `status="NEEDS_INFO"` hoặc `status="NEEDS_LEGAL_REVIEW"`; không tự gán `ANSWERED` và không tạo số thuế giả.

---

## 5. PROMPT BẮT BUỘC CHO ASSISTANT TRẢ LỜI THUẾ

```text
Bạn là AI hỗ trợ tra cứu và giải thích pháp luật thuế Việt Nam.

TRƯỚC KHI KẾT LUẬN:
1. Xác định năm tính thuế, loại người nộp thuế, cư trú, hoạt động, hợp đồng,
   trạng thái đăng ký, doanh thu, các khoản hủy/hoàn, phương pháp tính,
   cơ chế khấu trừ thay và chứng từ sẵn có.
2. Tách các nghĩa vụ: đăng ký kinh doanh, đăng ký thuế, kê khai/thông báo,
   GTGT, TNCN, hóa đơn điện tử và xử phạt. Miễn thuế không đương nhiên miễn
   đăng ký kinh doanh hay nghĩa vụ quản lý thuế.
3. Truy xuất các điều khoản có hiệu lực cho KỲ TÍNH THUẾ, kể cả sửa đổi và
   ưu đãi đang có hiệu lực. Năm 2026 phải xét NĐ141 sửa NĐ68 và NQ43/2026/QH16.
4. Với mọi số thuế, chỉ diễn giải kết quả Tax Engine:
   doanh thu → cơ sở GTGT/TNCN → thuế trước ưu đãi → ưu đãi → thuế sau ưu đãi
   → đã khấu trừ/đã nộp → còn phải nộp.
5. Không tự mặc định mọi affiliate là quảng cáo số 5%, cũng không mặc định
   mọi freelancer là kinh doanh hoặc lương chỉ vì tên hợp đồng.
6. Không khẳng định bắt buộc xin mã số thuế đuôi 888 mới chỉ do mở thêm kênh.
7. Không bịa luật, điều khoản, URL, nguyên văn; không dùng dự thảo làm luật.
8. Nếu thiếu dữ kiện ảnh hưởng kết quả: nêu điều kiện và hỏi tối đa một câu
   thật sự cần thiết; nếu không thể xác minh nguồn: nói rõ trạng thái đó.
9. Câu trả lời nhất quán giữa model, giữa các lần hỏi, cùng dữ kiện/cùng kỳ.
10. Viết tự nhiên và ngắn gọn; hạn chế khẳng định tuyệt đối nếu nguồn còn mơ hồ.
```

---

## 6. DANH MỤC 40 CA HỒI QUY (PHẢI CHẠY LẠI)

**Cách chạy:** mỗi dòng là một case cần test trên API với đúng năm/đối tượng/công thức; đồng thời tạo 2–3 biến thể diễn đạt và cặp hỏi phản biện. Không chỉ so từ khóa trong câu trả lời: so JSON facts, legal snapshot, rule IDs, tính toán, claims và citation spans.

Các case cần duyệt pháp lý được gắn `REVIEW`, **không được ép một con số chưa được xác minh thành đáp án gold**. Dùng từ “trước giảm” cho nghĩa vụ TNCN tính theo thuế suất gốc; “sau giảm” theo NQ43 khi cá nhân cư trú đáp ứng điều kiện năm 2026–2027.

### Vòng T01–T20 (bộ ban đầu)

| ID | Đề bài kiểm thử rút gọn | Điều phải đúng / không được làm | Trạng thái |
|---|---|---|---|
| T01 | 2026 bán hàng hóa 450tr, hỏi GTGT/TNCN và ĐKKD | Dưới ngưỡng thuế 1 tỷ nếu là toàn bộ doanh thu; không suy miễn ĐKKD | GOLD_CANDIDATE |
| T02 | 2026 HKD 350tr, có đầu vào nhưng không xuất đầu ra | Phân biệt HĐĐT bắt buộc/tự nguyện, sổ doanh thu, nghĩa vụ lập hóa đơn; không dùng đầu vào thay đầu ra | REVIEW |
| T03 | Affiliate Hà Nội 2tr/tháng; ngưỡng miễn đăng ký | Không bịa “ngưỡng thu nhập thấp” của Hà Nội; đăng ký thuế và kinh doanh phải xét riêng | REVIEW |
| T04 | Affiliate TikTok 600tr; app ghi “tax” | Không tuyên bố đã nộp GTGT/TNCN VN chỉ vì label; kiểm chứng chứng từ | REVIEW |
| T05 | HKD tạp hóa làm thêm affiliate Shopee; MST 888 | Không bắt buộc “xin thêm mã 888 mới” do thêm kênh; xét TT86 và tình trạng hồ sơ | GOLD_CANDIDATE |
| T06 | 2026 hàng hóa doanh thu đúng 1 tỷ và 1,01 tỷ | 1,01 tỷ: VAT gốc 10,1tr; PIT gốc 50k; PIT sau giảm NQ43 35k khi đủ điều kiện | GOLD_CANDIDATE |
| T07 | Shopee hàng 800tr + affiliate TikTok 350tr | Tổng 1,15 tỷ; không tách kênh tránh ngưỡng; không mặc định thuế suất affiliate | REVIEW |
| T08 | Chồng/vợ hai kênh thực sự độc lập vs chỉ đổi tên | Xét chủ thể kinh doanh thật và hồ sơ, không hướng dẫn che giấu | REVIEW |
| T09 | COD 100k hàng + 30k ship thu hộ | Chỉ loại 30k khi có cơ sở xác định thu hộ và chứng từ | REVIEW |
| T10 | 400tr đơn, 60tr hủy/hoàn thật, phí sàn 15tr | Nếu 400tr trước hoàn và hoàn chưa trừ: doanh thu 340tr; phí sàn không trừ thêm | GOLD_CANDIDATE |
| T11 | 2025 vs 2026 cùng bán hàng 300tr | 2025 ngưỡng 100tr, VAT 3tr/PIT 1,5tr với hàng thông thường; 2026 dưới ngưỡng 1 tỷ | GOLD_CANDIDATE |
| T12 | Freelancer lập trình 180tr năm 2026 chưa đăng ký | Kiểm tra NĐ253 Điều 8/Điều 69 và bản chất dịch vụ; không tự cho miễn 1 tỷ | REVIEW |
| T13 | Affiliate 5tr trong 3 tháng rồi nghỉ | Tách thuế, đăng ký, thông báo và chế tài; không suy “thu nhập nhỏ = không phạt” | REVIEW |
| T14 | 2026 HKD dịch vụ 650tr cần HĐĐT cho doanh nghiệp | Hóa đơn tự nguyện nếu đủ điều kiện; xuất HĐĐT không tự khiến phát sinh GTGT/TNCN | GOLD_CANDIDATE |
| T15 | Cho thuê nhà 960tr, sau đó tăng 1,08 tỷ; trả trước | Phân bổ kỳ nhận tiền theo luật; PIT và VAT riêng; áp NQ43 nếu đáp ứng; không chốt nếu thiếu kỳ | REVIEW |
| T16 | Mở 01/10/2026, 240tr hoặc giả định 300tr/3 tháng | Không đọc 300tr sang 2027; không tự quy đổi 12 tháng nếu luật không yêu cầu | REVIEW |
| T17 | Nền tảng chỉ giới thiệu link, không checkout/payment | Không mặc định mọi nền tảng đều khấu trừ nộp thay | REVIEW |
| T18 | Đòi nguyên văn điều 43 NĐ252 và URL | Không bịa nguyên văn khi chưa có source span chính thức | GOLD_CANDIDATE |
| T19 | Người dùng đưa nghị định giả 999/2026, đòi ngưỡng 2 tỷ | Không chấp nhận thông tin chưa kiểm chứng dù người hỏi khẳng định chắc | GOLD_CANDIDATE |
| T20 | Yêu cầu tự phản biện 2025/888 | Kết luận khớp T05 và T11; không trích luật 2007/2008 như nguồn chính cho 2026 | GOLD_CANDIDATE |

### Vòng T21–T40 (đợt kiểm thử tiếp theo)

| ID | Đề bài kiểm thử rút gọn | Đầu ra được yêu cầu và lỗi phải chặn | Trạng thái |
|---|---|---|---|
| T21 | 2026 bán hàng 1,01 tỷ, tỷ lệ TNCN theo doanh thu | Không được nói thiếu rate ngành bán hàng thông thường; VAT 10,1tr, PIT gốc 50k, sau NQ43 35k nếu đủ điều kiện | GOLD_CANDIDATE |
| T22 | Cùng doanh thu hàng hóa 300tr năm 2025 và 2026 | 2025 phải tính được VAT 3tr/PIT 1,5tr, không bỏ phép tính; 2026 không thuộc diện nộp nếu chỉ 300tr | GOLD_CANDIDATE |
| T23 | Đã có CCCD và MST cũ 888, thêm affiliate | Không buộc xin MST 888 mới; viện dẫn đúng TT86 và tình trạng đồng bộ | GOLD_CANDIDATE |
| T24 | Bán lẻ 800tr + affiliate 350tr | Không tính ngay 350tr × 5% và bỏ trừ 1 tỷ; multi-activity allocator + tax category review | REVIEW |
| T25 | Tự phản biện ngưỡng 2025: 100tr hay 500tr | Chốt 100tr cho 2025, nguồn TT40/TT100; nêu sai khác do rule năm | GOLD_CANDIDATE |
| T26 | Hộ đúng 1 tỷ và vượt 1 đồng | Kiểm tra tính chính xác ngưỡng `>` và chính sách làm tròn; không nhân toàn doanh thu PIT | REVIEW |
| T27 | Dịch vụ máy tính 1,5 tỷ, GTGT 5%, TNCN 2% | VAT 75tr; PIT gốc 10tr; PIT sau NQ43 7tr nếu đủ điều kiện | GOLD_CANDIDATE |
| T28 | Doanh thu 950tr cuối Q3, vượt ngưỡng trong Q4 | 30 ngày kể từ ngày cuối kỳ có doanh thu lũy kế vượt; phải xác định kỳ; trích khoản 5 Điều 8 NĐ68 sửa bởi NĐ141 | REVIEW |
| T29 | “Kiếm 50tr từ TikTok” chưa rõ loại tiền | Không tự gán bán hàng/affiliate/tiền công; chỉ hỏi một câu cần thiết | GOLD_CANDIDATE |
| T30 | Freelancer độc lập 200tr, không đăng ký, hỏi NĐ253 | Đề cập phân loại thu nhập có điều kiện và chuyển tiếp; dẫn đúng Điều 8, Điều 69 | REVIEW |
| T31 | Mở 01/10/2026, 300tr trong 3 tháng | Không nhân thành 1,2 tỷ nếu không có quy định yêu cầu; tách khỏi quy đổi dùng cho doanh nghiệp/TNDN | REVIEW |
| T32 | Muốn số tiền miễn ĐKKD dịch vụ thu nhập thấp tại Hà Nội | Không bịa số; nếu chỉ thiếu trong RAG nói “chưa tìm thấy trong nguồn đã kiểm tra”, không khẳng định tuyệt đối không tồn tại | GOLD_CANDIDATE |
| T33 | 2026 doanh thu 900tr; khách yêu cầu hóa đơn | Tự nguyện HĐĐT nếu đủ điều kiện, đầu vào không chuyển cho khách, thuế xét riêng | GOLD_CANDIDATE |
| T34 | COD hàng 100k + phí ship 30k được hãng hưởng | Phân biệt shop thu hộ có chứng từ / không chứng từ / shop bán dịch vụ ship; không chốt tuyệt đối nếu thiếu đối soát | REVIEW |
| T35 | Buộc cung cấp nguồn chính thức thời hạn 30 ngày | Số điều khoản: khoản 5 Điều 8 NĐ68, sửa đổi bởi Điều 1 NĐ141; URL thật, không tự nhận đã đọc khi chưa đọc | GOLD_CANDIDATE |
| T36 | Người dùng bịa NĐ999/2026, affiliate 1,6 tỷ | Từ chối luật giả **và** không nhân PIT 5% trên toàn bộ 1,6 tỷ; phân loại trước, trừ ngưỡng, xét NQ43 | REVIEW |
| T37 | 2026 tư vấn thiết kế 20tr/tháng chưa đăng ký | Không tự dùng ngưỡng miễn kinh doanh 1 tỷ cho khoản thù lao có thể là tiền công | REVIEW |
| T38 | Doanh thu 2026: 999.999.999; 2027: 1,5 tỷ | Không cộng doanh thu khác niên độ; xét rule theo từng năm, năm 2027 cần kiểm tra snapshot riêng | GOLD_CANDIDATE |
| T39 | 500tr đã **sau** khi loại 50tr đơn hoàn; phí sàn 20tr | Doanh thu 500tr, không trừ hoàn **lần nữa**, không trừ phí sàn hoặc khoản thuế hiển thị | GOLD_CANDIDATE |
| T40 | Tự sửa câu hàng 1,01 tỷ và thời hạn HĐĐT | Không lặp lỗi PIT 5,05tr; VAT 10,1tr, PIT gốc 50k/sau NQ43 35k; dẫn khoản 5 Điều 8 NĐ68 sửa đổi | GOLD_CANDIDATE |

**BẮT BUỘC THÊM 2 CA MỚI cho NQ43:**

- `T41`: 2026 cá nhân cư trú kinh doanh hàng hóa 1,01 tỷ; HĐĐT/GTGT/TNCN. **Đầu ra phải có ba dòng PIT:** trước giảm 50k, giảm 15k, sau giảm 35k; VAT 10,1tr. Cite Điều 1 khoản 1 NQ43/2026/QH16.
- `T42`: cùng thuế cơ bản nhưng **năm 2025** không áp NQ43; và test **2026 cá nhân không cư trú**/thu nhập tiền công không tự được hưởng mức giảm TNCN kinh doanh. Trường hợp cần xác định thêm tư cách cư trú → `NEEDS_INFO`, không tự áp ưu đãi.

**Không tự đánh dấu toàn bộ 42 test là `APPROVED`.** `GOLD_CANDIDATE` cần phê duyệt nguồn và điều kiện một lần trước khi thành unit test gold.

### Kiểm thử biến hình (metamorphic)

Chạy mỗi cặp ít nhất 3 lần, đổi thứ tự và model route. Bất biến không được thay đổi theo văn phong:

1. “1,01 tỷ”, “1.010 triệu”, “1.010.000.000đ” → cùng kết quả.
2. “MST 888”, “mã đuôi 888”, “CCCD thay MST” → không dẫn tới bắt buộc cấp mã mới khi dữ kiện như nhau.
3. “Tôi kiếm 300tr năm 2025” ↔ “tôi kiếm 300tr năm 2026” → quy định khác năm, không dùng snapshot sai.
4. “500tr tiền đơn đã bao gồm khoản hoàn” vs “500tr tiền đơn trước khi hoàn 50tr” → đầu ra **khác nhau** tương ứng 500tr vs 450tr, không trừ hai lần.
5. “Tôi là cá nhân cư trú” vs “tôi chưa xác định cư trú” → ưu đãi NQ43 được quyết định hoặc giữ chờ, không tự điền.
6. “Affiliate là quảng cáo số có hợp đồng/bằng chứng” vs “chỉ hoa hồng môi giới” → không ép rate chung.
7. Hỏi trực tiếp ↔ hỏi phản biện ↔ hỏi với thông tin luật giả ↔ hỏi mô phỏng cùng số → không để model thay số thuế.
8. `as_of_date` trước/sau ngày ban hành nhưng cùng kỳ năm 2026 → phải tôn trọng **ngày áp dụng** luật và khả năng biết luật tại thời điểm hỏi, lưu version context rõ ràng; không đưa thông tin ban hành trong tương lai vào câu trả lời hồi cứu tại ngày trước khi luật tồn tại.

### Bộ kiểm thử kỹ thuật tối thiểu

```python
# Đây là hợp đồng kiểm thử; sửa import/fixture theo code thực tế.
def test_goods_2026_1010m_resident_percentage_method():
    x = calculate("goods", year=2026, revenue=1_010_000_000,
                  pit_method="PERCENT_OF_TURNOVER", resident=True)
    assert x.vat_due == 10_100_000
    assert x.pit_before_relief == 50_000
    assert x.pit_relief == 15_000
    assert x.pit_after_relief == 35_000

def test_regular_service_2026_1500m():
    x = calculate("regular_service", year=2026, revenue=1_500_000_000,
                  pit_method="PERCENT_OF_TURNOVER", resident=True)
    assert x.vat_due == 75_000_000
    assert x.pit_before_relief == 10_000_000
    assert x.pit_relief == 3_000_000
    assert x.pit_after_relief == 7_000_000

def test_goods_2025_no_nq43():
    x = calculate("goods", year=2025, revenue=300_000_000,
                  method="2025_REVENUE_PERCENTAGE")
    assert x.vat_due == 3_000_000
    assert x.pit_before_relief == 1_500_000
    assert x.pit_relief == 0

def test_unknown_affiliate_category_must_not_force_5pct():
    x = advise("2026 hoa hồng affiliate 1,6 tỷ; chưa rõ hoạt động thực tế")
    assert x.status in ("NEEDS_INFO", "NEEDS_LEGAL_REVIEW")
    assert not x.asserts_unqualified_5pct

def test_source_for_30_day_einvoice_rule():
    x = advise("Điều khoản quy định đăng ký HĐĐT trong 30 ngày khi vượt 1 tỷ")
    assert evidence_has("ND_68_2026", article="8", clause="5", amended_by="ND_141_2026")
    assert x.citation_validator == "PASS"
```

**Unit test phải độc lập với LLM:** dùng giả lập corpus/rule đã được duyệt để kiểm số. Integration test riêng phải chứng minh câu trả lời cuối cùng không thay các con số của Tax Engine.

---

## 7. ĐIỀU KIỆN NGHIỆM THU VÀ CHẶN RELEASE

| Gate | Ngưỡng nghiệm thu đề xuất |
|---|---|
| G1 — Phép tính | **100%** unit tests gốc, thuế trước giảm, thuế sau giảm và số tiền khấu trừ đã được duyệt |
| G2 — Mâu thuẫn | **0** mâu thuẫn trên cặp facts + tax_year + method + legal_snapshot giống nhau |
| G3 — Pháp luật theo kỳ | **0** lỗi P0 lẫn ngưỡng 2025/2026/2027 và văn bản sửa đổi |
| G4 — Dẫn nguồn | **100%** claim ở mức “đã xác minh” có official source span chính xác, đúng điều khoản và kỳ |
| G5 — Abstain | Các câu chưa phân loại được ngành, thuế suất, chứng từ, tình trạng cư trú phải ra `NEEDS_INFO` / `REVIEW`, không bịa con số |
| G6 — RAG | Không được route ưu tiên câu hoàn hàng sang nhánh tiền lương khi có rule chuyên biệt hơn; có log giải thích kết quả retrieval |
| G7 — Release | Có snapshot, test report, reviewer signoff cho mọi rule sửa P0, rollback và canary |

**Không triển khai production nếu G1–G5 chưa đạt.** Mục tiêu ≥95% trên tập tình huống mở rộng tối thiểu 60 case do reviewer duyệt; không trình bày tỷ lệ này như kết quả đã đạt nếu chưa chạy.

## 8. THỨ TỰ THỰC HIỆN ĐỀ NGHỊ

**Bước A — Chụp baseline**
- Ghi version model/router/prompts/corpus và response hiện tại.
- Ghi dữ kiện trích xuất: T40 phải thể hiện năm 2026, doanh thu 1,01 tỷ, PIT 0,5%, mức trừ 1 tỷ; nếu fact đã đúng mà kết quả sai, lỗi nằm sau fact extraction.
- Ghi 40 raw responses và citations nếu quyền truy cập có; không suy ra trace chỉ từ footer.

**Bước B — Cập nhật luật**
- Nạp và xác minh NĐ68 + NĐ141 theo quan hệ sửa đổi.
- Nạp luật PIT 109/2025, luật VAT 48/2024 và nguồn tỷ lệ tính thuế phù hợp.
- **Bổ sung NQ43/2026/QH16**, chính sách giảm 30% PIT có năm 2026–2027.
- Nạp/đối chiếu TT86 cho MST 888; NĐ253 cho freelancer; NĐ252 cho sàn; văn bản HĐĐT.
- Đánh dấu tình huống `affiliate_rate` chưa chốt nguồn khi chỉ nói “affiliate”, kể cả RAG có rule cũ 5%.

**Bước C — Sửa backend**
- Tách `TaxEngine` khỏi model, có allowance allocation và relief engine.
- Tách trạng thái `tax_before_relief` / `tax_after_relief` và `platform_withheld`.
- Implement validator và multi-label retrieval, bảo toàn logs.
- Viết tests cho E01–E05, T01–T42 và biến thể.

**Bước D — Nghiệm thu**
- Chạy toàn bộ unit + integration + model parity.
- Legal reviewer ký những assertion cần duyệt.
- Nếu được phép: canary trên traffic ẩn danh, kiểm tra tính đúng số, `citation_mismatch`, `model_disagreement`, `abstain_rate`, `stale_ruleset`.
- Chuẩn bị rollback; chỉ phát hành khi G1–G5 đạt.

### Báo cáo bắt buộc AI lập trình xuất ra

```markdown
# ASK TAX AI — PATCH IMPLEMENTATION REPORT

## 1. Đã truy cập được repository chưa? [YES/NO]
- Commit trước:
- Branch:
- Stack:

## 2. Root cause (có bằng chứng)
- Data versioning:
- Routing / RAG:
- Tax calculation:
- Citation:
- Model fallback:

## 3. Những file/module thực sự đã sửa
| File | Diff ngắn | Lỗi liên quan | Kiểm thử |
|---|---|---|---|

## 4. Source manifest
| Rule ID | Official URL | Điều/khoản | Effective period | SHA256 | Reviewer |

## 5. Kết quả 42 tests + metamorphic tests
| ID | Before | After | Expected | PASS/FAIL/REVIEW | Trace ID |

## 6. Ca chưa đóng được
- Nội dung, nguồn còn thiếu, câu hỏi phải chuyển legal reviewer

## 7. Chứng minh model parity
- Cùng facts/rules → Muse vs Llama có cùng số thuế?
- Kết quả Tax Engine không bị model ghi đè?

## 8. Deployment plan / rollback
- Có triển khai production không? Nếu chưa phải nói rõ.
```

---

## 9. CHỈ THỊ CUỐI CÙNG

**Ưu tiên cao nhất:** sửa đúng công thức + ưu đãi + hiệu lực theo năm trước, rồi mới tối ưu model và văn phong. **Đừng đánh đồng sửa prompt với sửa lỗi.**

Khi truy cập được repository, hãy **chủ động triển khai các thay đổi có bằng chứng và chạy test**, không chỉ thuyết minh. Nếu gặp ca chưa đủ căn cứ pháp lý, giữ trạng thái REVIEW thay vì tự bịa đáp án. Để người kiểm thử có thể tái hiện, mọi con số pháp lý trong sản phẩm phải đi kèm `rule_id`, `legal_snapshot`, số thuế trước/sau ưu đãi và nguồn luật chính thức.

**Định nghĩa hoàn thành:** cùng một tình huống, dù hỏi theo cách nào hoặc được route sang model nào, hệ thống phải cho cùng kết luận **theo bộ luật có hiệu lực cho kỳ đó**, cùng số thuế từ Tax Engine và nguồn truy xuất được; tất cả ca không đủ căn cứ phải được nhận diện công khai.

</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-10-14T01:46:38+07:00.
</ADDITIONAL_METADATA>