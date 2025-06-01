import * as os from 'os';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { simpleGit } from 'simple-git';
import type { CaptureOptions, WorkState } from './types';

export class CaptureManager {
  private fileWatcher: chokidar.FSWatcher | null = null;
  private recentChanges: Array<{ path: string; timestamp: number }> = [];

  constructor(private readonly watchPath: string = process.cwd()) {}

  async initialize(): Promise<void> {
    this.fileWatcher = chokidar.watch(this.watchPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
    });

    this.fileWatcher.on('change', (filePath) => {
      this.recentChanges.push({
        path: filePath,
        timestamp: Date.now(),
      });
    });
  }

  async captureGitState(): Promise<WorkState['gitState']> {
    const git = simpleGit();
    return {
      branch: await git.revparse(['--abbrev-ref', 'HEAD']),
      uncommittedChanges: (await git.diff(['--name-only'])).split('\n').filter(Boolean),
      lastCommit: (await git.log(['-1'])).latest?.hash,
    };
  }

  async captureFileState(): Promise<WorkState['fileState']> {
    return {
      openFiles: [], // To be implemented with editor integration
      recentChanges: this.recentChanges,
    };
  }

  async captureTerminalState(): Promise<WorkState['terminalState']> {
    return {
      currentDirectory: process.cwd(),
      recentCommands: [], // To be implemented with shell history integration
    };
  }

  async captureProcessState(): Promise<WorkState['processState']> {
    return {
      runningProcesses: process.getgid
        ? [
            {
              name: process.title,
              pid: process.pid,
            },
          ]
        : [],
    };
  }

  async captureState(options: CaptureOptions = {}): Promise<WorkState> {
    const state: WorkState = {
      timestamp: Date.now(),
      gitState: {
        branch: '',
        uncommittedChanges: [],
        lastCommit: undefined,
      },
      fileState: {
        openFiles: [],
        recentChanges: [],
      },
      terminalState: {
        currentDirectory: '',
        recentCommands: [],
      },
      processState: {
        runningProcesses: [],
      },
    };

    if (options.includeGitState) {
      state.gitState = await this.captureGitState();
    }

    if (options.includeFileState) {
      state.fileState = await this.captureFileState();
    }

    if (options.includeTerminalState) {
      state.terminalState = await this.captureTerminalState();
    }

    if (options.includeProcessState) {
      state.processState = await this.captureProcessState();
    }

    return state;
  }

  async cleanup(): Promise<void> {
    if (this.fileWatcher) {
      await this.fileWatcher.close();
    }
  }
}
