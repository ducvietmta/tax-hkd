const fs=require('fs');
const paths=['outputs/legal-assurance/private/production-worker.js','worker/outputs/rag-source-coverage-2026-10-22/bundle/index.js'];
const texts=paths.map(p=>fs.readFileSync(p,'utf8'));
function modules(s){const matches=[...s.matchAll(/^\/\/ ((?:worker\/)?src\/[^\n]+)\n/gm)];return new Map(matches.map((m,i)=>[m[1].replace(/^worker\//,''),s.slice(m.index+m[0].length,matches[i+1]?.index??s.length)]));}
const [a,b]=texts.map(modules);
const changes=[...b].filter(([k,v])=>a.get(k)!==v).map(([k])=>k);
const result={productionVersion:texts[0].match(/v2\.\d+\.\d+-[a-z-]+/)?.[0],localVersion:texts[1].match(/v2\.\d+\.\d+-[a-z-]+/)?.[0],productionModules:a.size,localModules:b.size,changed:changes,removed:[...a.keys()].filter(k=>!b.has(k))};
fs.writeFileSync('outputs/rag-source-coverage-2026-10-22/bundle-comparison.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
// Save only changed code modules for private inspection, never emit bundle text.
for(const name of changes.filter(n=>!n.startsWith('src/kb/')&&n!=='src/ragEngine.ts')){
 const file=name.replaceAll('/','_');fs.writeFileSync('outputs/legal-assurance/private/'+file+'.production.txt',a.get(name)||'');fs.writeFileSync('outputs/legal-assurance/private/'+file+'.local.txt',b.get(name)||'');
}
