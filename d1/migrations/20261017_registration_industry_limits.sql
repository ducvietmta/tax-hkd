-- Dedicated to anonymous industry suggestion. No personal form or activity text.
CREATE TABLE IF NOT EXISTS registration_industry_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scope TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_registration_industry_limits_scope_created
    ON registration_industry_limits(scope, created_at);
CREATE INDEX IF NOT EXISTS idx_registration_industry_limits_created
    ON registration_industry_limits(created_at);
