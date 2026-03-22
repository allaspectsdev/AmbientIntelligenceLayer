import type { Automation, RiskLevel } from '@ail/common';

/**
 * Classifies the risk level of an automation based on its type and content.
 * - safe: read-only, opens apps, navigates
 * - moderate: writes files, sends messages, modifies local data
 * - risky: deletes files, sends emails, modifies remote data, runs shell commands
 */
export function classifyRisk(automation: Automation): RiskLevel {
  const content = (automation.scriptContent || '').toLowerCase();

  // Risky patterns
  const riskyPatterns = [
    'rm ', 'rm -', 'delete', 'drop', 'remove', 'destroy',
    'send email', 'emailsend', 'smtp',
    'git push', 'deploy', 'publish',
    'password', 'secret', 'credential',
    'sudo', 'chmod', 'chown',
  ];

  if (riskyPatterns.some(p => content.includes(p))) {
    return 'risky';
  }

  // Moderate patterns
  const moderatePatterns = [
    'write', 'save', 'create', 'insert', 'update',
    'post', 'put', 'patch',
    'send', 'message', 'notify',
    'file', 'mkdir',
    'type keystroke', 'keystroke',
  ];

  if (moderatePatterns.some(p => content.includes(p))) {
    return 'moderate';
  }

  return 'safe';
}
