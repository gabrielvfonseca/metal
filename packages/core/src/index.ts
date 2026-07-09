// @metal/core/src/index.ts
// Metal - Prisma-like DX for graph databases

export {
  node,
  defineRel,
  schema,
  property,
  string,
  number,
  boolean,
  date,
  bigint,
  float,
  uuid,
  json,
  relation,
  path,
  shortestPath,
  allShortestPaths,
} from './schema';

export {
  MetalClient,
  MetalTransaction,
} from './client';

export {
  QueryCompiler,
  createQueryCompiler,
} from './query';

export {
  defineConfig,
  resolveConfig,
  loadConfig,
  getDefaultConfig,
} from './config';

export type {
  PropertyConfig,
  PropertyType,
  NodeConfig,
  RelationConfig,
  RelationDirection,
  WhereCondition,
  WhereOperator,
  OrderByInput,
  IncludeInput,
  SelectInput,
  CreateInput,
  UpdateInput,
  FindManyOptions,
  FindUniqueOptions,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
  UpsertOptions,
  MetalClientConfig,
  DriverAdapter,
  QueryResult,
  QueryRecord,
  TransactionContext,
  MetalConfig,
  MetalDriverConfig,
  MetalOutputConfig,
} from './types';