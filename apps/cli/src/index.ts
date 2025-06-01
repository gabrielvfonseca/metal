import path from 'path';
import chalk from 'chalk';
import { Command } from 'commander';
import { Worker } from 'worker_threads';

// Mock data for demonstration
const mockState = {
  timestamp: new Date().toISOString(),
  git: {
    branch: 'main',
    status: {
      modified: ['src/index.ts', 'package.json'],
      staged: ['README.md'],
      untracked: ['new-file.txt'],
    },
  },
  files: [
    { path: 'src/index.ts', lastModified: new Date().toISOString() },
    { path: 'package.json', lastModified: new Date().toISOString() },
  ],
  processes: [
    { name: 'node', pid: 1234 },
    { name: 'npm', pid: 1235 },
  ],
};

const mockHistory = Array(5)
  .fill(null)
  .map((_, i) => ({
    ...mockState,
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  }));

const program = new Command();

// Spawn the daemon as a worker thread
const daemon = new Worker(path.join(__dirname, '../../daemon/dist/index.js'));

// Handle messages from the daemon
daemon.on('message', (message: { type: string; payload?: unknown }) => {
  switch (message.type) {
    case 'stateCaptured':
      console.log(chalk.blue('State captured:'), message.payload);
      break;
    case 'stateAnalyzed':
      console.log(chalk.cyan('State analyzed:'), message.payload);
      break;
    case 'resumptionPlan':
      console.log(chalk.cyan('\nResumption Plan:'), message.payload);
      break;
    case 'error':
      console.error(chalk.red('Daemon error:'), message.payload);
      break;
    default:
      console.warn('Unknown message from daemon:', message);
  }
});

program.name('metal').description('AI-powered context switching CLI tool').version('0.1.0');

program
  .command('start')
  .description('Start the Metal daemon')
  .action(async () => {
    console.log(chalk.blue('Starting Metal daemon...'));
    daemon.postMessage({ type: 'start' });
    console.log(chalk.green('Daemon started successfully'));
  });

program
  .command('stop')
  .description('Stop the Metal daemon')
  .action(async () => {
    console.log(chalk.yellow('Stopping Metal daemon...'));
    daemon.postMessage({ type: 'stop' });
    console.log(chalk.green('Daemon stopped successfully'));
  });

program
  .command('pause')
  .description('Pause state capture')
  .action(async () => {
    console.log(chalk.yellow('Pausing state capture...'));
    daemon.postMessage({ type: 'pause' });
    console.log(chalk.green('State capture paused'));
  });

program
  .command('resume')
  .description('Get resumption assistance')
  .action(async () => {
    console.log(chalk.green('Getting resumption assistance...'));
    daemon.postMessage({ type: 'getResumptionPlan' });
  });

program
  .command('status')
  .description('Show current state')
  .action(async () => {
    console.log(chalk.cyan('Current state:'));
    console.log(chalk.cyan('\nGit:'));
    console.log(`  Branch: ${mockState.git.branch}`);
    console.log(`  Modified: ${mockState.git.status.modified.length} files`);
    console.log(`  Staged: ${mockState.git.status.staged.length} files`);
    console.log(`  Untracked: ${mockState.git.status.untracked.length} files`);

    console.log(chalk.cyan('\nFiles:'));
    console.log(`  Tracked: ${mockState.files.length} files`);
    mockState.files.forEach((file) => {
      console.log(`  - ${file.path} (${new Date(file.lastModified).toLocaleString()})`);
    });

    console.log(chalk.cyan('\nProcesses:'));
    console.log(`  Running: ${mockState.processes.length} processes`);
    mockState.processes.forEach((proc) => {
      console.log(`  - ${proc.name} (PID: ${proc.pid})`);
    });
  });

program
  .command('history')
  .description('View past sessions')
  .option('-l, --limit <number>', 'Number of states to show', '5')
  .action(async (options) => {
    console.log(chalk.magenta('Session history:'));
    const limit = Number.parseInt(options.limit, 10);
    const states = mockHistory.slice(0, limit);

    states.forEach((state, index) => {
      console.log(
        chalk.magenta(`\nState ${index + 1} (${new Date(state.timestamp).toLocaleString()}):`)
      );
      console.log(chalk.cyan('Git:'));
      console.log(`  Branch: ${state.git.branch}`);
      console.log(`  Modified: ${state.git.status.modified.length} files`);
      console.log(`  Staged: ${state.git.status.staged.length} files`);
      console.log(`  Untracked: ${state.git.status.untracked.length} files`);

      console.log(chalk.cyan('Files:'));
      console.log(`  Tracked: ${state.files.length} files`);

      console.log(chalk.cyan('Processes:'));
      console.log(`  Running: ${state.processes.length} processes`);
    });
  });

program
  .command('config')
  .description('Configuration management')
  .option('-s, --set <key=value>', 'Set configuration value')
  .option('-g, --get <key>', 'Get configuration value')
  .option('-l, --list', 'List all configuration values')
  .action(async (options) => {
    const mockConfig = {
      capture: {
        interval: 60000,
        includeGit: true,
        includeFiles: true,
        includeProcesses: true,
      },
      storage: {
        dbPath: './data/metal.db',
      },
      ai: {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: '********',
      },
    };

    if (options.list) {
      console.log(chalk.cyan('Current configuration:'));
      console.log(JSON.stringify(mockConfig, null, 2));
    } else if (options.get) {
      const value = options.get
        .split('.')
        .reduce((obj: any, key: string) => obj?.[key], mockConfig);
      console.log(chalk.cyan(`${options.get}:`), value);
    } else if (options.set) {
      const [key, value] = options.set.split('=');
      console.log(chalk.green(`Updated ${key} to ${value}`));
    } else {
      console.log(chalk.yellow('Please specify an action: --list, --get, or --set'));
    }
  });

program.parse();
