/**
 * Nạp vectors cho Vectorize index từ CANONICAL_CHUNKS (chạy 1 lần + khi KB đổi).
 * Mặc định sử dụng native Workers AI + Vectorize binding trên Worker đã deploy
 * (không cần CLOUDFLARE_API_TOKEN thủ công), hoặc dùng REST API nếu truyền
 * CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN.
 */
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const INDEX = process.env.VECTORIZE_INDEX || 'tax-kb-v1';
export const INDEX_VERSION = 'tax-kb-v1-bge-m3-1024';
const WORKER_URL = process.env.WORKER_URL || 'https://tax-agent-worker.ducviet-mta.workers.dev';

async function main() {
  if (!ACCOUNT || !TOKEN) {
    console.log(`⚡ Nạp vectors qua native Worker binding (${WORKER_URL})...`);
    const res = await fetch(`${WORKER_URL}/api/test-ai?vectorize=backfill`, {
      method: 'POST',
      headers: { 'X-Internal-Caller': 'mcp' },
    }).then((r) => r.json());
    if (!res?.success) {
      throw new Error('Worker backfill failed: ' + JSON.stringify(res));
    }
    console.log(`✅ Đã nạp thành công ${res.upserted}/${res.totalChunks} vectors vào index '${res.index}'.`);

    const probe = await fetch(
      `${WORKER_URL}/api/test-ai?vectorize=query&q=${encodeURIComponent('Doanh thu trên 3 tỷ tính thuế TNCN theo thu nhập tính thuế 17%')}`,
      { headers: { 'X-Internal-Caller': 'mcp' } }
    ).then((r) => r.json());
    console.log(`🔍 Kiểm thử truy vấn Vectorize:`, JSON.stringify(probe, null, 2));
    return;
  }

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
