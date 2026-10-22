// Reusable rules found while reviewing the remaining case inventory.
// Source cases are never treated as authority; each rule has primary evidence.
const law='https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf';
const invoice='https://vanban.chinhphu.vn/?classid=1&docid=218689&pageid=27160&typegroupid=4';
const expenses='https://xaydungchinhsach.chinhphu.vn/chi-tiet-cac-khoan-chi-duoc-tru-va-khong-duoc-tru-trong-xac-dinh-thue-thu-nhap-ca-nhan-119260309111406444.htm';
const entries=[];
function add(n,title,topic,body,source,local,pages,from='2026-07-01'){
 const ref=`16.${n}`;
 entries.push({id:`KB/depth-expansion#${ref}`,file:'KB/depth-expansion',ref_id:ref,section:`${ref}. ${title}`,tier:'VERIFIED_CONDITIONAL',
 text:body.join('\n')+`\n[NGUỒN] ${source}. Đối chiếu ${local}, trang ${pages}; rà soát 19/10/2026.`,
 review:{source_urls:[source],local_file:local,pages,topic,effective_from_date:from,effective_to_date:null}});
}
function inv(n,t,b,p){add(n,t,'INVOICE_USAGE',b,invoice,'public/documents/ND-254-2026-ND-CP.pdf',p);}
function exp(n,t,b){add(n,t,'BUSINESS_EXPENSES',b,expenses,'public/documents/ND-68-2026-ND-CP.pdf','4–5 (Điều 6)','2026-01-01');}
function mgmt(n,t,b,p,topic='TAXPAYER_RIGHTS'){add(n,t,topic,b,law,'public/documents/Luat-108-2025-QH15.pdf',p);}
inv(129,'Hóa đơn bán hàng của hộ tính GTGT trực tiếp khác hóa đơn GTGT',[
 '[QUY TẮC] Điều 8 Nghị định 254/2026/NĐ-CP: hóa đơn GTGT dành cho hoạt động khai thuế GTGT theo phương pháp khấu trừ; tổ chức, hộ/cá nhân kinh doanh tính GTGT theo phương pháp trực tiếp sử dụng hóa đơn bán hàng theo khoản 2. Tên loại hóa đơn phụ thuộc phương pháp và hoạt động, không phụ thuộc việc khách là công ty hay cá nhân.',
 '[ÁP DỤNG] Khách công ty yêu cầu “hóa đơn VAT” không làm hộ tính trực tiếp trở thành đơn vị khấu trừ; cần giải thích loại hóa đơn hợp pháp hộ được lập. Không tự thêm dòng thuế suất của phương pháp khấu trừ để đáp ứng yêu cầu khách, không nói hóa đơn bán hàng là hóa đơn không hợp lệ. Khả năng bên mua hạch toán chi phí và khấu trừ GTGT là hai vấn đề riêng, cần điều kiện của bên mua.'
],'14–15');
inv(130,'Thời điểm hóa đơn bán hàng hóa: chuyển giao, không chờ sàn trả tiền',[
 '[QUY TẮC] Khoản 1 Điều 9 Nghị định 254/2026/NĐ-CP: bán hàng hóa trong nước lập hóa đơn tại thời điểm chuyển giao quyền sở hữu hoặc quyền sử dụng cho người mua, không phân biệt đã thu tiền hay chưa.',
 '[ĐỐI SOÁT] Ngày sàn chốt tiền, ngày đơn vị COD chuyển tiền, ngày ngân hàng báo có hoặc khách trả nợ không tự thay thời điểm chuyển giao hàng. Xác định thực tế giao dịch, hàng chưa giao/hủy/hoàn trả và chứng từ; không gọi mọi đơn tạo trên sàn là đã bán, không trì hoãn đến lúc rút tiền. Quy tắc ngoại lệ xuất khẩu phải tra riêng, không áp mốc bán trong nước cho mọi giao dịch xuyên biên giới.'
],'16');
inv(131,'Thời điểm hóa đơn dịch vụ: hoàn thành hoặc thu tiền trước/trong khi cung cấp',[
 '[QUY TẮC] Khoản 2 Điều 9 Nghị định 254/2026/NĐ-CP: lập hóa đơn khi hoàn thành cung cấp dịch vụ, không phân biệt đã thu tiền; nếu thu tiền trước hoặc trong khi cung cấp thì thời điểm là thu tiền, trừ thu tiền đặt cọc hoặc tạm ứng để bảo đảm thực hiện hợp đồng theo quy định của Bộ Tài chính.',
 '[GIỚI HẠN] Không kết luận mọi khoản ghi “cọc” đều miễn lập hóa đơn, cũng không kết luận mọi khoản tạm ứng đều phải lập ngay. Phải xét hợp đồng, mục đích tiền, loại dịch vụ và ngoại lệ áp dụng. Khách nợ tiền sau khi hoàn thành dịch vụ không phải lý do chờ thu tiền mới lập. Hóa đơn và kỳ ghi nhận doanh thu thuế là hai phép kiểm tra riêng.'
],'16');
inv(132,'Giao hàng nhiều lần, nghiệm thu từng phần: hóa đơn theo từng khối lượng',[
 '[QUY TẮC] Khoản 3 Điều 9 Nghị định 254/2026/NĐ-CP: giao hàng nhiều lần hoặc bàn giao từng hạng mục, công đoạn dịch vụ thì mỗi lần giao hàng/bàn giao phải lập hóa đơn cho khối lượng, giá trị tương ứng.',
 '[ÁP DỤNG] Đối chiếu hợp đồng, biên bản giao nhận/nghiệm thu và phần đã lập; không chờ thanh lý toàn bộ hợp đồng mới xuất cho tất cả, không lập trùng phần đã xuất. Việc khách trả một lần cuối kỳ không tự cho phép gộp các lần chuyển giao. Nếu thuộc một ngoại lệ đối soát chuyên ngành thì phải xác định đúng ngoại lệ trước.'
],'16');
inv(133,'Lập hóa đơn sau đối soát: chỉ nhóm đủ điều kiện, không áp cho mọi cửa hàng',[
 '[ĐIỀU KIỆN] Điểm a khoản 4 Điều 9 Nghị định 254/2026/NĐ-CP áp dụng các giao dịch số lượng lớn, phát sinh thường xuyên, cần thời gian đối soát thuộc danh mục được quy định, như một số dịch vụ thương mại điện tử, bưu chính/chuyển phát, logistic, công nghệ thông tin và nhóm khác ghi trong điều khoản.',
 '[MỐC] Nhánh này lập tại thời điểm hoàn thành đối soát nhưng chậm nhất ngày 07 của tháng sau tháng phát sinh cung cấp dịch vụ hoặc không quá 07 ngày kể từ ngày kết thúc kỳ quy ước. Không lấy việc cửa hàng bán qua sàn làm bằng chứng cửa hàng đang cung cấp “dịch vụ thương mại điện tử”. Cần xác định chủ thể, loại dịch vụ, hợp đồng và kỳ quy ước; bán hàng hóa thông thường vẫn kiểm tra khoản 1 Điều 9.'
],'17');
inv(134,'Xây dựng, lắp đặt: nghiệm thu/bàn giao thay vì ngày khách thanh toán',[
 '[QUY TẮC] Điểm c khoản 4 Điều 9 Nghị định 254/2026/NĐ-CP: xây dựng, lắp đặt lập hóa đơn khi nghiệm thu, bàn giao công trình, hạng mục, khối lượng xây dựng/lắp đặt hoàn thành, không phân biệt đã thu tiền hay chưa.',
 '[ÁP DỤNG] Xác định đúng hoạt động xây dựng/lắp đặt và phần hoàn thành; đối chiếu biên bản nghiệm thu, hợp đồng, khoản đã lập hóa đơn. Không chờ khách trả nợ, không lập trùng giá trị của các giai đoạn đã lập. Hợp đồng kèm bán thiết bị cần phân biệt phần hàng hóa và phần lắp đặt, không tự đổi toàn bộ thành một ngành.'
],'18');
inv(135,'Hóa đơn máy tính tiền: thông tin người mua và chữ ký khác hóa đơn thường',[
 '[QUY TẮC] Khoản 9 Điều 8 và khoản 4 Điều 10 Nghị định 254/2026/NĐ-CP: hóa đơn khởi tạo từ máy tính tiền kết nối cơ quan thuế không bắt buộc có chữ ký số; tên, địa chỉ, MST/số định danh/số điện thoại người mua được thể hiện nếu người mua yêu cầu; có mã hoặc dữ liệu để truy xuất, kê khai thông tin hóa đơn.',
 '[GIỚI HẠN] Đây là nhánh máy tính tiền, không được mở rộng thành mọi hóa đơn đều được bỏ thông tin người mua/chữ ký. Khách không lấy hóa đơn không tự miễn nghĩa vụ lập khi người bán thuộc diện phải lập. Khi khách doanh nghiệp yêu cầu thông tin, phải lấy đúng thông tin hợp pháp của giao dịch, không gán người mua khác để hợp thức chi phí.'
],'16, 22');
inv(136,'Hóa đơn bán hàng không trình bày thuế suất và giá trị XML khác bản hiển thị',[
 '[QUY TẮC] Khoản 5 Điều 10 Nghị định 254/2026/NĐ-CP: hóa đơn bán hàng của hộ/cá nhân kinh doanh không thể hiện thuế suất GTGT. Các nội dung khuyến khích hiển thị thêm không làm thay đổi bản chất, loại hóa đơn.',
 '[DỮ LIỆU] Khoản 5 quy định dữ liệu hóa đơn dạng XML gửi cơ quan thuế về chiết khấu thương mại, khuyến mại và trường hợp hàng hóa/dịch vụ không chịu thuế; không suy từ bản PDF/ảnh khách nhận rằng dữ liệu gốc đã khai đúng. Cần đối chiếu XML, mã tra cứu và giao dịch; “không thể hiện thuế suất” không có nghĩa mọi doanh thu đều miễn GTGT.'
],'22');
inv(137,'Sự cố hóa đơn điện tử: tách lỗi người bán, nhà cung cấp và hệ thống thuế',[
 '[PHÂN LUỒNG] Điều 14 Nghị định 254/2026/NĐ-CP tách lỗi của người bán không dùng được hóa đơn có mã; lỗi hệ thống cấp mã; lỗi hạ tầng tổ chức cung cấp dịch vụ; lỗi cổng thuế nhận dữ liệu không có mã. Cách xử lý và đầu mối khác nhau, không áp một cách cho mọi lỗi.',
 '[XỬ LÝ] Người bán có mã gặp sự cố liên hệ cơ quan thuế hoặc nhà cung cấp để được hỗ trợ; có thể được hướng dẫn chuyển sang tổ chức đủ điều kiện hoặc cơ quan thuế cấp mã theo nhánh tương ứng. Khi lỗi cổng tiếp nhận dữ liệu không mã được khắc phục, người bán chuyển dữ liệu đến cơ quan thuế. Không tự xóa giao dịch, đổi ngày hoặc coi bản nháp là hóa đơn hợp lệ.',
 '[BẤT KHẢ KHÁNG] Khoản 5: trong trường hợp bất khả kháng theo khoản 21 Điều 4 Luật 108 dẫn đến không lập được đúng hạn, phải lưu chứng minh và ghi chép giao dịch; trong 03 ngày làm việc từ khi sự cố được khắc phục phải lập/gửi theo quy định. Không gọi mọi lỗi phần mềm hay quên thao tác là bất khả kháng.'
],'24–25');
inv(138,'Dịch vụ hóa đơn miễn phí: điều kiện địa bàn và tự lựa chọn gói thương mại',[
 '[QUY TẮC] Điều 11 Nghị định 254/2026/NĐ-CP có nhánh doanh nghiệp nhỏ/vừa, hợp tác xã, liên hiệp hợp tác xã, hộ/cá nhân kinh doanh tại địa bàn khó khăn hoặc đặc biệt khó khăn sử dụng miễn phí hóa đơn có mã qua tổ chức được cơ quan thuế lựa chọn. Phải đối chiếu danh mục địa bàn theo quy định; không phải mọi hộ nhỏ đều được miễn phí.',
 '[LỰA CHỌN] Khoản 3: chủ thể không thuộc diện miễn phí trả phí dịch vụ theo thỏa thuận. Chủ thể đủ điều kiện nhưng chọn giải pháp trả phí cần xem hợp đồng, không hứa được Nhà nước hoàn mọi phí đã mua. Khoản 4 có kênh đăng ký/thay đổi trực tiếp qua hệ thống thuế cho đối tượng quy định; quyền miễn phí không thay thế đăng ký/chấp thuận sử dụng hóa đơn.'
],'23');
exp(139,'Khấu hao máy móc: đã hết giá trị không trích tiếp, không trừ cả giá mua ngay',[
 '[PHƯƠNG PHÁP] Chỉ xét khoản trừ chi phí trong phương pháp TNCN theo thu nhập tính thuế. Điểm c khoản 1, điểm d khoản 2 Điều 6 Nghị định 68/2026/NĐ-CP: tài sản cố định phục vụ kinh doanh được trích theo chế độ quản lý, sử dụng, khấu hao áp dụng doanh nghiệp; phần vượt mức hoặc tài sản không phục vụ kinh doanh không được trừ.',
 '[GIỚI HẠN] Tài sản đã khấu hao hết nhưng vẫn dùng thì không trích tiếp. Không tự lấy toàn bộ tiền mua máy trừ ngay trong kỳ, không tự đặt thời gian khấu hao; cần giá trị, hồ sơ, thời điểm đưa vào sử dụng và phân loại tài sản/công cụ. Không mang khấu hao trừ khỏi doanh thu GTGT hoặc cơ sở TNCN theo tỷ lệ doanh thu.'
]);
exp(140,'Tiền lương chủ hộ, thành viên hộ và lao động thuê: không chỉ xét quan hệ họ hàng',[
 '[QUY TẮC] Điểm b khoản 1 và điểm c khoản 2 Điều 6 Nghị định 68/2026/NĐ-CP: phân biệt chi trả người lao động theo điều kiện luật với tiền lương, tiền công và khoản có tính chất lương của cá nhân kinh doanh, nhóm cá nhân kinh doanh, các thành viên trong hộ kinh doanh; nhóm sau không được trừ trừ các khoản đóng góp bảo hiểm bắt buộc.',
 '[ĐỐI CHIẾU] Không mặc định thuê vợ/chồng/con đều được trừ vì có hợp đồng, cũng không kết luận mọi người họ hàng là thành viên hộ kinh doanh. Cần xác định tư cách chủ thể, công việc thực tế, hồ sơ lao động, chứng từ thực trả và điều kiện bảo hiểm theo nguồn. Chi đã ghi sổ nhưng không thực trả hoặc không có chứng từ thanh toán thuộc khoản không được trừ. Chỉ xét trong phương pháp thu nhập, không trừ vào doanh thu GTGT.'
]);
exp(141,'Lãi vay: ngân hàng khác người cho vay cá nhân và không phải toàn bộ gốc trả nợ',[
 '[QUY TẮC] Điểm đ khoản 1 Điều 6 Nghị định 68/2026/NĐ-CP: lãi tiền vay vốn sản xuất kinh doanh của tổ chức tín dụng theo lãi suất thực tế; vay đối tượng không phải tổ chức tín dụng thì phần lãi không vượt mức quy định Bộ luật Dân sự. Đồng thời cần giao dịch thực, phục vụ kinh doanh, hồ sơ và điều kiện thanh toán tại khoản 1.',
 '[GIỚI HẠN] Không lấy gốc trả nợ làm lãi vay được trừ, không áp trần cho vay dân sự thay lãi thực tế ngân hàng, không tự kết luận hợp đồng đứng tên người khác được trừ chỉ vì là tài sản chung vợ chồng. Cần xác minh bên vay, bên trả, sử dụng vốn và chứng từ; chưa khớp chủ thể thì hướng dẫn làm rõ, không bịa hình thức hợp thức hóa. Chỉ tính chi phí trong phương pháp thu nhập.'
]);
exp(142,'Thanh toán từng lần từ 5 triệu: điều kiện chi phí, không phải ngưỡng miễn thuế',[
 '[QUY TẮC] Khoản 1 Điều 6 Nghị định 68/2026/NĐ-CP yêu cầu chi thực liên quan kinh doanh, đủ hóa đơn/chứng từ theo pháp luật hóa đơn/kế toán và chứng từ thanh toán không dùng tiền mặt đối với khoản thanh toán từng lần từ 05 triệu đồng trở lên theo pháp luật GTGT.',
 '[PHÂN BIỆT] Đúng 5 triệu đã nằm trong mốc từ 5 triệu; dưới mốc không tự được trừ nếu thiếu điều kiện còn lại. Đây là điều kiện chi phí TNCN theo phương pháp thu nhập; không tự biến hộ GTGT trực tiếp thành được khấu trừ GTGT đầu vào. Không khuyên chia nhỏ hóa đơn hoặc dòng tiền để lách; nếu hỏi trả góp, bù trừ hoặc cộng nhiều giao dịch phải tra quy tắc thanh toán tương ứng, không suy riêng từ con số từng lần.'
]);
exp(143,'Nhà ở, xe và tài sản mang tên cá nhân: điều kiện riêng ngoài mục đích sử dụng',[
 '[QUY TẮC] Điểm e, g khoản 2 Điều 6 Nghị định 68/2026/NĐ-CP liệt kê đất ở/công trình phục vụ sinh hoạt, xe ô tô và tài sản đăng ký sở hữu hoặc sử dụng mang tên cá nhân, với ngoại lệ xe/tài sản đăng ký với mục đích kinh doanh vận tải, du lịch. Chi phí cá nhân/gia đình phải theo dõi riêng và không được trừ.',
 '[GIỚI HẠN] Không chỉ dựa việc thỉnh thoảng chở hàng hoặc đặt bàn làm việc trong nhà để mặc định toàn bộ tài sản/chi gia đình được trừ; cũng không tự loại mọi dịch vụ thuê tài sản có chứng từ. Cần phân biệt mua tài sản, khấu hao, thuê và chi vận hành; đối chiếu chủ thể, đăng ký, ngành và chứng từ thực tế. Không tự bịa một tỷ lệ phân bổ chi phí hỗn hợp khi thiếu căn cứ.'
]);
exp(144,'Tiền phạt và bồi thường do lỗi cá nhân kinh doanh: trả thật vẫn có thể không được trừ',[
 '[QUY TẮC] Điểm đ khoản 2 Điều 6 Nghị định 68/2026/NĐ-CP loại các khoản phạt vi phạm hành chính, phạt vi phạm hợp đồng, bồi thường do lỗi của cá nhân kinh doanh khỏi chi phí được trừ khi tính TNCN theo thu nhập.',
 '[PHÂN BIỆT] Chứng từ đã trả hoặc chuyển khoản không tự làm khoản chi bị loại thành được trừ. Cần phân loại đúng tiền phạt, tiền bồi thường do lỗi với tiền hoàn khách, chiết khấu, giảm giá hoặc chi phí dịch vụ thông thường; không loại mọi khoản hoàn tiền theo một nhãn “phạt sàn”. Thuế/phạt và cơ sở tính doanh thu GTGT phải xử lý riêng.'
]);
mgmt(145,'Nộp thừa: bù trừ khác trừ chi phí, thời hạn 10 năm khác khai bổ sung 5 năm',[
 '[QUY TẮC] Điều 15 Luật 108/2025/QH15: nộp thừa là số đã nộp lớn hơn nghĩa vụ phải nộp. Có thể bù trừ trong/giữa loại thuế, khoản thu khác, tiền chậm nộp, tiền phạt theo cơ chế tự động hoặc đề nghị; hoàn khi không còn tiền thuế nợ và theo thủ tục Điều 18.',
 '[GIỚI HẠN] Khoản 4 không hoàn nếu người nộp thuế từ chối nhận hoặc quá 10 năm từ ngày nộp mà không bù trừ và không đề nghị hoàn. Không nhầm mốc này với 05 năm khai bổ sung ở Điều 12. Một dòng “tax” nền tảng giữ chưa rõ loại thuế/chứng từ chưa đủ để tự bù trừ ngay; không trừ nộp thừa khỏi doanh thu hoặc chi phí thay cho xử lý nghĩa vụ.'
],'16–17','TAX_PAYMENT_RECONCILIATION');
mgmt(146,'Gia hạn hồ sơ do bất khả kháng khác gia hạn nộp tiền thuế',[
 '[QUY TẮC] Khoản 4 Điều 12 Luật 108/2025/QH15: khi không có khả năng nộp hồ sơ đúng hạn do bất khả kháng theo khoản 21 Điều 4, nhánh tháng/quý/năm/từng lần được gia hạn không quá 30 ngày từ hết hạn; hồ sơ quyết toán không quá 60 ngày. Chính phủ quy định trường hợp cần kéo dài.',
 '[PHÂN BIỆT] Đây là gia hạn hồ sơ trong điều kiện luật, không phải quyền tự lùi hạn vì bận, quên hoặc thuê kế toán; cũng không tự là gia hạn tiền thuế. Gia hạn tiền theo chính sách riêng không mặc nhiên gia hạn tờ khai. Cần xác định sự kiện, chứng minh, kỳ và thủ tục áp dụng, không hứa hệ thống tự chấp nhận hoặc đặt ngày hết hạn nếu thiếu dữ kiện.'
],'9–10','TAX_EXTENSION');
mgmt(147,'Hết thời hiệu phạt không tự hết nghĩa vụ truy thu',[
 '[QUY TẮC] Khoản 7–8 Điều 44 Luật 108/2025/QH15: thời hiệu xử phạt thủ tục thuế là 02 năm; trốn thuế chưa đến hình sự hoặc khai sai dẫn tới thiếu thuế/tăng miễn giảm hoàn không thu là 05 năm. Thời điểm tính phải theo pháp luật xử lý vi phạm hành chính, không đơn giản tính từ lúc được gọi lên thuế.',
 '[TRUY THU] Quá thời hiệu phạt vẫn nộp thuế thiếu/trốn, miễn giảm hoàn không đúng và tiền chậm nộp trong 10 năm trở về trước từ phát hiện; trường hợp không đăng ký thuế thì cho toàn bộ thời gian trở về trước. Không kết luận cứ quá 5 hoặc 10 năm là xóa mọi nợ, không áp quy tắc năm 2026 máy móc thay quy định cho kỳ/hành vi lịch sử.'
],'56–57');
mgmt(148,'Tự khai sửa trước khi phát hiện và quyết toán cá nhân được hoàn: giới hạn không xử phạt',[
 '[QUY TẮC] Điểm a khoản 2 Điều 44 Luật 108/2025/QH15: hành vi khai sai thuộc khoản 2 Điều 45 được khai bổ sung và tự giác nộp đủ trước các mốc công bố quyết định thanh tra/kiểm tra hoặc phát hiện theo điều khoản thuộc trường hợp không xử phạt. Điều khoản cũng nêu cá nhân trực tiếp quyết toán TNCN chậm nộp hồ sơ mà phát sinh thuế được hoàn.',
 '[GIỚI HẠN] Không mở rộng thành mọi vi phạm nộp tờ khai muộn, trốn thuế hoặc hóa đơn đều miễn phạt nếu tự lên cơ quan thuế. Việc không phạt không tự miễn thuế gốc và mọi tiền chậm nộp. Phải xác định loại sai phạm, thời điểm phát hiện/công bố, hồ sơ và chứng từ đã nộp; nếu có quyết định kiểm tra thì xử lý đúng phạm vi, không khuyên khai sửa để né điều tra.'
],'56–57');
mgmt(149,'Trốn thuế khác chậm thủ tục: không kết luận tội chỉ từ nợ thuế hoặc dòng tiền',[
 '[QUY TẮC] Khoản 4 Điều 45 Luật 108/2025/QH15 liệt kê hành vi như không ghi doanh thu trong sổ, không lập hóa đơn và không khai thuế, dùng hóa đơn/chứng từ trái quy định làm giảm thuế, tài liệu sai bản chất giao dịch, kinh doanh trong thời gian ngừng/tạm ngừng không thông báo và những trường hợp cụ thể khác.',
 '[NGOẠI LỆ] Điểm l khoản 4 phân biệt một số trường hợp không đăng ký/không khai hoặc khai quá 90 ngày nhưng không phát sinh thuế, hoặc đã nộp đủ thuế và tiền chậm nộp trước các mốc theo luật thì xử lý thủ tục thay vì trốn thuế. Phải đọc đủ điều kiện, không cứ quá 90 ngày là gọi trốn thuế.',
 '[CHẾ TÀI] Điều 44 khoản 3–4: phạt hành chính trốn thuế 01–03 lần số thuế trốn, không chia đôi vì là cá nhân; xử lý hình sự cần pháp luật hình sự và hồ sơ riêng. Nợ tiền, bị cảnh báo rủi ro hoặc doanh thu cao không tự chứng minh hành vi hay tội phạm.'
],'58–59');
mgmt(150,'Cưỡng chế thuế: điều kiện, quyết định và nộp dần có bảo lãnh',[
 '[ĐIỀU KIỆN] Điều 48 Luật 108/2025/QH15 quy định các nhánh như nợ quá 90 ngày, hết hạn gia hạn, có nợ nhưng không hoạt động tại địa chỉ/phát tán tài sản, không chấp hành quyết định xử phạt hoặc kiểm tra trong điều kiện luật. Không coi mọi khoản app báo nợ là đã bị cưỡng chế hoặc tự suy ngưỡng tiền cụ thể chỉ từ điều này.',
 '[NỘP DẦN] Khoản 6: trường hợp được chấp nhận nộp dần tối đa 12 tháng từ văn bản chấp nhận và trong thời gian thư bảo lãnh có hiệu lực, cần bảo lãnh tổ chức tín dụng; không tự trả góp mà được dừng cưỡng chế.',
 '[BIỆN PHÁP] Điều 49 có trích/phong tỏa tài khoản, khấu trừ thu nhập, ngừng hóa đơn và các biện pháp khác; quyết định phải gửi người nộp thuế và bên liên quan. Khoản 2 quy định chấm dứt hiệu lực khi đủ nhánh, gồm nộp đủ nợ bị cưỡng chế hoặc có văn bản có thẩm quyền. Việc mở lại hóa đơn còn phải theo quy trình hóa đơn, không hứa vừa chuyển tiền là mở ngay.'
],'61–63');
mgmt(151,'Khoanh nợ và xóa nợ: đóng cửa lâu năm không tự xóa thuế',[
 '[KHOANH] Điều 20 Luật 108/2025/QH15 quy định các trường hợp khoanh nợ như chết/mất tích theo quyết định, thủ tục giải thể/phá sản, không còn hoạt động tại địa chỉ và nhánh khác; phải có quyết định của cơ quan quản lý. Khoản 4: tạm chưa tính tiền chậm nộp trong thời gian khoanh; khi chấm dứt thì tính đủ từ hết hạn theo luật, trừ nhánh điểm e khoản 1. Không đồng nghĩa đã được xóa nợ.',
 '[XÓA] Điều 21 có điều kiện riêng; nhánh khoản nợ quá 10 năm đòi hỏi đã áp biện pháp tại điểm h khoản 1 Điều 49 và không có khả năng thu hồi, không phải chỉ đợi đủ 10 năm. Theo khoản 2, chủ thể đã được xóa nhánh điểm c khoản 1 phải hoàn trả nợ đã xóa trước khi quay lại kinh doanh/lập cơ sở mới. Không khuyên bỏ địa chỉ, đóng gian hàng hoặc chờ nợ tự mất.'
],'24–26');
mgmt(152,'Chủ hộ qua đời: nghĩa vụ từ di sản và người nhận tiền thuế hoàn',[
 '[NGHĨA VỤ] Khoản 3 Điều 17 Luật 108/2025/QH15: người thừa kế/người quản lý di sản thực hiện nghĩa vụ thuế người chết trong phần di sản hoặc phần tài sản thừa kế được chia tại thời điểm nhận; trường hợp không có hoặc tất cả từ chối nhận thì theo pháp luật dân sự. Không tự buộc người thân trả mọi nợ bằng tài sản riêng không giới hạn.',
 '[HOÀN] Điểm c khoản 1 Điều 18: người thừa kế hoặc người được Tòa án giao quản lý tài sản có thể nhận khoản thuế được hoàn theo luật dân sự khi đủ điều kiện. Cần đối chiếu tư cách người nộp, hồ sơ thừa kế/quản lý, thông báo nghĩa vụ và căn cứ hoàn; không dùng tài khoản người thân để tự nhận hay coi tử vong tự động xóa mọi nợ. Thủ tục đăng ký/thay chủ và chấm dứt hộ vẫn phải giải quyết riêng.'
],'19–21','TAX_REGISTRATION_CHANGE');
mgmt(153,'Hiệu lực Luật Quản lý thuế 108 và chuyển tiếp nợ, kiểm tra trước tháng 7/2026',[
 '[HIỆU LỰC] Khoản 1–2 Điều 52 Luật 108/2025/QH15: hiệu lực chung từ 01/07/2026; Điều 13 và việc sử dụng hóa đơn điện tử của hộ/cá nhân kinh doanh quy định tại Điều 26 có hiệu lực từ 01/01/2026. Ngoại lệ không có nghĩa toàn bộ mọi nội dung Điều 26 đều được áp sớm cho mọi chủ thể.',
 '[CHUYỂN TIẾP] Điều 53: khoản miễn/giảm/không thu phát sinh trước 01/07/2026 tiếp tục xử lý theo Luật 38/2019/QH14; khoản nợ đến hết 30/06/2026 xử lý theo Luật 108; cuộc kiểm tra có quyết định trước hiệu lực mà chưa có kết luận/quyết định xử lý tiếp tục theo Luật 38. Không chỉ nhìn năm được hỏi rồi thay mọi luật cũ bằng mới; cần ngày phát sinh, loại nghĩa vụ và ngày quyết định kiểm tra.'
],'64–65');
export default entries;
