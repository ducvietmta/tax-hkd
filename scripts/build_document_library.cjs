const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const docs=JSON.parse(fs.readFileSync('src/data/legalDocuments.json','utf8'));
const entries=[];
for(const name of fs.readdirSync('document_library').filter(n=>n.endsWith('.md')&&n!=='README.md').sort()){
 const id=name.slice(0,-3),doc=docs.find(d=>d.id===id);if(!doc)throw Error('Unknown document ID: '+id);
 const markdown=fs.readFileSync(path.join('document_library',name),'utf8').replace(/^\uFEFF/,'').trim();
 if(!markdown||markdown.length>2000000)throw Error('Empty or oversized Markdown: '+id);
 // PDF conversions may contain only an export heading and source attribution.
 const body=markdown.includes('\n---')?markdown.slice(markdown.indexOf('\n---')+4).trim():markdown.replace(/^#.*$/gm,'').trim();
 if(!body)throw Error('Missing document body: '+id);
 const sections=[];let title='Mở đầu',lines=[];const flush=()=>{const text=lines.join('\n').trim();if(text)sections.push({id:'S'+(sections.length+1),title,text});lines=[];};
 for(const line of markdown.split(/\r?\n/)){
   // Preserve every source line. Recognize plain OCR article/chapter headings
   // for navigation; this does not verify their legal meaning or validity.
   const h=/^#{1,6}\s+(.+)$/.exec(line);
   const legal=/^\s*((?:Điều\s+\d+[a-zđ]?\s*[.:]|Chương\s+[IVXLCDM\d]+\b|CHƯƠNG\s+[IVXLCDM\d]+\b).*)$/u.exec(line);
   if(h||legal){flush();title=(h?h[1]:legal[1]).trim().slice(0,180);}
   // Bound each navigation section so three adjacent sections fit the existing
   // 80k context cap. Split at source line boundaries; never drop trailing text.
   if(lines.length&&lines.join('\n').length+line.length+1>24000){const previous=title;flush();title=previous+' (tiếp)';}
   lines.push(line);
 }flush();
 entries.push({id,code:doc.code,title:doc.title,version:crypto.createHash('sha256').update(markdown).digest('hex').slice(0,16),sections});
}
fs.writeFileSync('worker/src/data/documentLibrary.json',JSON.stringify(entries,null,2)+'\n');console.log('Document Markdown indexed:',entries.length);
