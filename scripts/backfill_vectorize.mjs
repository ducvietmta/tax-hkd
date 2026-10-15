/**
 * Nạp vectors cho Vectorize index từ CANONICAL_CHUNKS (chạy 1 lần + khi KB đổi).
 * Yêu cầu env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (quyền
 * Workers AI + Vectorize), VECTORIZE_INDEX (mặc định tax-kb-v1).
 * Mỗi chunk = 1 vector, id = ref_id (routeChat map ngược bằng id này).
 *
 * Index phải tạo trước trên dashboard: dimension 1024 (bge-m3), metric cosine.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const INDEX = process.env.VECTORIZE_INDEX || 'tax-kb-v1';
if (!ACCOUNT || !TOKEN) {
  console.error('Thiếu CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN.');
  process.exit(1);
}

async function main() {
  // Đọc compiled truth (đã qua kb:check) thay vì parse lại export.
  const { execSync } = await import('node:child_process');
  const list = JSON.parse(execSync('node -e "const fs=require(\'fs\');const ts=require(\'typescript\');const js=ts.transpileModule(fs.readFileSync(\'worker/src/ragEngine.ts\',\'utf8\'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const m={exports:{}};new Function(\'module\',\'exports\',js)(m,m.exports);console.log(JSON.stringify(m.exports.CANONICAL_CHUNKS.map(c=>({id:c.ref_id||c.id,text:(c.section||\'\')+\'\\n\'+c.text.slice(0,4000)}))));"', { cwd: ROOT, encoding: 'utf8' }));
  console.log(`Nạp ${list.length} vectors vào index ${INDEX}...`);
  let ok = 0;
  for (const item of list) {
    const emb = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run/@cf/baai/bge-m3`, {
      method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: item.text }),
    }).then((r) => r.json());
    const vector = emb?.result?.data?.[0];
    if (!vector) throw new Error('embedding failed for ' + item.id);
    const up = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/vectorize/v2/indexes/${INDEX}/upsert`, {
      method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ id: item.id, values: vector, metadata: { sha: crypto.createHash('sha256').update(item.text, 'utf8').digest('hex').slice(0, 16) } }]),
    }).then((r) => r.json());
    if (!up?.success) throw new Error('upsert failed for ' + item.id + ': ' + JSON.stringify(up).slice(0, 200));
    ok++;
    if (ok % 20 === 0) console.log(`  ...${ok}/${list.length}`);
  }
  console.log(`Xong ${ok} vectors. Đặt VECTORIZE_ENABLED=1 và mở binding trong worker/wrangler.toml.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
