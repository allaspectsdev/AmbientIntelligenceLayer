import { execFileSync } from 'node:child_process';

export interface RunResult {
  success: boolean;
  output: string;
  error: string | null;
}

export function runAppleScript(script: string, timeout: number = 30_000): RunResult {
  try {
    // Use execFileSync to bypass shell interpretation entirely — prevents command injection
    const output = execFileSync('osascript', ['-e', script], {
      encoding: 'utf-8',
      timeout,
    }).trim();

    return { success: true, output, error: null };
  } catch (err) {
    const error = err as { stderr?: string; message?: string };
    return {
      success: false,
      output: '',
      error: error.stderr || error.message || 'Unknown error',
    };
  }
}
