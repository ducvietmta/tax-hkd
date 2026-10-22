import fs from 'node:fs/promises';
const cases={
 extension:'Hôm nay là 19/10/2026. Tôi là cá nhân kinh doanh cư trú, xác nhận hoạt động thuộc Phụ lục I Nghị định 245/2026 và có TNCN quý II, quý III thuộc diện gia hạn. Tôi chưa gửi văn bản đề nghị. Nay còn kịp gửi không, hạn nộp tiền từng quý là ngày nào? Có được lùi cả tờ khai không? Không tính số thuế.',
 invoice:'Tôi muốn đăng ký sử dụng hóa đơn điện tử mới cho hộ kinh doanh đang hoạt động tháng 10/2026. Nộp mẫu nào, qua đâu? Nhận thông báo tiếp nhận hồ sơ là đã được xuất ngay chưa? Nếu thông tin định danh không khớp thì có chắc được chấp thuận trong một ngày không?',
 retention:'Hộ kinh doanh của tôi lưu sổ trên máy tính, muốn biết thời hạn lưu tài liệu kế toán. Có phải sau đúng 5 năm được xóa hết cả hóa đơn không? Tôi không hỏi chọn phương pháp hay tính thuế.',
};
const id=process.argv[2];if(!cases[id])throw Error('Unknown synthetic case');
const start=Date.now(),res=await fetch('https://tax-hkd.pages.dev/api/chatgpt/tax-qa?nocache=1',{
method:'POST',headers:{'Content-Type':'application/json','X-Test-Run':'rag-expansion-'+id},body:JSON.stringify({message:cases[id]}),signal:AbortSignal.timeout(75000)});
const value=await res.json();await fs.writeFile(`outputs/rag-expansion-2026-10-19/${id}-live.json`,JSON.stringify({http:res.status,elapsedMs:Date.now()-start,...value},null,2));
console.log(JSON.stringify({http:res.status,elapsedMs:Date.now()-start,answer:value.answer,source:value.source,decision:value.decision}));
