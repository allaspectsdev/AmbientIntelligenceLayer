import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

// Ensure data directories exist
const dataDir = process.env.DATA_DIR || './data';
mkdirSync(`${dataDir}/screenshots`, { recursive: true });

console.log('=== Ambient Intelligence Layer ===');
console.log(`Data directory: ${dataDir}`);
console.log('');

interface ServiceConfig {
  name: string;
  script: string;
  color: string;
}

const services: ServiceConfig[] = [
  { name: 'capture', script: 'packages/capture/src/index.ts', color: '\x1b[34m' },
  { name: 'api', script: 'packages/api/src/index.ts', color: '\x1b[32m' },
  { name: 'analysis', script: 'packages/analysis/src/index.ts', color: '\x1b[33m' },
];

const reset = '\x1b[0m';
const children: ReturnType<typeof spawn>[] = [];

for (const svc of services) {
  const child = spawn('npx', ['tsx', svc.script], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DATA_DIR: dataDir },
  });

  child.stdout?.on('data', (data: Buffer) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      console.log(`${svc.color}[${svc.name}]${reset} ${line}`);
    }
  });

  child.stderr?.on('data', (data: Buffer) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      console.error(`${svc.color}[${svc.name}]${reset} ${line}`);
    }
  });

  child.on('exit', (code) => {
    console.log(`${svc.color}[${svc.name}]${reset} Process exited with code ${code}`);
  });

  children.push(child);
}

// Also start the dashboard dev server
const dashboard = spawn('npm', ['run', 'dev:dashboard'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

dashboard.stdout?.on('data', (data: Buffer) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    console.log(`\x1b[35m[dashboard]${reset} ${line}`);
  }
});

dashboard.stderr?.on('data', (data: Buffer) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    console.error(`\x1b[35m[dashboard]${reset} ${line}`);
  }
});

children.push(dashboard);

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down all services...');
  for (const child of children) {
    child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 2000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('All services starting...');
console.log('Dashboard: http://localhost:5173');
console.log('API:       http://localhost:3333');
console.log('Press Ctrl+C to stop all services.\n');
