/* Import only identifiable agency contacts; preserve source values, never repair guessed addresses. */
const fs=require('node:fs'),crypto=require('node:crypto');
const input=process.argv[2];if(!input)throw Error('Usage: node scripts/import_tax_office_directory.cjs <export.json>');
const raw=fs.readFileSync(input),rows=JSON.parse(raw.toString('utf8'));
if(!Array.isArray(rows))throw Error('Expected an array');
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const skipped={},offices=new Map(),imported=new Set();let accepted=0,invalidPhones=0;
const skip=why=>{skipped[why]=(skipped[why]||0)+1;};
for(const [index,row] of rows.entries()){
 const unit=String(row.unit||'').trim(),rawName=String(row.name||'').trim();
 const name=fold(rawName)==='don vi'?unit:rawName,label=fold(name.replace(/^\([^)]*\)\s*/,''));
 if(!unit||!/^((chi )?cuc thue|thue)\b/.test(label)){skip('not_identifiable_agency');continue;}
 const email=String(row.email||'').trim();
 if(!/^[A-Z0-9._%+-]+@gdt\.gov\.vn$/i.test(email)){skip('email_missing_or_needs_review');continue;}
 const region=fold(unit).replace(/^(?:chi cuc thue|thue)\s*(?:tinh|tp|thanh pho)?\s*/,''),local=label.match(/\bco so\s+(\d+)\b/);
 // Group local branches by parent unit and number, including shortened agency names.
 const key=local?`${region}-co-so-${Number(local[1])}`:`${region}-${label}`;
 const id=key.replace(/\s+/g,'-');
 let office=offices.get(id);
 if(!office){office={id,name:local&&!label.includes(region)?`${name} · ${unit}`:name,unit,aliases:[],email:null,contacts:[]};offices.set(id,office);}
 if(!office.aliases.includes(name))office.aliases.push(name);
 const phone=String(row.phone||'').trim(),phoneDigits=phone.replace(/[\s().-]/g,'');
 const cleanPhone=(row.n_phone_variants||0)<=1&&/^(?:0\d{8,10}|\+84\d{9,10})$/.test(phoneDigits)?phone:null;
 if(phone&&!cleanPhone)invalidPhones++;
 const sources=Array.isArray(row.source_files)?row.source_files.filter(x=>typeof x==='string'):[];
 let contact=office.contacts.find(c=>c.email.toLowerCase()===email.toLowerCase()&&c.phone===cleanPhone);
 if(!contact){contact={email,phone:cleanPhone,sourceFiles:[]};office.contacts.push(contact);}
 contact.sourceFiles=[...new Set([...contact.sourceFiles,...sources])];accepted++;imported.add(index);
}
for(const office of offices.values()){
 const emails=[...new Set(office.contacts.map(c=>c.email.toLowerCase()))];
 office.email=emails.length===1?office.contacts[0].email:null;
}
const retained=rows.flatMap((row,index)=>imported.has(index)?[]:[{id:`record-${index}`,raw:row}]);
fs.mkdirSync('worker/src/data',{recursive:true});fs.writeFileSync('worker/src/data/taxDirectoryRecords.json',JSON.stringify(retained)+'\n');
const report={inputRows:rows.length,acceptedRows:accepted,retainedRows:retained.length,offices:offices.size,contacts:[...offices.values()].reduce((n,o)=>n+o.contacts.length,0),skipped,invalidPhones,sourceSha256:crypto.createHash('sha256').update(raw).digest('hex')};
fs.writeFileSync('shared/taxOfficeDirectory.json',JSON.stringify({version:'2026-10-23-import',source:'danhba_rag_export.json',quality:'Imported user-provided directory; not independently reverified.',...report,offices:[...offices.values()]},null,2)+'\n');
fs.mkdirSync('outputs/tax-office-directory',{recursive:true});fs.writeFileSync('outputs/tax-office-directory/import-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
