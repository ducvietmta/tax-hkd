# HƯỚNG DẪN TRIỂN KHAI HỆ SINH THÁI CLOUDFLARE TOÀN DIỆN
## Dự án: Hệ Thống Tư Vấn & Rà Soát Thuế TMĐT & Hộ Kinh Doanh (2026)

Hệ thống đã được thiết kế và chuẩn hóa 100% để vận hành trên kiến trúc **Cloudflare Serverless**:
- **Frontend:** Cloudflare Pages (React 19 + Vite + Tailwind CSS)
- **Backend / API:** Cloudflare Workers (TypeScript + REST API)
- **Database:** Cloudflare D1 (Serverless Distributed SQLite)
- **Ảnh / File:** Cloudflare R2 (Object Storage hoá đơn, chứng từ)
- **DNS / CDN / SSL / Bảo mật:** Cloudflare Edge, WAF, DDoS Protection

---

## BƯỚC 1: ĐĂNG NHẬP CLOUDFLARE WRANGLER CLI

Mở Terminal tại thư mục dự án và chạy:
```bash
npx wrangler login
```
*(Trình duyệt sẽ mở ra để bạn xác thực tài khoản Cloudflare).*

---

## BƯỚC 2: KHỞI TẠO VÀ THIẾT LẬP CLOUDFLARE D1 (DATABASE)

### 1. Tạo Database D1:
```bash
npx wrangler d1 create tax_db
```
Lệnh sẽ trả về thông tin cấu hình tương tự:
```toml
[[d1_databases]]
binding = "DB"
database_name = "tax_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
👉 Hãy copy `database_id` này và dán vào file [wrangler.toml](file:///c:/Users/engin/OneDrive/Documents/Website/wrangler.toml).

### 2. Chạy Migration tạo bảng (Schema):
```bash
# Thực thi trên Cloudflare D1 Production
npx wrangler d1 execute tax_db --remote --file=./d1/schema.sql

# (Tùy chọn) Thực thi trên môi trường local dev để test
npx wrangler d1 execute tax_db --local --file=./d1/schema.sql
```

### 3. Nạp dữ liệu khởi tạo (Seed VIP Account `0943219594`):
```bash
# Nạp tài khoản VIP với 1.000 credits
npx wrangler d1 execute tax_db --remote --file=./d1/seed.sql

# Test local
npx wrangler d1 execute tax_db --local --file=./d1/seed.sql
```

---

## BƯỚC 3: KHỞI TẠO CLOUDFLARE R2 (LƯU TRỮ ẢNH & CHỨNG TỪ)

Tạo R2 Bucket để lưu ảnh hoá đơn, chứng từ và sao kê doanh thu:
```bash
npx wrangler r2 bucket create tax-documents-bucket
```

---

## BƯỚC 4: TRIỂN KHAI BACKEND (CLOUDFLARE WORKERS)

Chạy lệnh deploy Worker API lên mạng lưới toàn cầu Cloudflare Edge:
```bash
npm run worker:deploy
```
Lệnh sẽ trả về domain Worker của bạn (ví dụ: `https://tax-agent-worker.<tên-subdomain>.workers.dev`).

### Các API Endpoints đã sẵn sàng trên Worker:
- Firebase Phone Authentication gửi SMS và xác thực OTP bằng reCAPTCHA trên trình duyệt.
- `POST /api/auth/session`: Nhận Firebase ID token trong `Authorization: Bearer`, kiểm tra chữ ký và số điện thoại rồi tạo hoặc tải tài khoản D1.
- `GET /api/user/profile?phone=...`: Lấy thông tin tài khoản và lịch sử giao dịch từ D1.
- `POST /api/user/credits/consume`: Trừ lượt hỏi nguyên tử (Atomic transaction trong D1).
- `POST /api/user/credits/deposit`: Nạp thêm lượt hỏi.
- `POST /api/chat`: Tư vấn chính sách thuế 2026 (ngưỡng 1 tỷ đồng theo NĐ 141/2026/NĐ-CP).
- `POST /api/files/upload`: Tải file/ảnh trực tiếp lên **Cloudflare R2** và ghi metadata vào **Cloudflare D1**.
- `GET /api/files/:key`: Truy xuất và stream file từ **Cloudflare R2**.
- `POST /api/consultations`: Tiếp nhận đăng ký tư vấn 1-1 vào bảng `consultation_leads`.

---

## BƯỚC 5: TRIỂN KHAI FRONTEND (CLOUDFLARE PAGES)

### Lựa chọn 1: Deploy trực tiếp qua Wrangler CLI
```bash
# Build mã nguồn frontend
npm run build

# Deploy thư mục dist lên Cloudflare Pages
npx wrangler pages deploy dist --project-name=tax-hkd --branch=main
```

### Lựa chọn 2: Kết nối tự động qua GitHub/GitLab trên Cloudflare Dashboard
1. Truy cập **Cloudflare Dashboard** -> **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Chọn Repository của bạn.
3. Thiết lập thông số build:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Tại mục **Settings** -> **Functions** -> **D1 database bindings**:
   - Variable name: `DB`
   - D1 database: Chọn `tax_db`
5. Tại mục **Settings** -> **Functions** -> **R2 bucket bindings**:
   - Variable name: `STORAGE_BUCKET`
   - R2 bucket: Chọn `tax-documents-bucket`

---

## BƯỚC 6: CẤU HÌNH DNS, CDN, SSL & BẢO MẬT (CLOUDFLARE EDGE)

Trên Cloudflare Dashboard cho Custom Domain của bạn:

### 1. SSL / TLS:
- Đặt chế độ **Full (Strict)** để mã hóa đầu cuối từ Cloudflare Edge đến Worker.
- Bật **Always Use HTTPS** và **Minimum TLS Version: TLS 1.3**.
- Bật **Automatic HTTPS Rewrites**.

### 2. Tốc độ & CDN Caching:
- File `_headers` đã được tạo sẵn trong thư mục `dist/` để cache toàn bộ assets trong 1 năm:
  `Cache-Control: public, max-age=31536000, immutable`
- Bật **Early Hints** và **HTTP/3 (QUIC)** để tối ưu tốc độ tải trang.

### 3. Bảo Mật & WAF (Web Application Firewall):
- **Bot Fight Mode:** Bật trong tab **Security** -> **Bots** để ngăn chặn bot cào dữ liệu và spam API.
- **Firebase Auth:** Bật Phone, cho phép `tax-hkd.pages.dev` và `localhost` trong Authorized domains, và cho phép Việt Nam trong SMS region policy. Firebase áp dụng giới hạn gửi SMS; không dùng mã OTP cố định.
- **DDoS Protection:** Mặc định luôn kích hoạt ở mức độ cao nhất trên Cloudflare Anycast Network.
