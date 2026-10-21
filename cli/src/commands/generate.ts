// @metal/cli/src/commands/generate.ts
import fs from 'node:fs';
import path from 'node:path';

interface GenerateOptions {
  watch?: boolean;
}

export interface PropertyDef {
  name: string;
  type: string;
  primary?: boolean;
  unique?: boolean;
  nullable?: boolean;
  array?: boolean;
}

export interface RelDef {
  name: string;
  type: string;
  direction: string;
  target: string;
  multiple: boolean;
}

export interface NodeDef {
  label: string;
  properties: PropertyDef[];
  relations: RelDef[];
}

export interface GenerateResult {
  nodes: NodeDef[];
  outputDir: string;
  files: string[];
}

const TS_TYPE_MAP: Record<string, string> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  date: 'Date',
  bigint: 'bigint',
  float: 'number',
  uuid: 'string',
  json: 'unknown',
};

const ZOD_TYPE_MAP: Record<string, string> = {
  string: 'z.string()',
  number: 'z.number()',
  boolean: 'z.boolean()',
  date: 'z.date()',
  bigint: 'z.bigint()',
  float: 'z.number()',
  uuid: 'z.string().uuid()',
  json: 'z.unknown()',
};

export function mapPropertyType(type: string, array?: boolean): string {
  const base = TS_TYPE_MAP[type] ?? 'unknown';
  return array ? `${base}[]` : base;
}

export function generateNodeInterface(node: NodeDef): string {
  const lines: string[] = [];
  lines.push(`export interface ${node.label}Node {`);

  for (const prop of node.properties) {
    const optional = prop.nullable ? '?' : '';
    const tsType = mapPropertyType(prop.type, prop.array);
    lines.push(`  ${prop.name}${optional}: ${tsType};`);
  }

  for (const rel of node.relations) {
    const optional = rel.multiple ? '' : '?';
    const targetType = `${rel.target}Node`;
    const valueType = rel.multiple ? `${targetType}[]` : `${targetType} | null`;
    lines.push(`  ${rel.name}${optional}: ${valueType};`);
  }

  lines.push('}');
  return lines.join('\n');
}

export function generateWhereType(node: NodeDef): string {
  const fields = node.properties
    .map((p) => {
      const tsType = mapPropertyType(p.type, p.array);
      return `  ${p.name}?: ${tsType} | WhereOperator<${tsType}>;`;
    })
    .join('\n');

  return `export type ${node.label}Where = {
${fields}
  AND?: ${node.label}Where[];
  OR?: ${node.label}Where[];
  NOT?: ${node.label}Where;
};`;
}

export function generateCreateType(node: NodeDef): string {
  const fields = node.properties
    .filter((p) => !p.primary && !p.array)
    .map((p) => {
      const optional = p.nullable ? '?' : '';
      const tsType = mapPropertyType(p.type);
      return `  ${p.name}${optional}: ${tsType};`;
    })
    .join('\n');

  return `export type ${node.label}CreateInput = {\n${fields}\n};`;
}

export function generateUpdateType(node: NodeDef): string {
  const fields = node.properties
    .filter((p) => !p.primary)
    .map((p) => {
      const tsType = mapPropertyType(p.type);
      const optional = p.type === 'date' ? 'Date | string' : tsType;
      return `  ${p.name}?: ${optional};`;
    })
    .join('\n');

  return `export type ${node.label}UpdateInput = {\n${fields}\n};`;
}

export function generateZodSchema(node: NodeDef): string {
  const fields = node.properties
    .map((p) => {
      let zod = ZOD_TYPE_MAP[p.type] ?? 'z.unknown()';
      if (p.array) zod = `z.array(${zod})`;
      if (p.nullable) zod = `${zod}.nullable()`;
      return `  ${p.name}: ${zod},`;
    })
    .join('\n');

  return `export const ${node.label}Schema = z.object({\n${fields}\n});`;
}

export function loadSchema(schemaPath: string, exclude: string[] = []): NodeDef[] {
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const nodeRegex = /node\s*\(\s*['"]([^'"]+)['"]\)/g;
  const nodes: NodeDef[] = [];

  const labelMatches = [...schemaContent.matchAll(nodeRegex)];
  for (const match of labelMatches) {
    const label = match[1]!;
    if (exclude.includes(label)) continue;
    const nodeBlock = extractNodeBlock(schemaContent, match.index!);

    const properties = extractProperties(nodeBlock);
    const relations = extractRelations(nodeBlock);

    nodes.push({ label, properties, relations });
  }

  return nodes;
}

function extractNodeBlock(content: string, startIndex: number): string {
  const start = content.indexOf('.build()', startIndex);
  if (start === -1) return content.slice(startIndex);
  return content.slice(startIndex, start + 8);
}

function extractProperties(block: string): PropertyDef[] {
  const props: PropertyDef[] = [];
  const propRegex = /\.add\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g;
  let match: RegExpExecArray | null = propRegex.exec(block);
  while (match !== null) {
    const name = match[1]!;
    const configStr = match[2]!;
    if (!/\b(relation|defineRel)\s*\(/.test(configStr)) {
      const type = extractType(configStr);
      const primary = configStr.includes('primary: true');
      const unique = configStr.includes('unique: true');
      const nullable = configStr.includes('nullable: true');
      const array = configStr.includes('array: true');

      props.push({ name, type, primary, unique, nullable, array });
    }
    match = propRegex.exec(block);
  }

  return props;
}

function extractType(configStr: string): string {
  const knownTypes = ['string', 'number', 'boolean', 'date', 'bigint', 'float', 'uuid', 'json'];
  for (const t of knownTypes) {
    if (configStr.includes(`type: '${t}'`)) return t;
  }
  if (configStr.startsWith('string(')) return 'string';
  if (configStr.startsWith('number(')) return 'number';
  if (configStr.startsWith('date(')) return 'date';
  if (configStr.startsWith('uuid(')) return 'uuid';
  if (configStr.startsWith('boolean(')) return 'boolean';
  if (configStr.startsWith('float(')) return 'float';
  if (configStr.startsWith('json(')) return 'json';
  if (configStr.startsWith('bigint(')) return 'bigint';
  return 'string';
}

function extractRelations(block: string): RelDef[] {
  const rels: RelDef[] = [];
  const relRegex =
    /\.add\s*\(\s*['"]([^'"]+)['"]\s*,\s*(?:relation|defineRel)\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*(?:,\s*(\{[\s\S]*?\}))?\s*\)/g;
  let match: RegExpExecArray | null = relRegex.exec(block);
  while (match !== null) {
    const name = match[1]!;
    const type = match[2]!;
    const direction = match[3]!;
    const target = match[4]!;
    const options = match[5] ?? '';
    const multiple = options.includes('multiple: true');

    rels.push({ name, type, direction, target, multiple });
    match = relRegex.exec(block);
  }

  return rels;
}

export function generateTypesContent(nodes: NodeDef[]): string {
  return `// Auto-generated by Metal CLI
// Type definitions for your graph schema
import type { WhereOperator } from '@metal/core';

${nodes.map((n) => generateNodeInterface(n)).join('\n\n')}

${nodes.map((n) => generateWhereType(n)).join('\n\n')}

${nodes.map((n) => generateCreateType(n)).join('\n\n')}

${nodes.map((n) => generateUpdateType(n)).join('\n\n')}
`.replace(/\n\n\n+/g, '\n\n');
}

export function generateZodContent(nodes: NodeDef[]): string {
  return `// Auto-generated by Metal CLI
// Zod schemas for your graph schema
import { z } from 'zod';

${nodes.map((n) => generateZodSchema(n)).join('\n\n')}
`.replace(/\n\n\n+/g, '\n\n');
}

export function generateClientContent(nodes: NodeDef[]): string {
  const nodeMapFields = nodes.map((n) => `  '${n.label}': ${n.label}Node;`).join('\n');
  const imports = nodes.map((n) => `${n.label}Node`).join(', ');
  const nodeMapEntries = nodes
    .map((n) => {
      const props = n.properties
        .map(
          (p) =>
            `    ${p.name}: { type: '${p.type}'${p.primary ? ', primary: true' : ''}${p.unique ? ', unique: true' : ''}${p.nullable ? ', nullable: true' : ''}${p.array ? ', array: true' : ''} }`,
        )
        .join(',\n');
      return `  '${n.label}': {\n    label: '${n.label}',\n    properties: {\n${props}\n    },\n    relations: {},\n  }`;
    })
    .join(',\n');

  return `// Auto-generated by Metal CLI
import { MetalClient, env } from '@metal/core';
import type { DriverAdapter, NodeConfig } from '@metal/core';
import { createNeo4jDriver } from '@metal/neo4j-driver';
import type { ${imports} } from './types.js';

export type MetalNodeMap = {
${nodeMapFields}
};

export const nodeConfigs = {
${nodeMapEntries}
} as unknown as Record<string, NodeConfig<string, any>>;

export interface ClientConfig {
  uri?: string;
  username?: string;
  password?: string;
  database?: string;
}

export async function createClient(config: ClientConfig = {}): Promise<MetalClient> {
  const driver: DriverAdapter = createNeo4jDriver({
    uri: config.uri || env.NEO4J_URI,
    username: config.username || env.NEO4J_USER,
    password: config.password || env.NEO4J_PASSWORD,
    database: config.database,
  });
  await driver.connect();
  const client = new MetalClient(driver, nodeConfigs);
  return client;
}
`;
}

export interface LoadedProjectConfig {
  schemaPath: string;
  outputDir: string;
  zod: boolean;
  exclude: string[];
}

export function loadProjectConfig(projectRoot: string): LoadedProjectConfig {
  let schemaPath = path.join(projectRoot, 'src', 'schema.ts');
  let outputDir = path.join(projectRoot, 'src', '__generated__');
  let zod = false;
  let exclude: string[] = [];

  const configPath = path.join(projectRoot, 'metal.config.ts');
  const configJsonPath = path.join(projectRoot, 'metal.config.json');

  if (fs.existsSync(configJsonPath)) {
    const raw = fs.readFileSync(configJsonPath, 'utf-8');
    try {
      const parsed = JSON.parse(raw) as {
        schema?: string;
        output?: { directory?: string; zod?: boolean };
        exclude?: string[];
      };
      if (parsed.schema) schemaPath = path.resolve(projectRoot, parsed.schema);
      if (parsed.output?.directory) outputDir = path.resolve(projectRoot, parsed.output.directory);
      if (parsed.output?.zod) zod = true;
      if (Array.isArray(parsed.exclude)) exclude = parsed.exclude;
    } catch {
      console.warn('⚠ Could not parse metal.config.json, using defaults.');
    }
  } else if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const schemaMatch = raw.match(/schema:\s*['"]([^'"]+)['"]/);
    const outputMatch = raw.match(/directory:\s*['"]([^'"]+)['"]/);
    const zodMatch = raw.match(/zod:\s*(true|false)/);
    const excludeMatch = raw.match(/exclude:\s*\[([^\]]*)\]/);
    if (schemaMatch?.[1]) {
      schemaPath = path.resolve(projectRoot, schemaMatch[1]);
    }
    if (outputMatch?.[1]) {
      outputDir = path.resolve(projectRoot, outputMatch[1]);
    }
    if (zodMatch?.[1] === 'true') zod = true;
    if (excludeMatch?.[1]) {
      exclude = [...excludeMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]!);
    }
  }

  return { schemaPath, outputDir, zod, exclude };
}

export function runGenerate(projectRoot: string): GenerateResult {
  const { schemaPath, outputDir, zod, exclude } = loadProjectConfig(projectRoot);

  if (!fs.existsSync(schemaPath)) {
    throw new Error(
      `Schema file not found at ${schemaPath}. ` +
        `Check the "schema" field in metal.config.ts or run \`metal init\`.`,
    );
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const nodes = loadSchema(schemaPath, exclude);

  const files: string[] = [];

  fs.writeFileSync(path.join(outputDir, 'types.ts'), generateTypesContent(nodes));
  files.push('types.ts');

  fs.writeFileSync(path.join(outputDir, 'client.ts'), generateClientContent(nodes));
  files.push('client.ts');

  if (zod) {
    fs.writeFileSync(path.join(outputDir, 'zod.ts'), generateZodContent(nodes));
    files.push('zod.ts');
  }

  return { nodes, outputDir, files };
}

export async function generateCommand(options: GenerateOptions): Promise<void> {
  const projectRoot = process.cwd();

  try {
    const result = runGenerate(projectRoot);
    console.log(
      `✓ Generated types in ${path.relative(projectRoot, result.outputDir)}/ (${result.files.join(', ')})`,
    );
    console.log(`  Nodes: ${result.nodes.map((n) => n.label).join(', ') || '(none found)'}`);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }

  if (options.watch) {
    const { schemaPath } = loadProjectConfig(projectRoot);
    const watchTargets = [schemaPath, path.join(projectRoot, 'metal.config.ts')].filter((p) =>
      fs.existsSync(p),
    );
    console.log('\n👀 Watching for changes... (Ctrl+C to stop)\n');

    let debounce: NodeJS.Timeout | undefined;
    const regenerate = (filename: string) => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        try {
          console.log(`↻ ${filename} changed, regenerating...`);
          const result = runGenerate(projectRoot);
          console.log(`✓ Regenerated (${result.files.join(', ')})`);
        } catch (error) {
          console.error(`Error: ${(error as Error).message}`);
        }
      }, 150);
    };

    for (const target of watchTargets) {
      fs.watch(target, () => regenerate(path.basename(target)));
    }

    // Also watch the schema's directory for renames handled by re-running on any event
    await new Promise(() => {
      /* run forever */
    });
  }
}
