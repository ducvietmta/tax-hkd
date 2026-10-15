// Typed FPT fixture only; production never derives these labels from this helper.
module.exports = function nativeResponse(input, scope, business) {
  if (input.questions.scope) return { answers: { scope: { type: 'choice', choice: scope, confidence: 0.95 } } };
  if (input.questions.facts) return { answers: {
    ...Object.fromEntries(Object.keys(input.questions).map(k=>[k,{type:'choice',choice:'COMPLETE',confidence:.95}])),
    facts: { type: 'choice', choice: 'FAITHFUL', confidence: 0.95 },
    evidence: { type: 'choice', choice: 'SUPPORTED', confidence: 0.95 },
    coverage: { type: 'choice', choice: 'COMPLETE', confidence: 0.95 },
  } };
  const answers = {};
  const q = (input.state.question || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g,'d').toLowerCase();
  const active = q.replace(/\b(?:khong|ko)\s+(?:hoi|can|tinh|xet)(?:\s+(?:hoi|tinh|xet|ve|den|phan|thue))*\s*(?:tncn|thu nhap ca nhan|gtgt|gia tri gia tang)\b/g, '');
  const vat = /gtgt|gia tri gia tang/.test(active), pit = /tncn|thu nhap ca nhan/.test(active);
  for (const key of Object.keys(input.questions)) {
    if (key === 'taxpayer') answers[key] = { type: 'choice', choice: business.taxpayer, confidence: 0.95 };
    else if (key === 'primary_income') answers[key] = { type: 'choice', choice: business.incomeTypes[0] || 'UNKNOWN', confidence: 0.97 };
    else if (key === 'topic') answers[key] = { type: 'choice', choice: business.topic || 'TAX_AMOUNT', confidence: 0.95 };
    else if (key === 'revenue_context') answers[key] = { type: 'choice', choice: business.revenueContext || 'ACTUAL_YEAR', confidence: 0.95 };
    else if (key === 'tax_period') answers[key] = { type: 'choice', choice: business.taxYears?.[0]?.toString() || 'CURRENT', confidence: 0.95 };
    else if (key === 'tax_focus') answers[key] = { type:'choice', choice: business.taxFocus || (vat && pit ? 'both' : vat ? 'vat' : pit ? 'pit' : 'unspecified'), confidence:0.98 };
    else if (key === 'invoice_period') answers[key] = {type:'choice',choice:business.invoicePeriod || 'MIXED_OR_UNKNOWN',confidence:.98};
    else if (key === 'vat_relief') answers[key] = { type:'choice', choice: business.vatRelief || (/khong (?:duoc|du dieu kien) giam (?:thue )?gtgt/.test(q) ? 'INELIGIBLE' : /(du dieu kien|thuoc dien|gia dinh)[^.!?]{0,90}(20\s*%|gtgt)/.test(q) ? 'ELIGIBLE' : 'UNKNOWN'), confidence:0.98 };
    else if (key.startsWith('intent_')) {
      const label = key.slice(7);
      answers[key] = { type: 'noul', noul: business.primaryIntent === label ? 0.99 : business.secondaryIntents.includes(label) ? 0.95 : 0.01 };
    } else if (key.startsWith('income_')) answers[key] = { type: 'noul', noul: business.incomeTypes.includes(key.slice(7)) ? 0.97 : 0.01 };
  }
  return { answers };
};
