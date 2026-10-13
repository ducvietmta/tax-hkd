import React from 'react';
import { LiveVideo } from './LiveVideo';
import { LiveOverlay } from './LiveOverlay';
import { CommentItem } from './LiveOverlay';
import { TrendingUp } from 'lucide-react';

export interface PhoneMockupProps {
  videoSrc?: string;
  imageSrc?: string;
  viewerCount?: string;
  comments?: CommentItem[];
  autoplay?: boolean;
  className?: string;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  videoSrc = '/videos/live-demo.mp4',
  imageSrc = '/images/live-host.jpg',
  viewerCount = '12.4K',
  comments,
  autoplay = true,
  className = '',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none py-6 sm:py-10 ${className}`}>
      {/* Outer 3D Scene Wrapper */}
      <div className="relative flex items-center">
        
        {/* Realistic Ground Contact Shadow */}
        <div
          className="absolute -bottom-7 left-8 sm:left-12 w-[270px] sm:w-[310px] h-[36px] pointer-events-none -z-10"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.1) 48%, transparent 72%)',
            transform: 'rotate(-4deg) scaleY(0.75)',
            filter: 'blur(10px)',
          }}
        />

        {/* Unified 3D Phone Chassis & Screen Assembly */}
        <div
          className="relative transition-transform duration-500 ease-out hover:scale-[1.01]"
          style={{
            perspective: '1200px',
            transform: 'rotateY(-16.5deg) rotateX(9deg) rotateZ(5deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Layer 1: Metallic 3D Thickness / Back Frame Extrusion */}
          <div
            className="absolute -inset-[3px] rounded-[52px] sm:rounded-[58px] pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, #8E8E9C 0%, #4D4D58 25%, #25252B 65%, #151518 100%)',
              transform: 'translateZ(-14px) translateX(7px) translateY(4px)',
              boxShadow: '18px 28px 60px rgba(0,0,0,0.35)',
            }}
          />

          {/* Layer 2: Right Side Titanium Flank with Power Button & Antenna Lines */}
          <div
            className="absolute top-5 -right-[8px] w-[12px] h-[92%] rounded-r-[14px] pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, #9E9EAE 0%, #C4C4D4 15%, #585864 50%, #303038 80%, #1A1A1E 100%)',
              boxShadow: 'inset -1px 0 2px rgba(255,255,255,0.45), 4px 6px 16px rgba(0,0,0,0.4)',
            }}
          >
            {/* Side Power Button */}
            <div className="absolute top-28 -right-[2px] w-[3px] h-14 bg-[#7A7A8A] rounded-r-sm shadow-sm" />
            {/* Antenna Bands */}
            <div className="absolute top-12 left-0 right-0 h-[2px] bg-[#141418]" />
            <div className="absolute bottom-16 left-0 right-0 h-[2px] bg-[#141418]" />
          </div>

          {/* Layer 3: Main Phone Body (Outer Titanium Bezel) */}
          <div className="relative w-[285px] sm:w-[320px] md:w-[340px] h-[580px] sm:h-[640px] md:h-[680px] bg-[#1E1E22] rounded-[48px] sm:rounded-[54px] p-[8px] sm:p-[10px] shadow-[0_22px_55px_rgba(0,0,0,0.28)] border-[2.5px] border-[#4E4E58]">
            
            {/* Metallic Chamfer Light Bevel Ring */}
            <div className="absolute inset-[1px] rounded-[46px] sm:rounded-[52px] border border-white/30 pointer-events-none" />

            {/* Inner Black OLED Bezel */}
            <div className="relative w-full h-full bg-[#000000] rounded-[40px] sm:rounded-[45px] overflow-hidden p-[2.5px]">
              
              {/* Screen Display Container */}
              <div className="relative w-full h-full rounded-[38px] sm:rounded-[43px] overflow-hidden bg-black">
                
                {/* Dynamic Island at Top of Screen */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#000000] rounded-full z-40 flex items-center justify-between px-2.5 shadow-md pointer-events-none">
                  {/* Speaker sensor dot */}
                  <div className="w-2.5 h-2.5 rounded-full bg-[#16161A] border border-[#26262C]" />
                  {/* Front camera dot */}
                  <div className="w-2 h-2 rounded-full bg-[#0a1820]" />
                </div>

                {/* Layer 1: Live Video / Image (Scaled and centered naturally inside 3D screen) */}
                <LiveVideo videoSrc={videoSrc} imageSrc={imageSrc} autoplay={autoplay} />

                {/* Layer 2: TikTok Live UI (Aligned naturally with the 3D screen tilt) */}
                <LiveOverlay viewerCount={viewerCount} comments={comments} />

                {/* Glass Specular Reflection Highlight */}
                <div
                  className="absolute inset-0 pointer-events-none z-20 opacity-30"
                  style={{
                    background: 'linear-gradient(115deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.04) 40%, transparent 65%)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Side Badges: TikTok Logo + Metric Card (Positioned neatly on the right) */}
        <div className="flex flex-col gap-4 absolute -right-14 sm:-right-20 md:-right-24 top-[32%] z-50">
          {/* TikTok App Icon Box */}
          <div className="w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] rounded-[20px] sm:rounded-[24px] bg-[#0A0A0A] shadow-[0_18px_38px_rgba(0,0,0,0.2)] flex items-center justify-center border border-white/10 hover:scale-105 transition-transform duration-300">
            <svg className="w-9 h-9 sm:w-11 sm:h-11" viewBox="0 0 24 24" fill="none">
              <path
                d="M19.321 5.562a5.122 5.122 0 0 1-3.585-1.442A5.138 5.138 0 0 1 14.28 1H11.2v14.48c-.085 1.76-1.554 3.16-3.344 3.16-1.848 0-3.356-1.508-3.356-3.356 0-1.848 1.508-3.356 3.356-3.356.36 0 .707.06 1.032.17V8.895a6.452 6.452 0 0 0-1.032-.083C4.26 8.812 1.35 11.722 1.35 15.284c0 3.562 2.91 6.472 6.472 6.472 3.526 0 6.4-2.84 6.47-6.352V8.423a8.196 8.196 0 0 0 5.029 1.729V7.07c0-.52-.008-1.033-.04-1.508h.04z"
                fill="#FFFFFF"
              />
              <path
                d="M19.321 5.562a5.122 5.122 0 0 1-3.585-1.442V1h-1.2v14.48c-.085 1.76-1.554 3.16-3.344 3.16-1.848 0-3.356-1.508-3.356-3.356 0-1.848 1.508-3.356 3.356-3.356.36 0 .707.06 1.032.17V8.895a6.452 6.452 0 0 0-1.032-.083C4.26 8.812 1.35 11.722 1.35 15.284c0 3.562 2.91 6.472 6.472 6.472 3.526 0 6.4-2.84 6.47-6.352V8.423a8.196 8.196 0 0 0 5.029 1.729V7.07z"
                fill="#25F4EE"
                className="opacity-75 -translate-x-[0.7px] -translate-y-[0.7px]"
              />
              <path
                d="M19.321 5.562a5.122 5.122 0 0 1-3.585-1.442V1h-1.2v14.48c-.085 1.76-1.554 3.16-3.344 3.16-1.848 0-3.356-1.508-3.356-3.356 0-1.848 1.508-3.356 3.356-3.356.36 0 .707.06 1.032.17V8.895a6.452 6.452 0 0 0-1.032-.083C4.26 8.812 1.35 11.722 1.35 15.284c0 3.562 2.91 6.472 6.472 6.472 3.526 0 6.4-2.84 6.47-6.352V8.423a8.196 8.196 0 0 0 5.029 1.729V7.07z"
                fill="#FE2C55"
                className="opacity-75 translate-x-[0.7px] translate-y-[0.7px]"
              />
            </svg>
          </div>

          {/* Floating Metric Card */}
          <div className="bg-white/95 backdrop-blur-xl border border-[#EDEDED] py-3.5 px-5 rounded-[20px] shadow-[0_18px_38px_rgba(0,0,0,0.09)] whitespace-nowrap hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-1.5 text-[#FE2C55]">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[21px] sm:text-[23px] font-extrabold text-[#0A0A0A] tracking-tight">
                +285%
              </span>
            </div>
            <p className="text-[12px] sm:text-[13px] font-medium text-[#6B6B6B] mt-0.5">
              Doanh số trung bình
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
