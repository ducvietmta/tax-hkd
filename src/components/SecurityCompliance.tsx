import React from 'react';
import { ShieldCheck, Lock, Smartphone, CheckCircle2 } from 'lucide-react';

export const SecurityCompliance: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white border-t border-slate-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
        <div className="bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-slate-50 border border-emerald-200 rounded-3xl p-8 sm:p-12 md:p-14 shadow-soft">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-emerald-800 text-[12px] font-extrabold tracking-widest uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>BẢO MẬT TUYỆT ĐỐI THÔNG TIN DOANH THU CÁ NHÂN</span>
              </div>
              
              <h2 className="text-[26px] sm:text-[34px] font-extrabold text-slate-900 tracking-tight leading-tight">
                An toàn 100% cho số liệu tài khoản & doanh thu bán hàng
              </h2>

              <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                Mọi thông tin bảng kê doanh thu, số tài khoản và thông tin kinh doanh chỉ được xử lý tạm thời trong phiên tính toán của bạn, cam kết không lưu trữ hoặc chia sẻ với bên thứ ba.
              </p>

              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <div className="flex items-center gap-2 text-[13px] text-slate-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Mã hóa bảo mật HTTPS/TLS 1.3</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-slate-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Không lưu trữ sao kê tài khoản</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-slate-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Tuân thủ Nghị định 13/2023/NĐ-CP</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-slate-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Tự động xóa lịch sử tra cứu</span>
                </div>
              </div>
            </div>

            {/* Right Badges */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-[15px]">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Quyền riêng tư cá nhân</span>
                </div>
                <p className="text-[13px] text-slate-600 font-medium">Bạn hoàn toàn ẩn danh khi tra cứu và sử dụng công cụ tính toán thuế trên hệ thống.</p>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-[15px]">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Đồng bộ theo Cổng eTax Mobile</span>
                </div>
                <p className="text-[13px] text-slate-600 font-medium">Hướng dẫn thao tác chuẩn xác theo giao diện ứng dụng thuế điện tử chính thức của Tổng cục Thuế.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
