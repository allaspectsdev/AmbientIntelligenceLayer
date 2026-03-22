-- ============================================
-- Migration 002: Full Whitepaper Specification
-- ============================================

-- Extended capture tables
CREATE TABLE IF NOT EXISTS keyboard_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    key_code TEXT NOT NULL,
    modifiers TEXT,
    event_type TEXT NOT NULL DEFAULT 'keydown',
    app_name TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_keyboard_timestamp ON keyboard_events(timestamp);

CREATE TABLE IF NOT EXISTS mouse_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    button INTEGER DEFAULT 0,
    event_type TEXT NOT NULL DEFAULT 'click',
    app_name TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_mouse_timestamp ON mouse_events(timestamp);

CREATE TABLE IF NOT EXISTS clipboard_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    content_type TEXT DEFAULT 'text',
    content_hash TEXT,
    source_app TEXT,
    target_app TEXT,
    content_preview TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_clipboard_timestamp ON clipboard_events(timestamp);

CREATE TABLE IF NOT EXISTS file_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    path TEXT NOT NULL,
    event_type TEXT NOT NULL,
    app_name TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_file_timestamp ON file_events(timestamp);

-- Extend patterns table with confidence and risk
ALTER TABLE patterns ADD COLUMN confidence REAL DEFAULT 0.5;
ALTER TABLE patterns ADD COLUMN risk_level TEXT DEFAULT 'safe';

-- Automation tables
CREATE TABLE IF NOT EXISTS automations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_id INTEGER,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    script_content TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    confidence REAL DEFAULT 0.5,
    risk_level TEXT DEFAULT 'safe',
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    FOREIGN KEY (pattern_id) REFERENCES patterns(id)
);
CREATE INDEX IF NOT EXISTS idx_automations_status ON automations(status);
CREATE INDEX IF NOT EXISTS idx_automations_pattern ON automations(pattern_id);

CREATE TABLE IF NOT EXISTS automation_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    automation_id INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    status TEXT NOT NULL DEFAULT 'running',
    output TEXT,
    error TEXT,
    FOREIGN KEY (automation_id) REFERENCES automations(id)
);
CREATE INDEX IF NOT EXISTS idx_executions_automation ON automation_executions(automation_id);

-- Agent orchestration tables
CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    config_json TEXT,
    status TEXT NOT NULL DEFAULT 'idle',
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS agent_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    automation_id INTEGER,
    scheduled_at INTEGER,
    started_at INTEGER,
    completed_at INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    error TEXT,
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (automation_id) REFERENCES automations(id)
);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON agent_tasks(status);

CREATE TABLE IF NOT EXISTS approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_task_id INTEGER,
    automation_id INTEGER,
    action_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    decided_at INTEGER,
    decided_by TEXT,
    FOREIGN KEY (agent_task_id) REFERENCES agent_tasks(id),
    FOREIGN KEY (automation_id) REFERENCES automations(id)
);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);

CREATE TABLE IF NOT EXISTS credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    service TEXT,
    encrypted_value TEXT NOT NULL,
    scope TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details_json TEXT,
    risk_level TEXT DEFAULT 'safe'
);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
