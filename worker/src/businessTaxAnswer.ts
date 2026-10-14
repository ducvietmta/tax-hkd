import type { AnswerScope } from './answerScope';
import { calculateTax, formatVnd, formatRevenue, type TaxFacts } from './taxEngine';

export interface VerifiedBusinessAnswer {
  response: string;
  citations: string[];
  ruleIds: string[];
  facts: TaxFacts;
}

function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

function moneyToVnd(numberText: string, unit: string): number {
  const value = Number(numberText.replace(',', '.'));
  return Math.round(value * (unit === 'ty' ? 1_000_000_000 : 1_000_000));
}

/** Only accept a single annual business amount or two clearly labelled activities. */
export function extractVerifiedBusinessFacts(question: string, scope: AnswerScope): TaxFacts | null {
  const q = fold(question);
  const years = scope.years.filter(year => year === 2026 || year === 2027);
  if (!years.length || scope.years.some(year => year < 2026)) return null;
  if (/\b(cho thue|affiliate|hoa hong|tiep thi lien ket|luong|tien cong|loi nhuan|tru chi phi|thu nhap tinh thue)\b/.test(q)) return null;
  if (!/\b(thue|tncn|gtgt|nop|khau tru|giam 30|nghi quyet 43)\b/.test(q)) return null;

  const amounts = [...q.matchAll(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/g)]
    .map(match => ({ vnd: moneyToVnd(match[1], match[2]), index: match.index, raw: match[0] }))
    .filter(item => item.vnd > 0);
  const revenueAmounts = amounts.filter(amount => !/\b(khau tru|muc tru|giam tru|nguong)\s*$/.test(q.slice(Math.max(0, amount.index - 20), amount.index)));
  const billions = amounts.filter(item => item.vnd > 1_000_000_000 && item.vnd <= 3_000_000_000);
  const goods = /\b(tap hoa|ban le|ban hang|hang hoa|phan phoi)\b/.test(q);
  // The verified 5%/2% sector mapping here is limited to the repair examples.
  const service = /\b(sua chua|sua may|sua xe)\b/.test(q);
  const isResident = /\b(khong cu tru|phi cu tru)\b/.test(q) ? false
    : /\b(ca nhan cu tru|nguoi cu tru|toi cu tru|la cu tru)\b/.test(q) ? true : null;
  // The resident turnover deduction is not a verified non-resident calculation.
  if (isResident === false) return null;

  // Mixed activities require two amounts and a sector label immediately preceding each amount.
  if (goods && service && revenueAmounts.length === 2) {
    const activities = revenueAmounts.map((amount, i) => {
      const prior = q.slice(i === 0 ? 0 : revenueAmounts[i - 1].index + revenueAmounts[i - 1].raw.length, amount.index);
      const goodsAt = Math.max(prior.lastIndexOf('ban hang'), prior.lastIndexOf('ban le'), prior.lastIndexOf('hang hoa'), prior.lastIndexOf('tap hoa'), prior.lastIndexOf('phan phoi'));
      const serviceAt = Math.max(prior.lastIndexOf('sua chua'), prior.lastIndexOf('dich vu'), prior.lastIndexOf('sua may'), prior.lastIndexOf('sua xe'));
      if (goodsAt < 0 && serviceAt < 0) return null;
      const kind: 'goods' | 'service' = serviceAt > goodsAt ? 'service' : 'goods';
      return { id: `${kind}_${i}`, kind, revenueVnd: amount.vnd,
        vatRate: kind === 'goods' ? 0.01 : 0.05, pitRate: kind === 'goods' ? 0.005 : 0.02 };
    });
    if (activities.every((activity): activity is NonNullable<typeof activity> => activity !== null) &&
        new Set(activities.map(activity => activity.kind)).size === 2) {
      const total = activities.reduce((sum, activity) => sum + activity.revenueVnd, 0);
      if (total > 1_000_000_000 && total <= 3_000_000_000) {
        return { taxYear: years[0], activityType: 'multi', grossRevenueVnd: total,
          isResident, pitMethod: 'PERCENT_OF_TURNOVER', multiActivities: activities };
      }
    }
    return null;
  }

  if (goods === service || billions.length !== 1) return null;
  // Other mentioned monetary amounts may be competing revenue figures. Only accept them
  // when explicitly framed as tax figures, deductions or a comparison answer.
  const revenue = billions[0];
  for (const amount of amounts) {
    if (amount === revenue) continue;
    const prior = q.slice(Math.max(0, amount.index - 34), amount.index);
    if (!/\b(thue|tncn|gtgt|muc tru|giam|nguong|ke toan|noi|dap an|phuong an|cuoi cung|uu dai)\b/.test(prior)) return null;
  }
  return { taxYear: years[0], activityType: service ? 'service' : 'goods',
    grossRevenueVnd: revenue.vnd, isResident, pitMethod: 'PERCENT_OF_TURNOVER' };
}

/** A verified answer that the model cannot numerically rewrite. */
export function answerVerifiedBusinessTax(question: string, scope: AnswerScope): VerifiedBusinessAnswer | null {
  const facts = extractVerifiedBusinessFacts(question, scope);
  if (!facts) return null;
  const residentCalculation = calculateTax({ ...facts, isResident: true });
  if (residentCalculation.status !== 'ANSWERED') return null;
  const revenue = formatRevenue(residentCalculation.effectiveRevenueVnd);
  const multi = facts.activityType === 'multi';
  const sector = multi ? 'hai hoạt động bán hàng và dịch vụ sửa chữa'
    : facts.activityType === 'service' ? 'dịch vụ sửa chữa' : 'bán hàng hóa';
  const lines = [
    `Với doanh thu ${sector} ${revenue} trong năm ${facts.taxYear}, nếu tính thuế TNCN theo tỷ lệ trên doanh thu:`,
    `- Thuế GTGT trước khi xét chính sách giảm GTGT riêng: ${formatVnd(residentCalculation.vatDueVnd)}. Mức giảm GTGT (nếu có) phải kiểm tra theo loại hàng hóa, dịch vụ và hóa đơn; Nghị quyết 43 không giảm thuế GTGT.`,
    `- Mức trừ doanh thu TNCN 1 tỷ đồng được áp dụng một lần trong năm${multi ? ', phân bổ ưu tiên cho hoạt động có tỷ lệ TNCN cao hơn' : ''}. Doanh thu chịu thuế TNCN sau mức trừ: ${formatVnd(residentCalculation.taxablePitRevenueVnd)}.`,
    `- Thuế TNCN trước ưu đãi: ${formatVnd(residentCalculation.pitBeforeReliefVnd)}.`,
  ];
  if (facts.isResident === true) {
    lines.push(`- Giảm 30% TNCN theo Nghị quyết 43/2026/QH16: ${formatVnd(residentCalculation.pitReliefVnd)}. TNCN sau giảm: ${formatVnd(residentCalculation.pitAfterReliefVnd)}.`);
  } else {
    lines.push(`- Nếu bạn là cá nhân cư trú, doanh thu năm không quá 10 tỷ đồng và khoản này là thu nhập kinh doanh: giảm 30% TNCN (${formatVnd(residentCalculation.pitReliefVnd)}), còn ${formatVnd(residentCalculation.pitAfterReliefVnd)}. Nếu không đáp ứng điều kiện cư trú, không áp dụng mức giảm này.`);
  }
  if (fold(question).includes('2028')) lines.push('Nghị quyết 43 chỉ nêu kỳ tính thuế 2026 và 2027; không tự áp dụng mức giảm này cho năm 2028.');
  const citations = [
    'Khoản 3 Điều 4 Nghị định 68/2026/NĐ-CP, sửa đổi bởi Nghị định 141/2026/NĐ-CP',
    'Điều 12 Luật Thuế GTGT 48/2024/QH15',
    'Điều 7 Luật Thuế TNCN 109/2025/QH15',
    'Khoản 1 Điều 1 và khoản 1 Điều 2 Nghị quyết 43/2026/QH16',
  ];
  return { response: `${lines.join('\n')}\n\nCăn cứ pháp lý:\n${citations.join('\n')}`,
    citations, ruleIds: ['ND68_2026_ART4_3_AS_AMENDED_ND141', 'NQ43_2026_ART1_1'], facts };
}
