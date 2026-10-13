import React, { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';

interface LawItem {
  code: string;
  title: string;
  issuer: string;
  effectiveDate: string;
  category: string;
  keyTopics: string[];
}

const HKD_LAWS: LawItem[] = [
  {
    code: 'Nghị định 141/2026/NĐ-CP',
    title: 'Sửa đổi, bổ sung một số điều của Nghị định 68/2026/NĐ-CP - Nâng ngưỡng miễn thuế HKD lên 1 tỷ đồng/năm',
    issuer: 'Chính Phủ',
    effectiveDate: '29/04/2026',
    category: 'Văn bản cốt lõi HKD',
    keyTopics: ['Nâng ngưỡng doanh thu miễn thuế lên 1 tỷ đồng/năm', 'Doanh thu từ 1 tỷ trở xuống không chịu thuế GTGT & TNCN', 'Quy định sử dụng hóa đơn điện tử khi vượt 1 tỷ'],
  },
  {
    code: 'Luật Thuế GTGT số 48/2024/QH15',
    title: 'Luật Thuế Giá trị gia tăng (sửa đổi) & Khung pháp lý thuế Hộ kinh doanh',
    issuer: 'Quốc Hội',
    effectiveDate: '01/01/2026',
    category: 'Văn bản cốt lõi HKD',
    keyTopics: ['Quy định đối tượng không chịu thuế GTGT cho HKD, CNKD', 'Khung pháp lý thuế TMĐT', 'Trách nhiệm kê khai nộp thuế'],
  },
  {
    code: 'Nghị định 68/2026/NĐ-CP',
    title: 'Quy định chi tiết và hướng dẫn thi hành Luật Quản lý Thuế & Luật Thuế GTGT cho sàn TMĐT',
    issuer: 'Chính Phủ',
    effectiveDate: '01/01/2026',
    category: 'Thương Mại Điện Tử',
    keyTopics: ['Sàn TMĐT khấu trừ, kê khai và nộp thay thuế cho cá nhân kinh doanh', 'Cơ chế chia sẻ dữ liệu doanh thu tự động', 'Xử lý hoàn thuế'],
  },
  {
    code: 'Thông tư 40/2021/TT-BTC',
    title: 'Hướng dẫn thuế GTGT, TNCN và quản lý thuế đối với Hộ kinh doanh, Cá nhân kinh doanh',
    issuer: 'Bộ Tài Chính',
    effectiveDate: '01/08/2021',
    category: 'Văn bản cốt lõi HKD',
    keyTopics: ['Tỷ lệ % tính thuế trên doanh thu theo ngành nghề', 'Kê khai thuế sàn TMĐT Shopee/TikTok', 'Thuế cho thuê nhà', 'Mẫu biểu 01/CNKD'],
  },
  {
    code: 'Thông tư 100/2021/TT-BTC',
    title: 'Sửa đổi, bổ sung một số điều của Thông tư số 40/2021/TT-BTC',
    issuer: 'Bộ Tài Chính',
    effectiveDate: '01/01/2022',
    category: 'Văn bản cốt lõi HKD',
    keyTopics: ['Làm rõ trách nhiệm nộp thuế cho thuê tài sản', 'Thời điểm xác định ngưỡng doanh thu chịu thuế'],
  },
  {
    code: 'Nghị định 91/2022/NĐ-CP',
    title: 'Quy định trách nhiệm sàn TMĐT cung cấp dữ liệu định kỳ cho Tổng cục Thuế',
    issuer: 'Chính Phủ',
    effectiveDate: '30/10/2022',
    category: 'Thương Mại Điện Tử',
    keyTopics: ['Dữ liệu CCCD, MST, Doanh thu người bán', 'Đối soát chéo tài khoản ngân hàng với doanh thu sàn'],
  },
  {
    code: 'Thông tư 88/2021/TT-BTC',
    title: 'Hướng dẫn chế độ kế toán cho Hộ kinh doanh, Cá nhân kinh doanh',
    issuer: 'Bộ Tài Chính',
    effectiveDate: '01/01/2022',
    category: 'Sổ sách kế toán HKD',
    keyTopics: ['Chế độ chứng từ và sổ sách kế toán đơn giản', 'Mẫu biểu sổ doanh thu, chi phí, vật tư'],
  },
  {
    code: 'Nghị định 123/2020/NĐ-CP',
    title: 'Quy định hóa đơn điện tử khởi tạo từ máy tính tiền đối với Hộ kinh doanh',
    issuer: 'Chính Phủ',
    effectiveDate: '01/07/2022',
    category: 'Hóa đơn điện tử',
    keyTopics: ['Hóa đơn máy tính tiền cho quán ăn, bán lẻ', 'Xuất hóa đơn theo từng lần bán'],
  },
  {
    code: 'Luật Quản lý Thuế số 38/2019/QH14',
    title: 'Quy định về đăng ký thuế, kê khai, nộp thuế và xử phạt đối với HKD',
    issuer: 'Quốc Hội',
    effectiveDate: '01/07/2020',
    category: 'Luật chung',
    keyTopics: ['Xử phạt chậm nộp 0.03%/ngày', 'Mức phạt khai sai từ 20%', 'Đăng ký thuế điện tử qua VNeID'],
  },
];

export const LegalKnowledgeBase: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredLaws = HKD_LAWS.filter((law) => {
    const matchesCategory = filterCategory === 'all' || law.category === filterCategory;
    const matchesSearch = law.title.toLowerCase().includes(searchTerm.toLowerCase()) || law.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="legal-base" className="py-20 md:py-28 bg-[#F8FAFC]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-emerald-700 text-[12px] font-extrabold tracking-widest uppercase mb-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>CƠ SỞ PHÁP LÝ THUẾ HỘ & CÁ NHÂN KINH DOANH</span>
            </div>
            <h2 className="text-[30px] sm:text-[40px] font-extrabold text-slate-900 tracking-tight leading-tight">
              Thư viện Thông tư & Nghị định Thuế HKD <br />
              được AI cập nhật mới nhất
            </h2>
          </div>

          {/* Search inside legal library */}
          <div className="mt-4 md:mt-0 w-full md:w-80">
            <div className="relative">
              <input
                type="text"
                aria-label="Tìm kiếm văn bản pháp luật"
                placeholder="Tìm Thông tư 40, Nghị định 91, Nghị định 141..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-[14px] text-slate-900 focus:outline-none focus:border-emerald-500 font-medium focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div role="group" aria-label="Lọc theo nhóm văn bản" className="flex flex-wrap items-center gap-2 mb-8">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              filterCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({HKD_LAWS.length})
          </button>
          <button
            onClick={() => setFilterCategory('Văn bản cốt lõi HKD')}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
              filterCategory === 'Văn bản cốt lõi HKD'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            Thông tư 40 & TT 100
          </button>
          <button
            onClick={() => setFilterCategory('Thương Mại Điện Tử')}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
              filterCategory === 'Thương Mại Điện Tử'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            Nghị định 91 (TMĐT)
          </button>
          <button
            onClick={() => setFilterCategory('Sổ sách kế toán HKD')}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
              filterCategory === 'Sổ sách kế toán HKD'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            Thông tư 88 (Sổ sách)
          </button>
        </div>

        {/* Laws Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLaws.map((law, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between hover:border-emerald-500 transition-colors shadow-soft"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-bold text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {law.code}
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {law.issuer} • {law.effectiveDate}
                  </span>
                </div>

                <h3 className="text-[16px] font-bold text-slate-900 mb-3 leading-snug">
                  {law.title}
                </h3>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {law.keyTopics.map((topic, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[11px] text-slate-700 bg-slate-100 font-medium px-2 py-1 rounded"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[12px]">
                <span className="text-slate-500 font-medium">Trạng thái: Đang có hiệu lực</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  Đã nạp vào AI
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
