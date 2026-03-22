// Generators
export { AppleScriptGenerator } from './generators/applescript-generator.js';
export { PlaywrightGenerator } from './generators/playwright-generator.js';
export { N8nGenerator } from './generators/n8n-generator.js';
export { ApiStubGenerator } from './generators/api-stub-generator.js';
export { ShellScriptGenerator } from './generators/shell-generator.js';
export { PythonScriptGenerator } from './generators/python-generator.js';
export { TemplateGenerator } from './generators/template-generator.js';
export { RuleEngineGenerator } from './generators/rule-engine-generator.js';
export type { AutomationGenerator, GeneratedAutomation } from './generators/base-generator.js';

// Executor (strategy pattern)
export { AutomationExecutor } from './executor.js';

// Risk + Classification
export { classifyRisk } from './risk-classifier.js';
export { classifyTier } from './strategy/classifier.js';

// Runners
export type { AutomationRunner, RunResult, ExecutionContext } from './runners/types.js';

// Parameter resolution
export { resolveTemplate } from './params/resolver.js';

// Scheduling
export { AutomationScheduler } from './scheduling/scheduler.js';
