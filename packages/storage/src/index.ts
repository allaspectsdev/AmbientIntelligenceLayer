export { getDatabase, closeDatabase } from './db.js';

// Original repositories
export { ActivityRepository } from './repositories/activity.repo.js';
export { ScreenshotRepository } from './repositories/screenshot.repo.js';
export { PatternRepository } from './repositories/pattern.repo.js';
export { SuggestionRepository } from './repositories/suggestion.repo.js';
export { ConfigRepository } from './repositories/config.repo.js';

// Extended capture repositories
export { KeyboardEventRepository } from './repositories/keyboard.repo.js';
export { MouseEventRepository } from './repositories/mouse.repo.js';
export { ClipboardEventRepository } from './repositories/clipboard.repo.js';
export { FileEventRepository } from './repositories/file-event.repo.js';

// Automation repositories
export { AutomationRepository } from './repositories/automation.repo.js';
export { AutomationExecutionRepository } from './repositories/automation-execution.repo.js';

// Orchestration repositories
export { AgentRepository } from './repositories/agent.repo.js';
export { AgentTaskRepository } from './repositories/agent-task.repo.js';
export { ApprovalRepository } from './repositories/approval.repo.js';
export { CredentialRepository } from './repositories/credential.repo.js';
export { AuditRepository } from './repositories/audit.repo.js';
