import fs from 'node:fs/promises';
import path from 'node:path';
const config=await fs.readFile(path.join(process.env.APPDATA,'xdg.config/.wrangler/config/default.toml'),'utf8');
const token=config.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
if(!token)throw new Error('Wrangler session unavailable');
const {account}=JSON.parse(await fs.readFile('node_modules/.cache/wrangler/wrangler-account.json','utf8'));
const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account.id}/workers/scripts/tax-agent-worker/content/v2`,{headers:{Authorization:`Bearer ${token}`}});
if(!response.ok)throw new Error(`Source download HTTP ${response.status}`);
let source;
if(response.headers.get('content-type')?.includes('multipart/')){
 const data=await response.formData();
 const parts=[];for(const [name,value]of data){if(/\.(m?js|ts)$/.test(name)|| (typeof value!=='string' && /\.(m?js|ts)$/.test(value.name)))parts.push(typeof value==='string'?value:await value.text());}
 source=parts.join('\n');
}else source=await response.text();
if(source.length<10000)throw new Error('Unexpected source format');
await fs.mkdir('outputs/legal-assurance/private',{recursive:true});
await fs.writeFile('outputs/legal-assurance/private/production-worker.js',source);
const sections=source.split(/(?=^\/\/ (?:worker\/)?src\/)/m);
console.log(JSON.stringify({downloadedBytes:source.length,sections:sections.length,assuranceAlreadyPresent:source.includes('v2.8.0-provenance-review-integrity')},null,2));
