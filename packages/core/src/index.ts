// @metal/core/src/index.ts
// Metal - Prisma-like DX for graph databases

export {
  MetalClient,
  MetalTransaction,
  neo4jIntegerToNumber,
  parseNeo4jValue,
} from './client';
export {
  defineConfig,
  getDefaultConfig,
  loadConfig,
  resolveConfig,
} from './config';
export { env } from './config/keys';
export type { CompiledQuery } from './query';
export {
  createQueryCompiler,
  QueryCompiler,
} from './query';
export {
  allShortestPaths,
  bigint,
  boolean,
  date,
  defineRel,
  float,
  json,
  node,
  number,
  path,
  property,
  relation,
  schema,
  shortestPath,
  string,
  uuid,
} from './schema';

export type {
  CreateInput,
  CreateOptions,
  DeleteOptions,
  DriverAdapter,
  FindManyOptions,
  FindUniqueOptions,
  IncludeInput,
  InferNode,
  InferNodeProperties,
  InferNodeRelations,
  InferRelationProperties,
  MetalClientConfig,
  MetalConfig,
  MetalDriverConfig,
  MetalOutputConfig,
  MetalSchemaRegistry,
  NodeConfig,
  NoInferShim,
  OrderByDirection,
  OrderByInput,
  PropertyConfig,
  PropertyType,
  PropertyTypeToJSType,
  QueryRecord,
  QueryResult,
  RelationConfig,
  RelationDirection,
  RelationInput,
  RelationWhereInput,
  SelectInput,
  TransactionContext,
  UpdateInput,
  UpdateOptions,
  UpsertOptions,
  WhereCondition,
  WhereOperator,
} from './types';
