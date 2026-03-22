import type { ExclusionRule, WindowInfo } from './types.js';

export interface ExcludeContext {
  appName?: string;
  windowTitle?: string;
  url?: string | null;
  filePath?: string;
  clipboardContentType?: string;
}

export function shouldExclude(
  context: Pick<WindowInfo, 'appName' | 'windowTitle' | 'url'> | ExcludeContext,
  rules: ExclusionRule[]
): boolean {
  const appName = 'appName' in context ? context.appName || '' : '';
  const windowTitle = 'windowTitle' in context ? context.windowTitle || '' : '';
  const url = 'url' in context ? context.url : null;
  const filePath = 'filePath' in context ? (context as ExcludeContext).filePath : undefined;

  for (const rule of rules) {
    switch (rule.type) {
      case 'app':
        if (appName && appName.toLowerCase() === rule.pattern.toLowerCase()) {
          return true;
        }
        break;
      case 'title_regex':
        if (windowTitle) {
          try {
            if (new RegExp(rule.pattern, 'i').test(windowTitle)) return true;
          } catch { /* invalid regex */ }
        }
        break;
      case 'url_regex':
        if (url) {
          try {
            if (new RegExp(rule.pattern, 'i').test(url)) return true;
          } catch { /* invalid regex */ }
        }
        break;
      case 'path_regex':
        if (filePath) {
          try {
            if (new RegExp(rule.pattern, 'i').test(filePath)) return true;
          } catch { /* invalid regex */ }
        }
        break;
    }
  }
  return false;
}
