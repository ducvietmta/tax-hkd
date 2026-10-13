-- ====================================================================
-- CLOUDFLARE D1 RAG SCHEMA - HỆ THỐNG KHO TRI THỨC THUẾ 2026
-- ====================================================================

CREATE TABLE IF NOT EXISTS rag_chunks (
    id TEXT PRIMARY KEY,
    file TEXT NOT NULL,
    section TEXT,
    ref_id TEXT,
    tier TEXT NOT NULL,
    text TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_ref ON rag_chunks(ref_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_tier ON rag_chunks(tier);

CREATE TABLE IF NOT EXISTS rag_query_map (
    id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL,
    any_keywords TEXT NOT NULL,      -- JSON array
    context_keywords TEXT,          -- JSON array
    refs TEXT NOT NULL,              -- JSON array
    priority INTEGER NOT NULL DEFAULT 50
);

CREATE INDEX IF NOT EXISTS idx_rag_query_priority ON rag_query_map(priority);