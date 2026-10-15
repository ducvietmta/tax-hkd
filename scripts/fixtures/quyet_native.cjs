// Typed FPT fixture only; production never derives these labels from this helper.
module.exports = function nativeResponse(input, scope, business) {
  if (input.questions.scope) return { answers: { scope: { type: 'choice', choice: scope, confidence: 0.95 } } };
  const answers = {};
  for (const key of Object.keys(input.questions)) {
    if (key === 'taxpayer') answers[key] = { type: 'choice', choice: business.taxpayer, confidence: 0.95 };
    else if (key === 'primary_income') answers[key] = { type: 'choice', choice: business.incomeTypes[0] || 'UNKNOWN', confidence: 0.97 };
    else if (key === 'topic') answers[key] = { type: 'choice', choice: business.topic || 'TAX_AMOUNT', confidence: 0.95 };
    else if (key === 'revenue_context') answers[key] = { type: 'choice', choice: business.revenueContext || 'ACTUAL_YEAR', confidence: 0.95 };
    else if (key === 'tax_period') answers[key] = { type: 'choice', choice: business.taxYears?.[0]?.toString() || 'CURRENT', confidence: 0.95 };
    else if (key.startsWith('intent_')) {
      const label = key.slice(7);
      answers[key] = { type: 'noul', noul: business.primaryIntent === label ? 0.99 : business.secondaryIntents.includes(label) ? 0.95 : 0.01 };
    } else if (key.startsWith('income_')) answers[key] = { type: 'noul', noul: business.incomeTypes.includes(key.slice(7)) ? 0.97 : 0.01 };
  }
  return { answers };
};
