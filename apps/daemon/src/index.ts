import { parentPort } from 'worker_threads';

if (!parentPort) {
  throw new Error('This module must be run as a worker thread');
}

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

const mockResumptionPlan = {
  summary: 'You were working on implementing the Metal CLI tool',
  tasks: [
    'Complete the daemon implementation',
    'Add error handling for IPC communication',
    'Implement state capture functionality',
  ],
  context: {
    branch: 'main',
    modifiedFiles: ['src/index.ts', 'package.json'],
    runningProcesses: ['node', 'npm'],
  },
};

let isRunning = false;
let isPaused = false;
let captureInterval: NodeJS.Timeout | null = null;

// Handle messages from the CLI
parentPort.on('message', (message: { type: string }) => {
  switch (message.type) {
    case 'start':
      if (!isRunning) {
        isRunning = true;
        isPaused = false;
        // Simulate periodic state capture
        captureInterval = setInterval(() => {
          if (!isPaused && parentPort) {
            parentPort.postMessage({
              type: 'stateCaptured',
              payload: {
                ...mockState,
                timestamp: new Date().toISOString(),
              },
            });
          }
        }, 5000);
        if (parentPort) {
          parentPort.postMessage({ type: 'started' });
        }
      }
      break;

    case 'stop':
      if (isRunning) {
        isRunning = false;
        isPaused = false;
        if (captureInterval) {
          clearInterval(captureInterval);
          captureInterval = null;
        }
        if (parentPort) {
          parentPort.postMessage({ type: 'stopped' });
        }
      }
      break;

    case 'pause':
      if (isRunning && !isPaused) {
        isPaused = true;
        if (parentPort) {
          parentPort.postMessage({ type: 'paused' });
        }
      }
      break;

    case 'resume':
      if (isRunning && isPaused) {
        isPaused = false;
        if (parentPort) {
          parentPort.postMessage({ type: 'resumed' });
        }
      }
      break;

    case 'getResumptionPlan':
      if (parentPort) {
        parentPort.postMessage({
          type: 'resumptionPlan',
          payload: mockResumptionPlan,
        });
      }
      break;

    default:
      if (parentPort) {
        parentPort.postMessage({
          type: 'error',
          payload: `Unknown message type: ${message.type}`,
        });
      }
  }
});
