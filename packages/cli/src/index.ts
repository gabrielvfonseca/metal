// @metal/cli/src/index.ts
// CLI entry point

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { generateCommand } from './commands/generate.js';

const program = new Command();

program
  .name('metal')
  .description('Metal OGM - Prisma-like DX for graph databases')
  .version('0.1.0');

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

program.parse();