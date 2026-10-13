import React, { useEffect, useRef, useState } from 'react';
import { motion, animate, useInView } from 'framer-motion';
import { BrainCircuit, ScanSearch, Scale, ShieldCheck, Calculator, Radar, Zap, Lock } from 'lucide-react';

const TECH_CHIPS = [
  { icon: BrainCircuit, label: 'AI hiểu ngôn ngữ tự nhiên' },
  { icon: Scale, label: 'Tự động bóc tách căn cứ pháp lý' },
  { icon: ShieldCheck, label: 'Bộ lọc an toàn nhiều lớp' },
  { icon: Calculator, label: 'Tính thuế thời gian thực' },
  { icon: Radar, label: 'Rà soát rủi ro dòng tiền' },
  { icon: Zap, label: 'Phản hồi trong vài giây' },
  { icon: Lock, label: 'Chỉ trả lời đúng phạm vi thuế HKD' },
];

const STATS = [
  { value: 1, suffix: ' tỷ', label: 'Ngưỡng doanh thu/năm được miễn thuế (Nghị định 141/2026/NĐ-CP)', decimals: 0 },
  { value: 1.5, suffix: '%', label: 'Thuế suất TMĐT (GTGT + TNCN)', decimals: 1 },
  { value: 7, suffix: '%', label: 'Thuế suất nhóm dịch vụ, affiliate', decimals: 0 },
  { value: 10, suffix: '%', label: 'Thuế suất cho thuê tài sản', decimals: 0 },
];

const STEPS = [
  { icon: ScanSearch, title: 'Hiểu câu hỏi', desc: 'AI phân tích ý định và kiểm tra đúng phạm vi thuế HKD/CNKD.' },
  { icon: BrainCircuit, title: 'Suy luận', desc: 'Đối chiếu Nghị định 141/2026, Nghị định 68/2026 và Luật 48/2024.' },
  { icon: Scale, title: 'Bóc tách căn cứ', desc: 'Câu trả lời và căn cứ pháp lý được tách thành hai khối rõ ràng.' },
  { icon: ShieldCheck, title: 'Kiểm duyệt', desc: 'Đầu ra được rà soát để chặn nội dung lạc đề hoặc rò rỉ.' },
];

const Counter: React.FC<{ value: number; suffix: string; decimals: number }> = ({ value, suffix, decimals }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setN(v),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref}>
      {n.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export const TechShowcase: React.FC = () => {
  const loop = [...TECH_CHIPS, ...TECH_CHIPS];

  return (
    <section className="relative py-16 md:py-24">
      {/* Marquee */}
      <div
        className="relative overflow-hidden py-3"
        style={{
          maskImage: 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)',
        }}
      >
        <div className="flex w-max gap-4" style={{ animation: 'marquee 38s linear infinite' }}>
          {loop.map((c, i) => (
            <div key={i} className="glass flex items-center gap-2.5 rounded-full px-5 py-2.5 shadow-clean whitespace-nowrap">
              <c.icon className="h-4 w-4 text-emerald-600" />
              <span className="text-[13px] font-semibold text-slate-700">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 mt-16">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -6 }}
              className="glass rounded-3xl p-5 sm:p-6 shadow-card text-center"
            >
              <div className="text-[30px] sm:text-[40px] font-extrabold text-shimmer leading-tight">
                <Counter value={s.value} suffix={s.suffix} decimals={s.decimals} />
              </div>
              <p className="mt-1 text-[12px] sm:text-[13px] text-slate-600 font-medium leading-snug">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Pipeline */}
        <div className="mt-20 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[28px] sm:text-[38px] font-extrabold tracking-tight text-slate-900"
          >
            Cách trợ lý AI <span className="text-shimmer">xử lý mỗi câu hỏi</span>
          </motion.h2>
          <p className="mt-3 text-[15px] text-slate-600">Bốn bước tự động, minh bạch và có kiểm soát.</p>
        </div>

        <div className="relative mt-12 grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* connecting line (desktop) */}
          <div className="absolute left-[12%] right-[12%] top-[38px] hidden md:block h-[2px] bg-slate-200/80 overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: 'easeInOut' }}
              className="h-full origin-left bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500"
            />
          </div>

          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: 0.15 + i * 0.15, duration: 0.6 }}
              className="relative text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 4 }}
                className="relative mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-3xl bg-white shadow-floating border border-slate-100"
              >
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-[11px] font-bold text-white shadow">
                  {i + 1}
                </span>
                <s.icon className="h-8 w-8 text-emerald-600" />
              </motion.div>
              <h3 className="text-[16px] font-bold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-[13px] text-slate-600 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
