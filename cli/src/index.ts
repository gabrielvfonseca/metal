// @metal/cli/src/index.ts
// CLI entry point

import { Command } from 'commander';
import { generateCommand } from './commands/generate.js';
import { initCommand } from './commands/init.js';

// Injected at build time by tsup; falls back in dev/test.
declare const __METAL_CLI_VERSION__: string | undefined;

function readPackageVersion(): string {
  try {
    return typeof __METAL_CLI_VERSION__ !== 'undefined' ? __METAL_CLI_VERSION__ : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name('metal')
    .description('Metal OGM - Prisma-like DX for graph databases')
    .version(readPackageVersion());

  program
    .command('init')
    .description('Initialize a new Metal project')
    .argument('[directory]', 'Project directory', '.')
    .option('--database <type>', 'Database type (neo4j)', 'neo4j')
    .action(initCommand);

  program
    .command('generate')
    .description('Generate types and client from schema')
    .option('--watch', 'Watch mode for auto-generation')
    .action(generateCommand);

  return program;
}

function isExecutedDirectly(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return /[\\/]metal$/.test(entry) || /[\\/]index\.(mjs|cjs|js)$/.test(entry);
}

if (isExecutedDirectly()) {
  createProgram().parse();
}
