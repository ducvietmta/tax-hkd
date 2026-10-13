-- ====================================================================
-- CLOUDFLARE D1 SEED DATA
-- ====================================================================

-- Cấp tài khoản VIP quản trị theo yêu cầu với 1.000 lượt hỏi
INSERT OR REPLACE INTO users (id, phone, name, credits, role, created_at, updated_at)
VALUES (
    'usr_vip_0943219594',
    '0943219594',
    'Tài khoản VIP Quản trị (0943219594)',
    1000,
    'vip',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Ghi nhận giao dịch cấp lượt ban đầu
INSERT OR REPLACE INTO transactions (id, user_phone, amount, credits, payment_method, status, notes, created_at)
VALUES (
    'tx_init_vip_1000',
    '0943219594',
    0,
    1000,
    'admin_grant',
    'completed',
    'Cấp 1.000 lượt hỏi VIP theo cấu hình hệ thống',
    CURRENT_TIMESTAMP
);

-- Demo OTP hợp lệ phục vụ kiểm thử nhanh
INSERT OR REPLACE INTO otps (id, phone, code, expires_at, is_verified, created_at)
VALUES (
    'otp_demo_vip',
    '0943219594',
    '686868',
    datetime('now', '+365 days'),
    0,
    CURRENT_TIMESTAMP
);
