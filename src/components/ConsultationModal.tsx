import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { CloudflareApi } from '../services/api';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    contactName: '',
    phone: '',
    businessType: 'Bán hàng online (TikTok Shop / Shopee / Lazada)',
    revenueEstimate: 'Dưới 1 tỷ VNĐ / năm (Miễn thuế theo Nghị định 141/2026)',
    note: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await CloudflareApi.submitConsultation({
        name: `${formData.contactName} (${formData.shopName})`,
        phone: formData.phone,
        platform: formData.businessType,
        estimatedRevenue: formData.revenueEstimate,
        notes: formData.note,
      });
    } catch {
      // Fallback
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            {/* Modal Header */}
            <div className="mb-6">
              <span className="text-[11px] font-extrabold tracking-widest text-emerald-700 uppercase flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                ĐẶT LỊCH TƯ VẤN THUẾ 1-1 MIỄN PHÍ
              </span>
              <h3 className="text-[22px] sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
                Tối ưu thuế cho Chủ Shop & Hộ Kinh Doanh
              </h3>
              <p className="text-[14px] text-slate-600 mt-1 font-medium">
                Chuyên gia tư vấn thuế của TaxHKD sẽ hỗ trợ bạn rà soát doanh thu sàn và lập phương án kê khai an toàn nhất.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1">
                  Tên Shop / Tên Hộ kinh doanh <span className="text-emerald-600">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: Shop Thời trang ABC / HKD Minh Anh..."
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1">
                    Họ và tên bạn <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1">
                    Số điện thoại / Zalo <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="0912 xxx xxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1">
                  Mô hình kinh doanh của bạn
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-[13px] text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option>Bán hàng online (TikTok Shop / Shopee / Lazada)</option>
                  <option>Cho thuê nhà / căn hộ / mặt bằng kinh doanh</option>
                  <option>Tiếp thị liên kết Affiliate / KOC / KOL</option>
                  <option>Quán ăn / Nhà hàng / Quán cafe</option>
                  <option>Cửa hàng bán buôn / bán lẻ truyền thống</option>
                  <option>Chuyển đổi từ thuế khoán sang kê khai</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1">
                  Ước tính doanh thu năm
                </label>
                <select
                  value={formData.revenueEstimate}
                  onChange={(e) => setFormData({ ...formData, revenueEstimate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-[13px] text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option>Dưới 1 tỷ VNĐ / năm (Miễn thuế theo Nghị định 141/2026)</option>
                  <option>Từ 1 tỷ - 3 tỷ VNĐ / năm</option>
                  <option>Từ 3 tỷ - 10 tỷ VNĐ / năm</option>
                  <option>Trên 10 tỷ VNĐ / năm</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full group inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-[15px] py-3.5 rounded-xl transition-all active:scale-[0.99] shadow-md"
                >
                  <span>{isSubmitting ? 'Đang gửi thông tin lên Cloudflare D1…' : 'Gửi yêu cầu nhận tư vấn 1-1'}</span>
                  {!isSubmitting && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-[22px] font-bold text-slate-900 tracking-tight">
              Đã tiếp nhận yêu cầu tư vấn!
            </h3>
            <p className="text-[14px] text-slate-600 max-w-sm mx-auto leading-relaxed">
              Cảm ơn bạn <strong>{formData.contactName || 'Chủ Shop'}</strong>. Chuyên viên tư vấn thuế của TaxHKD sẽ liên hệ trực tiếp qua số <strong>{formData.phone}</strong> trong vòng 15-30 phút.
            </p>
            <div className="pt-3">
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[14px] px-6 py-2.5 rounded-xl border border-slate-200"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
