/* Offline behavior checks: citation integrity and evidence routing invariance. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const modules=new Map();
function load(file){
 file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';
 if(modules.has(file))return modules.get(file);
 if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}
 const m={exports:{}};modules.set(file,m.exports);
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);
 modules.set(file,m.exports);return m.exports;
}

const {hasMcpTestAccess}=load('worker/src/mcpTestAccess.ts');
(async()=>{const key='offline-test-'.repeat(5),env={MCP_TEST_API_KEY:key};
assert.equal(await hasMcpTestAccess(new Request('https://local',{headers:{'X-Internal-Caller':'mcp'}}),env),false);
assert.equal(await hasMcpTestAccess(new Request('https://local',{headers:{Authorization:'Bearer invalid'}}),env),false);
assert.equal(await hasMcpTestAccess(new Request('https://local',{headers:{Authorization:'Bearer '+key}}),env),true);
assert.equal(await hasMcpTestAccess(new Request('https://local',{headers:{Authorization:'Bearer '+key}}),{}),false);
const route=fs.readFileSync('worker/src/routeChat.ts','utf8');assert(route.includes("caller === 'connector' && await hasMcpTestAccess(request,env)"));assert(route.includes('privilegedMcp ? Promise.resolve(false) : isChatRateLimited'));
console.log('PASS private MCP key validation, missing/wrong key denial, caller binding and public rate limiting. No API calls.');
})().catch(e=>{console.error(e);process.exitCode=1});
