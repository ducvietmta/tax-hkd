// Local isolated component harness. No auth changes, credits or live model calls.
const {createRequire}=require('node:module');
const bundled=createRequire('C:/Users/engin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=bundled('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises');
const path=require('node:path'),http=require('node:http');
(async()=>{
 await require('esbuild').build({entryPoints:['outputs/mobile-registration/entry.tsx'],bundle:true,jsx:'automatic',loader:{'.css':'empty'},outfile:'outputs/mobile-registration/fixture-bundle.js'});
 const css=(await fs.readdir('dist/assets')).filter(file=>/^index-.*\.css$|^TaxRegistrationPage-.*\.css$/.test(file));
 const fixture=(await fs.readFile('outputs/mobile-registration/fixture.html','utf8')).replace(/<script type="module">[\s\S]*?<\/script>/,'<script src="/fixture-bundle.js"></script>').replace('</head>',css.map(file=>`<link rel="stylesheet" href="/assets/${file}">`).join('')+'</head>');
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fixture);return;}
   let file;
   if(url.pathname==='/fixture-bundle.js')file='outputs/mobile-registration/fixture-bundle.js';
   else if(url.pathname.startsWith('/assets/')&&!url.pathname.includes('..'))file='dist'+url.pathname;
   else if(url.pathname.startsWith('/images/registration/')&&!url.pathname.includes('..'))file='public'+url.pathname;
   else {res.statusCode=404;res.end();return;}
   const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.png':'image/png','.gif':'image/gif'})[ext]||'application/octet-stream');res.end(await fs.readFile(file));
  }catch{res.statusCode=404;res.end();}
 });
 await new Promise(resolve=>server.listen(4176,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const report=[];
  for(const width of [320,390,430,768,1024,1440]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:width<768,hasTouch:width<1024});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/api/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"Local layout test"}'}));
   await page.goto('http://127.0.0.1:4176/',{waitUntil:'domcontentloaded'});
   await page.getByRole('heading',{name:'Bạn muốn chuẩn bị thủ tục nào?'}).waitFor();
   const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   assert.equal(await overflow(),false,`Initial overflow at ${width}`);
   if(width===390)await page.screenshot({path:'outputs/mobile-registration/start-390.png',fullPage:true});
   await page.getByRole('button',{name:'Cá nhân kinh doanh Đăng ký thuế trực tiếp với cơ quan thuế',exact:true}).click();
   await page.getByRole('button',{name:/Nộp online qua Web/}).click();
   await page.locator('#rw-answer-input').waitFor();
   if(width<640)assert.equal(await page.locator('#rw-answer-input').evaluate(el=>getComputedStyle(el).fontSize),'16px');
   assert.equal(await overflow(),false,`Activity overflow at ${width}`);
   if(width<1024){
    await page.getByRole('button',{name:'Hình ảnh',exact:true}).click();
    assert.equal(await page.getByRole('region',{name:'Hội thoại đăng ký',exact:true}).isVisible(),false);
    await page.getByRole('button',{name:/Phóng to ảnh bước/}).click();
    assert.equal(await page.locator('dialog[open]').count(),1);
    if(width<640){
     const stage=page.locator('.rw-image-stage');
     assert(await stage.evaluate(el=>el.scrollWidth>el.clientWidth),'Full-size image must scroll within dialog');
     await page.screenshot({path:`outputs/mobile-registration/image-${width}.png`});
    }
    await page.getByRole('button',{name:'Đóng ảnh ×',exact:true}).click();
    await page.getByRole('button',{name:'Hỏi đáp',exact:true}).click();
    assert.equal(await page.locator('.rw-images').isVisible(),false);
   }else{
    assert(await page.locator('.rw-chat').isVisible());assert(await page.locator('.rw-images').isVisible());
   }
   await page.locator('#rw-answer-input').fill('Trồng lúa và tiếp thị liên kết');
   await page.locator('.rw-conversation form button[type=submit]').click();
   await page.locator('#rw-industry').waitFor();
   assert.equal(await overflow(),false,`Catalogue overflow at ${width}`);
   if(width===390){
    await page.screenshot({path:'outputs/mobile-registration/industry-390.png',fullPage:true});
    await page.locator('#rw-industry').fill('0111');
    await page.locator('.rw-conversation button[aria-pressed]').filter({hasText:'0111'}).click();
    await page.getByRole('button',{name:'Xác nhận các ngành đã chọn',exact:true}).click();
    await page.getByRole('button',{name:'Hình ảnh',exact:true}).click();
    await page.locator('.rw-tax-online-select select').selectOption('7');
    const context=page.locator('.rw-tax-online aside[aria-label="Hướng dẫn theo ngành đã xác nhận"]').first();
    assert(await context.isVisible());assert((await context.innerText()).includes('0111'));
    assert((await context.innerText()).includes('bắt buộc đăng ký hộ kinh doanh hoặc doanh nghiệp'));
    assert.equal(await overflow(),false);
    await page.screenshot({path:'outputs/mobile-registration/eligibility-390.png',fullPage:true});
   }
   assert.deepEqual(errors,[],`Runtime errors at ${width}`);
   report.push({width,overflow:false,errors});await page.close();
  }
  const app=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await app.goto('http://127.0.0.1:4176/',{waitUntil:'domcontentloaded'});
  await app.getByRole('button',{name:'Cá nhân kinh doanh Đăng ký thuế trực tiếp với cơ quan thuế',exact:true}).click();
  await app.getByRole('button',{name:/Nộp online qua App/}).click();
  await app.getByRole('button',{name:'Hình ảnh',exact:true}).click();
  assert(await app.locator('.rw-tax-app').isVisible());
  assert.equal(await app.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await app.getByRole('button',{name:/Phóng to ảnh bước/}).click();
  assert.equal(await app.locator('dialog[open]').count(),1);
  assert(await app.locator('dialog[open] img').evaluate(el=>el.getBoundingClientRect().width<=innerWidth));
  await app.screenshot({path:'outputs/mobile-registration/app-390.png'});await app.close();
  await fs.writeFile('outputs/mobile-registration/layout-check.json',JSON.stringify({checks:report,app390:true,liveApiCalls:0},null,2));
  console.log('PASS: six widths; web guide tabs, image dialog, 16px mobile input, catalogue and no horizontal overflow. Isolated component, API mocked.');
 }finally{await browser.close();server.closeAllConnections();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
