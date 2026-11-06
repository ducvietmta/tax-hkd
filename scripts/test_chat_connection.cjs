const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file){const m={exports:{}};new Function('module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports);return m.exports;}
const {chatTransportError}=load('src/services/chatTransportError.ts');
assert(chatTransportError({name:'TypeError',message:'Load failed'},'connect').includes('NETWORK_CONNECT'));
assert(chatTransportError({name:'TypeError',message:'Load failed'},'read','test-ray').includes('STREAM_INTERRUPTED · test-ray'));
assert(!chatTransportError({message:'Failed to fetch'},'read','<bad>').includes('<bad>'));
assert.equal(chatTransportError({name:'AbortError'},'read'),'Yêu cầu đã được hủy.');
const {streamChatProgress}=load('worker/src/chatProgressStream.ts');
(async()=>{let release;const gate=new Promise(r=>release=r),tasks=[];
const response=await streamChatProgress(async notify=>{notify({stage:'received'});await gate;return Response.json({success:true,response:'Hoàn tất.'});},{waitUntil:p=>tasks.push(p)},new Headers(),10);
const reader=response.body.getReader(),decoder=new TextDecoder();let text='';while(!text.includes(': keepalive')){text+=decoder.decode((await reader.read()).value);}
assert(!text.includes('"type":"delta"'));release();while(true){const part=await reader.read();if(part.done)break;text+=decoder.decode(part.value);}assert(text.includes('"type":"done"'));await Promise.all(tasks);
console.log('PASS: heartbeat during model wait, no draft leakage, done completion; Safari network error classification and cancellation. No API.');
})().catch(e=>{console.error(e);process.exitCode=1});
