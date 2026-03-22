import type { ExclusionRule, WindowInfo } from './types.js';

export function shouldExclude(
  window: Pick<WindowInfo, 'appName' | 'windowTitle' | 'url'>,
  rules: ExclusionRule[]
): boolean {
  for (const rule of rules) {
    switch (rule.type) {
      case 'app':
        if (window.appName.toLowerCase() === rule.pattern.toLowerCase()) {
          return true;
        }
        break;
      case 'title_regex':
        try {
          if (new RegExp(rule.pattern, 'i').test(window.windowTitle)) {
            return true;
          }
        } catch {
          // Invalid regex, skip
        }
        break;
      case 'url_regex':
        if (window.url) {
          try {
            if (new RegExp(rule.pattern, 'i').test(window.url)) {
              return true;
            }
          } catch {
            // Invalid regex, skip
          }
        }
        break;
    }
  }
  return false;
}
