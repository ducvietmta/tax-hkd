export interface GuideIndustry { code: string; name: string }
export interface GuideIndustryProps { industries?: GuideIndustry[]; industryConfirmed?: boolean }

/** Reuse confirmed catalogue values; an industry code is not an exemption ruling. */
export default function RegistrationIndustryContext({industries=[],industryConfirmed=false,step}:GuideIndustryProps&{step:string}){
  const eligibility=['portalEligibility','appEligibilityScope'].includes(step);
  const entry=['portalBusiness','appTargetTaxpayer','portalTaxpayer','appSubmit'].includes(step);
  if(!eligibility&&!entry)return null;
  const selected=industryConfirmed?industries:[];
  return <aside aria-label="Hướng dẫn theo ngành đã xác nhận" className="my-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-slate-800 space-y-3">
    <h4 className="font-bold text-emerald-950">Ngành nghề của bạn</h4>
    {selected.length>0?<ul className="space-y-2">{selected.map(industry=><li key={industry.code} className="rounded-xl border border-emerald-100 bg-white p-3 break-words"><strong className="text-emerald-800">{industry.code}</strong> · {industry.name}</li>)}</ul>:<p>Hãy xác nhận mã ở phần Hỏi đáp trước. Mã đang được gợi ý chưa được dùng làm thông tin đã chọn.</p>}
    {eligibility?selected.length>0?<>
      <div className="rounded-xl border border-emerald-300 bg-white p-4 space-y-2">
        <h4 className="font-bold text-emerald-900">Gợi ý chọn nhóm 2</h4>
        <p>“Không thuộc trường hợp nêu trên và người nộp thuế tự xác định không phải đăng ký hộ kinh doanh theo quy định”.</p>
      </div>
      <p><strong>Vì sao có gợi ý này?</strong> Bạn đang theo luồng đăng ký thuế trực tiếp cho cá nhân kinh doanh. Nhóm 2 dành cho trường hợp bạn tự xác định không phải đăng ký hộ kinh doanh. Nếu hoạt động kinh doanh diễn ra thường xuyên, ổn định hoặc đang mở rộng, bạn nên kiểm tra nghĩa vụ đăng ký hộ kinh doanh với cơ quan đăng ký kinh doanh tại địa phương. Khi thuộc diện bắt buộc, bạn cần thực hiện thủ tục đăng ký phù hợp; đăng ký thuế cá nhân không thay thế thủ tục này.</p>
      <p className="text-xs leading-relaxed text-slate-600"><strong>Điều kiện áp dụng:</strong> hoạt động không thuộc nhóm 1 và không thuộc diện bắt buộc đăng ký hộ kinh doanh hoặc doanh nghiệp. Gợi ý này chưa xác nhận bạn được miễn đăng ký hộ chỉ từ mã ngành. Nếu chưa rõ nghĩa vụ đăng ký, cần đối chiếu trước khi chọn.</p>
      <p className="text-xs leading-relaxed text-slate-600"><strong>Lưu ý trách nhiệm:</strong> Nội dung chỉ mang tính hướng dẫn tham khảo, không thay thế ý kiến của cơ quan có thẩm quyền hoặc tư vấn pháp lý cho trường hợp cụ thể. Bạn cần kiểm tra điều kiện áp dụng và chịu trách nhiệm về lựa chọn, tính chính xác và đầy đủ của thông tin kê khai theo quy định. TAXHKD không thay mặt bạn xác nhận tính hợp pháp của lựa chọn và không bảo đảm hồ sơ được chấp thuận.</p>
      <details className="text-xs text-slate-600">
        <summary className="cursor-pointer py-2 font-semibold text-emerald-800">Xem căn cứ và trường hợp cần kiểm tra</summary>
        <p className="py-2">Ngành, nghề đầu tư kinh doanh có điều kiện và yêu cầu đăng ký/hành nghề theo pháp luật chuyên ngành cần được kiểm tra riêng. Chưa xác minh mức thu nhập thấp tại địa phương không phải căn cứ tự động chọn nhóm 2.</p>
        <a href="https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-168-2025-nd-cp-ve-dang-ky-doanh-nghiep-119250702175708554.htm" target="_blank" rel="noreferrer" className="block py-2 font-semibold text-emerald-800 underline">Khoản 3 Điều 82 Nghị định 168/2025/NĐ-CP ↗</a>
      </details>
    </>:null:<>
      <p><strong>Đối tượng đăng ký:</strong> chọn “Cá nhân kinh doanh” nếu đang đăng ký thuế trực tiếp cho hoạt động cá nhân; đây là ô khác với nhóm trường hợp miễn đăng ký hộ.</p>
      <p><strong>Ô Ngành nghề kinh doanh:</strong> dùng tên và mã đã xác nhận ở trên, không lấy mã ví dụ trong ảnh. Có nhiều ngành thì giữ đủ từng hoạt động theo các ô/danh mục mà cổng hỗ trợ. Mã trong hướng dẫn là VSIC cấp 4; nếu cổng yêu cầu cấp 5 hoặc có ký tự phân loại, đối chiếu danh mục trên cổng, không tự thêm số 0 hay tiền tố.</p>
    </>}
  </aside>;
}
