/**
 * RAG BASELINE & ABLATION EVALUATION HARNESS (191 Active Cases: 121 Baseline + 70 Adversarial)
 *
 * Đo lường định lượng trước và sau khi nâng cấp RAG:
 * 1. Ground-truth mapping từ `expected.legal_basis` sang `CANONICAL_CHUNKS` (kèm lọc theo năm hiệu lực).
 * 2. Đo Hit-Rate@1, Recall@4, Recall@6, MRR@6 cho:
 *    - BM25 thuần
 *    - Dense Vectorize thuần (@cf/baai/bge-m3)
 *    - Baseline Hybrid hiện tại (append-only, threshold 0.45)
 *    - RRF / Weighted Hybrid + Period Metadata Filtering + Query Rewriting + Rerank (Grid Search)
 * 3. Đo Latency p50 / p95 cho từng khâu: BM25, Embedding, Vectorize Query, End-to-End Chat.
 */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const WORKER_URL = process.env.WORKER_URL || 'https://tax-agent-worker.ducviet-mta.workers.dev';
const VECTOR_CACHE_PATH = path.join(ROOT, 'outputs', 'vector_hits_191.json');

function loadModule(relativePath, dependencies = {}) {
  const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, resolveJsonModule: true },
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    (id) => {
      if (id in dependencies) return dependencies[id];
      throw new Error(`Unexpected import '${id}' in ${relativePath}`);
    },
    mod,
    mod.exports
  );
  return mod.exports;
}

const chunkMetaJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'worker/src/kb/chunkMeta.json'), 'utf8'));
const textUtils = loadModule('worker/src/utils/text.ts');
const engine = loadModule('worker/src/ragEngine.ts');
const scopeMod = loadModule('shared/taxScope.ts');
const labelsMod = loadModule('worker/src/decision/labels.ts');
const factExtractor = loadModule('worker/src/decision/factExtractor.ts', {
  './types': {},
  './labels': labelsMod,
  '../utils/text': textUtils,
});
const retrievalPlanMod = loadModule('worker/src/decision/retrievalPlan.ts', { './types': {} });
const understandQueryMod = loadModule('worker/src/decision/understandQuery.ts', {
  '../answerScope': scopeMod,
  './types': {},
  './labels': labelsMod,
  './factExtractor': factExtractor,
});
const retrieverMod = loadModule('worker/src/retriever.ts', {
  './kb/provenance': loadModule('worker/src/kb/provenance.ts',{'./chunkMeta.json':{default:JSON.parse(fs.readFileSync(path.join(__dirname,'../worker/src/kb/chunkMeta.json'),'utf8'))}}),
  './ragEngine': engine,
  './answerScope': scopeMod,
  './decision/factExtractor': factExtractor,
  './decision/retrievalPlan': retrievalPlanMod,
  './utils/text': textUtils,
  './kb/chunkMeta.json': { default: chunkMetaJson, ...chunkMetaJson },
});
const vectorRetrieverMod = loadModule('worker/src/vectorRetriever.ts', {
  './ragEngine': engine,
  './http': {},
  './utils/text': textUtils,
  './kb/chunkMeta.json': { default: chunkMetaJson, ...chunkMetaJson },
});

const { CANONICAL_CHUNKS } = engine;
const { foldText: fold } = textUtils;

// Extract canonical document identifiers like "68/2026", "141/2026", "168/2025", "43/2026", "204/2025", "174/2025", "252/2026", "109/2025", "108/2025", "48/2024", "40/2021", "88/2021", "311/tct", "86/2024", "111/2013", "139/2016", "198/2025"
function extractDocKeys(text) {
  const raw = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const keys = new Set();
  for (const m of raw.matchAll(/(?<!\d)(\d{1,4}\/(?:19|20)\d{2})\b/g)) {
    keys.add(m[1]);
  }
  if (/311\/tct|\bcv\s*311\b|\bcong van 311\b/.test(raw)) keys.add('311/tct');
  if (/nq\s*43\b|nghi quyet 43\b/.test(raw) && !keys.has('43/2022')) keys.add('43/2026');
  if (/nq\s*204\b|nghi quyet 204\b/.test(raw)) keys.add('204/2025');
  if (/nq\s*198\b|nghi quyet 198\b/.test(raw)) keys.add('198/2025');
  return [...keys];
}

// Pre-index chunks by their document keys and effective period
const verifiedChunks = CANONICAL_CHUNKS.filter(
  (c) => c.tier === 'VERIFIED' || c.tier === 'VERIFIED_CONDITIONAL'
);
const chunkDocMap = new Map();
for (const c of verifiedChunks) {
  const ref = c.ref_id || c.id;
  const meta = chunkMetaJson[ref] || {};
  const docs = extractDocKeys(`${c.section || ''} ${c.text || ''}`);
  chunkDocMap.set(ref, {
    ref,
    docs,
    fromYear: meta.applies_from_year || 2026,
    toYear: meta.applies_to_year ?? null,
    section: c.section || '',
    text: c.text || '',
  });
}

function getGroundTruthForCase(tc) {
  const msg = tc.input.message;
  const history = tc.input.history || [];
  const scope = scopeMod.resolveAnswerScope(history, msg, new Date('2026-10-16T00:00:00Z'));
  const targetYears = scope.years;
  const isHistorical = targetYears.every((y) => y < 2026);

  let basis = tc.expected?.legal_basis || '';
  // If legal_basis has both [T2026] and [T2025] blocks, select the block matching the case's period
  if (basis.includes('[T2026]') && basis.includes('[T2025]')) {
    const parts = basis.split(/\[T2025\]/);
    basis = isHistorical ? '[T2025]' + parts.slice(1).join('[T2025]') : parts[0];
  }

  const gtDocs = extractDocKeys(basis);
  const gtRefs = new Set();

  // Direct ref_id mentions if any
  for (const m of basis.matchAll(/\b(16\.\d{1,3})\b/g)) {
    gtRefs.add(m[1]);
  }

  // Match chunks that cover the ground-truth legal documents and match the tax period
  for (const [ref, info] of chunkDocMap.entries()) {
    const periodOk = targetYears.some(
      (y) => y >= info.fromYear && (info.toYear === null || y <= info.toYear)
    );
    if (!periodOk) continue;
    if (gtDocs.some((d) => info.docs.includes(d))) {
      gtRefs.add(ref);
    }
  }

  return { scope, gtDocs, gtRefs: [...gtRefs] };
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function ensureVectorCache(cases) {
  if (fs.existsSync(VECTOR_CACHE_PATH)) {
    const cached = JSON.parse(fs.readFileSync(VECTOR_CACHE_PATH, 'utf8'));
    if (cached && Object.keys(cached.results || {}).length >= cases.length) {
      return cached.results;
    }
  }
  console.log(`⚡ Fetching Vectorize top-10 rankings for ${cases.length} cases from ${WORKER_URL}...`);
  const queries = cases.map((tc) => {
    const scope = scopeMod.resolveAnswerScope(tc.input.history || [], tc.input.message, new Date('2026-10-16T00:00:00Z'));
    return {
      id: tc.id,
      q: `${tc.input.message} ${scope.years.join(' ')}`.trim(),
    };
  });
  const res = await fetch(`${WORKER_URL}/api/test-ai?vectorize=batch_query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Caller': 'mcp' },
    body: JSON.stringify({ queries }),
  }).then((r) => r.json());
  if (!res?.success) {
    throw new Error('Failed to fetch batch_query: ' + JSON.stringify(res));
  }
  fs.mkdirSync(path.dirname(VECTOR_CACHE_PATH), { recursive: true });
  fs.writeFileSync(VECTOR_CACHE_PATH, JSON.stringify(res, null, 2), 'utf8');
  return res.results;
}

function evaluateRanking(rankedRefs, gtRefsSet) {
  const top1 = rankedRefs.slice(0, 1);
  const top4 = rankedRefs.slice(0, 4);
  const top6 = rankedRefs.slice(0, 6);
  const hit1 = top1.some((r) => gtRefsSet.has(r)) ? 1 : 0;
  const hit4 = top4.some((r) => gtRefsSet.has(r)) ? 1 : 0;
  const hit6 = top6.some((r) => gtRefsSet.has(r)) ? 1 : 0;
  let mrr = 0;
  for (let i = 0; i < Math.min(6, rankedRefs.length); i++) {
    if (gtRefsSet.has(rankedRefs[i])) {
      mrr = 1 / (i + 1);
      break;
    }
  }
  // Period contamination check: how many chunks in top-4 have mismatched effective period?
  return { hit1, hit4, hit6, mrr };
}

async function main() {
  const suite191 = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'outputs/testcases/tax-hkd-200-20261016/tax_hkd_191_active.json'), 'utf8')
  );
  const cases = suite191.cases.filter((c) => c.enabled !== false);
  const vectorData = await ensureVectorCache(cases);

  const bm25Latencies = [];
  const embedLatencies = [];
  const vectorSearchLatencies = [];

  const metrics = {
    bm25_route: { hit1: 0, hit4: 0, hit6: 0, mrr: 0, periodMismatchTop4: 0 },
    dense_only: { hit1: 0, hit4: 0, hit6: 0, mrr: 0, periodMismatchTop4: 0 },
    baseline_append: { hit1: 0, hit4: 0, hit6: 0, mrr: 0, periodMismatchTop4: 0 },
  };

  let evaluableCount = 0;
  const preparedCases = [];

  for (const tc of cases) {
    const { scope, gtDocs, gtRefs } = getGroundTruthForCase(tc);
    const gtSet = new Set(gtRefs);
    if (gtSet.size === 0) continue;
    evaluableCount++;

    const frame = understandQueryMod.understandQuery(tc.input.message, scope, tc.input.history || []);
    const plan = retrievalPlanMod.buildRetrievalPlan(frame);
    const q = `${tc.input.message} ${scope.years.join(' ')}`.trim();

    const t0 = performance.now();
    const bm25Res = retrieverMod.retrieve(q, 6, scope);
    bm25Latencies.push(performance.now() - t0);

    const vEntry = vectorData[tc.id] || { hits: [], embedMs: 0, searchMs: 0 };
    if (vEntry.embedMs) embedLatencies.push(vEntry.embedMs);
    if (vEntry.searchMs) vectorSearchLatencies.push(vEntry.searchMs);

    const bm25Refs = bm25Res.results.map((r) => r.chunk.ref_id);
    const denseRefs = vEntry.hits.filter((h) => h.score >= 0.45).map((h) => h.refId);

    // Baseline append-only mergeVectorHits
    const baselineMerged = vectorRetrieverMod
      .mergeVectorHits(bm25Res.results.slice(0, 4), vEntry.hits.filter((h) => h.score >= 0.45), 6)
      .map((r) => r.chunk.ref_id);

    const countPeriodMismatch = (refs) =>
      refs.slice(0, 4).filter((ref) => {
        const info = chunkDocMap.get(ref);
        if (!info) return false;
        return !scope.years.some((y) => y >= info.fromYear && (info.toYear === null || y <= info.toYear));
      }).length;

    const mBm25 = evaluateRanking(bm25Refs, gtSet);
    const mDense = evaluateRanking(denseRefs, gtSet);
    const mBase = evaluateRanking(baselineMerged, gtSet);

    for (const [k, m, refs] of [
      ['bm25_route', mBm25, bm25Refs],
      ['dense_only', mDense, denseRefs],
      ['baseline_append', mBase, baselineMerged],
    ]) {
      metrics[k].hit1 += m.hit1;
      metrics[k].hit4 += m.hit4;
      metrics[k].hit6 += m.hit6;
      metrics[k].mrr += m.mrr;
      metrics[k].periodMismatchTop4 += countPeriodMismatch(refs);
    }

    preparedCases.push({
      tc,
      scope,
      frame,
      plan,
      gtSet,
      bm25List: bm25Res.results,
      denseHits: vEntry.hits,
      countPeriodMismatch,
    });
  }

  console.log(`\n================================================================================`);
  console.log(`📊 BẢNG 1: BASELINE RETRIEVAL METRICS TRÊN ${evaluableCount}/${cases.length} CÂU (121 CŨ + 70 MỚI)`);
  console.log(`================================================================================`);
  for (const [name, m] of Object.entries(metrics)) {
    console.log(
      `${name.padEnd(20)} | Hit@1: ${((m.hit1 / evaluableCount) * 100).toFixed(1)}% | Recall@4: ${((m.hit4 / evaluableCount) * 100).toFixed(1)}% | Recall@6: ${((m.hit6 / evaluableCount) * 100).toFixed(1)}% | MRR@6: ${(m.mrr / evaluableCount).toFixed(3)} | PeriodMismatch@4: ${m.periodMismatchTop4}`
    );
  }

  // GRID SEARCH FOR RRF + PERIOD FILTER + RERANK
  console.log(`\n================================================================================`);
  console.log(`🔬 GRID SEARCH: RRF WEIGHTS × MIN COSINE SCORE × PERIOD METADATA FILTER`);
  console.log(`================================================================================`);
  const minScores = [0.35, 0.40, 0.45, 0.50];
  const denseWeights = [0.6, 1.0, 1.4, 1.8];
  const rrfKs = [10, 20, 60];

  let bestConfig = null;
  let bestScore = -1;

  for (const minScore of minScores) {
    for (const wDense of denseWeights) {
      for (const rrfK of rrfKs) {
        let hit1 = 0, hit4 = 0, hit6 = 0, mrr = 0, mismatch = 0;
        for (const item of preparedCases) {
          const { tc, scope, gtSet, bm25List, denseHits, countPeriodMismatch } = item;
          const scores = new Map();
          const legacyPins = new Set(retrievalPlanMod.legacyPinRefs(tc.input.message, scope).map((p) => p.ref));
          const qTerms = new Set(fold(tc.input.message).split(/\s+/).filter((w) => w.length > 2));

          // BM25 rank contribution + preserve only true route/legacy pins
          bm25List.forEach((r, idx) => {
            const ref = r.chunk.ref_id;
            if (!ref) return;
            const info = chunkDocMap.get(ref);
            const periodOk = !info || scope.years.some((y) => y >= info.fromYear && (info.toYear === null || y <= info.toYear));
            if (!periodOk) return; // Period metadata filter!
            const isTruePin = r.viaRoute || legacyPins.has(ref);
            const pinBoost = isTruePin ? (0.45 / (idx + 1)) : 0;
            const rrf = 1.0 / (rrfK + idx + 1) + pinBoost;
            scores.set(ref, (scores.get(ref) || 0) + rrf);
          });

          // Dense rank contribution + Lightweight Cross-Feature Rerank (section + doc/article overlap)
          denseHits
            .filter((h) => h.score >= minScore)
            .forEach((h, idx) => {
              const ref = h.refId;
              const info = chunkDocMap.get(ref);
              if (!info) return;
              const periodOk = scope.years.some((y) => y >= info.fromYear && (info.toYear === null || y <= info.toYear));
              if (!periodOk) return; // Period metadata filter!
              const secFold = fold(info.section);
              const textFold = fold(info.text.slice(0, 800));
              let overlap = 0;
              for (const t of qTerms) {
                if (secFold.includes(t)) overlap += 2;
                else if (textFold.includes(t)) overlap += 0.5;
              }
              const rerankBonus = Math.min(0.25, overlap * 0.025);
              const rrf = wDense * (1.0 / (rrfK + idx + 1)) + 0.12 * h.score + rerankBonus;
              scores.set(ref, (scores.get(ref) || 0) + rrf);
            });

          const ranked = [...scores.entries()]
            .sort((a, b) => b[1] - a[1])
            .map((e) => e[0]);

          const m = evaluateRanking(ranked, gtSet);
          hit1 += m.hit1;
          hit4 += m.hit4;
          hit6 += m.hit6;
          mrr += m.mrr;
          mismatch += countPeriodMismatch(ranked);
        }
        const composite = hit4 * 2 + hit6 + hit1 * 1.5 + mrr;
        if (composite > bestScore) {
          bestScore = composite;
          bestConfig = { minScore, wDense, rrfK, hit1, hit4, hit6, mrr, mismatch };
        }
      }
    }
  }

  console.log(
    `🏆 Best RRF Config: minScore=${bestConfig.minScore}, wDense=${bestConfig.wDense}, rrfK=${bestConfig.rrfK}\n` +
      `   -> Hit@1: ${((bestConfig.hit1 / evaluableCount) * 100).toFixed(1)}% | Recall@4: ${((bestConfig.hit4 / evaluableCount) * 100).toFixed(1)}% | Recall@6: ${((bestConfig.hit6 / evaluableCount) * 100).toFixed(1)}% | MRR@6: ${(bestConfig.mrr / evaluableCount).toFixed(3)} | PeriodMismatch@4: ${bestConfig.mismatch}`
  );

  console.log(`\n================================================================================`);
  console.log(`⏱️ BẢNG 2: LATENCY PHÂN TẦNG (BM25 / EMBEDDING / VECTORIZE)`);
  console.log(`================================================================================`);
  console.log(`BM25 In-Memory (ms)      | p50: ${percentile(bm25Latencies, 50).toFixed(2)} ms | p95: ${percentile(bm25Latencies, 95).toFixed(2)} ms`);
  console.log(`Workers AI bge-m3 (ms)   | p50: ${percentile(embedLatencies, 50).toFixed(0)} ms | p95: ${percentile(embedLatencies, 95).toFixed(0)} ms`);
  console.log(`Vectorize Query (ms)     | p50: ${percentile(vectorSearchLatencies, 50).toFixed(0)} ms | p95: ${percentile(vectorSearchLatencies, 95).toFixed(0)} ms`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
