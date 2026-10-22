// Homepage illustration for the 2026 tax year, one resident's single activity.
// This is not a replacement for the decision engine or a tax return.
export function estimateHomepageTax(
  revenue: number, vatRate: number, pitRate: number,
  rental: boolean, vatReductionEligible: boolean, resident: boolean,
) {
  const taxable = revenue > 1_000_000_000;
  const effectiveVatRate = vatRate * (vatReductionEligible && !rental ? 80 : 100) / 100;
  const vat = taxable ? revenue * effectiveVatRate : 0;
  const needsIncome = taxable && !rental && revenue > 3_000_000_000;
  const pitBefore = needsIncome ? null : Math.max(0, revenue - 1_000_000_000) * pitRate;
  const pit = pitBefore === null ? null : pitBefore * (resident && revenue <= 10_000_000_000 ? 0.7 : 1);
  return { taxable, effectiveVatRate, vat, pitBefore, pit, total: pit === null ? null : vat + pit };
}
