/** Portal captures supplied by the site owner, 19/10/2026. Not a live portal session. */
export const TAX_ONLINE_MEDIA = '/images/registration/tax-online';
export const TAX_ONLINE_GIF = `${TAX_ONLINE_MEDIA}/huong-dan-dang-ky-thue-17-buoc.gif`;
export const TAX_ONLINE_STEPS = [
  { id:'login', title:'Mở cổng Thuế và chọn Đăng nhập', help:'Truy cập Dịch Vụ Công Thuế Nhà Nước tại https://dichvucong.gdt.gov.vn/tthc/homelogin rồi chọn Đăng nhập ở góc trên bên phải.' },
  { id:'portalIdentityMethod', title:'Chọn tài khoản định danh điện tử', help:'Chọn Đăng nhập bằng tài khoản Định danh điện tử (VNeID), như ô được khoanh trên ảnh.' },
  { id:'portalIdentityPerson', title:'Chọn đối tượng Cá nhân', help:'Trong cửa sổ Đối tượng đăng nhập, chọn Cá nhân để tiếp tục bằng tài khoản của bạn.' },
  { id:'portalIdentityAuth', title:'Tự đăng nhập VNeID', help:'Nhập thông tin hoặc quét QR trên trang VNeID chính thức và hoàn tất xác thực theo yêu cầu. Không dùng mã QR trong ảnh hướng dẫn; không nhập mật khẩu hay OTP tại TaxHKD.' },
  { id:'portalServices', title:'Mở Hộ, cá nhân kinh doanh', help:'Sau khi trở lại cổng Thuế, chọn mục Hộ, cá nhân kinh doanh trên trang chủ.' },
  { id:'portalOfficial', title:'Chọn dịch vụ Chính thức', help:'Ở thẻ Chính thức, chọn Tiếp tục. Mục Trải nghiệm chỉ dùng để mô phỏng, không gửi hồ sơ thật.' },
  { id:'procedure', title:'Chọn Đăng ký thuế lần đầu', help:'Trong nhóm Đăng ký thuế/Hóa đơn, chọn Đăng ký thuế lần đầu. Nếu hoạt động này đã đăng ký, tra cứu hồ sơ/thủ tục thay đổi thay vì nộp mới trùng.' },
  { id:'portalEligibility', title:'Đọc và chọn đúng trường hợp đăng ký', help:'Cổng đưa ra bốn trường hợp. Chọn theo hoàn cảnh thực tế và điều kiện áp dụng của bạn. Ảnh khoanh lựa chọn thứ hai chỉ minh họa một hồ sơ, không có nghĩa ai cũng chọn mục này hoặc tự xác định là được miễn đăng ký hộ. Nếu chưa rõ đối tượng áp dụng, làm rõ trước khi tiếp tục.' },
  { id:'attachments', title:'Đọc giấy tờ cần chuẩn bị', help:'Đọc cửa sổ Thông tin các hồ sơ cần chuẩn bị trước khi nộp hồ sơ rồi chọn Tiếp tục. Ảnh nêu giấy tờ cho người nước ngoài/người Việt ở nước ngoài không có số định danh, tệp PDF/ảnh tối đa 2 MB. Chỉ chuẩn bị/tải giấy tờ thuộc trường hợp được cổng yêu cầu; không mặc định mọi người phải nộp hộ chiếu hoặc bản sao căn cước.' },
  { id:'portalTaxpayer', title:'Chọn đối tượng Cá nhân kinh doanh', help:'Trong cửa sổ Chọn đối tượng cần đăng ký, chọn Cá nhân kinh doanh nếu bạn thực hiện nhánh này, rồi chọn Tiếp tục. Không chọn Hộ gia đình kinh doanh chỉ vì có người thân cùng hỗ trợ.' },
  { id:'portalDeclarant', title:'Xác định Tự khai hay Khai thay', help:'Chọn Tự khai nếu bạn kê khai cho chính mình. Nếu thực sự khai thay, chọn nhánh tương ứng và đối chiếu yêu cầu đại diện/ủy quyền của cổng; ảnh minh họa nhánh Tự khai.' },
  { id:'declare', title:'Kiểm tra thông tin cá nhân và liên hệ', help:'Kiểm tra số định danh, họ tên, ngày sinh được điền từ dữ liệu định danh; bổ sung điện thoại và email theo các ô bắt buộc trên cổng. Chỉ khai số định danh trước đây nếu thực sự có. Sửa sai lệch theo hướng dẫn của cổng trước khi chọn Tiếp tục.' },
  { id:'portalAddresses', title:'Kiểm tra địa chỉ thường trú và hiện tại', help:'Đối chiếu hai nhóm địa chỉ: thường trú và hiện tại. Kiểm tra tỉnh/thành phố, xã/phường/đặc khu và số nhà/đường/thôn/xóm theo dữ liệu thực tế, rồi chọn Tiếp tục.' },
  { id:'portalBusiness', title:'Điền hoạt động và địa chỉ kinh doanh', help:'Điền tên cửa hàng/thương hiệu, ngành nghề đúng hoạt động thực tế, ngày bắt đầu, địa chỉ kinh doanh, điện thoại/email và nơi nhận thông báo. Dùng mã ngành bạn đã xác nhận; mã G47900 xuất hiện trên ảnh chỉ là ví dụ, không áp cho mọi ngành. Đối chiếu danh mục của cổng nếu cách hiển thị mã khác. Ảnh có mục Phương pháp kê khai; đây không phải kết luận rằng bạn phải nộp một mức thuế cụ thể.' },
  { id:'submit', title:'Rà soát tờ khai và nhập captcha', help:'Đọc lại toàn bộ tờ khai; nếu sai, quay lại sửa. Có thể chọn Tải về để lưu bản kiểm tra. Nhập captcha đang hiển thị trên cổng (không dùng mã trên ảnh), rồi chọn Tiếp tục.' },
  { id:'portalOtp', title:'Tự xác thực OTP và nộp hồ sơ', help:'Theo ảnh, cổng gửi OTP đến email. Mở hộp thư, nhập mã còn hiệu lực trực tiếp trên cổng và chọn Nộp hồ sơ; dùng Gửi lại mã OTP nếu cần theo thông báo thực tế. Không dùng mã minh họa, không gửi OTP cho chatbot.' },
  { id:'receipt', title:'Lưu mã hồ sơ và theo dõi kết quả', help:'Khi cổng báo Thành công, lưu mã hồ sơ/biên nhận của chính bạn. Không sao chép mã trong ảnh. Tra cứu tiến độ và thông báo bổ sung; gửi hồ sơ thành công chưa đồng nghĩa hồ sơ đã được chấp thuận đăng ký.' },
] as const;
export function taxOnlineStepIndex(step: string) {
  const index=TAX_ONLINE_STEPS.findIndex(item=>item.id===step);
  return index < 0 ? 0 : index;
}

export const TAX_APP_MEDIA = '/images/registration/tax-app';
export const TAX_APP_STEPS = [
  {
    id: 'appServices',
    title: 'Chọn nhóm Hộ, cá nhân kinh doanh',
    help: 'Sau khi mở ứng dụng eTax Mobile và đăng nhập VNeID, tại màn hình trang chủ chạm chọn nhóm chức năng "Hộ, cá nhân kinh doanh" (vị trí khoanh đỏ).',
    file: 'buoc-01-etax-home.jpg',
  },
  {
    id: 'appOfficialMode',
    title: 'Chọn chế độ Chính thức',
    help: 'Tại màn hình phân loại môi trường, chạm chọn mục "Chính thức" để nộp hồ sơ thật tới cơ quan Thuế. Mục "Trải nghiệm" chỉ dùng để mô phỏng tập dượt.',
    file: 'buoc-02-chon-che-do.jpg',
  },
  {
    id: 'appConfirmOfficial',
    title: 'Xác nhận nộp hồ sơ chính thức',
    help: 'Đọc kỹ thông báo xác nhận: dữ liệu sẽ được ghi nhận chính thức vào hệ thống Quản lý thuế của Tổng cục Thuế. Chạm chọn "Tiếp tục".',
    file: 'buoc-03-xac-nhan-chinh-thuc.jpg',
  },
  {
    id: 'appMenuProcedure',
    title: 'Chọn Đăng ký thuế/Hoá đơn',
    help: 'Trong danh sách chức năng của phân hệ Hộ, cá nhân kinh doanh, chọn mục "Đăng ký thuế/Hoá đơn" (biểu tượng cây bút khoanh đỏ).',
    file: 'buoc-04-danh-sach-chuc-nang.jpg',
  },
  {
    id: 'appMenuFirstRegister',
    title: 'Chọn Đăng ký thuế lần đầu',
    help: 'Tại danh mục thủ tục, nhấn chọn "Đăng ký thuế lần đầu". Nếu đã có mã số thuế trước đó thì dùng chức năng tra cứu hoặc thay đổi thông tin.',
    file: 'buoc-05-menu-dang-ky.jpg',
  },
  {
    id: 'appNoticeDossier',
    title: 'Đọc thông báo hồ sơ cần chuẩn bị',
    help: 'Đọc hướng dẫn về giấy tờ kèm theo (áp dụng cho người nước ngoài hoặc người chưa có CCCD 12 số định danh). Nếu bạn đã có CCCD gắn chip/VNeID thì nhấn "Đồng ý" để tiếp tục.',
    file: 'buoc-06-thong-bao-ho-so.jpg',
  },
  {
    id: 'appTargetTaxpayer',
    title: 'Chọn đối tượng Cá nhân kinh doanh',
    help: 'Trong màn hình Chọn đối tượng cần đăng ký (Mẫu 03-ĐK-TCT), tích chọn "Cá nhân kinh doanh", sau đó nhấn nút "Tiếp tục".',
    file: 'buoc-07-chon-doi-tuong.jpg',
  },
  {
    id: 'appEligibilityScope',
    title: 'Chọn trường hợp đối tượng nộp thuế',
    help: 'Đọc kỹ 4 trường hợp ứng dụng liệt kê (kinh doanh lưu động, buôn chuyến, thương mại điện tử, dịch vụ cá nhân...). Tích chọn trường hợp đúng với hoạt động của bạn rồi nhấn "Tiếp tục".',
    file: 'buoc-08-truong-hop-mien.jpg',
  },
  {
    id: 'appPersonalInfo',
    title: 'Kiểm tra thông tin cá nhân và liên hệ',
    help: 'Rà soát Số định danh cá nhân, Họ và tên, Ngày sinh tự động điền từ VNeID. Điền chính xác Số điện thoại và Email để nhận mã OTP xác thực và thông báo thuế, rồi nhấn "Tiếp tục".',
    file: 'buoc-09-thong-tin-ca-nhan.jpg',
  },
  {
    id: 'appAddressInfo',
    title: 'Kiểm tra địa chỉ thường trú và nơi ở',
    help: 'Đối chiếu thông tin Địa chỉ thường trú và Địa chỉ hiện tại (Quốc gia, Tỉnh/Thành phố, Phường/Xã, Chi tiết số nhà/đường). Chọn hoặc cập nhật theo thực tế rồi nhấn "Tiếp tục".',
    file: 'buoc-10-dia-chi.jpg',
  },
  {
    id: 'appSubmit',
    title: 'Rà soát tờ khai và nhấn Nộp hồ DKT',
    help: 'Cuộn rà soát toàn bộ Tờ khai Mẫu 03-ĐK-TCT (ngành nghề kinh doanh, địa điểm, vốn...). Nhấn nút đỏ "Nộp hồ DKT" ở dưới cùng, sau đó nhập mã OTP xác thực gửi về điện thoại để hoàn tất.',
    file: 'buoc-11-nop-ho-so.jpg',
  },
] as const;

export function taxAppStepIndex(step: string) {
  const index = TAX_APP_STEPS.findIndex(item => item.id === step);
  return index < 0 ? 0 : index;
}
