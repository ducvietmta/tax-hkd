const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();function load(file){file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const value=JSON.parse(fs.readFileSync(file,'utf8'));return {default:value,...value};}const m={exports:{}};cache.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>id==='./firebaseAuth'?{verifiedFirebasePhone:async()=>'+84000000000'}:id==='./rateLimit'?{isChatRateLimited:async()=>false}:load(path.resolve(path.dirname(file),id)),m,m.exports);cache.set(file,m.exports);return m.exports;}
const directory=JSON.parse(fs.readFileSync('shared/taxOfficeDirectory.json','utf8'));
const {officeCandidates,contactCandidates,directoryCandidates}=load('worker/src/taxOfficeLookup.ts'),{handleRegistrationOffice:handle}=load('worker/src/registrationOffice.ts');
const retained=JSON.parse(fs.readFileSync('worker/src/data/taxDirectoryRecords.json','utf8'));
assert.equal(retained.length,9993);assert.equal(retained.length+directory.acceptedRows,directory.inputRows,'Every input row must be retained');
const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
const person=retained.find(r=>r.raw.name?.includes(' ')&&!/\d/.test(r.raw.name)&&!fold(r.raw.name).startsWith('thue')&&r.raw.email?.endsWith('@gdt.gov.vn')&&r.raw.unit?.includes('TỈNH'));
assert(person);const nameQuery=person.raw.name+' '+person.raw.unit;
for(const query of [nameQuery,fold(nameQuery)])assert(contactCandidates([query]).some(c=>c.id===person.id),'Name plus province, with and without accents');
const selected=directoryCandidates([nameQuery]).find(c=>c.id===person.id);assert(selected);assert.equal(selected.responsibilityKnown,false);assert.equal(selected.unit,person.raw.unit);
assert.equal(selected.contacts[0].email,person.raw.email.trim());
assert(directoryCandidates([nameQuery]).length<=24,'Do not send the full retained directory to the model');
const nameGroups=new Map();for(const r of retained){if(!r.raw.name||/\d/.test(r.raw.name))continue;const key=fold(r.raw.name);const group=nameGroups.get(key)||[];group.push(r);nameGroups.set(key,group);}
const duplicate=[...nameGroups.values()].find(g=>g.length===2&&new Set(g.map(r=>r.raw.unit)).size===2&&g[0].raw.name.split(' ').length>=3);
assert(duplicate);const alternatives=contactCandidates([duplicate[0].raw.name]);for(const entry of duplicate)assert(alternatives.some(c=>c.id===entry.id),'Keep same-name alternatives across provinces');
assert(directory.offices.length>1);assert.equal(new Set(directory.offices.map(o=>o.id)).size,directory.offices.length);
for(const office of directory.offices){assert(office.contacts.length);for(const contact of office.contacts){assert.match(contact.email,/^[A-Z0-9._%+-]+@gdt\.gov\.vn$/i);assert(contact.sourceFiles.length);if(contact.phone)assert.match(contact.phone.replace(/[\s().-]/g,''),/^(?:0\d{8,10}|\+84\d{9,10})$/);}const unique=new Set(office.contacts.map(c=>c.email.toLowerCase()));assert.equal(!!office.email,unique.size===1);}
const hn=officeCandidates(['Thuế cơ sở 25 Hà Nội']);assert.equal(hn.length,1);assert.equal(hn[0].id,'ha-noi-co-so-25');
assert(officeCandidates(['Thuế cơ sở 1']).length>1,'A branch number alone must preserve locality alternatives');
const original=global.fetch;let calls=0,prompt='',result;
global.fetch=async(url,init)=>{calls++;assert.equal(url,'https://api.meta.ai/v1/responses');const body=JSON.parse(init.body);prompt=body.instructions;return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]});};
async function request(answers){return handle(new Request('https://test.local/api/registration-guide/office',{method:'POST',body:JSON.stringify({answers})}),{MUSE_API_KEY:'MOCK'}, {},new Headers());}
(async()=>{
 result={status:'matched',officeId:hn[0].id,email:'invented@example.test'};
 const found=await(await request(['Thuế cơ sở 25 Hà Nội'])).json();assert.equal(found.status,'matched');assert.deepEqual(found.office.contacts,hn[0].contacts);assert.notEqual(found.office.email,result.email);
 for(const contact of directory.offices.flatMap(o=>o.contacts))assert(!prompt.includes(contact.email),'Email addresses must not be sent to the LLM');
 assert(prompt.length<2000,'A named branch and locality should use a small candidate prompt');
 result={status:'clarify',question:'Thuế cơ sở 1 thuộc tỉnh/thành phố nào?'};assert.equal((await(await request(['Thuế cơ sở 1'])).json()).status,'clarify');
 result={status:'not_found'};assert.equal((await(await request(['Không rõ cơ quan'])).json()).status,'not_found');
 result={status:'matched',officeId:person.id};const foundPerson=await(await request([nameQuery])).json();assert.equal(foundPerson.office.recordType,'CONTACT');assert.equal(foundPerson.office.responsibilityKnown,false);assert.deepEqual(foundPerson.office.contacts,selected.contacts);assert(!prompt.includes(person.raw.email));
 result={status:'matched',officeId:directory.offices.find(o=>o.id!==hn[0].id).id};assert.equal((await request(['Thuế cơ sở 25 Hà Nội'])).status,503,'Reject a selected ID outside retrieved candidates');
 assert.equal(calls,5);console.log(`PASS: ${directory.offices.length} offices + ${retained.length} retained rows; accent-insensitive name/province search; same-name alternatives; source-bound contacts; candidate integrity; bounded prompt. Real API calls: 0.`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{global.fetch=original;});
