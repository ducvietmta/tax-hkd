import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, FileCheck, CheckCircle2, XCircle, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

interface AuditCheck {
  id: string;
  name: string;
  status: 'passed' | 'warning' | 'failed';
  details: string;
  recommendation: string;
  lawCite: string;
}

const SAMPLE_HKD_CHECKS: AuditCheck[] = [
  {
    id: 'bank-vs-seller',
    name: 'Đối soát dòng tiền Tài khoản Ngân hàng & Báo cáo Sàn TMĐT',
    status: 'warning',
    details: 'Dòng tiền ghi có vào tài khoản cá nhân trong năm là 1,2 tỷ đồng, nhưng doanh thu kê khai trên thuế khoán chỉ 200 triệu đồng (Chênh lệch 1 tỷ đồng).',
    recommendation: 'Cần phân loại rõ các khoản chuyển tiền cá nhân không mang tính chất kinh doanh (vay mượn, người thân chuyển) và chủ động chuyển sang phương pháp kê khai để tránh bị phạt trốn thuế từ 1-3 lần.',
    lawCite: 'Khoản 7 Điều 1 Nghị định 91/2022/NĐ-CP & Luật Quản lý Thuế số 38',
  },
  {
    id: 'threshold-1b',
    name: 'Kiểm tra Ngưỡng miễn thuế 1 Tỷ đồng / Năm (Nghị định 141/2026/NĐ-CP)',
    status: 'passed',
    details: 'Doanh thu năm 2026 đạt 1,2 tỷ đồng (Vượt ngưỡng miễn thuế 1 tỷ đồng), phần doanh thu vượt ngưỡng thuộc diện kê khai chịu thuế theo tỷ lệ 1.5% và được sàn TMĐT hỗ trợ khấu trừ nộp thay.',
    recommendation: 'Đối soát báo cáo khấu trừ của sàn TMĐT qua ứng dụng eTax Mobile để theo dõi số thuế đã nộp thay theo Nghị định 141/2026/NĐ-CP.',
    lawCite: 'Nghị định 141/2026/NĐ-CP & Luật Thuế GTGT 48/2024/QH15',
  },
  {
    id: 'pos-invoice-check',
    name: 'Điều kiện Hóa đơn điện tử máy tính tiền (Quán ăn / Bán lẻ)',
    status: 'passed',
    details: 'Hộ kinh doanh đã đăng ký thành công Mẫu 01/ĐKTĐ-HĐĐT và kết nối máy tính tiền trực tiếp với hệ thống cơ quan thuế.',
    recommendation: 'Xuất hóa đơn theo từng lần bán hàng cho khách hàng để được hưởng chính sách thuế minh bạch.',
    lawCite: 'Điều 90 Luật Quản lý Thuế & Nghị định 123/2020/NĐ-CP',
  },
  {
    id: 'affiliate-tax-withholding',
    name: 'Hồ sơ Hoàn thuế TNCN 10% bị khấu trừ tại nguồn (Affiliate / KOC)',
    status: 'warning',
    details: 'Đã bị Shopee/TikTok khấu trừ 10% tiền thuế TNCN (Tổng 24 triệu), trong khi mức thuế thực tế phải nộp của HKD chỉ là 7% (16.8 triệu).',
    recommendation: 'Yêu cầu sàn cấp Chứng từ khấu trừ thuế điện tử và làm hồ sơ đề nghị hoàn trả 7.2 triệu đồng tiền thuế nộp thừa.',
    lawCite: 'Điều 28 Thông tư 111/2013/TT-BTC',
  },
  {
    id: 'rental-contract-check',
    name: 'Hồ sơ pháp lý Hợp đồng Cho thuê nhà & Nghĩa vụ nộp thuế',
    status: 'passed',
    details: 'Hợp đồng thuê ghi rõ bên cho thuê trực tiếp kê khai và nộp thuế 10% theo từng quý.',
    recommendation: 'Lưu trữ bản sao hợp đồng và biên lai nộp tiền điện tử trên eTax Mobile để xuất trình khi cơ quan thuế yêu cầu.',
    lawCite: 'Điều 9 Thông tư 40/2021/TT-BTC',
  },
];

export const TaxRiskAuditDemo: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanRound, setScanRound] = useState(0);
  const [selectedCheck, setSelectedCheck] = useState<AuditCheck>(SAMPLE_HKD_CHECKS[0]);

  const passed = SAMPLE_HKD_CHECKS.filter((c) => c.status === 'passed').length;
  const score = Math.round((passed / SAMPLE_HKD_CHECKS.length) * 100);
  const R = 52;
  const C = 2 * Math.PI * R;

  const handleTriggerScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanRound((n) => n + 1);
    }, 1800);
  };

  return (
    <section id="risk-audit" className="relative py-20 md:py-28">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="glass inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-extrabold text-amber-700 tracking-wide uppercase mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Rà soát rủi ro dòng tiền & truy thu thuế TMĐT</span>
          </div>
          <h2 className="text-[30px] sm:text-[44px] font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            AI đối soát dòng tiền <span className="text-shimmer">trước khi nhận giấy mời</span>
          </h2>
          <p className="text-[15px] sm:text-[16px] text-slate-600 max-w-2xl mx-auto">
            Hỗ trợ chủ shop online và hộ kinh doanh tự kiểm tra mức chênh lệch giữa doanh thu thực tế và số liệu báo cáo lên Chi cục Thuế.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left column */}
          <div className="lg:col-span-6 space-y-6">
            {/* File + score */}
            <div className="glass relative overflow-hidden rounded-3xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-[15px] text-slate-800">Bảng kê sao kê mẫu</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTriggerScan}
                  disabled={isScanning}
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Đang quét...' : 'Phân tích lại'}</span>
                </motion.button>
              </div>

              <div className="relative flex items-center gap-4">
                <div className="relative flex-1 overflow-hidden p-4 bg-white/80 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-[12px] font-mono">
                    XLS
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] sm:text-[14px] font-bold text-slate-900 truncate">BANGKE_DOANHTHU_TIKTOK_2026.xlsx</div>
                    <div className="text-[12px] text-slate-500">Doanh thu sàn: 1.200.000.000 đ • Thuế khoán cũ: 200tr</div>
                  </div>
                  {isScanning && (
                    <motion.div
                      initial={{ x: '-120%' }}
                      animate={{ x: '420%' }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                      className="pointer-events-none absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent"
                    />
                  )}
                </div>

                {/* Score ring */}
                <div className="relative h-[104px] w-[104px] shrink-0">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r={R} fill="none" stroke="#E2E8F0" strokeWidth="10" />
                    <motion.circle
                      key={scanRound}
                      cx="60" cy="60" r={R} fill="none" strokeWidth="10" strokeLinecap="round"
                      stroke="url(#scoreGrad)"
                      strokeDasharray={C}
                      initial={{ strokeDashoffset: C }}
                      animate={{ strokeDashoffset: isScanning ? C : C * (1 - score / 100) }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[22px] font-extrabold text-slate-900 leading-none">{isScanning ? '--' : `${score}%`}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">An toàn</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
                Chênh lệch cao
              </div>
            </div>

            {/* Checklist */}
            <div className="glass rounded-3xl p-6 shadow-card space-y-3">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                5 tiêu chí an toàn thuế của AI
              </span>

              {SAMPLE_HKD_CHECKS.map((check, i) => {
                const active = selectedCheck.id === check.id;
                return (
                  <motion.button
                    type="button"
                    key={`${check.id}-${scanRound}`}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ x: 4 }}
                    onClick={() => setSelectedCheck(check)}
                    aria-pressed={active}
                    className={`w-full text-left relative p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      active ? 'border-emerald-500 bg-emerald-50/80 shadow-xs' : 'bg-white/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isScanning ? (
                        <RefreshCw className="w-5 h-5 text-slate-400 animate-spin flex-shrink-0" />
                      ) : (
                        <>
                          {check.status === 'passed' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                          {check.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
                          {check.status === 'failed' && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                        </>
                      )}
                      <span className="text-[13px] sm:text-[14px] font-bold leading-snug text-slate-800">{check.name}</span>
                    </div>

                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase whitespace-nowrap ${
                        isScanning
                          ? 'bg-slate-100 text-slate-400'
                          : check.status === 'passed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isScanning ? 'Đang quét' : check.status === 'passed' ? 'An toàn' : 'Cần rà soát'}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right column: diagnostic card */}
          <div className="lg:col-span-6 glass rounded-3xl p-6 sm:p-8 shadow-floating space-y-6 lg:sticky lg:top-28">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-white">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="font-bold text-[16px] text-slate-900">Chi tiết tư vấn & khuyến nghị</span>
              </div>
              <span className="text-[12px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                AI Verified
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCheck.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                    Nội dung rủi ro đang xem
                  </span>
                  <h3 className="text-[18px] sm:text-[20px] font-bold text-slate-900">{selectedCheck.name}</h3>
                </div>

                <div className="bg-white/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-1.5">
                  <span className="text-[12px] font-bold text-emerald-800 uppercase tracking-wider block">Phân tích tình huống</span>
                  <p className="text-[14px] text-slate-700 leading-relaxed font-medium">{selectedCheck.details}</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50/90 to-cyan-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200 space-y-1.5">
                  <span className="text-[12px] font-bold text-emerald-800 uppercase tracking-wider block">Giải pháp hợp chuẩn pháp luật</span>
                  <p className="text-[14px] text-emerald-950 leading-relaxed font-medium">{selectedCheck.recommendation}</p>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3 text-[12px] text-slate-500 border-t border-slate-200/70 font-medium">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{selectedCheck.lawCite}</span>
                  </div>
                  <span className="text-slate-400 whitespace-nowrap">Tránh phạt hành chính</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
