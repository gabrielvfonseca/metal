// @metal/core/src/types/index.ts
// Core type definitions for Metal OGM

export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'bigint'
  | 'float'
  | 'uuid'
  | 'json';

export type RelationDirection = 'IN' | 'OUT' | 'BOTH';

export interface PropertyConfig<T extends PropertyType = PropertyType> {
  type: T;
  primary?: boolean;
  unique?: boolean;
  index?: boolean;
  default?: PropertyTypeToJSType<T> | (() => PropertyTypeToJSType<T>);
  nullable?: boolean;
  array?: boolean;
}

export type PropertyTypeToJSType<T extends PropertyType> =
  T extends 'string' ? string
  : T extends 'number' ? number
  : T extends 'boolean' ? boolean
  : T extends 'date' ? Date
  : T extends 'bigint' ? bigint
  : T extends 'float' ? number
  : T extends 'uuid' ? string
  : T extends 'json' ? unknown
  : never;

export interface NodeConfig<TName extends string, TProps extends Record<string, PropertyConfig>> {
  label: TName;
  properties: TProps;
  relations: Record<string, RelationConfig<any, any>>;
  indexes?: Array<{ fields: Array<keyof TProps>; unique?: boolean }>;
  constraints?: Array<{ fields: Array<keyof TProps>; type: 'UNIQUE' | 'EXISTS' }>;
}

export interface RelationConfig<TFrom extends string, TTo extends string> {
  type: string;
  direction: RelationDirection;
  target: TTo;
  properties?: Record<string, PropertyConfig>;
  multiple?: boolean;
  // Path traversal options
  path?: {
    minDepth?: number;
    maxDepth?: number;
    shortestPath?: boolean;
    filter?: WhereCondition<Record<string, unknown>>;
  };
  // Internal path traversal markers (added by schema helpers)
  _path?: {
    minDepth?: number;
    maxDepth?: number;
    relationshipFilter?: string;
    direction?: 'OUT' | 'IN' | 'BOTH';
  };
  _shortestPath?: boolean;
  _allShortestPaths?: boolean;
}

export type InferNodeProperties<TConfig extends NodeConfig<any, any>> = {
  [K in keyof TConfig['properties']]: TConfig['properties'][K]['nullable'] extends true
    ? PropertyTypeToJSType<TConfig['properties'][K]['type']> | null
    : PropertyTypeToJSType<TConfig['properties'][K]['type']>;
};

export type InferNodeRelations<TConfig extends NodeConfig<any, any>> = {
  [K in keyof TConfig['relations']]: TConfig['relations'][K]['multiple'] extends true
    ? InferNode<TConfig['relations'][K]['target']>[]
    : InferNode<TConfig['relations'][K]['target']> | null;
};

export type InferNode<TName extends string> = TName extends 'User'
  ? UserNode
  : TName extends 'Post'
  ? PostNode
  : TName extends 'Comment'
  ? CommentNode
  : Record<string, unknown>;

export interface UserNode {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostNode {
  id: string;
  title: string;
  content: string;
  published: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentNode {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  createdAt: Date;
}

export type InferRelationProperties<TConfig extends RelationConfig<any, any>> = TConfig['properties'] extends Record<string, PropertyConfig>
  ? {
      [K in keyof TConfig['properties']]: TConfig['properties'][K]['nullable'] extends true
        ? PropertyTypeToJSType<TConfig['properties'][K]['type']> | null
        : PropertyTypeToJSType<TConfig['properties'][K]['type']>;
    }
  : Record<string, unknown>;

// Type-level utilities for query building
export type WhereOperator<T> =
  | T
  | { eq: T }
  | { ne: T }
  | { gt: T }
  | { gte: T }
  | { lt: T }
  | { lte: T }
  | { contains: T }
  | { startsWith: T }
  | { endsWith: T }
  | { in: T[] }
  | { notIn: T[] }
  | { not: WhereOperator<T> };

export type WhereCondition<T> = {
  [K in keyof T]?: WhereOperator<T[K]>;
} & {
  AND?: WhereCondition<T>[];
  OR?: WhereCondition<T>[];
  NOT?: WhereCondition<T>;
};

export type OrderByDirection = 'asc' | 'desc';

export type OrderByInput<T> = {
  [K in keyof T]?: OrderByDirection;
};

export type IncludeInput<TRelations extends Record<string, any>> = {
  [K in keyof TRelations]?: boolean | IncludeInput<TRelations[K]>;
};

export type SelectInput<T> = {
  [K in keyof T]?: boolean;
};

export type CreateInput<T> = {
  [K in keyof T]?: T[K] extends Date ? Date | string : T[K];
};

export type UpdateInput<T> = {
  [K in keyof T]?: T[K] extends Date ? Date | string : T[K];
};

export type RelationInput<T> =
  | { connect: { where: WhereCondition<T> } | { id: string } }
  | { disconnect: { where: WhereCondition<T> } | { id: string } }
  | { create: CreateInput<T> }
  | { set: CreateInput<T>[] }
  | { createMany: CreateInput<T>[] };

export type RelationWhereInput<T> = WhereCondition<T> & {
  every?: WhereCondition<T>;
  some?: WhereCondition<T>;
  none?: WhereCondition<T>;
};

// Client-level options types
export interface FindManyOptions<T extends Record<string, unknown>> {
  where?: WhereCondition<T>;
  orderBy?: OrderByInput<T>;
  limit?: number;
  skip?: number;
  select?: SelectInput<T>;
  include?: IncludeInput<Record<string, any>>;
}

export interface FindUniqueOptions<T extends Record<string, unknown>> {
  where: WhereCondition<T> & { id?: string };
  include?: IncludeInput<Record<string, any>>;
}

export interface CreateOptions<T extends Record<string, unknown>> {
  data: CreateInput<T>;
  relations?: Record<string, {
    connect?: { where: Record<string, unknown> | { id: string } };
    create?: CreateInput<Record<string, unknown>>;
  }>;
}

export interface UpdateOptions<T extends Record<string, unknown>> {
  where: WhereCondition<T> & { id?: string };
  data: UpdateInput<T>;
}

export interface DeleteOptions<T extends Record<string, unknown>> {
  where: WhereCondition<T> & { id?: string };
}

export interface UpsertOptions<T extends Record<string, unknown>> {
  where: WhereCondition<T> & { id?: string };
  create: CreateInput<T>;
  update: UpdateInput<T>;
}

export interface MetalClientConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
  maxConnectionLifetime?: number;
  maxTransactionRetryTime?: number;
}

// Driver adapter types
export interface QueryResult {
  records: QueryRecord[];
  summary: {
    query: { text: string; parameters: Record<string, unknown> };
    counters: Record<string, number>;
    notifications: Array<Record<string, unknown>>;
    database: { name: string };
  };
  keys: string[];
}

export interface QueryRecord {
  keys: string[];
  get(key: string): unknown;
  toObject(): Record<string, unknown>;
}

export interface TransactionContext {
  run(query: string, params?: Record<string, unknown>): Promise<QueryResult>;
}

export interface DriverAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  runQuery(cypher: string, params?: Record<string, unknown>): Promise<QueryResult>;
  runInTransaction<T>(work: (txc: TransactionContext) => Promise<T>): Promise<T>;
  runInReadTransaction<T>(work: (txc: TransactionContext) => Promise<T>): Promise<T>;
  verifyConnectivity(): Promise<boolean>;
  getServerInfo(): Promise<{ address: string; version: string; protocol: string }>;
}

// Config types
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
  directory?: string;
  zod?: boolean;
}

export interface MetalConfig {
  schema: string;
  output?: MetalOutputConfig;
  driver?: MetalDriverConfig;
  debug?: boolean;
  exclude?: string[];
}