const fs=require('node:fs');
const phase=process.argv[2],base=process.argv[3]||'https://tax-hkd.pages.dev';
const scenario=process.argv[4]||'payment';
const questions={payment:'Tôi đã nộp trùng tiền thuế, tiền ngân hàng đã trừ nhưng vẫn còn treo nợ. Tôi cần đối soát chứng từ gì?',portal:'Tôi đăng nhập cổng thuế bằng VNeID, quét QR xong lại quay về màn hình đăng nhập và báo hết phiên. Tôi cần kiểm tra thao tác nào?',registration:'Tôi đăng ký hộ kinh doanh lần đầu thì nộp hồ sơ tại cơ quan nào?'};
if(!questions[scenario])throw Error('Unknown smoke scenario.');
const label=phase+(scenario==='payment'?'':'-'+scenario);
if(!['before','after'].includes(phase))throw Error('Use before or after.');
const dir='outputs/case-recognition-activation-2026-10-24';fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const h=await fetch(new URL('/api/health',base),{signal:AbortSignal.timeout(20000)});if(!h.ok)throw Error('HEALTH_HTTP_'+h.status);
 const health=await h.json();fs.writeFileSync(dir+'/'+label+'-health.json',JSON.stringify(health,null,2));
 if(phase==='after'&&(health.caseRecognition?.mode!=='on'||!health.caseRecognition?.strict||health.caseRecognition?.approvedDescriptors!==829||health.caseRecognition?.invalid))throw Error('ACTIVATION_HEALTH_MISMATCH');
 const start=performance.now();
 const res=await fetch(new URL('/mcp',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'case-recognition-activation-'+label,method:'tools/call',params:{name:'ask_tax_ai',arguments:{question:questions[scenario]}}}),signal:AbortSignal.timeout(180000)});
 const body=await res.json(),out=body.result?.structuredContent;
 const report={phase,scenario,endpoint:base,http_status:res.status,duration_ms:performance.now()-start,result:body};
 fs.writeFileSync(dir+'/'+label+'-smoke.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({phase,http_status:res.status,duration_ms:report.duration_ms,health:health.caseRecognition,answer_review:out?.answerReview,source:out?.source,trace:out?.retrieval?.caseRecognition,error:body.error},null,2));
 if(phase==='after'){
  if(!out)throw Error('NO_STRUCTURED_ANSWER');
  const text=JSON.stringify(out);
  if(/CASE_EVIDENCE|KB\/(?:0[1-9]|1[01])-|facebook\.com/i.test((out.answer||'')+' '+JSON.stringify(out.citations||[])))throw Error('CASE_LEAK');
  if(out.answerReview?.status==='PASS'&&!out.retrieval?.caseRecognition?.final?.gate?.ok)throw Error('RELEASE_WITHOUT_SOURCE_GATE');
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
