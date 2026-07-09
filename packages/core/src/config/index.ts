// @metal/core/src/config/index.ts
// Metal configuration system — inspired by Vite's defineConfig, Prisma schema, Drizzle config

export interface MetalDriverConfig {
  type: 'neo4j';
  uri?: string;
  username?: string;
  password?: string;
  database?: string;
  maxConnectionLifetime?: number;
  maxTransactionRetryTime?: number;
}

export interface MetalOutputConfig {
  /** Directory for generated types (default: ./src/__generated__) */
  directory?: string;
  /** When true, also generate a Zod schema file */
  zod?: boolean;
}

export interface MetalConfig {
  /** Path to schema definition file */
  schema: string;
  /** Output configuration for codegen */
  output?: MetalOutputConfig;
  /** Database driver configuration */
  driver?: MetalDriverConfig;
  /** When true, enables verbose logging */
  debug?: boolean;
  /** Node labels to exclude from codegen */
  exclude?: string[];
}

export function defineConfig(config: MetalConfig): MetalConfig {
  return config;
}

export function resolveConfig(config: MetalConfig): Required<MetalConfig> & { output: Required<MetalOutputConfig> } {
  return {
    schema: config.schema,
    output: {
      directory: config.output?.directory ?? './src/__generated__',
      zod: config.output?.zod ?? false,
    },
    driver: {
      type: 'neo4j',
      uri: config.driver?.uri ?? 'bolt://localhost:7687',
      username: config.driver?.username ?? 'neo4j',
      password: config.driver?.password ?? 'password',
      database: config.driver?.database,
      maxConnectionLifetime: config.driver?.maxConnectionLifetime,
      maxTransactionRetryTime: config.driver?.maxTransactionRetryTime,
    },
    debug: config.debug ?? false,
    exclude: config.exclude ?? [],
  };
}

/**
 * Try to load a config file from the project root.
 * Supports metal.config.ts, metal.config.mjs, metal.config.js, metal.config.json.
 */
export async function loadConfig(cwd?: string): Promise<MetalConfig | null> {
  const path = await import('node:path');
  const fs = await import('node:fs');
  const root = cwd ?? process.cwd();

  const candidates = [
    'metal.config.ts',
    'metal.config.mjs',
    'metal.config.js',
    'metal.config.json',
  ];

  for (const file of candidates) {
    const fullPath = path.join(root, file);
    if (fs.existsSync(fullPath)) {
      if (file.endsWith('.json')) {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        return JSON.parse(raw) as MetalConfig;
      }
      // Dynamic import of TS/JS config files
      try {
        const imported = await import(fullPath);
        const mod = imported.default ?? imported;
        if (typeof mod === 'function') return mod();
        return mod as MetalConfig;
      } catch {
        console.warn(`⚠ Could not load ${file}, trying next candidate.`);
      }
    }
  }

  return null;
}

export function getDefaultConfig(schemaPath?: string): MetalConfig {
  return {
    schema: schemaPath ?? './src/schema.ts',
    output: {
      directory: './src/__generated__',
      zod: false,
    },
    driver: {
      type: 'neo4j',
    },
    exclude: [],
  };
}