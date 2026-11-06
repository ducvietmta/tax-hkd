CREATE TABLE IF NOT EXISTS rate_limits (id INTEGER PRIMARY KEY AUTOINCREMENT,scope TEXT NOT NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_rate_limits_scope_created ON rate_limits(scope,created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_created ON rate_limits(created_at);
