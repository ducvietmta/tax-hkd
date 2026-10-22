CREATE TABLE IF NOT EXISTS answer_grounding_traces (
 id TEXT PRIMARY KEY,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 pipeline_version TEXT NOT NULL,
 trace_json TEXT NOT NULL
);
