import { execSync } from 'node:child_process';

export interface RunResult {
  success: boolean;
  output: string;
  error: string | null;
}

export function runAppleScript(script: string, timeout: number = 30_000): RunResult {
  try {
    const output = execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
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
