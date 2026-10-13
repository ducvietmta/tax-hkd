import React from 'react';

export const BrandStrip: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 border-y border-[#ECECEC]">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        {/* Left Heading */}
        <div className="flex-shrink-0 text-center md:text-left text-[#6B6B6B] text-[14px] leading-tight font-medium">
          <div>Được tin tưởng bởi</div>
          <div>nhiều nhãn hàng</div>
        </div>

        {/* Divider on desktop */}
        <div className="hidden md:block w-px h-10 bg-[#ECECEC]" />

        {/* Brand Logos Row */}
        <div className="flex-1 flex flex-wrap items-center justify-center md:justify-between gap-8 sm:gap-12 opacity-80 hover:opacity-100 transition-opacity">
          {/* L'ORÉAL PARIS */}
          <div className="flex flex-col items-center">
            <span className="font-serif font-black tracking-widest text-[18px] text-[#0A0A0A]">
              L'ORÉAL
            </span>
            <span className="text-[8px] tracking-[0.25em] font-sans text-[#6B6B6B]">
              PARIS
            </span>
          </div>

          {/* MAYBELLINE NEW YORK */}
          <div className="flex flex-col items-center">
            <span className="font-sans font-black tracking-wider text-[16px] text-[#0A0A0A]">
              MAYBELLINE
            </span>
            <span className="text-[7px] tracking-[0.2em] font-sans font-bold text-[#6B6B6B]">
              NEW YORK
            </span>
          </div>

          {/* Tefal */}
          <div className="flex items-center">
            <span className="font-sans font-black italic tracking-tight text-[22px] text-[#0A0A0A]">
              Tefal
            </span>
          </div>

          {/* Xiaomi MI */}
          <div className="w-8 h-8 rounded-xl bg-[#0A0A0A] flex items-center justify-center text-white font-bold text-[13px]">
            mi
          </div>

          {/* PNJ */}
          <div className="flex items-center gap-1.5 font-bold text-[19px] tracking-wider text-[#0A0A0A]">
            <svg className="w-5 h-5 text-[#0A0A0A]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 9l10 13 10-13-10-7zm0 3.5l6.5 4.5H5.5L12 5.5z" />
            </svg>
            <span>PNJ</span>
          </div>
        </div>
      </div>
    </section>
  );
};
