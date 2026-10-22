import fs from 'node:fs/promises';
async function save(file,text){
 for(let attempt=0;attempt<5;attempt++){
  try{return await fs.writeFile(file,text);}catch(error){
   if(attempt===4)throw error;
   await new Promise(resolve=>setTimeout(resolve,400));
  }
 }
}
const file='rag_data/rag-kb-export-2026-10-12/chunks.jsonl';
const chunks=(await fs.readFile(file,'utf8')).trim().split(/\r?\n/).map(JSON.parse);
const historical=chunks.find(c=>c.ref_id==='16.54');
historical.evidence_mode='COMPLETE_RULE';
if(!historical.text.includes('[TỶ LỆ HÀNG HÓA LỊCH SỬ]'))historical.text+='\n[TỶ LỆ HÀNG HÓA LỊCH SỬ] Khoản 2 Điều 4, Điều 10 và mục 1 Phụ lục I Thông tư 40/2021/TT-BTC: với hoạt động phân phối, cung cấp hàng hóa chịu thuế theo tỷ lệ trên doanh thu, tỷ lệ gốc GTGT 1%, TNCN 0,5%. Doanh thu năm vượt 100 triệu thì tính trên toàn bộ doanh thu chịu thuế, không chỉ phần vượt 100 triệu; tiền lãi/chi phí không thay cơ sở này. Xét riêng điều kiện giảm GTGT của từng giai đoạn; các tỷ lệ gốc không tự chứng minh hàng được giảm. Phải đối trừ số đã nộp/đã được nộp thay có chứng từ phù hợp, không coi đây là nghĩa vụ nộp thêm. Nguồn gốc: https://congbao.chinhphu.vn/van-ban/thong-tu-so-40-2021-tt-btc-33850/36037.htm ; bản tại public/documents/TT-40-2021-TT-BTC.pdf. Kỳ nghĩa vụ quyết định quy tắc, không lấy năm hiện tại lúc hỏi thay năm doanh thu.';
await save(file,chunks.map(c=>JSON.stringify(c)).join('\n')+'\n');
const supplement='rag_data/semantic-topic-supplements.json';
const extra=JSON.parse(await fs.readFile(supplement,'utf8'));
const invoice=extra.find(c=>c.ref_id==='16.103');
invoice.evidence_mode='COMPLETE_RULE';
if(!invoice.text.includes('[PHẠM VI KỲ KÊ KHAI]'))invoice.text+='\n[PHẠM VI KỲ KÊ KHAI] Đã đối chiếu trực tiếp Thông tư 91/2026/TT-BTC, Điều 10, trang 17–22 của PDF chính thức tại public/documents/TT-91-2026-TT-BTC.pdf. Điểm b khoản 1 xử lý hóa đơn sai số tiền/giá bằng điều chỉnh hoặc thay thế. Điểm c khoản 6 yêu cầu điều chỉnh tăng ghi dương, giảm ghi âm theo thực tế. Điểm d khoản 6 CHỈ quy định hóa đơn điều chỉnh thuộc KHOẢN 5: người bán kê khai vào kỳ phát sinh hóa đơn điều chỉnh, người mua vào kỳ nhận được. Khoản 5 có các tình huống thay đổi giá trị/khối lượng qua quyết toán, chiết khấu thương mại, trả lại hàng hóa/dịch vụ, hoàn phí và các tình huống đặc thù được liệt kê. Không tự đồng nhất lỗi sai giá lúc lập hóa đơn thuộc khoản 1 với mọi tình huống tại khoản 5, không ép áp kỳ hiện tại hoặc kỳ gốc chỉ từ chữ điều chỉnh. Với lỗi giá không trả hàng, nêu quy trình/chứng từ và giảm số tiền đúng thực tế trước; để chốt kỳ thuế cụ thể phải đối chiếu thời điểm, phương pháp thuế và quy định khai thuế áp dụng. Thiếu căn cứ chốt kỳ không phải thiếu toàn bộ quy trình. Nguồn chính thức: https://vanban.chinhphu.vn/?docid=219006&pageid=27160 ; hướng dẫn giới hạn khoản 5: https://chinhsachonline.chinhphu.vn/thoi-diem-ke-khai-hoa-don-dieu-chinh-thue-gtgt-91057.htm';
await save(supplement,JSON.stringify(extra,null,2)+'\n');
console.log('Updated historical rates and invoice-period scope. Answer contracts are maintained in source.');
