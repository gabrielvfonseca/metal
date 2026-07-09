// @metal/cli/src/commands/generate.ts
import fs from 'node:fs';
import path from 'node:path';

interface GenerateOptions {
  watch?: boolean;
}

interface PropertyDef {
  name: string;
  type: string;
  primary?: boolean;
  unique?: boolean;
  nullable?: boolean;
  array?: boolean;
}

interface RelDef {
  name: string;
  type: string;
  direction: string;
  target: string;
  multiple: boolean;
}

interface NodeDef {
  label: string;
  properties: PropertyDef[];
  relations: RelDef[];
}

function mapPropertyType(type: string, array?: boolean): string {
  const tsType: Record<string, string> = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    date: 'Date',
    bigint: 'bigint',
    float: 'number',
    uuid: 'string',
    json: 'unknown',
  };
  const base = tsType[type] || 'unknown';
  return array ? `${base}[]` : base;
}

function generateNodeInterface(node: NodeDef): string {
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

function generateWhereType(node: NodeDef): string {
  const fields = node.properties.map(p => {
    const tsType = mapPropertyType(p.type, p.array);
    return `  ${p.name}?: ${tsType} | WhereOperator<${tsType}>;`;
  }).join('\n');

  return `export type ${node.label}Where = {
${fields}
  AND?: ${node.label}Where[];
  OR?: ${node.label}Where[];
  NOT?: ${node.label}Where;
};`;
}

function generateCreateType(node: NodeDef): string {
  const fields = node.properties
    .filter(p => !p.primary && !p.array)
    .map(p => {
      const optional = p.nullable || p.primary ? '?' : '';
      const tsType = mapPropertyType(p.type);
      return `  ${p.name}${optional}: ${tsType};`;
    }).join('\n');

  return `export type ${node.label}CreateInput = {\n${fields}\n};`;
}

function generateUpdateType(node: NodeDef): string {
  const fields = node.properties
    .filter(p => !p.primary)
    .map(p => {
      const tsType = mapPropertyType(p.type);
      const optional = p.type === 'date' ? 'Date | string' : tsType;
      return `  ${p.name}?: ${optional};`;
    }).join('\n');

  return `export type ${node.label}UpdateInput = {\n${fields}\n};`;
}

async function loadSchema(schemaPath: string): Promise<NodeDef[]> {
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  // Extract node definitions using regex
  const nodeRegex = /node\s*\(\s*['"]([^'"]+)['"]\)/g;
  const nodes: NodeDef[] = [];

  const labelMatches = [...schemaContent.matchAll(nodeRegex)];
  for (const match of labelMatches) {
    const label = match[1]!;
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
  // Return content from node() to .build()
  return content.slice(startIndex, start + 8);
}

function extractProperties(block: string): PropertyDef[] {
  const props: PropertyDef[] = [];
  const propRegex = /\.add\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = propRegex.exec(block)) !== null) {
    const name = match[1]!;
    const configStr = match[2]!;
    const type = extractType(configStr);
    const primary = configStr.includes('primary: true');
    const unique = configStr.includes('unique: true');
    const nullable = configStr.includes('nullable: true');
    const array = configStr.includes('array: true');

    props.push({ name, type, primary, unique, nullable, array });
  }

  return props;
}

function extractType(configStr: string): string {
  const knownTypes = ['string', 'number', 'boolean', 'date', 'bigint', 'float', 'uuid', 'json'];
  for (const t of knownTypes) {
    if (configStr.includes(`type: '${t}'`)) return t;
  }
  if (configStr.startsWith('string(') || configStr.startsWith("string(")) return 'string';
  if (configStr.startsWith('number(')) return 'number';
  if (configStr.startsWith('date(')) return 'date';
  if (configStr.startsWith('uuid(')) return 'uuid';
  if (configStr.startsWith('boolean(')) return 'boolean';
  if (configStr.startsWith('float(')) return 'float';
  return 'string';
}

function extractRelations(block: string): RelDef[] {
  const rels: RelDef[] = [];
  const relRegex = /\.add\s*\(\s*['"]([^'"]+)['"]\s*,\s*(relation|defineRel)\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = relRegex.exec(block)) !== null) {
    const name = match[1]!;
    const type = match[3]!;
    const direction = match[4]!;
    const target = match[5]!;
    const multiple = block.includes(`multiple: true`);

    rels.push({ name, type, direction, target, multiple });
  }

  return rels;
}

function generateClientContent(nodes: NodeDef[]): string {
  const nodeNames = nodes.map(n => `  '${n.label}'`).join(',\n');
  const imports = nodes.map(n => `${n.label}Node`).join(', ');

  return `// Auto-generated by Metal CLI
import { MetalClient, MetalTransaction } from '@metal/core';
import { createNeo4jDriver } from '@metal/neo4j-driver';
import type {
  WhereCondition,
  FindManyOptions,
  CreateInput,
  UpdateInput,
  WhereOperator
} from '@metal/core';
import type { ${imports} } from './types.js';

export type MetalNodeMap = {
${nodeNames}
};

export async function createClient(config: {
  uri?: string;
  username?: string;
  password?: string;
  database?: string;
} = {}): Promise<MetalClient> {
  const driver = createNeo4jDriver({
    uri: config.uri || process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: config.username || process.env.NEO4J_USER || 'neo4j',
    password: config.password || process.env.NEO4J_PASSWORD || 'password',
    database: config.database,
  });
  await driver.connect();
  return new MetalClient(driver);
}
`;
}

export async function generateCommand(options: GenerateOptions): Promise<void> {
  const projectRoot = process.cwd();

  // Try loading metal.config.ts, fall back to defaults
  let schemaPath = path.join(projectRoot, 'src', 'schema.ts');
  let outputDir = path.join(projectRoot, 'src', '__generated__');

  const configPath = path.join(projectRoot, 'metal.config.ts');
  if (fs.existsSync(configPath)) {
    // Simple config parser — reads the file and extracts schema/output settings
    const raw = fs.readFileSync(configPath, 'utf-8');
    const schemaMatch = raw.match(/schema:\s*['"]([^'"]+)['"]/);
    const outputMatch = raw.match(/directory:\s*['"]([^'"]+)['"]/);
    if (schemaMatch && schemaMatch[1]) {
      schemaPath = path.resolve(projectRoot, schemaMatch[1]);
    }
    if (outputMatch && outputMatch[1]) {
      outputDir = path.resolve(projectRoot, outputMatch[1]);
    }
  }

  if (!fs.existsSync(schemaPath)) {
    console.error(`Error: Schema file not found at ${schemaPath}`);
    console.error('Check the "schema" field in metal.config.ts or run `metal init`.');
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const nodes = await loadSchema(schemaPath);

  const typeImports = nodes.map(n => n.label).join(', ');

  const typeContent = `// Auto-generated by Metal CLI
// Type definitions for your graph schema
import type { WhereOperator } from '@metal/core';

${nodes.map(n => generateNodeInterface(n)).join('\n\n')}

${nodes.map(n => generateWhereType(n)).join('\n\n')}

${nodes.map(n => generateCreateType(n)).join('\n\n')}

${nodes.map(n => generateUpdateType(n)).join('\n\n')}
`;

  fs.writeFileSync(path.join(outputDir, 'types.ts'), typeContent.replace(/\n\n\n/g, '\n\n'));

  const clientContent = generateClientContent(nodes);
  fs.writeFileSync(path.join(outputDir, 'client.ts'), clientContent);

  const generatedFiles = fs.readdirSync(outputDir).join(', ');
  console.log(`✓ Generated types in ${path.relative(projectRoot, outputDir)}/ (${generatedFiles})`);
  console.log(`  Nodes: ${nodes.map(n => n.label).join(', ')}`);

  if (options.watch) {
    console.log('⚠ Watch mode is not yet implemented.');
  }
}