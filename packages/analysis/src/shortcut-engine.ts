import type { Suggestion } from '@ail/common';
import type { ActivityRepository, SuggestionRepository } from '@ail/storage';

// Built-in shortcut database for common macOS apps
const APP_SHORTCUTS: Record<string, Array<{ action: string; shortcut: string; tip: string }>> = {
  'Google Chrome': [
    { action: 'New Tab', shortcut: 'Cmd+T', tip: 'Open a new tab instantly' },
    { action: 'Close Tab', shortcut: 'Cmd+W', tip: 'Close the current tab' },
    { action: 'Reopen Tab', shortcut: 'Cmd+Shift+T', tip: 'Reopen the last closed tab' },
    { action: 'Address Bar', shortcut: 'Cmd+L', tip: 'Jump to the address bar' },
    { action: 'Find', shortcut: 'Cmd+F', tip: 'Search within the page' },
    { action: 'Switch Tabs', shortcut: 'Ctrl+Tab', tip: 'Cycle through open tabs' },
  ],
  'Safari': [
    { action: 'New Tab', shortcut: 'Cmd+T', tip: 'Open a new tab instantly' },
    { action: 'Close Tab', shortcut: 'Cmd+W', tip: 'Close the current tab' },
    { action: 'Address Bar', shortcut: 'Cmd+L', tip: 'Jump to the address bar' },
  ],
  'Code': [
    { action: 'Command Palette', shortcut: 'Cmd+Shift+P', tip: 'Access any VS Code command' },
    { action: 'Quick Open', shortcut: 'Cmd+P', tip: 'Open any file by name' },
    { action: 'Toggle Terminal', shortcut: 'Ctrl+`', tip: 'Show/hide the integrated terminal' },
    { action: 'Go to Definition', shortcut: 'F12', tip: 'Jump to function/variable definition' },
    { action: 'Find in Files', shortcut: 'Cmd+Shift+F', tip: 'Search across all project files' },
    { action: 'Multi-cursor', shortcut: 'Cmd+D', tip: 'Select next occurrence for multi-editing' },
  ],
  'Slack': [
    { action: 'Quick Switcher', shortcut: 'Cmd+K', tip: 'Jump to any channel or DM' },
    { action: 'Search', shortcut: 'Cmd+F', tip: 'Search messages' },
    { action: 'Mark Read', shortcut: 'Esc', tip: 'Mark channel as read' },
  ],
  'Finder': [
    { action: 'New Finder Window', shortcut: 'Cmd+N', tip: 'Open a new Finder window' },
    { action: 'Go to Folder', shortcut: 'Cmd+Shift+G', tip: 'Navigate to any folder by path' },
    { action: 'Quick Look', shortcut: 'Space', tip: 'Preview any file instantly' },
    { action: 'Info', shortcut: 'Cmd+I', tip: 'Get file info' },
  ],
  'Terminal': [
    { action: 'New Tab', shortcut: 'Cmd+T', tip: 'Open a new terminal tab' },
    { action: 'Clear', shortcut: 'Cmd+K', tip: 'Clear the terminal screen' },
  ],
  'Microsoft Excel': [
    { action: 'AutoSum', shortcut: 'Cmd+Shift+T', tip: 'Quick sum of selected cells' },
    { action: 'Find', shortcut: 'Cmd+F', tip: 'Search within spreadsheet' },
    { action: 'Fill Down', shortcut: 'Cmd+D', tip: 'Fill cells down from selection' },
  ],
  'Numbers': [
    { action: 'Find', shortcut: 'Cmd+F', tip: 'Search within spreadsheet' },
  ],
};

/**
 * Generates keyboard shortcut suggestions based on which apps the user
 * uses most frequently but may not know shortcuts for.
 */
export class ShortcutEngine {
  constructor(
    private activityRepo: ActivityRepository,
    private suggestionRepo: SuggestionRepository,
  ) {}

  generateSuggestions(): Suggestion[] {
    const now = Date.now();
    const range = { start: now - 24 * 60 * 60_000, end: now };
    const topApps = this.activityRepo.getAppUsage(range);
    const suggestions: Suggestion[] = [];

    // For each heavily-used app, suggest shortcuts they might not know
    for (const app of topApps.slice(0, 5)) {
      const shortcuts = APP_SHORTCUTS[app.appName];
      if (!shortcuts) continue;

      // Pick 1-2 random shortcuts to suggest (don't overwhelm)
      const shuffled = shortcuts.sort(() => Math.random() - 0.5);
      for (const sc of shuffled.slice(0, 1)) {
        const suggestion: Suggestion = {
          patternId: null,
          source: 'heuristic',
          category: 'coaching',
          title: `${app.appName}: Try ${sc.shortcut}`,
          body: `${sc.tip}. You use ${app.appName} frequently — the "${sc.action}" shortcut (${sc.shortcut}) can save you time.`,
          priority: 4,
          status: 'new',
          userFeedback: null,
        };

        // Don't duplicate suggestions
        const existing = this.suggestionRepo.getByStatus('new');
        const alreadyExists = existing.some(s => s.title === suggestion.title);
        if (!alreadyExists) {
          this.suggestionRepo.insert(suggestion);
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions;
  }
}
