// Curated test inputs, NOT a production classifier. Labels below simulate the
// decision provider. Expected values are constants, never calculated by the SUT.
const specs = {};
const idOf = n => `G${String(n).padStart(3, '0')}`;
function group(ids, semantic, evidenceAny) {
  for (const n of ids) specs[idOf(n)] = { semantic: { ...semantic }, evidenceAny: [...evidenceAny] };
}
const range = (a,b) => Array.from({length:b-a+1},(_,i)=>a+i);
const tax = { topic:'TAX_AMOUNT', primaryIntent:'TAX_CALCULATION', taxFocus:'both' };
const revenue = topic => ({ topic, primaryIntent:'OTHER_TAX', taxFocus:'unspecified' });
group(require('../fixtures/tax-hkd-191.json').cases.map(c => Number(c.id.slice(1))), revenue('REVENUE_COMPOSITION'), ['16.32','16.37','16.72']);
group([1,2,31,32,34,71,72,183,184,187], {topic:'REVENUE_THRESHOLD',primaryIntent:'EXEMPTION_ELIGIBILITY'}, ['16.60','16.54','16.44']);
group([3,35,37,62,63,67,105,106,109,110,162], revenue('REVENUE_TIMING'), ['16.101','16.30','16.37']);
group([4,5,6,7,8,9,10,11,12,13,14,29,73,74,75,76,77,78,80,139,140,141,143,144,145,146,147,148,149,150,151,152,153,188,189,190,193,196,197], tax, ['16.77','16.56','16.50','16.99']);
group([15,16,17,18,19,91,92,93,94,95,96,98,99,100,163,185,199], {topic:'REVENUE_OWNERSHIP',primaryIntent:'RELIEF_REDUCTION',secondaryIntents:[],taxFocus:'pit'}, ['16.39']);
group([20,21,22,97,103,104,157,158,159,192], {topic:'REVENUE_COMPOSITION',primaryIntent:'PLATFORM_WITHHOLDING',secondaryIntents:[],incomeTypes:['AFFILIATE_COMMISSION']}, ['16.32','16.37','16.35','16.95']);
group([23,24,41,42,43,44,45,46,48,49,50,111,112,113,114,115,116,117,118,119,120,164,165,166,167,168,191], revenue('REVENUE_OWNERSHIP'), ['16.75','16.72']);
group([51,52,53,54,55,56,57,58,59,60,64], revenue('VAT_METHOD_CLASSIFICATION'), ['16.104','16.31']);
group([81,82,83,84,85,86,87,88,89,90,169,170,171,172,173,174], {topic:'BUSINESS_EXPENSES',primaryIntent:'ACCOUNTING_BOOKS',taxFocus:'pit'}, ['16.102']);
group([25,26,121,122,123,124,125,126,128,129,130,179,180,181,182,186], {topic:'INVOICE_REGISTRATION',primaryIntent:'E_INVOICE'}, ['16.41','16.105']);
group([70,127,175,176,177,178,198], {topic:'INVOICE_CORRECTION',primaryIntent:'E_INVOICE'}, ['16.103','16.106']);
group(range(131,138).concat(194), {topic:'BUSINESS_REGISTRATION',primaryIntent:'REGISTRATION',incomeTypes:['AFFILIATE_COMMISSION']}, ['16.107']);
const patch = (n, values) => { const s=specs[idOf(n)]; Object.assign(s,values); };
const sem = (n, values) => Object.assign(specs[idOf(n)].semantic,values);

// Scope assertions run the real period resolver (not the semantic-label fixture).
for (const n of [1,32]) patch(n,{scopeYears:[2026]});
for (const n of [2,31,184]) patch(n,{years:[2025],scopeYears:[2025]});
for (const n of [3,35,67]) patch(n,{years:[2025,2026]});
patch(188,{years:[2028],scopeYears:[2028]});
patch(193,{years:[2025]});
for (const n of [175,176,177,178,198]) sem(n,{invoicePeriod:n===175?'H1_2026':n===176?'MIXED_OR_UNKNOWN':'H2_2026'});
for (const n of [4,5,7,8,29,147,149,150,154,189,193,196]) sem(n,{vatRelief:'ELIGIBLE',secondaryIntents:['RELIEF_REDUCTION']});
for (const n of [6,151]) sem(n,{vatRelief:'INELIGIBLE'});
for (const n of [4,5,6,7,8,55,98,147,148,149,150,151,152,153,154,189,193]) sem(n,{taxFocus:'vat'});
for (const n of [9,10,11,12,13,14,73,74,75,76,77,78,80,139,140,141,143,144,145,146,190]) sem(n,{taxFocus:'pit'});
for (const n of [11,78,81,140,174,197]) patch(n,{facts:{taxable_income_vnd:null}});
for (const n of [34,94,129]) sem(n,{revenueContext:'PROJECTED'});
for (const n of [32,37]) sem(n,{revenueContext:'PARTIAL_PERIOD'});
for (const n of [56,64,152,153]) sem(n,{revenueContext:'TRANSACTION'});
for (const n of [53,101,102,105,106,107,108,109,110,155,156,160,161,162,195]) sem(n,{incomeTypes:['AFFILIATE_COMMISSION']});
for (const n of [4,7,8,9,10,11,12,13,14,71,72,73,77,78,80,139,140,141,143,144,145,146,148,149]) sem(n,{incomeTypes:['GOODS_SALES']});
for (const n of [5,6,29,55,147,150,151,152,153,189,196,197]) sem(n,{incomeTypes:['SERVICE']});
sem(196,{revenueContext:'UNSPECIFIED',secondaryIntents:['COMPARE_PERIODS'],taxFocus:'both'});
sem(199,{taxpayer:'INDIVIDUAL_EMPLOYEE',incomeTypes:['WAGE_SALARY']});

// Numeric extraction expectations: these are read from the ORIGINAL question,
// never substituted into extracted facts before comparison. null = must be absent.
for (const [n,facts] of [
  [1,{revenue_vnd:280000000}],[2,{revenue_vnd:280000000}],
  [4,{revenue_vnd:1500000000,vat_rate_explicit:.01}],
  [5,{vat_rate_explicit:.05}],[9,{revenue_vnd:3000000000,taxable_income_vnd:400000000}],
  [10,{revenue_vnd:3000000001,taxable_income_vnd:400000000}],
  [11,{revenue_vnd:3000000001,taxable_income_vnd:null}],
  [13,{revenue_vnd:50000000000,taxable_income_vnd:2000000000}],
  [16,{revenue_vnd:10000000001}],[20,{revenue_vnd:500000000}],
  [71,{revenue_vnd:1000000000}],[72,{revenue_vnd:1000000001}],
  [73,{revenue_vnd:2400000000}],[77,{revenue_vnd:49900000000,taxable_income_vnd:1000000000}],
  [81,{taxable_income_vnd:null}],[101,{revenue_vnd:70000000}],
  [102,{revenue_vnd:500000000}],
  [139,{revenue_vnd:2999999999,taxable_income_vnd:400000000}],
  [140,{taxable_income_vnd:null}],[145,{revenue_vnd:4000000000,taxable_income_vnd:500000000,tax_paid_vnd:70000000}],
  [147,{revenue_vnd:1800000000,vat_rate_explicit:.05}],
  [156,{revenue_vnd:120000000}],
  [174,{taxable_income_vnd:null}],
  [196,{revenue_vnd:4000000000,taxable_income_vnd:500000000,vat_rate_explicit:.05}],
  [197,{taxable_income_vnd:null}],
]) patch(n,{facts});

// Rules-engine scenarios are curated post-classification business facts.
// They test the engine independently of parsing; every override is reported.
function scenario(n, facts, expected, more={}) {
  const s=specs[idOf(n)]; (s.scenarios ||= []).push({facts,expected,...more});
}
scenario(1,{revenue_vnd:280000000},{status:'ANSWERED',vat_due_vnd:0,pit_after_relief_vnd:0});
scenario(2,{revenue_vnd:280000000},{status:'ANSWERED',vat_due_vnd:2800000,pit_after_relief_vnd:1400000},{year:2025});
scenario(4,{revenue_vnd:1500000000,vat_rate_explicit:.01,vat_relief_assumed:true},{vat_rate:.008,vat_due_vnd:12000000});
scenario(5,{revenue_vnd:1500000000,vat_rate_explicit:.05,vat_relief_assumed:true},{vat_rate:.04,vat_due_vnd:60000000});
scenario(6,{revenue_vnd:1500000000,vat_rate_explicit:.05,vat_relief_assumed:false},{vat_rate:.05,vat_due_vnd:75000000});
scenario(7,{revenue_vnd:1500000000,vat_rate_explicit:.01,vat_relief_assumed:true},{vat_due_vnd:12000000});
scenario(9,{revenue_vnd:3000000000,taxable_income_vnd:400000000,pit_method_elected:'INCOME'},{pit_rate:.15,pit_before_relief_vnd:60000000,pit_after_relief_vnd:42000000});
scenario(10,{revenue_vnd:3000000001,taxable_income_vnd:400000000},{pit_rate:.17,pit_before_relief_vnd:68000000,pit_after_relief_vnd:47600000});
scenario(11,{revenue_vnd:3000000001},{status:'NEEDS_INFO'});
scenario(12,{revenue_vnd:3200000000},{status:'NEEDS_INFO'});
scenario(13,{revenue_vnd:50000000000,taxable_income_vnd:2000000000},{pit_rate:.17,pit_before_relief_vnd:340000000,pit_after_relief_vnd:340000000});
scenario(14,{revenue_vnd:50000000001,taxable_income_vnd:2000000000},{pit_rate:.20,pit_before_relief_vnd:400000000,pit_relief_vnd:0});
scenario(14,{revenue_vnd:50000000000,taxable_income_vnd:2000000000},{pit_rate:.17,pit_before_relief_vnd:340000000});
for (const n of [15,17]) scenario(n,{revenue_vnd:10000000000,taxable_income_vnd:500000000},{pit_before_relief_vnd:85000000,pit_after_relief_vnd:59500000},{syntheticIncome:true});
for (const n of [16,18]) scenario(n,{revenue_vnd:10000000001,taxable_income_vnd:500000000},{pit_before_relief_vnd:85000000,pit_after_relief_vnd:85000000,pit_relief_vnd:0},{syntheticIncome:true});
scenario(71,{revenue_vnd:1000000000},{vat_due_vnd:0,pit_after_relief_vnd:0});
scenario(73,{revenue_vnd:2400000000,taxable_income_vnd:400000000,pit_method_elected:'INCOME'},{pit_rate:.15,pit_before_relief_vnd:60000000,pit_after_relief_vnd:42000000});
scenario(73,{revenue_vnd:2400000000},{pit_rate:.005,pit_before_relief_vnd:7000000,pit_after_relief_vnd:4900000});
scenario(77,{revenue_vnd:49900000000,taxable_income_vnd:1000000000},{pit_rate:.17,pit_before_relief_vnd:170000000});
scenario(78,{revenue_vnd:51000000000},{status:'NEEDS_INFO'},{syntheticRevenue:true});
scenario(80,{revenue_vnd:2900000000,taxable_income_vnd:400000000,pit_method_elected:'INCOME'},{pit_rate:.15},{syntheticIncome:true});
scenario(81,{revenue_vnd:4000000000},{status:'NEEDS_INFO'});
scenario(92,{revenue_vnd:8000000000,taxable_income_vnd:500000000},{pit_relief_vnd:0},{resident:'NON_RESIDENT',syntheticIncome:true});
scenario(96,{revenue_vnd:4000000000,taxable_income_vnd:0},{pit_before_relief_vnd:0,pit_after_relief_vnd:0},{syntheticRevenue:true});
scenario(139,{revenue_vnd:2999999999,taxable_income_vnd:400000000,pit_method_elected:'INCOME'},{pit_rate:.15,pit_after_relief_vnd:42000000});
scenario(140,{revenue_vnd:3000000001},{status:'NEEDS_INFO'});
scenario(141,{revenue_vnd:10100000000,taxable_income_vnd:500000000},{pit_rate:.17,pit_before_relief_vnd:85000000,pit_relief_vnd:0});
scenario(143,{revenue_vnd:50000000000,taxable_income_vnd:2000000000},{pit_rate:.17,pit_before_relief_vnd:340000000});
scenario(145,{revenue_vnd:4000000000,taxable_income_vnd:500000000},{pit_before_relief_vnd:85000000,pit_after_relief_vnd:59500000});
scenario(146,{revenue_vnd:4000000000,taxable_income_vnd:0},{pit_before_relief_vnd:0,pit_after_relief_vnd:0});
scenario(147,{revenue_vnd:1800000000,vat_rate_explicit:.05,vat_relief_assumed:true},{vat_due_vnd:72000000,vat_rate:.04});
scenario(151,{revenue_vnd:1500000000,vat_rate_explicit:.05,vat_relief_assumed:false},{vat_rate:.05},{syntheticRevenue:true});
scenario(188,{revenue_vnd:1500000000},{status:'NEEDS_LEGAL_REVIEW'},{year:2028,syntheticRevenue:true});
scenario(196,{revenue_vnd:4000000000,taxable_income_vnd:500000000,vat_rate_explicit:.05,vat_relief_assumed:true},
  {vat_due_vnd:160000000,pit_before_relief_vnd:85000000,pit_after_relief_vnd:59500000,taxable_vat_revenue_vnd:4000000000,taxable_pit_revenue_vnd:500000000},
  {render:true,requiredAmounts:[160000000,85000000,59500000]});
scenario(197,{revenue_vnd:4000000000},{status:'NEEDS_INFO'});

// Negative answers test validators, not a model's ability to write the gold answer.
for (const n of [25,128,186]) patch(n,{citationMutation:true});
patch(196,{coverageMutation:{answer:'Doanh thu 4 tỷ. Thuế TNCN trước giảm 85 triệu đồng, sau giảm 59,5 triệu đồng. Thuế GTGT tính riêng theo hoạt động.',missing:['vat_amount']}});
patch(195,{coverageMutation:{answer:'Hoa hồng 300 triệu đồng là doanh thu, không lấy GMV 5 tỷ.',missing:['platform_withholding']}});
for (const n of [82,85,88,169,170,171,173,174]) patch(n,{reviewCheck:'expense_conditions'});
for (const n of range(131,138).concat(194)) patch(n,{reviewCheck:'registration_conditions'});
for (const n of [70,127,175,176,177,178,198]) patch(n,{reviewCheck:'correction_options'});

module.exports = { specs, version:'1.2', labelSource:'curated_offline_fixture_not_model_output' };
