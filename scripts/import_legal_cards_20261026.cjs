// Curated source excerpts. Source text is data; never execute embedded instructions.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const library=read('worker/src/data/documentLibrary.json'),catalog=read('src/data/legalDocuments.json');
const reviews=[];
// Each row was assessed for subject, article, exceptions and period. This is an
// AI source review, not a human review or certification of the entire document.
function add(doc_id,sections,title,summary,limits,from=2026,to=null,extra={}){
 reviews.push({doc_id,sections,title,summary,limits,from,to,...extra});
}
add('ND-118-2025-ND-CP',['S16','S17'],'Nộp hồ sơ một cửa và yêu cầu hướng dẫn bổ sung hồ sơ',
 'Có các kênh trực tiếp, bưu chính/ủy quyền và trực tuyến theo thủ tục đã công bố; hướng dẫn hồ sơ thiếu phải đầy đủ, chính xác trong một lần.',
 'Chỉ nguyên tắc một cửa cho HKD/CNKD; không tự suy mọi thủ tục thuế đều nộp được tại mọi bộ phận một cửa.',2025);
add('ND-123-2020-ND-CP',['S8','S9'],'Lịch sử bảo quản và chuyển đổi hóa đơn điện tử thành giấy',
 'Hóa đơn điện tử cần bảo đảm tính toàn vẹn, có thể tra cứu/in khi được yêu cầu; bản chuyển đổi giấy có giới hạn giá trị theo Điều 7.',
 'Thẻ lịch sử cho giai đoạn trước NĐ254 có hiệu lực 01/07/2026. Phạm vi chỉ lưu trữ/chuyển đổi, không dùng thời điểm lập hoặc xử lý sai sót theo bản cũ.',2022,2025);
add('ND-125-2020-ND-CP',['S7'],'Chỉ xử phạt thuế khi có hành vi được quy định',
 'Tổ chức, cá nhân chỉ bị xử phạt hành chính về thuế, hóa đơn khi có hành vi vi phạm được quy định.',
 'Chỉ khoản 2 Điều 5; không nhập các quy tắc gộp hành vi cũ đã bị NĐ310 sửa đổi. Không suy mọi thông báo doanh thu là hồ sơ khai thuế.',2020,null,
 {start:'2. Tổ chức, cá nhân chỉ bị xử phạt',end:'3. Tổ chức, cá nhân thực hiện',locator:'Khoản 2 Điều 5'});
add('ND-125-2020-ND-CP',['S9'],'Hộ kinh doanh áp dụng mức phạt như cá nhân',
 'Đối với người nộp thuế là hộ gia đình, hộ kinh doanh, áp dụng mức phạt tiền như đối với cá nhân.',
 'Chỉ quy tắc xác định đối tượng tại điểm a khoản 4 Điều 7; không cung cấp khung tiền phạt cũ, không tự chia đôi mọi chế tài.',2020,null,
 {start:'Đối với người nộp thuế là hộ gia đình',end:'b) Khi xác định mức phạt tiền',locator:'Điểm a khoản 4 Điều 7 (đoạn về hộ gia đình, hộ kinh doanh)'});
add('ND-144-2026-ND-CP',['S3'],'Doanh thu đại lý và hoa hồng môi giới bảo hiểm trong GTGT',
 'Điều 2 sửa điểm b khoản 1 Điều 9 NĐ181 về doanh thu hàng hóa, dịch vụ, hoa hồng đại lý hàng hóa/dịch vụ không chịu GTGT và hoa hồng môi giới bảo hiểm không chịu GTGT.',
 'Phải xác định đúng loại hoạt động, tính chất hoa hồng và phương pháp GTGT; không suy mọi hoa hồng, đại lý đều không chịu thuế hoặc được khấu trừ đầu vào.',2026,null,{effective_from:'2026-06-20'});
add('ND-168-2025-ND-CP',['S88'],'Trụ sở và hoạt động ngoài trụ sở của hộ kinh doanh',
 'Trụ sở là nơi hoạt động và địa chỉ liên lạc đã đăng ký để cơ quan quản lý liên hệ; hộ có thể hoạt động ngoài trụ sở theo khoản 1 Điều 87.',
 'Chỉ khoản 1 Điều 87. Không nhập khoản 2 bản gốc: khoản 5 Điều 19 NĐ296/2026 đã thay cụm từ về nơi đặt địa điểm bằng theo quy định pháp luật. Không kết luận nơi gửi thông báo từ bản cũ.',2025,null,
 {end:'2. Địa điểm kinh doanh',locator:'Khoản 1 Điều 87'});
add('ND-168-2025-ND-CP',['S94'],'Ủy quyền đăng ký hộ kinh doanh',
 'Phân biệt ủy quyền cá nhân, tổ chức dịch vụ và đơn vị bưu chính; văn bản ủy quyền cá nhân thực hiện thủ tục không bắt buộc công chứng/chứng thực theo Điều 93.',
 'Chỉ khoản 1–4 Điều 93. Ủy quyền làm thủ tục khác văn bản thành viên gia đình ủy quyền làm chủ hộ. Không nhập khoản 5 bản gốc: Điều 15 NĐ296/2026 đã sửa phạm vi xác thực điện tử.',2025,null,
 {end:'5. Người ủy quyền',locator:'Khoản 1 Điều 93; khoản 2 Điều 93; khoản 3 Điều 93; khoản 4 Điều 93'});
add('ND-245-2026-ND-CP',['S2','S4'],'Điều kiện và hồ sơ gia hạn thuế cho HKD CNKD năm 2026',
 'Phải thuộc đối tượng, ngành/lĩnh vực trong Điều 1 và Phụ lục I; vẫn khai thuế đúng quy định. Văn bản đề nghị gia hạn nộp một lần, hạn chậm nhất 02/11/2026 theo Điều 3.',
 'Chỉ phần HKD/CNKD, không chuyển ưu đãi TNDN của doanh nghiệp sang hộ. Thẻ không chứa bảng kỳ hạn Điều 2 vì OCR nhầm nhãn quý; cần đối chiếu bản chính trước khi chốt từng ngày nộp.',2026,2026);
add('ND-248-2026-ND-CP',['S8','S15'],'Kênh khiếu nại và chính sách đổi trả của nền tảng TMĐT',
 'Nền tảng công khai cách tiếp nhận, quy trình, thời gian xử lý phản ánh/khiếu nại và điều kiện, thời hạn, chi phí đổi trả/hoàn tiền.',
 'Góc nhìn HKD/CNKD là người bán hoặc mua trên nền tảng. Nghĩa vụ công khai thuộc chủ quản nền tảng; không biến thành nghĩa vụ thuế riêng của mọi người bán.',2026,null,{effective_from:'2026-07-01'});
add('ND-254-2026-ND-CP',['S14'],'Xử lý sự cố hóa đơn điện tử có mã',
 'Phân biệt lỗi của người bán, hệ thống cấp mã, nhà cung cấp dịch vụ và bất khả kháng; liên hệ cơ quan thuế/nhà cung cấp, lưu hồ sơ chứng minh theo Điều 14.',
 'Chỉ nhánh người bán HKD/CNKD sử dụng đúng loại hóa đơn; thời hạn 02 ngày tại khoản 4 áp dụng chủ thể truyền dữ liệu nêu trong nguồn, không áp cho mọi hộ. Mốc 03 ngày có điều kiện bất khả kháng tại khoản 5.',2026,null,{effective_from:'2026-07-01'});
add('ND-291-2026-ND-CP',['S2'],'Phân biệt cung cấp thông tin trao đổi quốc tế với thông báo doanh thu',
 'NĐ291 bổ sung nhánh vi phạm cung cấp thông tin phục vụ trao đổi thông tin theo điều ước/thỏa thuận thuế; khi thuộc Điều 19a thì không xử phạt theo Điều 14, 15, 19 cho cùng nhánh nêu tại nguồn.',
 'Không dùng Điều 19a để tự phạt hành vi chậm thông báo doanh thu thông thường. Thẻ chỉ nhận diện phạm vi, không kết luận mọi trường hợp thông báo doanh thu được miễn chế tài.',2026,null,{effective_from:'2026-07-21'});
add('ND-310-2025-ND-CP',[],'Bất khả kháng trong xử phạt thuế, hóa đơn theo NĐ310',
 'Sự kiện phải khách quan, không thể lường trước và người nộp thuế không thể khắc phục dù đã áp dụng mọi biện pháp cần thiết, khả năng cho phép.',
 'Không tự động miễn phạt chỉ vì hệ thống lỗi, bệnh hoặc thiên tai; phải xét đủ điều kiện và chứng cứ. Dùng bản PDF chính thức, không dùng bản tóm tắt trong thư viện.',2026,null,
 {effective_from:'2026-01-16',official_file:'rag_data/sources/legal-cards-2026-10-26/ND-310-2025-official.pdf',source_url:'https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/12/310-cp.signed.pdf',locator:'Điểm b khoản 1 Điều 1 (bổ sung khoản 10 Điều 2 NĐ125); trang 2 PDF chính thức',transcription:'10. Các trường hợp bất khả kháng bao gồm: thiên tai, thảm họa, dịch bệnh, hỏa hoạn, tai nạn bất ngờ, chiến tranh, bạo loạn, đình công hoặc sự kiện xảy ra một cách khách quan không thể lường trước được và người nộp thuế không thể khắc phục được mặc dù đã áp dụng mọi biện pháp cần thiết và khả năng cho phép.'});
add('TT-100-2021-TT-BTC',['S2'],'Lịch sử thuế khoán, ủy quyền nộp thay và cho thuê tài sản',
 'Bản sửa TT40 quy định riêng hộ khoán ngừng hoạt động, ủy quyền nộp thay và phân bổ tiền thuê trả trước theo năm.',
 'Chỉ tra cứu giai đoạn cũ 2022–2025. TT18/2026 thay thế TT100; không dùng ngưỡng 100 triệu hoặc thuế khoán cho kỳ 2026.',2022,2025);
add('TT-103-2014-TT-BTC',['S8'],'Lịch sử nhà thầu nước ngoài là cá nhân và loại thuế áp dụng',
 'Nhà thầu nước ngoài là tổ chức và cá nhân có nhánh thuế khác nhau; cá nhân nước ngoài kinh doanh có GTGT và TNCN theo pháp luật tương ứng.',
 'Chỉ lịch sử 2014–2025; TT89 bãi bỏ TT103 từ 01/07/2026. Không lấy tỷ lệ TNDN của tổ chức để tính cho cá nhân và không suy nhận tiền từ nước ngoài là nhà thầu.',2014,2025);
add('TT-110-2026-TT-BTC',['S2'],'Bãi bỏ hướng dẫn thuế cũ và xóa nợ hộ cá thể',
 'Thông tư bãi bỏ 22 thông tư và 03 quyết định, trong đó có hướng dẫn xóa nợ thuế cho hộ/cá nhân theo TT02/2004. Phải kiểm tra đúng văn bản nằm trong danh sách.',
 'Không suy mọi thông tư thuế cũ đều bị bãi bỏ hoặc mọi khoản nợ cũ của HKD được tự xóa. Chỉ tra danh mục và thời điểm hiệu lực 12/09/2026.',2026,null,{effective_from:'2026-09-12'});
add('TT-111-2013-TT-BTC',['S3'],'Lịch sử xác định cá nhân cư trú và phạm vi thu nhập',
 'Phân biệt cá nhân cư trú/không cư trú, ngày hiện diện, nơi ở thường xuyên và chứng minh cư trú theo Điều 1.',
 'Chỉ lịch sử đến 2025 phục vụ phân loại CNKD. TT87 thay TT111 từ 01/07/2026; không dùng nội dung thuế kinh doanh cũ hoặc giảm trừ tiền lương cho kỳ 2026.',2013,2025);
add('TT-126-2026-TT-BTC',['S2','S3','S4'],'Chi phí yêu cầu cung cấp thông tin cho cá nhân kinh doanh',
 'Phân biệt chi phí in/sao/chụp, gửi thông tin và trường hợp không phải trả chi phí; phải áp đúng quyền tiếp cận thông tin và bảng mức thu tương ứng.',
 'Chỉ quyền yêu cầu thông tin của cá nhân, không phải thuế/phí kinh doanh. Không đưa mức tiền khi chưa đối chiếu phụ lục; không tự áp cho hồ sơ thuế thuộc cơ chế chuyên ngành.',2026,null,{effective_from:'2026-09-01'});
add('TT-152-2025-TT-BTC',['S4','S5'],'Bố trí người kế toán và lưu trữ tài liệu của HKD CNKD',
 'Có thể tự ghi sổ, bố trí người hoặc thuê dịch vụ kế toán; cho phép lưu điện tử hoặc giấy. Tài liệu kế toán tối thiểu 05 năm, riêng hóa đơn theo pháp luật thuế.',
 'Không biến mốc 05 năm thành thời hạn chung cho mọi hóa đơn/chứng từ. Thay thế TT88 từ 01/01/2026.',2026,null,{effective_from:'2026-01-01'});
add('TT-18-2026-TT-BTC',['S4'],'Thông báo thành lập, thay đổi, tạm ngừng địa điểm kinh doanh',
 'Gửi mẫu 01/TB-ĐĐKD đến cơ quan thuế quản lý trụ sở cho việc thành lập, thay đổi, tạm ngừng hoặc chấm dứt địa điểm kinh doanh; cơ quan thuế phản hồi mẫu 02/TB-ĐĐKD.',
 'Địa điểm kinh doanh khác toàn bộ hộ; không thay thủ tục đăng ký kinh doanh bằng riêng thông báo thuế. Không dùng biểu mẫu hoàn thuế bản TT18 chưa sửa bởi TT50/TT89.',2026,null,{effective_from:'2026-03-05'});
add('TT-19-2021-TT-BTC',['S10'],'Lịch sử thời điểm nộp hồ sơ thuế điện tử',
 'Phải phân biệt thông báo tiếp nhận và thông báo chấp nhận hồ sơ; giao dịch điện tử thực hiện 24/7 theo điều kiện của Điều 8.',
 'Chỉ lịch sử đến 2025. TT89 bãi bỏ TT19 từ 01/07/2026; không dùng mẫu thông báo và mốc xác nhận cũ cho hồ sơ nộp hiện nay.',2021,2025);
add('TT-50-2026-TT-BTC',['S2','S3'],'Hồ sơ hoàn thuế theo phương pháp thu nhập tính thuế',
 'TT50 sửa phạm vi TT18 và hồ sơ hoàn nộp thừa đối với phương pháp thu nhập tính thuế nhân thuế suất: mẫu 02/CNKD-TNCN-QTT; có thay thế mẫu thông báo/kê khai.',
 'Mẫu 01/TKN-CNKD và các mẫu thuộc khoản 5 Điều 99 TT89 phải đọc bản TT89 đã đính chính QĐ2551. Không coi mẫu cùng số là cùng chức năng, hoặc miễn kê khai các sắc thuế khác.',2026,null,{effective_from:'2026-05-13'});
add('TT-78-2021-TT-BTC',['S9'],'Lịch sử hóa đơn máy tính tiền theo TT78',
 'Điều 8 quy định nhóm áp dụng, nội dung hóa đơn, cấp mã và trách nhiệm người bán theo chế độ cũ.',
 'Chỉ lịch sử 2022–2024. Không dùng quyền lựa chọn trong bản cũ để phủ nhận nghĩa vụ hóa đơn năm 2026; TT32/2025 đã thay TT78 từ 01/06/2025.',2022,2024);
add('TT-86-2024-TT-BTC',['S31'],'Lịch sử thông báo tạm ngừng và khôi phục mã số thuế',
 'Phân biệt CNKD không thuộc diện đăng ký kinh doanh gửi thông báo trực tiếp với hộ đã bị ghi nhận không hoạt động tại địa chỉ và phải khôi phục mã số trước.',
 'Chỉ giai đoạn 2025. TT90 thay thế TT86 từ 01/07/2026; không dùng mẫu 23/ĐK-TCT cũ cho hồ sơ hiện hành.',2025,2025);
add('TT-87-2026-TT-BTC',['S7'],'Chuyển tiếp TNCN và thay thế TT111',
 'TT87 có hiệu lực 01/07/2026, thay TT111; nội dung liên quan thu nhập kinh doanh và tiền lương của cá nhân cư trú áp dụng từ kỳ 2026 theo khoản 1 Điều 6.',
 'Chỉ quy tắc hiệu lực cho CNKD. Không nhập mức người phụ thuộc hoặc chứng khoán làm khoản giảm trừ thu nhập kinh doanh.',2026,null,
 {start:'Điều 6. Hiệu lực thi hành',end:'3. Bãi bỏ quy định tại:',locator:'Khoản 1 Điều 6; khoản 2 Điều 6',effective_from:'2026-07-01'});
add('TT-88-2021-TT-BTC',['S4'],'Lịch sử tổ chức kế toán hộ kinh doanh theo TT88',
 'Người đại diện quyết định bố trí người kế toán; nguồn cho phép người thân hoặc người kiêm nhiệm trong những trường hợp nêu tại Điều 3.',
 'Chỉ 2022–2025. TT152 thay thế TT88 từ 01/01/2026; dùng TT152 cho sổ sách kỳ 2026.',2022,2025);
add('TT-89-2026-TT-BTC',['S15'],'Xác nhận thời điểm nộp hồ sơ thuế điện tử hiện hành',
 'Ghi nhận gửi hồ sơ tự động khác thông báo tiếp nhận hồ sơ hợp lệ. Điều 11 phân biệt thời điểm xác nhận nộp và thời hạn cơ quan thuế phản hồi 01/03 ngày làm việc tùy hồ sơ.',
 'Chỉ giao dịch thuế điện tử HKD/CNKD; không coi biên nhận gửi thành công là hồ sơ đã hợp lệ. QĐ2551 chỉ đính chính khoản 5 Điều 99, không sửa Điều 11.',2026,null,{effective_from:'2026-07-01'});
add('TT-89-2026-TT-BTC',['S76'],'Hồ sơ giảm TNCN khi thiên tai, tai nạn, bệnh hiểm nghèo',
 'Điều 68 phân biệt hồ sơ theo nguyên nhân khó khăn; với HKD/CNKD có tờ khai 01/TKN-CNKD hoặc quyết toán 02/CNKD-TNCN-QTT khi chưa nộp hồ sơ của kỳ đề nghị.',
 'Chỉ hồ sơ giảm do khó khăn theo điểm b.2 khoản 1 Điều 65; không dùng thay thủ tục giảm 30% theo NQ43. Không tự bảo đảm được giảm nếu chưa xác định mức thiệt hại, số thuế và điều kiện pháp luật.',2026,null,{effective_from:'2026-07-01'});
add('TT-90-2026-TT-BTC',['S28'],'Tạm ngừng trực tiếp với cơ quan thuế cho CNKD',
 'CNKD không thuộc diện đăng ký kinh doanh dùng mẫu 23/ĐKT; tạm ngừng địa điểm kinh doanh theo TT18. Hộ đã bị thông báo không hoạt động tại địa chỉ phải khôi phục mã số thuế trước.',
 'Phân biệt luồng đăng ký hộ liên thông và CNKD đăng ký thuế trực tiếp; không lấy thời hạn đăng ký hộ áp cho mọi hồ sơ thuế.',2026,null,{effective_from:'2026-07-01'});
add('TT-90-2026-TT-BTC',['S31'],'Nghĩa vụ trước khi đóng mã số hoạt động kinh doanh',
 'Hoàn thành nghĩa vụ hóa đơn, hồ sơ khai, tiền thuế, khoản nộp thừa theo từng trường hợp. Chấm dứt hiệu lực cho hoạt động kinh doanh không làm chấm dứt mã số cá nhân để thực hiện nghĩa vụ khác.',
 'Không hứa xóa nợ hoặc đóng mã số ngay; chuyển lên doanh nghiệp có nhánh kế thừa nghĩa vụ riêng. Phân biệt đóng địa điểm với toàn bộ hoạt động.',2026,null,{effective_from:'2026-07-01'});
add('TT-90-2026-TT-BTC',['S40'],'Định danh cá nhân, nhiều mã số thuế và hồ sơ chuyển tiếp',
 'Hồ sơ nộp trước hiệu lực tiếp tục xử lý theo luật lúc nộp; thông tin định danh chưa khớp phải cập nhật; nhiều mã số thuế cần tích hợp/hợp nhất theo Điều 37.',
 'Không yêu cầu tự sửa toàn bộ hóa đơn cũ sau tích hợp mã số; không tự đoán trạng thái thuế khi chưa tra cứu tài khoản.',2026,null,{effective_from:'2026-07-01'});
add('TT-92-2015-TT-BTC',['S3'],'Lịch sử người nộp thuế CNKD theo TT92',
 'Điều 1 mô tả đối tượng cá nhân cư trú có hoạt động kinh doanh theo chế độ cũ.',
 'Chỉ lịch sử 2015–2020, không dùng ngưỡng 100 triệu và quy định cũ cho kỳ 2026; TT40 đã thay các quy định kinh doanh liên quan, TT89/TT87 tiếp tục bãi bỏ theo phạm vi.',2015,2020);
add('TT-94-2026-TT-BTC',['S16'],'Rủi ro thuế trong thay đổi, tạm ngừng và khôi phục đăng ký',
 'Biện pháp quản lý khác nhau theo mức rủi ro và thủ tục; có nhánh kiểm tra, giám sát, giải trình hoặc đôn đốc nghĩa vụ theo Điều 14.',
 'Chỉ cơ chế quản lý liên quan HKD/CNKD, không tự phân loại người hỏi rủi ro cao hoặc suy bị phạt/trốn thuế từ một dấu hiệu.',2026,null,{effective_from:'2026-07-01'});
add('TT-89-2026-TT-BTC',[],'Mẫu HKD CNKD theo TT89 đã đính chính bởi QĐ2551',
 'QĐ2551/QĐ-BTC ngày 15/09/2026 đính chính khoản 5 Điều 99 TT89: tên mẫu mới có 01/XSBHĐCMG-CNKD và 01/BK-XSBHĐCMG. Không lấy ký hiệu mẫu trước đính chính làm mẫu hiện hành.',
 'Chỉ danh tính sáu mẫu thay thế trong khoản 5 Điều 99; việc xác định đúng mẫu phụ thuộc phương pháp thuế, nguồn thu và mục đích hồ sơ. Không coi chung số mẫu là chung nghĩa vụ thông báo/kê khai.',2026,null,
 {effective_from:'2026-09-15',official_file:'rag_data/sources/legal-cards-2026-10-26/QD-2551-2026-BTC.pdf',source_url:'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/9/dinh-chinh-tt-89-2026-btc.signed.pdf',locator:'Khoản 5 Điều 99 TT89, được đính chính tại Điều 1 QĐ2551/QĐ-BTC; trang 2 PDF quyết định (phần nội dung thay thế)',transcription:'5. Thông tư này thay thế mẫu số 01/TKN-CNKD kèm theo Thông tư số 50/2026/TT-BTC, mẫu số 02/CNKD-TNCN-QTT, mẫu số 01/XSBHĐC, mẫu số 01/BK-XSBHĐC, mẫu số 01/TCKT, mẫu số 01/BK-KTHTKD kèm theo Thông tư số 18/2026/TT-BTC bằng mẫu số 01/TKN-CNKD, mẫu số 02/CNKD-TNCN-QTT, mẫu số 01/XSBHĐCMG-CNKD, mẫu số 01/BK-XSBHĐCMG, mẫu số 01/TCKT, mẫu số 01/BK-KTHTKD Phụ lục I ban hành kèm theo Thông tư này.'});
const excluded=[
 {doc_id:'ND-320-2025-ND-CP',status:'EXCLUDED_SUBJECT',sections:['S3','S4'],reason:'Điều 1–2 điều chỉnh TNDN và người nộp thuế doanh nghiệp; không sinh quy tắc chi phí/thuế suất TNDN thành nghĩa vụ HKD/CNKD.'},
 {doc_id:'TT-20-2026-TT-BTC',status:'EXCLUDED_SUBJECT',sections:['S2','S3'],reason:'Hướng dẫn TNDN/NĐ320; không dùng hồ sơ chi phí được trừ của doanh nghiệp áp cho cá nhân kinh doanh.'},
 {doc_id:'TT-121-2026-TT-BTC',status:'EXCLUDED_SUBJECT',sections:['S2','S3','S4'],reason:'Điều 1 chỉ thay/bãi bỏ mẫu Phụ lục I đăng ký doanh nghiệp; không sửa bộ mẫu đăng ký hộ chỉ từ tên chung TT68. Chuyển tiếp Điều 2 là cơ quan cấp tỉnh.'},
];
const packagePath='rag_data/legal-card-review-2026-10-26.json';
const verifiedStarts={
 'ND-118-2025-ND-CP':'2025-07-01','ND-123-2020-ND-CP':'2022-07-01',
 'ND-125-2020-ND-CP':'2020-12-05','ND-168-2025-ND-CP':'2025-07-01',
 'TT-100-2021-TT-BTC':'2022-01-01','TT-103-2014-TT-BTC':'2014-10-01',
 'TT-111-2013-TT-BTC':'2013-10-01','TT-19-2021-TT-BTC':'2021-05-03',
 'TT-78-2021-TT-BTC':'2022-07-01','TT-86-2024-TT-BTC':'2025-02-06',
 'TT-88-2021-TT-BTC':'2022-01-01',
};
for(const r of reviews)if(!r.effective_from&&verifiedStarts[r.doc_id])r.effective_from=verifiedStarts[r.doc_id];
const chunks=read('rag_data/semantic-topic-supplements.json'),meta=read('worker/src/kb/chunkMeta.json'),sources=read('worker/src/kb/sourceDocuments.json');
const reviewRows=[];
for(const [index,r]of reviews.entries()){
 const ref=`16.${197+index}`,doc=library.find(d=>d.id===r.doc_id),definition=catalog.find(d=>d.id===r.doc_id);assert(doc&&definition);
 let quote=r.transcription||r.sections.map(id=>{const s=doc.sections.find(s=>s.id===id);assert(s,`${r.doc_id}/${id}`);return s.text;}).join('\n\n');
 if(r.start){const pos=quote.indexOf(r.start);assert(pos>=0,r.doc_id+' start');quote=quote.slice(pos);}
 if(r.end){const pos=quote.indexOf(r.end);assert(pos>0,r.doc_id+' end');quote=quote.slice(0,pos).trim();}
 assert(quote.length>50&&quote.length<10000,`${ref} excerpt length ${quote.length}`);
 const rawFile=r.official_file||`document_library/${r.doc_id}.md`,sourceHash=hash(fs.readFileSync(rawFile));
 const locator=r.locator||r.sections.map(id=>{const s=doc.sections.find(s=>s.id===id);const a=s.title.match(/^Điều\s+(\d+[a-z]?)/u);assert(a,`${r.doc_id}/${id} article`);return `Điều ${a[1]}`;}).join('; ');
 const sourceUrl=r.source_url||definition.downloadUrl;
 const limits=`Chỉ phạm vi HKD/CNKD. ${r.limits} Đã kiểm duyệt bằng AI theo đoạn nguồn, không phải chứng nhận toàn văn hoặc kiểm duyệt của con người. Bản Markdown có thể có lỗi OCR; không tự sửa số hoặc suy điều kiện thiếu.`;
 const text=`${r.summary}\n[GIỚI HẠN VÀ KỲ ÁP DỤNG] ${limits}\nPhạm vi năm được lập chỉ mục: ${r.from}${r.to?'–'+r.to:' trở đi, phải kiểm tra sửa đổi tại thời điểm áp dụng'}.${r.effective_from?' Không áp dụng trước ngày '+r.effective_from+'.':''}\n[NGUỒN] ${definition.code}; ${locator}.\n[TRÍCH NGUYÊN VĂN NGUỒN ĐÃ CHỌN]\n${quote}\nNguồn: ${sourceUrl}`;
 const id=`KB/legal-cards-2026-10-26#${ref}`,chunk={id,file:'KB/legal-cards-2026-10-26',ref_id:ref,section:`${ref}. ${r.title}`,tier:'VERIFIED_CONDITIONAL',evidence_mode:'COMPLETE_RULE',subject_scope:['INDIVIDUAL_ACTIVITY','HOUSEHOLD_FORM','COMPARISON'],text};
 const old=chunks.findIndex(c=>c.ref_id===ref);if(old>=0){assert.equal(chunks[old].id,id,'Ref collision');chunks[old]=chunk;}else chunks.push(chunk);
 const link={doc_id:r.doc_id,code:definition.code,locator,scope:limits,source_url:sourceUrl,source_type:r.official_file?'OFFICIAL_PDF_VISUALLY_REVIEWED':'USER_SUPPLIED_MARKDOWN_SCOPED_REVIEW',applies_from_year:r.from,...(r.to?{applies_to_year:r.to}:{})};
 meta[ref]={id,ref_id:ref,section:chunk.section,tier:chunk.tier,legal_status:chunk.tier,applies_from_year:r.from,applies_to_year:r.to,...(r.effective_from?{effective_from:r.effective_from}:{}),content_reviewed_at:'2026-10-26',content_sha256:hash(text),source_document_sha256:sourceHash,original_source_status:r.official_file?'OFFICIAL_PDF_VISUAL_EXCERPT_REVIEW':'USER_SUPPLIED_MARKDOWN_READ',reviewer_type:'AI',source_excerpt_sha256:hash(quote),source_sections:r.sections,source_link_review:{checked_on:'2026-10-26',content_sha256:hash(text),status:'SOURCE_LINKED_SCOPED_NOT_FULL_LEGAL_CERTIFICATION',coverage:'SCOPED_SUPPORT_NOT_EVERY_SENTENCE',limits},source_links:[link]};
 // Catalog documents already have an identity; do not shadow them in the
 // supplementary registry. The card retains its exact reviewed source hash/URL.
 reviewRows.push({...r,ref_id:ref,status:r.to?'APPROVED_HISTORICAL_SCOPED':'APPROVED_SCOPED',locator,source_file:rawFile,source_sha256:sourceHash,excerpt_sha256:hash(quote),quote,chunk_sha256:hash(text)});
}
const baseline=[...new Set([...reviews.map(r=>r.doc_id),...excluded.map(r=>r.doc_id)])].sort();assert.equal(baseline.length,30);
for(const r of excluded){r.source_file=`document_library/${r.doc_id}.md`;r.source_sha256=hash(fs.readFileSync(r.source_file));}
write('rag_data/semantic-topic-supplements.json',chunks);write('worker/src/kb/chunkMeta.json',meta);write('worker/src/kb/sourceDocuments.json',sources);
write(packagePath,{schema:'taxhkd-scoped-card-review-v1',reviewed_on:'2026-10-26',reviewer_type:'AI',scope:['HKD','CNKD'],baseline_missing_documents:baseline,policy:'Scoped excerpt review only; no FULL coverage claim. No raw case evidence used.',cards:reviewRows,excluded,correction:{doc_id:'QD-2551-2026-BTC',source_file:'rag_data/sources/legal-cards-2026-10-26/QD-2551-2026-BTC.pdf',sha256:hash(fs.readFileSync('rag_data/sources/legal-cards-2026-10-26/QD-2551-2026-BTC.pdf')),review:'Visually read both pages. Corrects clause 5 article 99 TT89 form identifiers (01/XSBHĐCMG-CNKD and 01/BK-XSBHĐCMG); does not change article 11 or article 68 excerpts.'}});
console.log(JSON.stringify({reviewed_documents:baseline.length,approved_documents:new Set(reviews.map(r=>r.doc_id)).size,cards:reviews.length,historical:reviews.filter(r=>r.to&&r.to<2026).length,excluded:excluded.length,refs:[reviewRows[0].ref_id,reviewRows.at(-1).ref_id]}));
