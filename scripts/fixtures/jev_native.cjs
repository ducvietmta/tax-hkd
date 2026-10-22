// Typed FPT fixture only; production never derives these labels from this helper.
const operationalTopics=['BUSINESS_SUSPENSION','TAX_REGISTRATION_CHANGE','TAX_STATUS_RESTORATION','TAX_PAYMENT_RECONCILIATION','TAX_EXTENSION','TAXPAYER_RIGHTS','ACCOUNTING_RETENTION','INVOICE_USAGE'];
module.exports = function nativeResponse(input, scope, business) {
  if(input.questions.request_alignment)return {answers:Object.fromEntries(Object.keys(input.questions).map(key=>[key,{type:'choice',choice:'SUPPORTED',confidence:.99}]))};
  if (input.questions.scope) return { answers: { scope: { type: 'choice', choice: scope, confidence: 0.95 } } };
  if (input.questions.facts) return { answers: {
    ...Object.fromEntries(Object.keys(input.questions).map(k=>[k,{type:'choice',choice:k.startsWith('role_')?'DIRECT_ANSWER':'COMPLETE',confidence:.95}])),
    facts: { type: 'choice', choice: 'FAITHFUL', confidence: 0.95 },
    evidence: { type: 'choice', choice: 'SUPPORTED', confidence: 0.95 },
    coverage: { type: 'choice', choice: 'COMPLETE', confidence: 0.95 },
    missing_fact: { type: 'choice', choice: 'NONE', confidence: 0.95 },
    ...(input.questions.safe_fact ? {safe_fact:{type:'choice',choice:'NONE',confidence:.99}} : {}),
  } };
  const answers = {};
  const q = (input.state.question || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g,'d').toLowerCase();
  const active = q.replace(/\b(?:khong|ko)\s+(?:hoi|can|tinh|xet)(?:\s+(?:hoi|tinh|xet|ve|den|phan|thue))*\s*(?:tncn|thu nhap ca nhan|gtgt|gia tri gia tang)\b/g, '');
  const vat = /gtgt|gia tri gia tang/.test(active), pit = /tncn|thu nhap ca nhan/.test(active);
  for (const key of Object.keys(input.questions)) {
    if (key === 'business_registration' || key === 'operational_topic') {
      const criteria=input.questions[key].criteria;
      const supported=criteria ? Object.hasOwn(criteria,business.topic)
        : key==='operational_topic' ? operationalTopics.includes(business.topic)
        : ['BUSINESS_CESSATION','BUSINESS_REGISTRATION','TAX_REGISTRATION','REGISTRATION_COMPARISON','REGISTRATION_REQUIREMENTS','SYSTEM_REGISTRATION','PORTAL_TROUBLESHOOTING','TAX_SOFTWARE_SYSTEM'].includes(business.topic);
      answers[key] = { type: 'choice', choice:supported ? business.topic : 'NOT_APPLICABLE', confidence: .99 }; continue;
    }
    if (key === 'subject_context') answers[key]={type:'choice',choice:business.subjectContext||'UNKNOWN',confidence:.99};
    else if (key === 'registration_status') answers[key]={type:'choice',choice:business.registrationStatus||'UNKNOWN',confidence:.99};
    else if (key === 'policy_focus') answers[key]={type:'choice',choice:business.policyFocus||'UNSPECIFIED',confidence:.99};
    else if (key === 'obligation_date') answers[key]={type:'choice',choice:business.obligationDate||'UNSPECIFIED',confidence:.99};
    else if (key === 'answer_purpose') answers[key]={type:'choice',choice:business.answerPurpose||'OTHER',confidence:.99};
    else if (key === 'taxpayer') answers[key] = { type: 'choice', choice: business.taxpayer, confidence: 0.95 };
    else if (key === 'primary_income') answers[key] = { type: 'choice', choice: business.incomeTypes[0] || 'UNKNOWN', confidence: 0.97 };
    else if (key === 'topic') answers[key] = { type:'choice',choice:Object.hasOwn(input.questions.topic.criteria||{},business.topic||'TAX_AMOUNT')?(business.topic||'TAX_AMOUNT'):'OTHER',confidence:.95 };
    else if (key === 'revenue_context') answers[key] = { type: 'choice', choice: business.revenueContext || 'ACTUAL_YEAR', confidence: 0.95 };
    else if (key === 'tax_period') answers[key] = { type: 'choice', choice: business.taxYears?.[0]?.toString() || 'CURRENT', confidence: 0.95 };
    else if (key === 'tax_focus') answers[key] = { type:'choice', choice: business.taxFocus || (vat && pit ? 'both' : vat ? 'vat' : pit ? 'pit' : 'unspecified'), confidence:0.98 };
    else if (key === 'invoice_period') answers[key] = {type:'choice',choice:business.invoicePeriod || 'MIXED_OR_UNKNOWN',confidence:.98};
    else if (key === 'calculation_shape') answers[key] = {type:'choice',choice:business.calculationShape || 'SINGLE',confidence:.98};
    else if (key === 'method_context') answers[key] = {type:'choice',choice:business.methodContext || 'UNSPECIFIED',confidence:.98};
    else if (key === 'vat_relief') answers[key] = { type:'choice', choice: business.vatRelief || (/khong (?:duoc|du dieu kien) giam (?:thue )?gtgt/.test(q) ? 'INELIGIBLE' : /(du dieu kien|thuoc dien|gia dinh)[^.!?]{0,90}(20\s*%|gtgt)/.test(q) ? 'ELIGIBLE' : 'UNKNOWN'), confidence:0.98 };
    else if (key.startsWith('intent_')) {
      const label = key.slice(7);
      answers[key] = { type: 'noul', noul: business.primaryIntent === label ? 0.99 : business.secondaryIntents.includes(label) ? 0.95 : 0.01 };
    } else if (key.startsWith('income_')) answers[key] = { type: 'noul', noul: business.incomeTypes.includes(key.slice(7)) ? 0.97 : 0.01 };
  }
  return { answers };
};
