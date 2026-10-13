const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../worker/src/museRequest.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleRef = { exports: {} };
new Function('require', 'module', 'exports', compiled)(
  () => { throw new Error('Unexpected runtime import'); },
  moduleRef,
  moduleRef.exports,
);

const { buildMuseRequest } = moduleRef.exports;
const history = [
  { role: 'user', content: 'Doanh thu năm nay bao nhiêu thì phải nộp thuế?' },
  { role: 'assistant', content: 'Bạn cho mình biết tổng doanh thu nhé.' },
];
const request = buildMuseRequest('Quy tắc tư vấn thuế', history, '800 triệu', true);
assert.equal(request.instructions, 'Quy tắc tư vấn thuế');
assert.equal(request.input.length, 3);
assert.deepEqual(request.input.map((turn) => turn.role), ['user', 'assistant', 'user']);
assert.deepEqual(request.input.map((turn) => turn.content[0].type), ['input_text', 'output_text', 'input_text']);
assert.equal(request.input[2].content[0].text, '800 triệu');
assert.equal(request.reasoning.effort, 'high');
assert.equal(request.stream, true);
assert.ok(request.max_output_tokens >= 4000);
assert.ok(!('temperature' in request));
assert.equal(buildMuseRequest('Quy tắc', history, '800 triệu', false).stream, false);

console.log('Muse request contract checks passed.');
