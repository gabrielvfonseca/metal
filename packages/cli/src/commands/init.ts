// @metal/cli/src/commands/init.ts
import fs from 'node:fs';
import path from 'node:path';

interface InitOptions {
  database: string;
}

export async function initCommand(directory: string, options: InitOptions): Promise<void> {
  const targetDir = path.resolve(process.cwd(), directory);

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    console.error(`Error: Directory "${targetDir}" is not empty.`);
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const packageJson = {
    name: path.basename(targetDir),
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      build: 'metal generate',
      start: 'tsx src/index.ts',
    },
    dependencies: {
      '@metal/core': 'latest',
      '@metal/neo4j-driver': 'latest',
    },
    devDependencies: {
      typescript: '^5.3.0',
      tsx: '^4.0.0',
      '@types/node': '^20.0.0',
    },
  };

  fs.writeFileSync(
    path.join(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n'
  );

  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      esModuleInterop: true,
      outDir: './dist',
      rootDir: './src',
    },
    include: ['src'],
  };

  fs.writeFileSync(
    path.join(targetDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2) + '\n'
  );

  fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });

  const schemaContent = `// metal/schema.ts - Define your graph schema
import { node, defineRel, schema as sch, string, number, date } from '@metal/core';

export const User = node('User')
  .add('id', string({ primary: true }))
  .add('name', string())
  .add('email', string({ unique: true }))
  .add('createdAt', date({ default: () => new Date() }))
  .build();

export const graph = sch()
  .add('User', User)
  .build();
`;

  fs.writeFileSync(path.join(targetDir, 'src', 'schema.ts'), schemaContent);

  const mainContent = `// src/index.ts
import { MetalClient } from '@metal/core';
import { graph } from './schema.js';

async function main() {
  const client = await MetalClient.connect({
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password',
  });

  client.registerNodes(graph);

  const users = await client.findMany('User', { limit: 10 });
  console.log('Users:', users);

  await client.disconnect();
}

main().catch(console.error);
`;

  fs.writeFileSync(path.join(targetDir, 'src', 'index.ts'), mainContent);

  // Generate metal.config.ts — the single source of truth for Metal
  const metalConfigContent = `import { defineConfig } from '@metal/core';

export default defineConfig({
  schema: './src/schema.ts',
  output: {
    directory: './src/__generated__',
    zod: false,
  },
  driver: {
    type: 'neo4j',
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password',
  },
  debug: false,
});
`;

  fs.writeFileSync(path.join(targetDir, 'metal.config.ts'), metalConfigContent);

  const envContent = `NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
`;
  fs.writeFileSync(path.join(targetDir, '.env.example'), envContent);

  console.log(`\n✓ Initialized Metal project in "${targetDir}"`);
  console.log('\nNext steps:');
  console.log('  1. cd ' + directory);
  console.log('  2. npm install');
  console.log('  3. Set your Neo4j connection in .env');
  console.log('  4. Edit src/schema.ts to define your graph');
  console.log('  5. npx tsx src/index.ts\n');
}