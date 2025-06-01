import fs from 'fs';
import os from 'os';
import path from 'path';
import { z } from 'zod';
import { type AIConfig, type Config, ConfigSchema } from './types';

export class ConfigManager {
  private config: Config;
  private configPath: string;

  constructor() {
    this.configPath = path.join(os.homedir(), '.metal', 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        const rawConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        return ConfigSchema.parse(rawConfig);
      }
    } catch (error) {
      console.warn('Error loading config:', error);
    }

    // Default configuration
    return {
      capture: {
        git: true,
        files: true,
        terminal: true,
        processes: true,
      },
      storage: {
        path: path.join(os.homedir(), '.metal', 'data'),
        maxStates: 100,
      },
      ai: {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        apiKey: process.env.OPENAI_API_KEY || '',
        temperature: 0.7,
        maxTokens: 1000,
      },
    };
  }

  getConfig(): Config {
    return this.config;
  }

  async updateConfig(updates: Partial<Config>): Promise<void> {
    const newConfig = {
      ...this.config,
      ...updates,
    };

    // Validate the new configuration
    ConfigSchema.parse(newConfig);

    // Ensure the config directory exists
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Write the new configuration
    fs.writeFileSync(this.configPath, JSON.stringify(newConfig, null, 2));
    this.config = newConfig;
  }

  async resetConfig(): Promise<void> {
    const defaultConfig = this.loadConfig();
    await this.updateConfig(defaultConfig);
  }

  getAIConfig(): AIConfig {
    return this.config.ai;
  }

  async updateAIConfig(updates: Partial<AIConfig>): Promise<void> {
    await this.updateConfig({
      ai: {
        ...this.config.ai,
        ...updates,
      },
    });
  }
}
