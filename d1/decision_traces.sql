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
