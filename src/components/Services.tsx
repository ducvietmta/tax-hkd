import React from 'react';
import { ArrowRight, Video, Users, BarChart3 } from 'lucide-react';

interface ServiceItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const SERVICES: ServiceItem[] = [
  {
    icon: <Video className="w-6 h-6 text-[#0A0A0A] stroke-[1.75]" />,
    title: 'Chiến lược & Kịch bản',
    description: 'Xây dựng chiến lược, concept và kịch bản phù hợp với từng nhãn hàng',
  },
  {
    icon: <Users className="w-6 h-6 text-[#0A0A0A] stroke-[1.75]" />,
    title: 'Setup & Vận hành',
    description: 'Chuẩn bị studio, thiết bị, host/KOC và vận hành phiên live chuyên nghiệp',
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-[#0A0A0A] stroke-[1.75]" />,
    title: 'Tối ưu & Báo cáo',
    description: 'Phân tích hiệu quả, đề xuất tối ưu cho các phiên live tiếp theo',
  },
];

export const Services: React.FC = () => {
  return (
    <section id="services" className="py-24 md:py-32">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Heading & Description */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <span className="text-[12px] font-bold tracking-[0.2em] text-[#888888] uppercase mb-4 block">
              DỊCH VỤ
            </span>
            <h2 className="text-[38px] sm:text-[46px] font-extrabold tracking-tight text-[#0A0A0A] leading-[1.12] mb-6">
              Từ chiến lược <br />
              đến phiên live <br />
              tạo doanh số
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#6B6B6B] leading-relaxed mb-8 max-w-[380px]">
              Chúng tôi cung cấp giải pháp livestream trọn gói, tinh gọn và hiệu quả cho từng nhãn hàng.
            </p>

            <div>
              <a
                href="#services"
                className="group inline-flex items-center gap-2 text-[15px] font-bold text-[#0A0A0A] hover:text-[#FE2C55] transition-colors"
              >
                <span>Tìm hiểu dịch vụ</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Right Column: 3 Horizontal Rows with 1px divider */}
          <div className="lg:col-span-7 flex flex-col border-t border-[#ECECEC]">
            {SERVICES.map((item, idx) => (
              <div
                key={idx}
                className="group py-7 sm:py-8 border-b border-[#ECECEC] flex items-center justify-between gap-6 cursor-pointer hover:bg-black/[0.01] transition-all duration-200"
              >
                <div className="flex items-center gap-5 sm:gap-6">
                  {/* Left Icon */}
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>

                  {/* Text Content */}
                  <div>
                    <h3 className="text-[17px] sm:text-[18px] font-bold text-[#0A0A0A] tracking-tight group-hover:text-[#FE2C55] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[13px] sm:text-[14px] text-[#6B6B6B] leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Right Arrow */}
                <div className="text-[#0A0A0A] group-hover:text-[#FE2C55] transition-all group-hover:translate-x-1 flex-shrink-0 pr-2">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
