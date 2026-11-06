// Local TypeScript loader for offline tools/tests; no transpiled files are written.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
module.exports=function createLoader(overrides=new Map()){
 const cache=new Map(overrides);
 function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);
  if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}
  const m={exports:{}};cache.set(file,m.exports);
  new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id+(path.extname(id)?'':'.ts'))):require(id),m,m.exports);
  cache.set(file,m.exports);return m.exports;
 }return load;
};
