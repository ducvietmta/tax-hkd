import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { Calculator, ShoppingBag, Home, Smartphone, Utensils, CheckCircle2, Sparkles } from 'lucide-react';
import { estimateHomepageTax } from '../services/homepageTaxEstimate';

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
    note: 'Mô phỏng hoạt động phân phối hàng hóa; doanh thu là tiền bán hàng, không phải tiền ròng sau phí sàn.',
    filing: 'Đối soát số sàn đã khấu trừ, nộp thay với nghĩa vụ thực tế theo Nghị định 252/2026/NĐ-CP; không mặc định sàn chỉ khấu trừ khi vượt 1 tỷ.',
  },
  {
    key: 'rental', label: 'Cho thuê nhà', icon: Home, vat: 0.05, pit: 0.05,
    accent: 'from-sky-400 to-blue-500', text: 'text-blue-600', ring: 'accent-blue-500',
    revenueLabel: 'Giá cho thuê hàng tháng',
    note: 'Doanh thu cho thuê tài sản từ 1 tỷ đồng/năm trở xuống được miễn thuế theo Nghị định 141/2026.',
    filing: 'Đối chiếu hợp đồng và hồ sơ khai thuế cho thuê bất động sản theo quy định hiện hành; mức trừ 1 tỷ dùng chung cho các hợp đồng của một cá nhân.',
  },
  {
    key: 'affiliate', label: 'KOC / Affiliate', icon: Smartphone, vat: 0.05, pit: 0.02,
    accent: 'from-violet-400 to-fuchsia-500', text: 'text-purple-600', ring: 'accent-purple-500',
    revenueLabel: 'Tổng hoa hồng Affiliate / booking KOC cả năm',
    note: 'Chỉ mô phỏng thu nhập kinh doanh: chọn đúng môi giới hay quảng cáo/nội dung số. Khoản tiền công, tiền lương cần được xét riêng, không tự chuyển sang thu nhập kinh doanh.',
    filing: 'Khoản ghi “tax” hoặc giữ lại 10% chưa chứng minh đã nộp TNCN thay. Cần chứng từ xác định loại thuế, người nộp, kỳ và số đã nộp; không tự bù GTGT vào TNCN.',
  },
  {
    key: 'restaurant', label: 'Quán ăn / Cafe', icon: Utensils, vat: 0.03, pit: 0.015,
    accent: 'from-amber-400 to-orange-500', text: 'text-amber-600', ring: 'accent-amber-500',
    revenueLabel: 'Doanh thu quán ăn / cafe cả năm',
    note: 'Bao gồm doanh thu ăn tại quán và bán qua nền tảng giao đồ ăn, trước khi trừ phí nền tảng.',
    filing: 'Kiểm tra diện sử dụng hóa đơn điện tử theo Nghị định 141/2026/NĐ-CP và Nghị định 254/2026/NĐ-CP; kỳ khai phụ thuộc phương pháp và doanh thu.',
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
  const [vatReductionEligible, setVatReductionEligible] = useState(false);
  const [resident, setResident] = useState(true);
  const [affiliatePitRate, setAffiliatePitRate] = useState(0.02);

  const cfg = TABS.find((t) => t.key === tab)!;
  const input = revenue[tab];
  const annualRevenue = tab === 'rental' ? input * rentalMonths : input;
  const { taxable, vat, pitBefore, pit, total, effectiveVatRate } = estimateHomepageTax(
    annualRevenue, cfg.vat, tab === 'affiliate' ? affiliatePitRate : cfg.pit, tab === 'rental', vatReductionEligible, resident,
  );

  const meterMax = Math.max(THRESHOLD * 2, annualRevenue * 1.1);
  const meterFill = Math.min(100, (annualRevenue / meterMax) * 100);
  const meterTick = (THRESHOLD / meterMax) * 100;

  const setInput = (v: number) => setRevenue((r) => ({ ...r, [tab]: Math.max(0, v || 0) }));

  const sliderMax = tab === 'rental' ? 200_000_000 : 8_000_000_000;
  const sliderStep = tab === 'rental' ? 1_000_000 : 20_000_000;

  return (
    <section id="tax-calculator" className="relative py-10 md:py-20">
      <div className="max-w-[1200px] mx-auto px-3.5 sm:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-12">
          <div className="glass inline-flex items-center gap-1.5 sm:gap-2 text-emerald-700 text-[11px] sm:text-[12px] font-extrabold tracking-widest uppercase px-3 py-1 sm:px-4 sm:py-1.5 rounded-full mb-2.5 sm:mb-4">
            <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Mô phỏng thuế kinh doanh năm 2026</span>
          </div>
          <h2 className="text-[22px] sm:text-[38px] font-extrabold text-slate-900 tracking-tight leading-tight">
            Mô phỏng <span className="text-shimmer">số thuế phải nộp</span> <br className="hidden sm:block" />
            cho từng mô hình kinh doanh
          </h2>
          <p className="mt-2.5 sm:mt-4 text-[13px] sm:text-[15px] text-slate-600 leading-relaxed">
            Minh họa một hoạt động kinh doanh của cá nhân cư trú, chưa có doanh thu khác. TNCN chọn phương pháp theo doanh thu trong dải được phép; chưa xét chuyển tiếp hoặc kỳ ổn định phương pháp. GTGT và TNCN có cơ sở tính riêng.
          </p>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Mô hình kinh doanh" className="glass relative mx-auto mb-5 sm:mb-8 flex max-w-3xl items-center gap-1 rounded-2xl p-1 sm:p-1.5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex-1 whitespace-nowrap rounded-xl px-2.5 py-2 sm:px-4 sm:py-2.5 text-[12px] sm:text-[14px] font-bold transition-colors flex items-center justify-center gap-1.5 sm:gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
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
              <t.icon className={`relative h-3.5 w-3.5 sm:h-4 sm:w-4 ${tab === t.key ? t.text : ''}`} />
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Calculator body */}
        <div className="glass rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-8 md:p-10 shadow-floating">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start"
            >
              {/* Inputs */}
              <div className="lg:col-span-6 space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="revenue-input" className="block text-[13px] sm:text-[14px] font-bold text-slate-800 mb-1.5 sm:mb-2">
                    {cfg.revenueLabel} (VNĐ)
                  </label>
                  <input
                    id="revenue-input"
                    type="number"
                    step={sliderStep}
                    value={input}
                    onChange={(e) => setInput(Number(e.target.value))}
                    className="w-full bg-white/90 border border-slate-200 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-[16px] sm:text-[18px] text-slate-900 font-mono font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
                  />
                  <input
                    type="range"
                    aria-label={`${cfg.revenueLabel} thanh trượt`}
                    min={0}
                    max={sliderMax}
                    step={sliderStep}
                    value={Math.min(input, sliderMax)}
                    onChange={(e) => setInput(Number(e.target.value))}
                    className={`mt-3 sm:mt-4 w-full cursor-pointer ${cfg.ring} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`}
                  />
                  <div className="flex justify-between text-[10.5px] sm:text-[11px] text-slate-400 font-medium">
                    <span>0</span>
                    <span>{tab === 'rental' ? '200 triệu/tháng' : '8 tỷ/năm'}</span>
                  </div>
                  <p className="text-[11.5px] sm:text-[12px] text-slate-500 mt-1.5 sm:mt-2">{cfg.note}</p>
                </div>

                {tab === 'rental' && (
                  <div>
                    <label className="block text-[12.5px] sm:text-[13px] font-bold text-slate-800 mb-1.5 sm:mb-2">Số tháng cho thuê trong năm</label>
                    <select
                      value={rentalMonths}
                      onChange={(e) => setRentalMonths(Number(e.target.value))}
                      className="w-full bg-white/90 border border-slate-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-[13px] sm:text-[14px] text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>{m} tháng</option>
                      ))}
                    </select>
                  </div>
                )}

                {tab === 'affiliate' && (
                  <label className="block text-[12.5px] sm:text-[13px] font-semibold text-slate-800">
                    Bản chất hoạt động kinh doanh đã xác định
                    <select value={affiliatePitRate} onChange={(e) => setAffiliatePitRate(Number(e.target.value))} className="mt-1.5 sm:mt-2 w-full border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-white text-[12.5px] sm:text-[13px]">
                      <option value={0.02}>Dịch vụ môi giới hưởng hoa hồng — TNCN gốc 2%</option>
                      <option value={0.05}>Quảng cáo số / sản phẩm thông tin số — TNCN gốc 5%</option>
                    </select>
                  </label>
                )}
                {tab !== 'rental' && (
                  <label className="flex items-start gap-2.5 sm:gap-3 bg-white/80 p-3 sm:p-4 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vatReductionEligible}
                      onChange={(e) => setVatReductionEligible(e.target.checked)}
                      className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 accent-purple-500 shrink-0"
                    />
                    <span className="text-[12px] sm:text-[13px] font-semibold text-slate-800 leading-snug">
                      Toàn bộ hàng hóa/dịch vụ đủ điều kiện giảm 20% tỷ lệ GTGT theo NQ 204/2025 và NĐ 174/2025 (đến 31/12/2026)
                    </span>
                  </label>
                )}
                <label className="flex items-start gap-2.5 sm:gap-3 text-[12px] sm:text-[13px] text-slate-700 leading-snug">
                  <input type="checkbox" checked={resident} onChange={(e) => setResident(e.target.checked)} className="mt-0.5 accent-emerald-600 shrink-0" />
                  Cá nhân cư trú, xét giảm 30% TNCN kinh doanh theo NQ 43/2026 khi tổng doanh thu năm không quá 10 tỷ đồng. Mô phỏng này không tính cho cá nhân không cư trú.
                </label>

                {/* Threshold meter */}
                <div className="bg-white/80 rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between text-[11px] sm:text-[12px] font-semibold text-slate-600 gap-1">
                    <span>Doanh thu năm: <b className="text-slate-900">{formatVND(annualRevenue)}</b></span>
                    <span className={taxable ? 'text-amber-600' : 'text-emerald-600'}>
                      {taxable ? 'Vượt ngưỡng 1 tỷ' : 'Không quá 1 tỷ: không nộp GTGT, TNCN'}
                    </span>
                  </div>
                  <div className="relative h-2.5 sm:h-3 rounded-full bg-slate-100">
                    <motion.div
                      animate={{ width: `${meterFill}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      className={`h-full rounded-full bg-gradient-to-r ${taxable ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-teal-500'}`}
                    />
                    <div
                      className="absolute -top-1.5 h-5 sm:h-6 w-[2px] bg-slate-700"
                      style={{ left: `${meterTick}%` }}
                      title="Ngưỡng 1 tỷ"
                    />
                    <span
                      className="absolute top-4 sm:top-5 -translate-x-1/2 text-[9.5px] sm:text-[10px] font-bold text-slate-500 whitespace-nowrap"
                      style={{ left: `${meterTick}%` }}
                    >
                      1 tỷ đồng
                    </span>
                  </div>
                  <div className="h-2" />
                </div>
              </div>

              {/* Result */}
              <div className="lg:col-span-6 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/90 border border-slate-200 p-4 sm:p-7 space-y-4 sm:space-y-6 shadow-card">
                <div className={`pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gradient-to-br ${cfg.accent} opacity-20 blur-3xl`} />
                <div className="relative">
                  <span className={`text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-wider block mb-1 ${cfg.text}`}>
                    Tổng GTGT và TNCN mô phỏng năm 2026
                  </span>
                  <div className={`text-[24px] sm:text-[38px] font-extrabold tracking-tight font-mono ${cfg.text} leading-tight`}>
                    {resident && total !== null ? <AnimatedMoney value={total} /> : '—'}
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-slate-500 mt-1 leading-relaxed">
                    {!resident ? 'Cá nhân không cư trú: cần tính theo quy định riêng, không dùng kết quả mô phỏng này.' : pit === null ? 'Doanh thu trên 3 tỷ: cần thu nhập tính thuế hợp lệ để tính TNCN; trên 3 đến 50 tỷ áp dụng 17%, trên 50 tỷ áp dụng 20%. Chưa đủ dữ kiện để cộng tổng.' : taxable ? 'GTGT tính trên toàn bộ doanh thu; TNCN theo doanh thu tính trên phần vượt 1 tỷ. Giảm GTGT và giảm TNCN được xét độc lập.' : 'Không quá 1 tỷ đồng/năm: không phải nộp GTGT và TNCN từ kinh doanh theo Nghị định 141/2026/NĐ-CP; vẫn cần xét các nghĩa vụ đăng ký, thông báo.'}
                  </p>
                </div>

                <div className="relative grid grid-cols-2 gap-2.5 sm:gap-4 pt-3.5 sm:pt-4 border-t border-slate-100">
                  <div className="bg-slate-50/90 p-2.5 sm:p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] sm:text-[12px] text-slate-500 block mb-0.5 sm:mb-1">Thuế GTGT ({(effectiveVatRate * 100).toString().replace('.', ',')}%)</span>
                    {resident ? <AnimatedMoney value={vat} className="text-[13.5px] sm:text-[15px] font-bold text-slate-800 font-mono" /> : '—'}
                  </div>
                  <div className="bg-slate-50/90 p-2.5 sm:p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] sm:text-[12px] text-slate-500 block mb-0.5 sm:mb-1">TNCN sau xét giảm NQ 43</span>
                    {resident && pit !== null ? <><AnimatedMoney value={pit} className="text-[13.5px] sm:text-[15px] font-bold text-slate-800 font-mono" /><p className="text-[11px] text-slate-500 mt-1">Trước giảm: {formatVND(pitBefore!)}</p></> : <span className="text-xs">Theo phương pháp riêng</span>}
                  </div>
                </div>

                <div className="relative p-2.5 sm:p-3.5 bg-emerald-50/80 rounded-xl text-[11.5px] sm:text-[12px] text-emerald-800 flex items-start gap-2 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{cfg.filing}</span>
                </div>

                <div className="relative flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-slate-400 font-medium leading-relaxed">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>Căn cứ: NĐ 68/2026 sửa bởi NĐ 141/2026; NQ 43/2026; NQ 204/2025 và NĐ 174/2025.</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
