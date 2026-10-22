const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const dir='outputs/prompt-retest-49-2026-10-22';
if(fs.existsSync(dir+'/answer-freeze.json'))throw Error('Already frozen; create a new experiment to change answers');
const m={exports:{}};new Function('module','exports',ts.transpileModule(fs.readFileSync('worker/src/decision/arithmetic.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports);
const manifest=JSON.parse(fs.readFileSync(dir+'/capture-manifest.json','utf8')),authored=JSON.parse(fs.readFileSync(dir+'/authored-answers.json','utf8'));
assert.equal(Object.keys(authored).length,manifest.cases.length);
const rows=[];
for(const c of manifest.cases){
 const p=JSON.parse(fs.readFileSync(dir+'/prompts/'+c.id+'.json','utf8')),instruction=p.requests[0].instructions;
 const idMap=new Map([...instruction.matchAll(/evidence_id=(E\d+); ref_id=([\d.]+)/g)].map(x=>[x[2],x[1]]));
 assert(authored[c.id]);
 // Author chose source refs; bind them to this prompt's actual passage IDs.
 const withIds=authored[c.id].replace(/\[\[CALC:(\{[^\r\n]*?\})\]\]/g,(_,json)=>{const spec=JSON.parse(json);spec.evidence_ids=spec.evidence_ids.map(ref=>{assert(idMap.has(ref),`${c.id}: unavailable source ${ref}`);return idMap.get(ref);});return '[[CALC:'+JSON.stringify(spec)+']]';});
 const computed=m.exports.resolveCalculations(withIds,[...idMap.values()]);assert.deepEqual(computed.issues,[],c.id);
 rows.push({id:c.id,input:p.input,answer:computed.text,calculations:computed.records,providedRefs:[...idMap.keys()],promptSha256:c.hash,answerOrigin:'CODEX_OFFLINE_PROMPT_REPLAY',classification:p.classification});
}
fs.writeFileSync(dir+'/answers.json',JSON.stringify(rows,null,2));
const files=['authored-answers.json','answers.json','capture-manifest.json'].map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(dir+'/'+file)).digest('hex')}));
fs.writeFileSync(dir+'/answer-freeze.json',JSON.stringify({frozenAt:new Date().toISOString(),files,scope:'Answer integrity checkpoint before per-case comparison. Not blind/independent: author already knows previous defects and worked on their fixes.',networkAiCalls:0},null,2));
console.log(JSON.stringify({answers:rows.length,calculations:rows.reduce((n,r)=>n+r.calculations.length,0),frozen:true,folder:path.resolve(dir)}));
