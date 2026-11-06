import React from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';

/**
 * Architectural luxury canvas:
 * Serene cool-grey ground (#F8FAFC) with subtle ambient emerald/slate glow,
 * precision hairline grid, and smooth interactive cursor illumination.
 */
export const AuroraBackground: React.FC = () => {
  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  const spotlight = useMotionTemplate`radial-gradient(550px circle at ${x}px ${y}px, rgba(5, 150, 105, 0.05), transparent 70%)`;

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
    <div className="tax-aurora pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#F8FAFC]" aria-hidden>
      {/* Subtle architectural ambient lights */}
      <div
        className="absolute -top-48 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-emerald-500/[0.04] blur-[120px]"
      />
      <div
        className="absolute top-1/4 -right-40 h-[480px] w-[480px] rounded-full bg-slate-400/[0.03] blur-[100px]"
      />
      <div
        className="absolute bottom-10 -left-20 h-[400px] w-[400px] rounded-full bg-teal-500/[0.03] blur-[100px]"
      />

      {/* Precision architectural grid */}
      <div className="bg-grid absolute inset-0" />

      {/* Cursor spotlight */}
      <motion.div className="absolute inset-0" style={{ background: spotlight }} />
    </div>
  );
};
