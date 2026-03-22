import { relative } from 'node:path';
import type { FileEvent as FEvent, CaptureConfig, ExclusionRule } from '@ail/common';
import { shouldExclude } from '@ail/common';

export interface FileWriter {
  writeFileEvent(event: Omit<FEvent, 'id' | 'createdAt'>): void;
}

/**
 * Watches configured directories for file system events using chokidar.
 * Stores relative paths only for privacy.
 */
export class FileWatcher {
  private watcher: { close: () => Promise<void> } | null = null;
  private currentApp: string = '';
  private debounceMap = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private writer: FileWriter,
    private config: CaptureConfig,
    private exclusions: ExclusionRule[]
  ) {}

  updateCurrentApp(appName: string): void {
    this.currentApp = appName;
  }

  async start(): Promise<boolean> {
    if (!this.config.fileWatchEnabled || this.config.fileWatchPaths.length === 0) {
      console.log('[FileWatcher] Disabled');
      return false;
    }

    try {
      const { watch } = await import('chokidar');

      this.watcher = watch(this.config.fileWatchPaths, {
        ignoreInitial: true,
        ignored: /(^|[\/\\])\../, // Ignore dotfiles
        persistent: true,
        depth: 3, // Don't recurse too deep
      });

      this.watcher.on('add' as string, (path: string) => this.handleEvent(path, 'create'));
      this.watcher.on('change' as string, (path: string) => this.handleEvent(path, 'modify'));
      this.watcher.on('unlink' as string, (path: string) => this.handleEvent(path, 'delete'));

      console.log(`[FileWatcher] Watching ${this.config.fileWatchPaths.length} paths`);
      return true;
    } catch (err) {
      console.log('[FileWatcher] Could not start:', (err as Error).message);
      return false;
    }
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    for (const timer of this.debounceMap.values()) clearTimeout(timer);
    this.debounceMap.clear();
    console.log('[FileWatcher] Stopped');
  }

  private handleEvent(fullPath: string, eventType: 'create' | 'modify' | 'delete'): void {
    // Debounce: ignore duplicate events within 500ms for same file
    const key = `${fullPath}:${eventType}`;
    if (this.debounceMap.has(key)) return;

    this.debounceMap.set(key, setTimeout(() => this.debounceMap.delete(key), 500));

    // Use relative path for privacy
    const watchRoot = this.config.fileWatchPaths.find(p => fullPath.startsWith(p)) || '';
    const relPath = watchRoot ? relative(watchRoot, fullPath) : fullPath;

    // Check path exclusions
    if (shouldExclude({ filePath: fullPath } as any, this.exclusions)) return;

    this.writer.writeFileEvent({
      timestamp: Date.now(),
      path: relPath,
      eventType,
      appName: this.currentApp || null,
    });
  }
}
