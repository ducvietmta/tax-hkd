// Offline regressions. Run in the isolated sandbox, with dummy identities only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');
const { EventEmitter } = require('node:events');
const modules = new Map();
const mocks = new Map();
function load(file) {
  file = path.resolve(file);
  if (!path.extname(file)) {
    file += mocks.has(file + '.tsx') || (!fs.existsSync(file + '.ts') && fs.existsSync(file + '.tsx')) ? '.tsx' : '.ts';
  }
  if (mocks.has(file)) return mocks.get(file);
  if (modules.has(file)) return modules.get(file);
  const m = { exports: {} };
  modules.set(file, m.exports);
  const source = fs.readFileSync(file, 'utf8').replace(/import\.meta/g,
    `({env:{},url:${JSON.stringify(require('node:url').pathToFileURL(file).href)}})`);
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const resolve = id => {
    if (mocks.has(id)) return mocks.get(id);
    if (id.startsWith('.')) return load(path.resolve(path.dirname(file), id));
    return require(id);
  };
  new Function('require', 'module', 'exports', code)(resolve, m, m.exports);
  return m.exports;
}
const mock = (file, value) => mocks.set(path.resolve(file), value);
const phone = '0900000000';
mock('worker/src/firebaseAuth.ts', { verifiedFirebasePhone: async () => phone });
global.fetch = async () => { throw Error('External network forbidden'); };

const routes = load('worker/src/routesAuth.ts');
function fixture(credits) {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync('d1/schema.sql', 'utf8'));
  db.prepare('INSERT INTO users(id,phone,credits) VALUES(?,?,?)').run('dummy', phone, credits);
  let failComplete = false;
  let beforeBatch;
  const prepare = (sql, args = []) => ({ sql, args,
    bind: (...values) => prepare(sql, values),
    first: async () => db.prepare(sql).get(...args) || null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => ({ meta: db.prepare(sql).run(...args) }),
  });
  const DB = { prepare, batch: async rows => {
    if (beforeBatch) { const f = beforeBatch; beforeBatch = null; f(); }
    db.exec('BEGIN IMMEDIATE');
    try {
      const results = rows.map((row, i) => {
        if (failComplete && i === 2) throw Error('Injected completion failure');
        return { results: db.prepare(row.sql).all(...row.args) };
      });
      db.exec('COMMIT');
      return results;
    } catch (e) { db.exec('ROLLBACK'); throw e; }
  } };
  return { db, DB, balance: () => db.prepare('SELECT credits FROM users').get().credits,
    count: () => db.prepare('SELECT COUNT(*) AS n FROM transactions').get().n,
    setBeforeBatch: fn => { beforeBatch = fn; }, fail: () => { failComplete = true; } };
}
async function purchase(f, amount = 10, notes = 'unlock_guide_individual') {
  const request = new Request('https://dummy.test/api/user/credits/consume', {
    method: 'POST', body: JSON.stringify({ phone, amount, notes }),
  });
  return routes.handleConsumeCredit(request, { DB: f.DB }, new Headers());
}
async function testPurchases() {
  const f = fixture(0);
  for (const amount of [0, 0.5, -1, 1, 9, 11, '10', null]) {
    assert.equal((await purchase(f, amount)).status, 400);
  }
  assert.equal((await purchase(f, 10, 'unlock_guide_unknown')).status, 400);
  assert.equal((await purchase(f, 10, 'unlock_guide_individual ')).status, 400);
  assert.equal((await purchase(f)).status, 403);
  assert.equal(f.count(), 0);
  assert.equal((await routes.handleConsumeCredit(new Request('https://dummy.test', {
    method: 'POST', body: JSON.stringify({ phone, amount: 10, notes: 'unlock_guide_individual' }),
  }), {}, new Headers())).status, 503);

  const normal = fixture(20);
  const responses = await Promise.all(Array.from({ length: 8 }, () => purchase(normal)));
  assert(responses.every(r => r.status === 200));
  assert.equal(normal.balance(), 10);
  assert.equal(normal.count(), 1, 'repeat purchase must not double charge');
  assert.equal(normal.db.prepare('SELECT payment_method FROM transactions').get().payment_method, 'guide_purchase_v1');

  const race = fixture(10);
  race.setBeforeBatch(() => race.db.prepare('UPDATE users SET credits=credits-1 WHERE phone=? AND credits>0').run(phone));
  assert.equal((await purchase(race)).status, 403, 'chat reservation wins; full-price purchase must fail');
  assert.equal(race.balance(), 9);
  assert.equal(race.count(), 0);
  const competing = fixture(10);
  const r = await Promise.all([purchase(competing), purchase(competing, 10, 'unlock_guide_household')]);
  assert.deepEqual(r.map(x => x.status).sort(), [200, 403]);
  assert.equal(competing.balance(), 0);
  assert.equal(competing.count(), 1);
  const reverse = fixture(10);
  assert.equal((await purchase(reverse)).status, 200);
  assert.equal(reverse.db.prepare('UPDATE users SET credits=credits-1 WHERE credits>0 RETURNING credits').get(), undefined);

  const failed = fixture(10);
  failed.fail();
  assert.equal((await purchase(failed)).status, 503);
  assert.equal(failed.balance(), 10, 'completion failure must roll back debit');
  assert.equal(failed.count(), 0, 'completion failure must roll back pending receipt');

  const receipts = fixture(0);
  const insert = receipts.db.prepare("INSERT INTO transactions(id,user_phone,credits,payment_method,status,notes) VALUES(?,?,?,?,'completed',?)");
  insert.run('free', phone, 0, 'credits_consume', 'unlock_guide_individual');
  insert.run('wrongmethod', phone, -10, 'system_welcome', 'unlock_guide_individual');
  insert.run('unknown', phone, -10, 'credits_consume', 'unlock_guide_unknown');
  const profile = () => routes.handleUserProfile({ DB: receipts.DB }, new Headers(), new URL(`https://dummy.test?phone=${phone}`));
  assert.deepEqual((await (await profile()).json()).user.unlockedGuides, []);
  insert.run('legit', phone, -10, 'credits_consume', 'unlock_guide_household');
  assert.deepEqual((await (await profile()).json()).user.unlockedGuides, ['household']);
  assert.deepEqual((await (await routes.handleAuthSession(new Request('https://dummy.test'), { DB: receipts.DB }, new Headers())).json()).user.unlockedGuides, ['household']);
  console.log('PASS purchase: price tampering, insufficient funds, duplicate/different guides, chat interleaving, rollback and legacy receipt filtering');
}

async function testBridge() {
  const { allowDevBridgeRequest } = load('scripts/devBridgeAccess.ts');
  const base = () => ({ socket: { remoteAddress: '127.0.0.1', localAddress: '127.0.0.1', localPort: 5173 },
    headers: { host: 'localhost:5173', origin: 'http://localhost:5173', 'x-tax-dev-bridge': 'local', 'sec-fetch-site': 'same-origin' } });
  assert.equal(allowDevBridgeRequest(base(), true), true);
  for (const mutate of [r => r.socket.remoteAddress = '192.0.2.1', r => r.socket.localAddress = '192.0.2.2',
    r => r.headers.host = 'attacker.test:5173', r => r.headers.host = 'localhost:5174',
    r => r.headers.origin = 'https://attacker.test', r => delete r.headers.origin,
    r => delete r.headers['x-tax-dev-bridge'], r => r.headers['sec-fetch-site'] = 'cross-site',
    r => r.headers.host = 'localhost@attacker.test:5173']) {
    const req = base(); mutate(req); assert.equal(allowDevBridgeRequest(req, true), false);
  }
  const ipv6 = base(); ipv6.socket.remoteAddress = ipv6.socket.localAddress = '::1';
  ipv6.headers.host = '[::1]:5173'; ipv6.headers.origin = 'http://[::1]:5173';
  assert.equal(allowDevBridgeRequest(ipv6, true), true);
  const calls = [];
  mocks.set('vite', { defineConfig: x => x });
  mocks.set('@vitejs/plugin-react', () => ({}));
  mocks.set('@tailwindcss/vite', () => ({}));
  mocks.set('fs', { existsSync: () => false });
  mocks.set('http', { request: (_options, callback) => {
    const req = new EventEmitter();
    req.write = value => calls.push(JSON.parse(value));
    req.destroy = () => {};
    req.end = () => queueMicrotask(() => {
      const res = new EventEmitter(); callback(res);
      res.emit('data', JSON.stringify({ result: { content: [{ text: 'Dummy tax answer' }] } })); res.emit('end');
    });
    return req;
  } });
  process.env.AI_BRIDGE_TOKEN = 'dummy-offline-token';
  const config = load('vite.config.ts').default;
  assert.equal(config.server.host, '127.0.0.1');
  assert.notEqual(config.server.allowedHosts, true);
  const handlers = {};
  config.plugins.find(p => p.name === 'ai-chat-bridge-middleware').configureServer({ middlewares: { use: (route, handler) => { handlers[route] = handler; } } });
  async function invoke(route, values, body) {
    const req = Object.assign(new EventEmitter(), values);
    let done;
    const result = new Promise(resolve => { done = resolve; });
    const res = { statusCode: 200, setHeader() {}, end: data => done({ status: res.statusCode, data }) };
    await handlers[route](req, res);
    if (body) { req.emit('data', JSON.stringify(body)); req.emit('end'); }
    return result;
  }
  for (const route of ['/api/bridge-query', '/api/bridge-status']) {
    const req = base(); req.socket.remoteAddress = '192.0.2.1'; req.method = route.endsWith('status') ? 'GET' : 'POST';
    assert.equal((await invoke(route, req)).status, 403);
  }
  assert.equal(calls.length, 0, 'denied caller must not use host token/bridge');
  const allowed = base(); allowed.method = 'POST';
  assert.equal((await invoke('/api/bridge-query', allowed, { question: 'Ke khai thue nhu the nao?' })).status, 200);
  assert.deepEqual(calls.map(c => c.params.name), ['send_message', 'wait_response']);
  console.log('PASS bridge: loopback/Host/Origin/header admission and real middleware delegation only to a fake bridge');
}

async function testClientFailure() {
  mock('src/services/firebase.ts', { auth: { currentUser: { getIdToken: async () => 'dummy' } } });
  const { CloudflareApi } = load('src/services/api.ts');
  const result = await CloudflareApi.consumeCredit(phone, 10, 'unlock_guide_individual');
  assert.equal(result.success, false, 'network failure must never grant a purchase');
  console.log('PASS client: failed transport cannot report a successful purchase');
}

// A deterministic hook lifecycle fixture, not a full browser emulation.
let current;
function harness(component, props) {
  const states = [], effects = [];
  let cursor, pending, tree;
  const h = {
    state(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    ref(initial) { const i = cursor++; if (!(i in states)) states[i] = { current: initial }; return states[i]; },
    effect(fn, deps) { const i = cursor++; const previous = effects[i];
      if (!previous || deps.some((d, j) => !Object.is(d, previous.deps[j]))) pending.push(() => { previous?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; }); },
    render(next = props) { props = next; cursor = 0; pending = []; current = h; tree = component(props); current = null; pending.forEach(f => f()); return tree; },
    unmount() { effects.forEach(e => e?.cleanup?.()); },
  };
  return h;
}
async function testHistory() {
  const jsx = (type, props, key) => ({ type, props: props || {}, key });
  mocks.set('react/jsx-runtime', { jsx, jsxs: jsx });
  mocks.set('react', { useState: x => current.state(x), useRef: x => current.ref(x), useEffect: (f, d) => current.effect(f, d) });
  mocks.set('framer-motion', { motion: new Proxy({}, { get: (_, key) => key }), AnimatePresence: 'presence' });
  mocks.set('lucide-react', new Proxy({}, { get: (_, key) => key }));
  let identity = { user: { uid: 'A', phone: '0900000000' }, isAuthenticated: true };
  const pending = [];
  mock('src/context/AuthContext.tsx', { useAuth: () => identity });
  mock('src/services/api.ts', { CloudflareApi: {
    getChatHistory: (phone, signal) => new Promise(resolve => pending.push({ phone, signal, resolve })),
  } });
  const cache = new Map();
  global.localStorage = { getItem: key => cache.get(key) || null, setItem: (k, v) => cache.set(k, v), removeItem: k => cache.delete(k) };
  const { HistoryModal } = load('src/components/HistoryModal.tsx');
  const props = { isOpen: true, onClose() {} };
  const wrapper = harness(HistoryModal, props);
  const a = wrapper.render();
  const sessionA = harness(a.type, a.props); sessionA.render();
  assert.equal(pending.length, 1);
  sessionA.render({ ...a.props, isOpen: false });
  identity = { user: null, isAuthenticated: false };
  const loggedOut = wrapper.render(); assert.notEqual(loggedOut.key, a.key);
  sessionA.unmount(); cache.clear();
  identity = { user: { uid: 'B', phone: '0900000001' }, isAuthenticated: true };
  const b = wrapper.render(); assert.notEqual(a.key, b.key);
  const sessionB = harness(b.type, b.props); sessionB.render();
  assert.equal(pending.length, 2);
  assert.equal(pending[0].signal.aborted, true);
  // Deliberately ignore transport abort: the response commit must still be gated.
  pending[0].resolve({ success: true, history: [{ id: 'A', message: 'A_PRIVATE', response: 'A_SECRET' }] });
  await Promise.resolve(); await Promise.resolve();
  assert.equal(JSON.stringify(sessionB.render()).includes('A_PRIVATE'), false);
  assert.equal(cache.has('tax_chat_history_0900000000'), false);
  pending[1].resolve({ success: true, history: [{ id: 'B', message: 'B_OWN', response: 'B_ANSWER', created_at: '2026-01-01' }] });
  await Promise.resolve(); await Promise.resolve();
  assert.equal(JSON.stringify(sessionB.render()).includes('B_OWN'), true);
  sessionB.unmount();
  console.log('PASS history: account-key remount, abort, delayed A response ignored after B login, no stale cache recreation');
  mock('src/features/registration/RegistrationWizard.tsx', { default: () => null });
  mock('src/components/RegistrationConfirmModal.tsx', { RegistrationConfirmModal: () => null });
  identity = { user: { uid: 'B', phone: '0900000001', role: 'user', unlockedGuides: [] }, isAuthenticated: true };
  cache.set('taxhkd_unlocked_guides_0900000001', JSON.stringify(['individual']));
  const page = harness(load('src/features/registration/TaxRegistrationPage.tsx').default, {});
  let view = page.render();
  assert.equal(view.props.children[1].props.onBeforeSelectKind('individual'), false, 'forged/old local unlock must not bypass purchase');
  identity.user = { ...identity.user, unlockedGuides: ['individual'] };
  view = page.render();
  assert.equal(view.props.children[1].props.onBeforeSelectKind('individual'), true, 'server entitlement remains usable');
  page.unmount();
  console.log('PASS guide UI: old local unlock cache ignored; server-confirmed entitlement accepted');
}
(async () => { await testPurchases(); await testBridge(); await testClientFailure(); await testHistory(); })().catch(e => { console.error(e); process.exitCode = 1; });
