const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relativePath, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => dependencies[id] || {}, mod, mod.exports);
  return mod.exports;
}

const labels = load('worker/src/decision/labels.ts');
const facts = load('worker/src/decision/factExtractor.ts', { './labels': labels });
const { understandQuery, refineQueryWithL2, understandClassifiedQuery } = load('worker/src/decision/understandQuery.ts', {
  './labels': labels, './factExtractor': facts,
});
const scope = { years: [2026], periodSource: 'current_message' };

async function main() {
  const explicit = understandQuery('Cá nhân cư trú sửa chữa máy vi tính, không bán lẻ tạp hóa, doanh thu 1,5 tỷ năm 2026', scope);
  let calls = 0;
  const provider = { classifyAll: async () => {
    calls++;
    return { taxpayer: 'HOUSEHOLD_BUSINESS', taxpayerConf: 0.95,
      income: 'GOODS_SALES', incomeConf: 0.95,
      intent: 'REGISTRATION', intentConf: 0.95, durationMs: 1 };
  } };
  const unchanged = await refineQueryWithL2(explicit, 'irrelevant', provider);
  assert.equal(calls, 0, 'Confident L1 labels must not call L2');
  assert.equal(unchanged.income_type[0].value, 'SERVICE');
  const forced = await refineQueryWithL2(explicit, 'irrelevant', provider, true);
  assert.equal(calls, 1);
  assert.equal(forced.income_type[0].value, 'SERVICE', 'L2 must not overwrite an explicit activity');
  const semantic = { taxpayer: 'INDIVIDUAL_BUSINESS', primaryIntent: 'REFUND',
    secondaryIntents: ['PLATFORM_WITHHOLDING', 'LEGAL_TEXT_LOOKUP'], incomeTypes: ['AFFILIATE_COMMISSION', 'WAGE_SALARY'] };
  const modelFrame = understandClassifiedQuery('Doanh thu 3 tỷ + 1 đồng năm 2026, thu nhập tính thuế hợp lệ 400 triệu. Tôi không bán lẻ tạp hóa.', scope, [], semantic);
  assert.equal(modelFrame.taxpayer_type.value, semantic.taxpayer);
  assert.equal(modelFrame.taxpayer_type.source, 'llm');
  assert.equal(modelFrame.tax_intent.primary.value, 'REFUND');
  assert.deepEqual(modelFrame.tax_intent.secondary, semantic.secondaryIntents);
  assert.deepEqual(modelFrame.income_type.map(x => x.value), semantic.incomeTypes);
  assert.equal(modelFrame.facts.revenue_vnd, 3_000_000_001);
  assert.equal(modelFrame.facts.taxable_income_vnd, 400_000_000);
  assert.equal(facts.extractTaxFacts('Doanh thu năm 2026 đúng 1 tỷ đồng').revenue_vnd, 1_000_000_000, 'A year is never revenue');
  assert.equal(facts.extractTaxFacts('Doanh thu năm 2026 là 1 tỷ 1 đồng').revenue_vnd, 1_000_000_001);
  assert.equal(modelFrame.meta.l2_used, true);
  const unknown = understandClassifiedQuery('Hộ kinh doanh bán tạp hóa cần đăng ký hóa đơn', scope, [], {
    taxpayer: 'UNKNOWN', primaryIntent: 'OTHER_TAX', secondaryIntents: [], incomeTypes: ['UNKNOWN'],
  });
  assert.equal(unknown.taxpayer_type.value, 'UNKNOWN', 'No keyword fallback even with obvious words');
  assert.equal(unknown.income_type[0].value, 'UNKNOWN');
  assert.equal(unknown.tax_intent.primary.value, 'OTHER_TAX');
  assert.throws(() => understandClassifiedQuery('Bán hàng', scope, [], null), /required/);
  const { JevDecisionProvider, QuyetDecisionProvider } = load('worker/src/decision/jevProvider.ts', { './labels': labels });
  const oldFetch = global.fetch;
  try {
    let corrupt;
    let captured;
    const fixture = require('./fixtures/jev_native.cjs');
    global.fetch = async (url, init) => {
      assert.equal(url, 'https://mkp-api.fptcloud.com/v1/systemone');
      const input = JSON.parse(init.body);
      assert.ok(Object.keys(input.questions).length <= 32);
      for (const q of Object.values(input.questions)) if (q.type === 'choice') assert.ok(Object.keys(q.criteria).length <= 10);
      captured = { ...input, questions: { ...captured?.questions, ...input.questions } };
      assert.equal(captured.messages, undefined, 'Must use native decisions, never generated chat');
      const response = fixture(input, 'IN_SCOPE', semantic);
      if (corrupt) corrupt(response);
      return Response.json(response);
    };
    const provider = new QuyetDecisionProvider('fixture');
    const history = [{ role: 'user', content: 'Tôi làm affiliate và có lương.' }];
    const classified = await provider.classifyBusiness('Có hoàn được không?', history);
    const { confidence, ...semanticLabels } = classified;
    assert.deepEqual(semanticLabels, { ...semantic, topic: 'TAX_AMOUNT', revenueContext: 'ACTUAL_YEAR', answerPurpose:'OTHER', taxFocus: 'unspecified', vatRelief: 'UNKNOWN',invoicePeriod:'MIXED_OR_UNKNOWN', calculationShape:'SINGLE', methodContext:'UNSPECIFIED' });
    assert.deepEqual(confidence, { taxpayer: 0.95, intent: 0.99, income: 0.97 });
    assert.deepEqual(captured.state.history, history);
    assert.ok(captured.questions.business_registration, 'The classifier must be able to choose the registration route within provider option limits');
    assert.ok(captured.questions.policy_focus, 'Policy target must be independent of the broad topic');
    for(const [choice,confidence,expected] of [['PIT_RELIEF',.99,'PIT_RELIEF'],['PIT_RELIEF',.4,undefined],['UNRECOGNIZED',.99,undefined]]){
      corrupt=r=>{r.answers.policy_focus={type:'choice',choice,confidence};};
      const parsed=await provider.classifyBusiness('Xét điều kiện giảm thuế cho trường hợp đã nêu.',history);
      assert.equal(parsed?.policyFocus,expected);
      if(choice==='UNRECOGNIZED')assert.equal(parsed,null,'Malformed provider choices must not enter the frame');
    }
    for (const topic of ['BUSINESS_REGISTRATION', 'TAX_REGISTRATION', 'REGISTRATION_COMPARISON', 'REGISTRATION_REQUIREMENTS']) {
      corrupt = r => { r.answers.business_registration = { type: 'choice', choice: topic, confidence: .99 }; };
      const result = await provider.classifyBusiness('Tôi nên đăng ký như thế nào?', history);
      assert.equal(result.topic, topic, 'Keep the model-selected registration meaning');
      const frame = understandClassifiedQuery('đăng ký hkd hay đăng ký cá nhân kinh doanh?', scope, [], result);
      assert.equal(frame.semantic.topic, topic);
      assert.equal(frame.tax_intent.primary.value, 'REGISTRATION');
    }
    const modelOther = understandClassifiedQuery('đăng ký hkd chỉ là bối cảnh, tôi hỏi thuế', scope, [], { ...semantic, topic: 'OTHER' });
    assert.equal(modelOther.semantic.topic, 'OTHER', 'Words must not override semantic classification');
    assert.equal(modelOther.tax_intent.primary.value, 'REFUND');
    corrupt = undefined;
    const compactQuestion = 'doanh thu4 tỷ,tỷ lệGTGTgốc5%,tính TNCNtrước/sauNQ43';
    await provider.classifyBusiness(compactQuestion);
    assert.equal(captured.state.original_question, compactQuestion);
    assert.match(captured.state.question, /doanh thu 4/);
    assert.match(captured.state.question, /GTGT gốc 5%/);
    assert.match(captured.state.question, /TNCN trước/);
    assert.match(captured.state.question, /NQ 43/);
    assert.equal(await provider.classifyTaxRelevance('Có hoàn được không?', history), 'IN_SCOPE');
    corrupt = r => { r.answers.tax_period = { type: 'choice', choice: '2025', confidence: 0.98 }; };
    assert.deepEqual((await provider.classifyBusiness('Năm 2025 bán hàng, giờ 2026 hỏi nghĩa vụ năm đó')).taxYears, [2025], 'Separate the tax year from the year a question is asked');
    corrupt = undefined;
    const originalMock = global.fetch;
    global.fetch = async () => Response.json({ answers: {
      facts: { type: 'choice', choice: 'INVENTED', confidence: 0.97 },
      evidence: { type: 'choice', choice: 'CONTRADICTED', confidence: 0.96 },
      coverage: { type: 'choice', choice: 'COMPLETE', confidence: 0.95 },
    } });
    assert.deepEqual(await provider.reviewAnswer('Chưa rõ chủ thể', 'Chốt toàn bộ thuộc vợ', 'Cần kiểm hợp đồng'), ['facts:INVENTED', 'evidence:CONTRADICTED']);
    for (const [choice, confidence, issue] of [['UNCERTAIN',0.99,'evidence:UNCERTAIN'],['SUPPORTED',0.4,'evidence:LOW_CONFIDENCE'],['CONTRADICTED',0.4,'evidence:LOW_CONFIDENCE']]) {
      global.fetch = async (_url, init) => {
        const payload=JSON.parse(init.body);
        assert.equal(payload.state.evidence.length,8000,'Reviewer must not drop evidence after 5500 chars');
        assert.deepEqual(payload.state.history,history,'Review must retain follow-up context');
        return Response.json({answers:{facts:{type:'choice',choice:'FAITHFUL',confidence:.99},evidence:{type:'choice',choice,confidence},coverage:{type:'choice',choice:'COMPLETE',confidence:.99}}});
      };
      assert.deepEqual(await provider.reviewAnswer('Câu nối tiếp','Đáp án','x'.repeat(8000),history),[choice === 'CONTRADICTED' ? 'evidence:CONTRADICTED' : issue]);
    }
    assert.equal(await provider.reviewAnswer('Câu hỏi','a'.repeat(12001),'Nguồn'),null,'Oversized draft must not be silently certified after truncation');
    global.fetch=async (_url,init)=>{
      const input=JSON.parse(init.body);
      assert.ok(input.questions.contract_change && input.questions.expense_conditions && input.questions.citations);
      const output=fixture(input,'IN_SCOPE');
      output.answers.contract_change.choice='INCOMPLETE';
      return Response.json(output);
    };
    assert.deepEqual(await provider.reviewAnswer('Chi phí lãi vay và đổi tên?', 'Chưa đủ chứng từ.', 'Nguồn', [], {topic:'BUSINESS_EXPENSES'}),['contract_change:INCOMPLETE']);
    for (const topic of ['TAX_REGISTRATION', 'REGISTRATION_COMPARISON', 'REGISTRATION_REQUIREMENTS']) {
      global.fetch = async (_url, init) => {
        const input = JSON.parse(init.body);
        assert.ok(input.questions.registration_scope, 'Review must check registration scope, not just exemption conditions');
        const output = fixture(input, 'IN_SCOPE');
        output.answers.registration_scope.choice = 'INCOMPLETE';
        return Response.json(output);
      };
      assert.deepEqual(await provider.reviewAnswer('HKD với CNKD khác nhau thế nào?',
        'Bán hàng rong được miễn đăng ký hộ.', 'Nguồn', [], { topic }), ['registration_scope:INCOMPLETE']);
    }
    global.fetch = originalMock;
    for (const invalid of [
      r => { delete r.answers.taxpayer; },
      r => { r.answers.business_registration.choice = 'FAKE'; },
      r => { r.answers.business_registration.type = 'noul'; },
      r => { r.answers.taxpayer.choice = 'FAKE'; },
      r => { r.answers.taxpayer.confidence = -1; },
      r => { r.answers.income_SERVICE.noul = 1.5; },
      r => { r.answers.income_SERVICE.noul = 'true'; },
      r => { delete r.answers.intent_REFUND; },
      r => { r.partial_failures = { income_SERVICE: 'failed' }; },
    ]) {
      corrupt = invalid;
      assert.equal(await provider.classifyBusiness('Có hoàn không?'), null);
    }
    global.fetch = async () => Response.json({ choices: [{ message: { content: 'A' } }] });
    assert.equal(await provider.classifyBusiness('Có hoàn không?'), null, 'Reject legacy chat responses');
    global.fetch = async () => { throw new DOMException('timeout', 'AbortError'); };
    assert.equal(await provider.classifyBusiness('Có hoàn không?'), null);
  } finally { global.fetch = oldFetch; }
  console.log('L2 gate and explicit-fact precedence passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
