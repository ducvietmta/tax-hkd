/** One-time reviewed migration. Ref IDs identify knowledge records, never user-question routing. */
const fs=require('node:fs'),crypto=require('node:crypto'),ts=require('typescript');
const mod={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('worker/src/ragEngine.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod,mod.exports);
const chunks=mod.exports.CANONICAL_CHUNKS,meta=JSON.parse(fs.readFileSync('worker/src/kb/chunkMeta.json','utf8'));
const docs=JSON.parse(fs.readFileSync('src/data/legalDocuments.json','utf8'));
const base='https://xaydungchinhsach.chinhphu.vn/';
const official={
 ND68:base+'toan-van-nghi-dinh-68-2026-nd-cp-quy-dinh-ve-chinh-sach-thue-quan-ly-thue-voi-ho-kinh-doanh-119260306102906789.htm',
 ND141:base+'toan-van-nghi-dinh-so-141-2026-nd-cp-nang-nguong-doanh-thu-khong-phai-chiu-thue-len-1-ty-dong-119260504154326455.htm',
 ND252:base+'toan-van-nghi-dinh-252-2026-nd-cp-huong-dan-thi-hanh-luat-quan-ly-thue-119260715155021635.htm',
 ND253:base+'nghi-dinh-253-2026-nd-cp-huong-dan-thi-hanh-luat-thue-thu-nhap-ca-nhan-119260713171348107.htm',
 ND254:base+'toan-van-nghi-dinh-so-254-2026-nd-cp-ve-hoa-don-dien-tu-chung-tu-dien-tu-119260713164251972.htm',
 TT50:base+'huong-dan-thu-tuc-khai-thue-doi-voi-ho-kinh-doanh-ca-nhan-kinh-doanh-119260530072620314.htm',
 TT89:base+'co-can-khai-bao-doanh-thu-khi-ban-hang-qua-shopee-grab-be-cac-san-da-khau-tru-thue-119260721055834808.htm',
};
const extra=[
 ['VBHN-114-2026-VPQH','Văn bản hợp nhất 114/VBHN-VPQH',base+'van-ban-hop-nhat-114-vbhn-vpqh-hop-nhat-luat-thue-gia-tri-gia-tang-119260605094756577.htm','CONSOLIDATED_TEXT'],
 ['DTA-VN-SG-MLI-2023','Hiệp định Việt Nam–Singapore (bản tổng hợp MLI công bố 01/09/2023)','https://www.iras.gov.sg/media/docs/default-source/dtas/singapore-vietnam-dta-(ratified)(mli)(01092023).pdf','TREATY_SYNTHESISED_TEXT'],
 ['NQ-198-2025-QH15','Nghị quyết 198/2025/QH15',base+'nghi-quyet-198-2025-qh15-ve-mot-so-co-che-chinh-sach-dac-biet-phat-trien-kinh-te-tu-nhan-119250517191622422.htm','PRIMARY_TEXT'],
 ['ND-362-2025-ND-CP','Nghị định 362/2025/NĐ-CP','https://chinhphu.vn/?classid=0&docid=216389&pageid=27160','PRIMARY_DOCUMENT_RECORD'],
 ['ND-139-2016-ND-CP','Nghị định 139/2016/NĐ-CP','https://vbpl.moj.gov.vn/bonoivu/Pages/vbpq-toanvan.aspx?ItemID=114261','HISTORICAL_TEXT'],
 ['ND-22-2020-ND-CP','Nghị định 22/2020/NĐ-CP','https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-22-2020-nd-cp-30787.htm','HISTORICAL_TEXT'],
 ['ND-126-2020-ND-CP','Nghị định 126/2020/NĐ-CP','https://vanban.chinhphu.vn/?docid=201402&pageid=27160','HISTORICAL_TEXT'],
 ['7403-CT-TMDT-2026','Công văn 7403/CT-TMĐT','/documents/7403-CT-TMDT-2026.docx','SUPPLIED_OFFICIAL_DOCUMENT'],
].map(([id,code,source_url,source_type])=>({id,code,source_url,source_type,access:source_url.startsWith('/')?'LOCAL_PUBLIC_FILE':'EXTERNAL_PRIMARY_SOURCE',source_checked_on:'2026-10-20'}));
const byId=new Map([...docs,...extra].map(d=>[d.id,d]));
const doc=(id,locator,scope,options={})=>{
 const d=byId.get(id);if(!d)throw Error(id);
 return {doc_id:id,code:d.code,locator,scope,source_url:d.source_url||d.downloadUrl,
  source_type:d.source_type||'LOCAL_OFFICIAL_TEXT',...options};
};
const nd=(n,loc,scope,opts={})=>doc(`ND-${n}-${[174,181].includes(n)?2025:2026}-ND-CP`,loc,scope,{...(official['ND'+n]?{source_url:official['ND'+n]}:{}),source_type:'PRIMARY_TEXT_AND_OFFICIAL_GUIDANCE',...opts});
const tt=(n,loc,scope)=>doc(`TT-${n}-2026-TT-BTC`,loc,scope,{source_url:official['TT'+n]||byId.get(`TT-${n}-2026-TT-BTC`).downloadUrl,source_type:official['TT'+n]?'OFFICIAL_GUIDANCE_AND_LOCAL_TEXT':'LOCAL_OFFICIAL_TEXT'});
const rate=()=>nd(68,'Điều 3, Điều 4','Phân loại hoạt động và tỷ lệ theo phương pháp; không xác định thay bản chất hợp đồng.');
const revenue=()=>nd(68,'Điều 5','Doanh thu được hưởng, khoản loại trừ và thời điểm ghi nhận; không đồng nhất với dòng tiền.');
const threshold=()=>nd(141,'Điều 1','Sửa ngưỡng và quy định liên quan của Nghị định 68; không thay mọi ngưỡng trong luật khác.');
const vat=()=>doc('VBHN-114-2026-VPQH','Điều 5; Điều 12','Đối tượng không chịu GTGT và phương pháp trực tiếp; ưu đãi trực tiếp sản xuất phải đủ điều kiện.');
const invoice=()=>nd(254,'Quy định về sử dụng, thời điểm lập và nội dung HĐĐT','Chỉ phần hóa đơn từ kỳ áp dụng; không quyết định riêng doanh thu TNCN.',{applies_from_year:2026});
const cost=()=>nd(68,'Điều 6','Điều kiện chi phí được trừ của TNCN theo thu nhập; không phải chi phí TNDN của bên mua.');
const relief=()=>doc('NQ-43-2026-QH16','Khoản 1 Điều 1','Giảm TNCN kinh doanh cho cá nhân cư trú đủ điều kiện; không giảm GTGT.',{applies_from_year:2026,applies_to_year:2027});
const form=()=>tt(50,'Mẫu 01/CNKD và hướng dẫn chỉ tiêu [14]','Phân bổ mức trừ và thuật ngữ theo mẫu, dùng phiên bản đúng kỳ.');
const settlement=()=>tt(89,'Mẫu 01/TKN-CNKD; Mẫu 02/QTT-TNCN-CNKD','Thông báo doanh thu/quyết toán và đối trừ khoản nền tảng đã nộp thay.');
const links={
 '16.2':[vat(),doc('Luat-109-2025-QH15','Quy định thu nhập được miễn thuế','Chỉ nhánh cá nhân trực tiếp sản xuất nông nghiệp đáp ứng điều kiện; không miễn cho người mua đi bán lại.'),rate()],
 '16.3':[vat(),rate(),revenue()],
 '16.4':[rate()],
 '16.5':[revenue(),invoice()],
 '16.10':[revenue(),nd(252,'Điều 29–31','Xử lý nộp thừa và hồ sơ hoàn sau điều chỉnh hợp đồng; không tự động hoàn khi chưa có hồ sơ.')],
 '16.13':[rate(),cost(),doc('TT-152-2025-TT-BTC','Hướng dẫn chứng từ và bảng kê mua hàng','Chứng minh giao dịch mua hàng theo chế độ kế toán; không hợp thức hóa hàng không rõ nguồn gốc.'),threshold()],
 '16.15':[rate(),nd(68,'Điều 4, Điều 5','Phân biệt dịch vụ lưu trú với cho thuê bất động sản; không áp cùng tỷ lệ chỉ vì sử dụng nhà.')],
 '16.16':[doc('Luat-48-2024-QH15','Điều 11–12','Phân biệt khấu trừ và trực tiếp; đọc cùng các văn bản sửa đổi.'),nd(181,'Quy định khấu trừ và hoàn GTGT','Không suy có hóa đơn đầu vào thì HKD theo trực tiếp được hoàn/khấu trừ.',{source_url:base+'nghi-dinh-181-2025-nd-cp-quy-dinh-chi-tiet-thi-hanh-mot-so-dieu-cua-luat-thue-gia-tri-gia-tang-119250707172930626.htm'}),cost()],
 '16.17':[invoice(),tt(91,'Quy định hóa đơn theo Nghị định 254','Thao tác theo loại hóa đơn, thời điểm phát sinh và chuyển tiếp.'),doc('ND-123-2020-ND-CP','Quy định thời điểm lập hóa đơn của kỳ cũ','Nguồn lịch sử; đọc cùng văn bản sửa đổi, không hồi tố quy định mới.',{applies_to_year:2026})],
 '16.19':[cost(),doc('TT-152-2025-TT-BTC','Chứng từ kế toán và bảng kê mua hàng','Bảng kê không thay điều kiện thực tế, nguồn gốc và thanh toán.'),threshold()],
 '16.23':[nd(68,'Điều 8','Khai theo doanh thu thực tế và nghĩa vụ hóa đơn.'),threshold()],
 '16.25':[tt(90,'Trạng thái người nộp thuế và chấm dứt hiệu lực mã số thuế','Phân biệt trạng thái 03 với 06; mã trạng thái không tự xác định hoãn xuất cảnh.'),nd(252,'Quy định tạm hoãn xuất cảnh','Tách căn cứ nợ bị cưỡng chế với căn cứ không hoạt động tại địa chỉ đăng ký; phải đủ điều kiện.')],
 '16.27':[vat(),rate()],
 '16.28':[vat(),rate()],
 '16.30':[revenue(),invoice()],
 '16.31':[rate(),revenue()],
 '16.32':[revenue(),invoice()],
 '16.33':[revenue()],
 '16.34':[revenue()],
 '16.36':[revenue(),invoice()],
 '16.37':[revenue(),nd(68,'Điều 3; khoản 5 Điều 8','Tách cơ sở GTGT, doanh thu TNCN và nghĩa vụ HĐĐT.'),threshold(),invoice()],
 '16.40':[form(),threshold()],
 '16.42':[nd(68,'Khoản 1 Điều 8','Không khai nộp trùng giao dịch đã được nền tảng thực hiện thay.'),threshold(),nd(252,'Điều 43','Khấu trừ, khai thay và nộp thay theo giao dịch.'),settlement()],
 '16.45':[form(),nd(68,'Điều 4','Phân biệt doanh thu tính thuế với thu nhập tính thuế.')],
 '16.46':[form(),rate(),threshold(),relief(),nd(174,'Quy định giảm tỷ lệ GTGT','Giảm GTGT độc lập với giảm TNCN; ví dụ số học không phải điều khoản luật.',{doc_note:'Nghị định 174/2025/NĐ-CP',source_url:byId.get('ND-174-2025-ND-CP')?.downloadUrl}),settlement()],
 '16.48':[threshold(),revenue(),nd(252,'Điều 43','Phân biệt số nền tảng nộp thay với nghĩa vụ tổng hợp.'),settlement()],
 '16.51':[settlement(),nd(252,'Điều 29–31','Điều kiện, tiếp nhận và thời hạn xử lý hoàn nộp thừa; không hứa ngày tiền về.')],
 '16.53':[nd(68,'Điều 8','Khai từ kỳ phát sinh vượt ngưỡng, xác định chu kỳ tháng/quý theo điều kiện.'),threshold(),form()],
 '16.55':[doc('TT-40-2021-TT-BTC','Khoản 2 Điều 4','Ngưỡng lịch sử năm 2023 trong ví dụ; số phần mềm hiển thị không thay nghĩa vụ theo luật.',{applies_from_year:2021,applies_to_year:2025}),nd(68,'Điều 3, Điều 4, Điều 8','Nghĩa vụ pháp lý theo kỳ hiện hành, không chứng nhận hành vi cụ thể của HTKK/eTax.'),threshold()],
 '16.57':[nd(68,'Điều 4, Điều 8','Phương pháp và thời điểm chuyển; không hồi tố chỉ từ doanh thu cuối năm.'),nd(252,'Điều 43','Khấu trừ theo giao dịch không thay quyết toán của người thuộc phương pháp thu nhập.'),cost(),settlement()],
 '16.58':[invoice(),threshold(),nd(68,'Điều 3, Điều 4, Điều 6','HĐĐT tự nguyện không tự phát sinh thuế; thiếu đầu vào không xóa nghĩa vụ đầu ra.')],
 '16.59':[doc('Luat-108-2025-QH15','Quy định thời hạn khai thuế và khai bổ sung','Kê khai/bổ sung đúng kỳ sai sót; thao tác hủy hồ sơ phải kiểm trạng thái.'),nd(252,'Quy định khai bổ sung hồ sơ khai thuế','Không cộng kỳ thiếu vào kỳ khác để thay hồ sơ chưa nộp.')],
 '16.70':[doc('Luat-108-2025-QH15','Khoản 2 Điều 24','Căn cứ ấn định thuế; chênh lệch đầu vào/đầu ra không tự đủ điều kiện.')],
 '16.74':[rate(),revenue(),nd(252,'Điều 43','Chỉ nhánh nền tảng có thuộc diện khấu trừ, khai/nộp thay; không mặc định mọi nguồn nước ngoài đã nộp thay.'),threshold()],
 '16.78':[relief()],
 '16.84':[nd(253,'Điều 7; điểm c khoản 2 Điều 8','Phân loại kinh doanh/tiền lương theo quan hệ thực tế và điều kiện điều khoản.'),doc('7403-CT-TMDT-2026','Phần hướng dẫn tiếp thị liên kết, quảng cáo và nội dung trên nền tảng','Hướng dẫn chuyên biệt; không mở rộng mọi freelancer thành kinh doanh hoặc tiền công.')],
 '16.86':[doc('Luat-109-2025-QH15','Điều 6','Điều kiện hoàn thuế TNCN.'),doc('Luat-108-2025-QH15','Điều 15; Điều 18','Xử lý nộp thừa khác với quy trình hoàn thuế.',{source_url:'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf'}),nd(252,'Khoản 4 Điều 29; Điều 31','Mức nộp thừa nhỏ và thời hạn thủ tục; không đồng nhất tiếp nhận với nhận tiền.')],
 '16.87':[doc('Luat-109-2025-QH15','Điều 2','Cư trú và phạm vi thu nhập chịu thuế.'),nd(253,'Điều 3–6','Ngày hiện diện, nơi ở, chứng nhận cư trú và phạm vi thu nhập; hiệp định xét riêng.')],
 '16.94':[doc('DTA-VN-SG-MLI-2023','Điều 4, 14, 15, 24; Điều VIII Nghị định thư thứ hai','Nội dung hiệp định và phép thử riêng; không xác minh thủ tục hồ sơ tại Việt Nam sau TT 89.')],
 '16.97':[doc('NQ-198-2025-QH15','Khoản 7 Điều 10','Chấm dứt thu, nộp lệ phí môn bài từ 01/01/2026.',{applies_from_year:2026}),doc('ND-362-2025-ND-CP','Khoản 4 Điều 6','Bãi bỏ Nghị định 139/2016 và Nghị định 22/2020.'),doc('ND-139-2016-ND-CP','Điều 3; khoản 2 Điều 4','Chỉ biểu mức lịch sử và miễn của các năm trước.',{applies_to_year:2025}),doc('ND-22-2020-ND-CP','Điều 1','Miễn năm đầu theo quy định lịch sử.',{applies_to_year:2025}),doc('ND-126-2020-ND-CP','Khoản 4 Điều 10','Hạn nộp lệ phí môn bài của kỳ trước 2026.',{applies_to_year:2025})],
 '16.98':[doc('ND-139-2016-ND-CP','Điều 3; khoản 2 Điều 4','Biểu mức và miễn lịch sử; không áp cho 2026.',{applies_to_year:2025}),doc('ND-22-2020-ND-CP','Điều 1','Miễn năm đầu theo quy định lịch sử.',{applies_to_year:2025}),doc('ND-126-2020-ND-CP','Khoản 4 Điều 10','Hạn nộp lệ phí môn bài lịch sử.',{applies_to_year:2025}),doc('NQ-198-2025-QH15','Khoản 7 Điều 10','Nguồn chuyển tiếp: từ 2026 chấm dứt thu nộp, không áp biểu cũ.',{applies_from_year:2026})],
};
// ND174 is a 2025 decree, not a 2026 decree.
links['16.46'][4]=doc('ND-174-2025-ND-CP','Điều 1','Giảm tỷ lệ GTGT độc lập với giảm TNCN; ví dụ số học không phải điều khoản luật.');
if(Object.keys(links).length!==41)throw Error('Expected 41 reviewed records');
const before=JSON.parse(fs.readFileSync('outputs/legal-assurance/unlinked-chunks.json','utf8'));
for(const [ref,sources]of Object.entries(links)){
 const chunk=chunks.find(c=>c.ref_id===ref),snapshot=before.find(c=>c.ref_id===ref);
 if(!chunk||chunk.text!==snapshot?.text)throw Error(`Source review stale: ${ref}`);
 if(meta[ref].source_links)throw Error(`Already linked: ${ref}; do not auto-renew a source review`);
 meta[ref].source_link_review={checked_on:'2026-10-20',content_sha256:crypto.createHash('sha256').update(chunk.text).digest('hex'),status:'SOURCE_LINKED_SCOPED_NOT_FULL_LEGAL_CERTIFICATION',coverage:'SCOPED_SUPPORT_NOT_EVERY_SENTENCE',limits:ref==='16.78'?'Không xác minh tình trạng văn bản hướng dẫn sau 08/10/2026.':ref==='16.94'?'Chưa xác minh thủ tục hồ sơ áp dụng hiệp định sau TT 89.':ref==='16.55'?'Không xác nhận giao diện hoặc hành vi của phiên bản phần mềm.':'Áp dụng đúng kỳ và điều kiện; không tự nâng trạng thái pháp lý của chunk.'};
 meta[ref].source_links=sources;
}
fs.writeFileSync('worker/src/kb/sourceDocuments.json',JSON.stringify({schema:'taxhkd-source-documents-v1',documents:extra},null,2)+'\n');
fs.writeFileSync('worker/src/kb/chunkMeta.json',JSON.stringify(meta,null,2)+'\n');
console.log('Linked 41 source-reviewed chunks; legal_status and tax text unchanged.');
