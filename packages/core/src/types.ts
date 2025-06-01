import { z } from 'zod';

export const CaptureOptionsSchema = z.object({
  git: z.boolean().default(true),
  files: z.boolean().default(true),
  terminal: z.boolean().default(true),
  processes: z.boolean().default(true),
});

export type CaptureOptions = z.infer<typeof CaptureOptionsSchema>;

export const GitStateSchema = z.object({
  branch: z.string(),
  status: z.object({
    modified: z.array(z.string()),
    staged: z.array(z.string()),
    untracked: z.array(z.string()),
  }),
  lastCommit: z
    .object({
      hash: z.string(),
      message: z.string(),
      author: z.string(),
      date: z.string(),
    })
    .optional(),
});

export type GitState = z.infer<typeof GitStateSchema>;

export const FileStateSchema = z.object({
  path: z.string(),
  content: z.string(),
  lastModified: z.string(),
  size: z.number(),
});

export type FileState = z.infer<typeof FileStateSchema>;

export const TerminalStateSchema = z.object({
  cwd: z.string(),
  history: z.array(z.string()),
  environment: z.record(z.string()),
});

export type TerminalState = z.infer<typeof TerminalStateSchema>;

export const ProcessStateSchema = z.object({
  pid: z.number(),
  name: z.string(),
  command: z.string(),
  cwd: z.string(),
  startTime: z.string(),
});

export type ProcessState = z.infer<typeof ProcessStateSchema>;

export const WorkStateSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  git: GitStateSchema.optional(),
  files: z.array(FileStateSchema).optional(),
  terminal: TerminalStateSchema.optional(),
  processes: z.array(ProcessStateSchema).optional(),
});

export type WorkState = z.infer<typeof WorkStateSchema>;

export const AIConfigSchema = z.object({
  provider: z.enum(['openai']),
  model: z.string(),
  apiKey: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).default(1000),
});

export type AIConfig = z.infer<typeof AIConfigSchema>;

export const ConfigSchema = z.object({
  capture: CaptureOptionsSchema,
  storage: z.object({
    path: z.string(),
    maxStates: z.number().min(1).default(100),
  }),
  ai: AIConfigSchema,
});

export type Config = z.infer<typeof ConfigSchema>;

export interface StateManager {
  captureState(options?: CaptureOptions): Promise<WorkState>;
  restoreState(stateId: string): Promise<WorkState>;
  getRecentStates(limit?: number): Promise<WorkState[]>;
  deleteState(stateId: string): Promise<void>;
}

export interface ConfigManager {
  getConfig(): Config;
  updateConfig(updates: Partial<Config>): Promise<void>;
  resetConfig(): Promise<void>;
}

export interface AIManager {
  analyzeState(state: WorkState): Promise<string>;
  generateResumptionPlan(state: WorkState): Promise<string>;
  suggestNextSteps(state: WorkState): Promise<string>;
}
