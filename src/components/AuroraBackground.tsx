import React from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';

/** Nền sáng: aurora blobs + lưới + vệt sáng đi theo con trỏ chuột */
export const AuroraBackground: React.FC = () => {
  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${x}px ${y}px, rgba(16,185,129,0.13), transparent 70%)`;

  React.useEffect(() => {
    if (!window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    let frame = 0;
    let latestX = -500, latestY = -500;
    const move = (e: MouseEvent) => {
      latestX = e.clientX; latestY = e.clientY;
      if (!frame) frame = requestAnimationFrame(() => {
        x.set(latestX); y.set(latestY); frame = 0;
      });
    };
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(frame); };
  }, [x, y]);

  return (
    <div className="tax-aurora pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#F7FAFC]" aria-hidden>
      <div
        className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-emerald-300/40 blur-[110px]"
        style={{ animation: 'blob 18s ease-in-out infinite' }}
      />
      <div
        className="absolute top-20 -right-40 h-[560px] w-[560px] rounded-full bg-cyan-300/40 blur-[120px]"
        style={{ animation: 'blob 22s ease-in-out infinite reverse' }}
      />
      <div
        className="absolute top-[55%] left-[30%] h-[480px] w-[480px] rounded-full bg-indigo-300/30 blur-[120px]"
        style={{ animation: 'blob 26s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-0 -left-20 h-[420px] w-[420px] rounded-full bg-fuchsia-200/30 blur-[110px]"
        style={{ animation: 'blob 20s ease-in-out infinite reverse' }}
      />
      <div className="bg-grid absolute inset-0" />
      <motion.div className="absolute inset-0" style={{ background: spotlight }} />
    </div>
  );
};
