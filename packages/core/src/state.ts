import Database from 'better-sqlite3';
import chokidar from 'chokidar';
import { simpleGit } from 'simple-git';
import { v4 as uuidv4 } from 'uuid';
import { DefaultAIManager } from './ai';
import type { ConfigManager } from './config';
import { type CaptureOptions, type StateManager, type WorkState, WorkStateSchema } from './types';

export class DefaultStateManager implements StateManager {
  private db: Database.Database;
  private git: ReturnType<typeof simpleGit>;
  private fileWatcher: chokidar.FSWatcher | null = null;
  private configManager: ConfigManager;
  private aiManager: DefaultAIManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    const config = configManager.getConfig();
    this.db = new Database(`${config.storage.path}/states.db`);
    this.git = simpleGit();
    this.aiManager = new DefaultAIManager(config.ai);
    this.initializeDatabase();
    this.initializeFileWatcher();
  }

  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS states (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        data TEXT NOT NULL
      );
    `);
  }

  private initializeFileWatcher(): void {
    const config = this.configManager.getConfig();
    this.fileWatcher = chokidar.watch('.', {
      ignored: /(^|[\/\\])\../,
      persistent: true,
    });

    this.fileWatcher.on('change', async (path) => {
      // Optionally capture state on file changes
      // This could be configurable
    });
  }

  async captureState(options?: CaptureOptions): Promise<WorkState> {
    const config = this.configManager.getConfig();
    const captureOptions = { ...config.capture, ...options };
    const state: WorkState = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };

    if (captureOptions.git) {
      state.git = await this.captureGitState();
    }

    if (captureOptions.files) {
      state.files = await this.captureFileState();
    }

    if (captureOptions.terminal) {
      state.terminal = await this.captureTerminalState();
    }

    if (captureOptions.processes) {
      state.processes = await this.captureProcessState();
    }

    await this.saveState(state);
    return state;
  }

  private async captureGitState() {
    try {
      const status = await this.git.status();
      const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
      const lastCommit = await this.git.log(['-1']).then((log) => log.latest);

      return {
        branch,
        status: {
          modified: status.modified,
          staged: status.staged,
          untracked: status.not_added,
        },
        lastCommit: lastCommit
          ? {
              hash: lastCommit.hash,
              message: lastCommit.message,
              author: lastCommit.author_name,
              date: lastCommit.date,
            }
          : undefined,
      };
    } catch (error) {
      console.error('Error capturing Git state:', error);
      return undefined;
    }
  }

  private async captureFileState() {
    try {
      const files = await this.git.raw(['ls-files', '--full-name', '--error-unmatch']);
      return Promise.all(
        files
          .split('\n')
          .filter(Boolean)
          .map(async (path) => {
            const stats = await this.git.raw(['ls-files', '--stage', path]);
            const [mode, hash, stage, filePath] = stats.split(/\s+/);
            return {
              path: filePath,
              content: await this.git.show([`${hash}:${filePath}`]),
              lastModified: new Date().toISOString(), // This is approximate
              size: Buffer.from(await this.git.show([`${hash}:${filePath}`])).length,
            };
          })
      );
    } catch (error) {
      console.error('Error capturing file state:', error);
      return undefined;
    }
  }

  private async captureTerminalState() {
    try {
      // Convert process.env to Record<string, string>
      const env: Record<string, string> = {};
      for (const [key, value] of Object.entries(process.env)) {
        if (typeof value === 'string') {
          env[key] = value;
        }
      }
      return {
        cwd: process.cwd(),
        history: [] as string[], // Explicitly type as string[]
        environment: env,
      };
    } catch (error) {
      console.error('Error capturing terminal state:', error);
      return undefined;
    }
  }

  private async captureProcessState() {
    try {
      // This is a simplified version. In a real implementation,
      // you would need to use platform-specific APIs to get process information
      return [
        {
          pid: process.pid,
          name: process.title,
          command: process.argv.join(' '),
          cwd: process.cwd(),
          startTime: new Date(process.uptime() * 1000).toISOString(),
        },
      ];
    } catch (error) {
      console.error('Error capturing process state:', error);
      return undefined;
    }
  }

  private async saveState(state: WorkState): Promise<void> {
    const config = this.configManager.getConfig();
    const stmt = this.db.prepare('INSERT INTO states (id, timestamp, data) VALUES (?, ?, ?)');
    stmt.run(state.id, state.timestamp, JSON.stringify(state));

    // Clean up old states if we exceed the maximum
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM states');
    const { count } = countStmt.get() as { count: number };
    if (count > config.storage.maxStates) {
      const deleteStmt = this.db.prepare(
        'DELETE FROM states WHERE id IN (SELECT id FROM states ORDER BY timestamp ASC LIMIT ?)'
      );
      deleteStmt.run(count - config.storage.maxStates);
    }
  }

  async restoreState(stateId: string): Promise<WorkState> {
    const stmt = this.db.prepare('SELECT data FROM states WHERE id = ?');
    const result = stmt.get(stateId) as { data?: string };
    if (!result || !result.data) {
      throw new Error(`State with ID ${stateId} not found`);
    }
    return WorkStateSchema.parse(JSON.parse(result.data));
  }

  async getRecentStates(limit = 10): Promise<WorkState[]> {
    const stmt = this.db.prepare('SELECT data FROM states ORDER BY timestamp DESC LIMIT ?');
    const results = stmt.all(limit) as { data: string }[];
    return results.map((result) => WorkStateSchema.parse(JSON.parse(result.data)));
  }

  async deleteState(stateId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM states WHERE id = ?');
    stmt.run(stateId);
  }

  async cleanup(): Promise<void> {
    if (this.fileWatcher) {
      this.fileWatcher.close();
    }
    this.db.close();
  }
}
