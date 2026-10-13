import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { Calculator, ShoppingBag, Home, Smartphone, Utensils, CheckCircle2, Sparkles } from 'lucide-react';

type TabKey = 'online' | 'rental' | 'affiliate' | 'restaurant';

const THRESHOLD = 1_000_000_000;

const TABS: {
  key: TabKey; label: string; icon: React.ElementType; vat: number; pit: number;
  accent: string; text: string; ring: string; revenueLabel: string; note: string; filing: string;
}[] = [
  {
    key: 'online', label: 'Bán hàng Online', icon: ShoppingBag, vat: 0.01, pit: 0.005,
    accent: 'from-emerald-400 to-teal-500', text: 'text-emerald-600', ring: 'accent-emerald-500',
    revenueLabel: 'Tổng doanh thu bán hàng cả năm',
    note: 'Bao gồm đơn giao thành công trên TikTok Shop, Shopee, Lazada... Ngưỡng miễn thuế 1 tỷ/năm (Nghị định 141/2026/NĐ-CP). Sàn nộp thuế thay.',
    filing: 'Sàn TMĐT khấu trừ kê khai nộp thay khi vượt 1 tỷ, hoặc kê khai bổ sung qua Mẫu 01/CNKD trên eTax Mobile.',
  },
  {
    key: 'rental', label: 'Cho thuê nhà', icon: Home, vat: 0.05, pit: 0.05,
    accent: 'from-sky-400 to-blue-500', text: 'text-blue-600', ring: 'accent-blue-500',
    revenueLabel: 'Giá cho thuê hàng tháng',
    note: 'Doanh thu cho thuê tài sản từ 1 tỷ đồng/năm trở xuống được miễn thuế theo Nghị định 141/2026.',
    filing: 'Kê khai theo Tờ khai Mẫu 01/TTS kèm bản sao hợp đồng thuê.',
  },
  {
    key: 'affiliate', label: 'KOC / Affiliate', icon: Smartphone, vat: 0.05, pit: 0.02,
    accent: 'from-violet-400 to-fuchsia-500', text: 'text-purple-600', ring: 'accent-purple-500',
    revenueLabel: 'Tổng hoa hồng Affiliate / booking KOC cả năm',
    note: 'Nếu sàn đã khấu trừ 10% tại nguồn, bạn có thể xin chứng từ để hoàn phần nộp thừa.',
    filing: 'Yêu cầu sàn cấp chứng từ khấu trừ thuế điện tử và đăng ký mã số thuế.',
  },
  {
    key: 'restaurant', label: 'Quán ăn / Cafe', icon: Utensils, vat: 0.03, pit: 0.015,
    accent: 'from-amber-400 to-orange-500', text: 'text-amber-600', ring: 'accent-amber-500',
    revenueLabel: 'Doanh thu quán ăn / cafe cả năm',
    note: 'Bao gồm doanh thu ăn tại quán và bán qua GrabFood, ShopeeFood, Baemin, BeFood.',
    filing: 'Đăng ký hóa đơn điện tử máy tính tiền và kê khai theo quý.',
  },
];

const formatVND = (num: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.round(num));

/** Số tiền chạy mượt tới giá trị mới */
const AnimatedMoney: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const [shown, setShown] = useState(value);
  const fromRef = React.useRef(value);

  useEffect(() => {
    const controls = animate(fromRef.current, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        fromRef.current = v;
        setShown(v);
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span className={className}>{formatVND(shown)}</span>;
};

export const TaxCalculatorInteractive: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('online');
  const [revenue, setRevenue] = useState<Record<TabKey, number>>({
    online: 1_250_000_000,
    rental: 35_000_000,
    affiliate: 450_000_000,
    restaurant: 850_000_000,
  });
  const [rentalMonths, setRentalMonths] = useState(12);
  const [deductedAtSource, setDeductedAtSource] = useState(true);

  const cfg = TABS.find((t) => t.key === tab)!;
  const input = revenue[tab];
  const annualRevenue = tab === 'rental' ? input * rentalMonths : input;
  const taxable = annualRevenue > THRESHOLD;
  const vat = taxable ? annualRevenue * cfg.vat : 0;
  const pit = taxable ? annualRevenue * cfg.pit : 0;
  const total = vat + pit;
  const ratePct = ((cfg.vat + cfg.pit) * 100).toString().replace('.', ',');

  const taxPaidAtSource = tab === 'affiliate' && deductedAtSource ? annualRevenue * 0.1 : 0;
  const refundable = Math.max(0, taxPaidAtSource - total);

  const meterMax = Math.max(THRESHOLD * 2, annualRevenue * 1.1);
  const meterFill = Math.min(100, (annualRevenue / meterMax) * 100);
  const meterTick = (THRESHOLD / meterMax) * 100;

  const setInput = (v: number) => setRevenue((r) => ({ ...r, [tab]: Math.max(0, v || 0) }));

  const sliderMax = tab === 'rental' ? 200_000_000 : 8_000_000_000;
  const sliderStep = tab === 'rental' ? 1_000_000 : 20_000_000;

  return (
    <section id="tax-calculator" className="relative py-20 md:py-28">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="glass inline-flex items-center gap-2 text-emerald-700 text-[12px] font-extrabold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            <Calculator className="w-4 h-4" />
            <span>Mô phỏng Thuế theo Nghị định 141/2026/NĐ-CP & Luật 48/2024/QH15</span>
          </div>
          <h2 className="text-[30px] sm:text-[44px] font-extrabold text-slate-900 tracking-tight leading-tight">
            Mô phỏng <span className="text-shimmer">số thuế phải nộp</span> <br className="hidden sm:block" />
            cho từng mô hình kinh doanh
          </h2>
          <p className="mt-4 text-[15px] sm:text-[16px] text-slate-600">
            Kéo thanh trượt hoặc nhập doanh thu, kết quả cập nhật ngay lập tức theo ngưỡng miễn thuế 1 tỷ đồng/năm (áp dụng từ 2026).
          </p>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Mô hình kinh doanh" className="glass relative mx-auto mb-8 flex max-w-3xl items-center gap-1 rounded-2xl p-1.5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-[13px] sm:text-[14px] font-bold transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                tab === t.key ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === t.key && (
                <motion.span
                  layoutId="calc-tab-pill"
                  className="absolute inset-0 rounded-xl bg-white shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <t.icon className={`relative h-4 w-4 ${tab === t.key ? t.text : ''}`} />
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Calculator body */}
        <div className="glass rounded-[2rem] p-5 sm:p-10 shadow-floating">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
            >
              {/* Inputs */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <label htmlFor="revenue-input" className="block text-[14px] font-bold text-slate-800 mb-2">
                    {cfg.revenueLabel} (VNĐ)
                  </label>
                  <input
                    id="revenue-input"
                    type="number"
                    step={sliderStep}
                    value={input}
                    onChange={(e) => setInput(Number(e.target.value))}
                    className="w-full bg-white/90 border border-slate-200 rounded-xl px-4 py-3 text-[18px] text-slate-900 font-mono font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                  />
                  <input
                    type="range"
                    aria-label={`${cfg.revenueLabel} thanh trượt`}
                    min={0}
                    max={sliderMax}
                    step={sliderStep}
                    value={Math.min(input, sliderMax)}
                    onChange={(e) => setInput(Number(e.target.value))}
                    className={`mt-4 w-full cursor-pointer ${cfg.ring} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`}
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>0</span>
                    <span>{tab === 'rental' ? '200 triệu/tháng' : '8 tỷ/năm'}</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-2">{cfg.note}</p>
                </div>

                {tab === 'rental' && (
                  <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-2">Số tháng cho thuê trong năm</label>
                    <select
                      value={rentalMonths}
                      onChange={(e) => setRentalMonths(Number(e.target.value))}
                      className="w-full bg-white/90 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>{m} tháng</option>
                      ))}
                    </select>
                  </div>
                )}

                {tab === 'affiliate' && (
                  <label className="flex items-center gap-3 bg-white/80 p-4 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deductedAtSource}
                      onChange={(e) => setDeductedAtSource(e.target.checked)}
                      className="w-5 h-5 accent-purple-500"
                    />
                    <span className="text-[13px] font-semibold text-slate-800">
                      Sàn đã khấu trừ tạm nộp 10% tại nguồn trước khi chi trả
                    </span>
                  </label>
                )}

                {/* Threshold meter */}
                <div className="bg-white/80 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex justify-between text-[12px] font-semibold text-slate-600">
                    <span>Doanh thu năm: <b className="text-slate-900">{formatVND(annualRevenue)}</b></span>
                    <span className={taxable ? 'text-amber-600' : 'text-emerald-600'}>
                      {taxable ? 'Vượt ngưỡng 1 tỷ (Kê khai & nộp thuế)' : 'Dưới 1 tỷ/năm: MIỄN thuế 100%'}
                    </span>
                  </div>
                  <div className="relative h-3 rounded-full bg-slate-100">
                    <motion.div
                      animate={{ width: `${meterFill}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      className={`h-full rounded-full bg-gradient-to-r ${taxable ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-teal-500'}`}
                    />
                    <div
                      className="absolute -top-1.5 h-6 w-[2px] bg-slate-700"
                      style={{ left: `${meterTick}%` }}
                      title="Ngưỡng 1 tỷ"
                    />
                    <span
                      className="absolute top-5 -translate-x-1/2 text-[10px] font-bold text-slate-500"
                      style={{ left: `${meterTick}%` }}
                    >
                      1 tỷ đồng
                    </span>
                  </div>
                  <div className="h-3" />
                </div>
              </div>

              {/* Result */}
              <div className="lg:col-span-6 relative overflow-hidden rounded-3xl bg-white/90 border border-slate-200 p-6 sm:p-8 space-y-6 shadow-card">
                <div className={`pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gradient-to-br ${cfg.accent} opacity-20 blur-3xl`} />
                <div className="relative">
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider block mb-1 ${cfg.text}`}>
                    Tổng thuế phải nộp cả năm ({ratePct}%)
                  </span>
                  <div className={`text-[32px] sm:text-[44px] font-extrabold tracking-tight font-mono ${cfg.text}`}>
                    <AnimatedMoney value={total} />
                  </div>
                  <p className="text-[13px] text-slate-500">
                    {taxable ? `Áp dụng tỷ lệ ${ratePct}% trên doanh thu thực tế khi vượt ngưỡng 1 tỷ` : 'Doanh thu từ 1 tỷ đồng/năm trở xuống được MIỄN thuế 100% (Nghị định 141/2026/NĐ-CP)'}
                  </p>
                </div>

                <div className="relative grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[12px] text-slate-500 block mb-1">Thuế GTGT ({(cfg.vat * 100).toString().replace('.', ',')}%)</span>
                    <AnimatedMoney value={vat} className="text-[15px] font-bold text-slate-800 font-mono" />
                  </div>
                  <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[12px] text-slate-500 block mb-1">Thuế TNCN ({(cfg.pit * 100).toString().replace('.', ',')}%)</span>
                    <AnimatedMoney value={pit} className="text-[15px] font-bold text-slate-800 font-mono" />
                  </div>
                </div>

                {tab === 'affiliate' && deductedAtSource && (
                  <div className="relative p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-purple-900 font-semibold">Số thuế đã bị tạm giữ 10%:</span>
                      <AnimatedMoney value={taxPaidAtSource} className="font-bold text-purple-900 font-mono" />
                    </div>
                    {refundable > 0 && (
                      <div className="flex justify-between text-[13px] pt-1 border-t border-purple-200">
                        <span className="text-emerald-700 font-bold">Có thể được hoàn lại:</span>
                        <AnimatedMoney value={refundable} className="font-extrabold text-emerald-600 font-mono" />
                      </div>
                    )}
                  </div>
                )}

                <div className="relative p-3.5 bg-emerald-50/80 rounded-xl text-[12px] text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{cfg.filing}</span>
                </div>

                <div className="relative flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kết quả tính toán chuẩn hóa theo Nghị định 141/2026/NĐ-CP, Nghị định 68/2026/NĐ-CP & Luật 48/2024/QH15</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
