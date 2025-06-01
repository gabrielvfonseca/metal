import { OpenAI } from 'openai';
import type { AIConfig, AIManager, WorkState } from './types';

export class DefaultAIManager implements AIManager {
  private openai: OpenAI;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  async analyzeState(state: WorkState): Promise<string> {
    const prompt = this.buildAnalysisPrompt(state);
    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant that analyzes development work states and provides insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    });

    return response.choices[0]?.message?.content || 'No analysis available.';
  }

  async generateResumptionPlan(state: WorkState): Promise<string> {
    const prompt = this.buildResumptionPrompt(state);
    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that helps developers resume their work efficiently.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    });

    return response.choices[0]?.message?.content || 'No resumption plan available.';
  }

  async suggestNextSteps(state: WorkState): Promise<string> {
    const prompt = this.buildNextStepsPrompt(state);
    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that suggests next steps in development work.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    });

    return response.choices[0]?.message?.content || 'No suggestions available.';
  }

  private buildAnalysisPrompt(state: WorkState): string {
    return `
Analyze the following development work state and provide insights:

Git Status:
${
  state.git
    ? `
- Branch: ${state.git.branch}
- Modified files: ${state.git.status.modified.join(', ')}
- Staged files: ${state.git.status.staged.join(', ')}
- Untracked files: ${state.git.status.untracked.join(', ')}
${
  state.git.lastCommit
    ? `
Last commit:
- Hash: ${state.git.lastCommit.hash}
- Message: ${state.git.lastCommit.message}
- Author: ${state.git.lastCommit.author}
- Date: ${state.git.lastCommit.date}
`
    : ''
}`
    : 'No Git information available.'
}

File Changes:
${
  state.files
    ? state.files
        .map(
          (file) => `
- ${file.path} (${file.size} bytes, last modified: ${file.lastModified})
`
        )
        .join('')
    : 'No file information available.'
}

Terminal State:
${
  state.terminal
    ? `
- Current directory: ${state.terminal.cwd}
- Recent commands: ${state.terminal.history.slice(-5).join(', ')}
`
    : 'No terminal information available.'
}

Running Processes:
${
  state.processes
    ? state.processes
        .map(
          (proc) => `
- ${proc.name} (PID: ${proc.pid})
  Command: ${proc.command}
  Working directory: ${proc.cwd}
  Started: ${proc.startTime}
`
        )
        .join('')
    : 'No process information available.'
}

Please provide:
1. A summary of the current work state
2. Key changes and their potential impact
3. Any potential issues or concerns
4. Recommendations for next steps
`;
  }

  private buildResumptionPrompt(state: WorkState): string {
    return `
Help the developer resume their work based on the following state:

${this.buildAnalysisPrompt(state)}

Please provide:
1. A step-by-step plan to resume work
2. Important context to remember
3. Potential challenges to watch out for
4. Recommended first actions
`;
  }

  private buildNextStepsPrompt(state: WorkState): string {
    return `
Suggest next steps based on the following work state:

${this.buildAnalysisPrompt(state)}

Please provide:
1. Immediate next steps
2. Short-term goals
3. Potential improvements or optimizations
4. Any technical debt to address
`;
  }
}
