-- ====================================================================
-- CLOUDFLARE D1 DATABASE SCHEMA - HỆ THỐNG THUẾ TMĐT & HỘ KINH DOANH
-- ====================================================================

-- 1. BẢNG NGƯỜI DÙNG (USERS)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    name TEXT,
    credits INTEGER NOT NULL DEFAULT 3,
    role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin' | 'vip'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 2. BẢNG MÃ XÁC THỰC OTP (OTPS)
CREATE TABLE IF NOT EXISTS otps (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    is_verified INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);

-- 3. BẢNG GIAO DỊCH NẠP LƯỢT HỎI (TRANSACTIONS)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_phone TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    credits INTEGER NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'qr_banking',
    status TEXT NOT NULL DEFAULT 'completed', -- 'pending' | 'completed' | 'failed'
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_phone) REFERENCES users(phone)
);

CREATE INDEX IF NOT EXISTS idx_transactions_phone ON transactions(user_phone);

-- 4. BẢNG YÊU CẦU ĐẶT LỊCH TƯ VẤN (CONSULTATION_LEADS)
CREATE TABLE IF NOT EXISTS consultation_leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    platform TEXT NOT NULL, -- 'tiktok' | 'shopee' | 'lazada' | 'rental' | 'offline_hkd'
    estimated_revenue TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'new', -- 'new' | 'contacted' | 'done'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultation_phone ON consultation_leads(phone);

-- 5. BẢNG LỊCH SỬ HỘI THOẠI AI (CHAT_LOGS)
CREATE TABLE IF NOT EXISTS chat_logs (
    id TEXT PRIMARY KEY,
    user_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    credits_used INTEGER NOT NULL DEFAULT 1,
    source TEXT DEFAULT 'Muse Spark 1.3 (Meta AI)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_phone) REFERENCES users(phone)
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_phone ON chat_logs(user_phone);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at);

-- Câu trả lời chuẩn dùng chung cho web và MCP theo câu hỏi/ngày/phiên bản luật.
CREATE TABLE IF NOT EXISTS answer_cache (
    cache_key TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. BẢNG QUẢN LÝ TÀI LIỆU & ẢNH HOÁ ĐƠN (FILES - LIÊN KẾT R2)
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    user_phone TEXT,
    file_key TEXT NOT NULL UNIQUE,     -- Key lưu trữ trong Cloudflare R2
    original_name TEXT NOT NULL,      -- Tên file gốc người dùng tải lên
    mime_type TEXT NOT NULL,          -- image/jpeg, image/png, application/pdf
    file_size INTEGER NOT NULL,       -- Kích thước byte
    public_url TEXT,                  -- URL truy cập qua CDN hoặc worker endpoint
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_phone);
CREATE INDEX IF NOT EXISTS idx_files_key ON files(file_key);

-- Decision diagnostics contain rule and evidence IDs only, never the question or phone.
CREATE TABLE IF NOT EXISTS decision_traces (
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL,
    decision_status TEXT NOT NULL,
    layer TEXT NOT NULL,
    tax_years TEXT NOT NULL,
    rule_ids TEXT NOT NULL,
    evidence_refs TEXT NOT NULL,
    excluded_refs TEXT NOT NULL,
    validation_status TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_decision_traces_created ON decision_traces(created_at);

-- 7. RATE LIMIT SLIDING-WINDOW BỀN VỮNG (thay cho caches.default best-effort).
-- Mỗi request /api/chat ghi 1 dòng; đếm số dòng trong window để giới hạn.
CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scope TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_scope_created ON rate_limits(scope, created_at);

-- Isolated admission counters for the anonymous registration-industry helper.
CREATE TABLE IF NOT EXISTS registration_industry_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scope TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_registration_industry_limits_scope_created ON registration_industry_limits(scope, created_at);
CREATE INDEX IF NOT EXISTS idx_registration_industry_limits_created ON registration_industry_limits(created_at);

-- 8. QUAN TRẮC RETRIEVAL (route miss / fallback) — chỉ diagnostics, không lưu câu hỏi/SĐT.
CREATE TABLE IF NOT EXISTS retrieval_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transport TEXT NOT NULL DEFAULT 'web',   -- 'web' | 'mcp' | 'chatgpt'
    route_id TEXT,                            -- NULL khi không trúng route nào
    used_fallback INTEGER NOT NULL DEFAULT 0,
    cache_hit INTEGER NOT NULL DEFAULT 0,
    has_plan INTEGER NOT NULL DEFAULT 0,
    result_count INTEGER NOT NULL DEFAULT 0,
    years TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_retrieval_stats_created ON retrieval_stats(created_at);
CREATE INDEX IF NOT EXISTS idx_retrieval_stats_route ON retrieval_stats(route_id, created_at);
