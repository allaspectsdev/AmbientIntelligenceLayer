-- ============================================
-- Migration 003: Execution Tier Hierarchy
-- AI as architect, not runtime
-- ============================================

-- Extend automations with tier classification
ALTER TABLE automations ADD COLUMN execution_tier INTEGER DEFAULT 1;
ALTER TABLE automations ADD COLUMN template_params TEXT;
ALTER TABLE automations ADD COLUMN rule_config TEXT;

CREATE INDEX IF NOT EXISTS idx_automations_tier ON automations(execution_tier);

-- Scheduling for Tier 1 hardcoded scripts
CREATE TABLE IF NOT EXISTS automation_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    automation_id INTEGER NOT NULL,
    cron_expression TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    last_run_at INTEGER,
    next_run_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
    FOREIGN KEY (automation_id) REFERENCES automations(id)
);

CREATE INDEX IF NOT EXISTS idx_schedules_due ON automation_schedules(enabled, next_run_at);
CREATE INDEX IF NOT EXISTS idx_schedules_automation ON automation_schedules(automation_id);
