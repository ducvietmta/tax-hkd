import type { AnswerScope } from './answerScope';

function fold(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

function million(value: number): string {
  return `${Number(value.toFixed(2)).toLocaleString('vi-VN')} triệu đồng`;
}

function revenueText(millionVnd: number): string {
  return millionVnd >= 1000
    ? `${Number((millionVnd / 1000).toFixed(2)).toLocaleString('vi-VN')} tỷ đồng`
    : million(millionVnd);
}

/** Repair narrow, verifiable mistakes after a fallback model ignores its retrieved evidence. */
export function guardTaxAnswer(query: string, scope: AnswerScope, refs: string[], answer: string): { answer: string; reason: string | null } {
  const q = fold(query);
  const a = fold(answer);
  const historical = scope.years.length === 1 && scope.years[0] >= 2022 && scope.years[0] <= 2025;
  const asksLateFiling = /\b(chua ke khai|chua khai thue|quen ke khai)\b/.test(q);
  const historicalRevenue = q.match(/doanh thu\s+(\d+(?:[.,]\d+)?)\s*(trieu|ty)\b/);
  if (historical && asksLateFiling && historicalRevenue && refs.includes('16.54')) {
    const revenue = Number(historicalRevenue[1].replace(',', '.')) * (historicalRevenue[2] === 'ty' ? 1000 : 1);
    if (revenue > 100 && (!a.includes('100 trieu') || /nguong 1 ty/.test(a))) {
      const year = scope.years[0];
      return {
        answer: `Nếu ${revenueText(revenue)} là doanh thu kinh doanh của bạn trong năm ${year}, khoản này vượt ngưỡng 100 triệu đồng/năm áp dụng cho kỳ ${year}. Bạn cần rà lại doanh thu và số đã nộp, kê khai bổ sung kỳ còn thiếu với cơ quan thuế; số thuế GTGT và TNCN cụ thể phụ thuộc loại hoạt động và hồ sơ thực tế. Không dùng ngưỡng 1 tỷ của năm 2026 để xét ngược năm ${year}.\n\nCăn cứ pháp lý:\nThông tư 40/2021/TT-BTC (quy định áp dụng cho kỳ ${year})`,
        reason: 'historical_threshold',
      };
    }
  }

  const asksRate = /bao nhieu\s*(phan tram|%)|thue suat bao nhieu/.test(q);
  const retail = /\b(tap hoa|phan phoi|ban hang hoa)\b/.test(q);
  const annualRevenue = q.match(/doanh thu\s+(\d+(?:[.,]\d+)?)\s*(ty|trieu)\b/);
  if (scope.years.length === 1 && scope.years[0] === 2026 && asksRate && retail && annualRevenue && refs.includes('16.77')) {
    const revenue = Number(annualRevenue[1].replace(',', '.')) * (annualRevenue[2] === 'ty' ? 1000 : 1);
    if (revenue > 1000 && revenue <= 3000 && !/\b(chi phi|thu nhap tinh thue|nhieu nganh|nhieu hoat dong)\b/.test(q)) {
      const vat = revenue * 0.01;
      const incomeTax = (revenue - 1000) * 0.005;
      const expected = fold(million(incomeTax));
      if (!a.includes(expected) || !a.includes('0,5%') || !a.includes(fold(million(vat)))) {
        return {
          answer: `Với doanh thu bán tạp hóa ${revenueText(revenue)} trong năm 2026 và tính TNCN theo tỷ lệ trên doanh thu: thuế GTGT là 1% trên toàn bộ doanh thu, tức ${revenueText(revenue)} × 1% = ${million(vat)}. Thuế TNCN là 0,5% trên phần doanh thu vượt 1 tỷ đồng, tức (${revenueText(revenue)} − 1 tỷ đồng) × 0,5% = ${million(incomeTax)}. Nếu bạn chọn phương pháp TNCN tính trên thu nhập thay vì tỷ lệ doanh thu, số TNCN sẽ tính theo phương pháp đó.\n\nCăn cứ pháp lý:\nĐiều 12 khoản 2 điểm b Luật Thuế GTGT 48/2024/QH15\nĐiều 7 khoản 3 Luật Thuế TNCN 109/2025/QH15\nNghị định 141/2026/NĐ-CP`,
          reason: 'retail_rate_calculation',
        };
      }
    }
  }

  return { answer, reason: null };
}
