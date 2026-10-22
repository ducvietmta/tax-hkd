// Newly authored synthetic probes; never uploads original community cases.
import fs from 'node:fs/promises';
const probes={
 invoice:'Tháng 10/2026, hộ của tôi bán hàng hóa tính GTGT trực tiếp. Khách là công ty yêu cầu hóa đơn VAT. Hàng đã chuyển giao, khách chưa trả tiền. Tôi dùng loại hóa đơn nào và có được chờ tiền về mới lập không? Không tính số thuế.',
 depreciation:'Tôi tính TNCN kinh doanh theo phương pháp thu nhập năm 2026. Một máy móc phục vụ cửa hàng đã khấu hao hết nhưng vẫn sử dụng. Có được tiếp tục trích khấu hao hoặc trừ lại giá mua không? Có được lấy khấu hao giảm doanh thu GTGT không? Không tính số thuế.',
 limitation:'Theo Luật Quản lý thuế 108/2025, hết thời hiệu phạt thủ tục thuế có tự hết nghĩa vụ truy thu không? Phân biệt người đã đăng ký và chưa từng đăng ký thuế, không kết luận tội phạm hay tính tiền phạt.',
};
const dir='outputs/rag-complete-review-2026-10-19';await fs.mkdir(dir,{recursive:true});
await Promise.all(Object.entries(probes).filter(([id])=>!process.argv[2]||id===process.argv[2]).map(async([id,message])=>{const start=Date.now();try{
 const res=await fetch('https://tax-hkd.pages.dev/api/chatgpt/tax-qa?nocache=1',{method:'POST',headers:{'Content-Type':'application/json','X-Test-Run':'rag-depth-'+id},body:JSON.stringify({message}),signal:AbortSignal.timeout(75000)});
 const value=await res.json();const result={http:res.status,elapsedMs:Date.now()-start,...value};
 await fs.writeFile(`${dir}/${id}-live.json`,JSON.stringify(result,null,2));
 console.log(JSON.stringify({id,http:res.status,elapsedMs:result.elapsedMs,answer:value.answer,source:value.source,decision:value.decision}));
 }catch(e){console.log(JSON.stringify({id,error:e.message}));process.exitCode=1;}}));
