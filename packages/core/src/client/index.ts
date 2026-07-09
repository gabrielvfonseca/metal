// @metal/core/src/client/index.ts
// MetalClient - Type-safe graph database client

import { QueryCompiler } from '../query';
import type {
  NodeConfig,
  RelationConfig,
  WhereCondition,
  IncludeInput,
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
  TransactionContext,
  MetalConfig,
  MetalDriverConfig,
} from '../types';

export class MetalClient {
  private driver: DriverAdapter;
  private compiler: QueryCompiler;
  private schemaNodes: Map<string, NodeConfig<any, any>>;

  constructor(
    driver: DriverAdapter,
    schemaNodes?: Record<string, NodeConfig<any, any>>
  ) {
    this.driver = driver;
    this.compiler = new QueryCompiler();
    this.schemaNodes = new Map();

    if (schemaNodes) {
      for (const [name, nodeConfig] of Object.entries(schemaNodes)) {
        this.schemaNodes.set(name, nodeConfig as NodeConfig<any, any>);
      }
    }
  }

  /**
   * Create a MetalClient from a driver adapter factory and optional config.
   *
   * @example
   * ```ts
   * import { createNeo4jDriver } from '@metal/neo4j-driver'
   * const client = MetalClient.fromConfig(driver, { schema: './src/schema.ts' })
   * ```
   */
  static fromConfig(
    driverOrFactory: DriverAdapter | ((config?: any) => DriverAdapter),
    config?: Partial<MetalConfig>,
    schemaNodes?: Record<string, NodeConfig<any, any>>
  ): MetalClient {
    const driver = typeof driverOrFactory === 'function'
      ? driverOrFactory(config?.driver)
      : driverOrFactory;
    return new MetalClient(driver, schemaNodes);
  }

  registerNode<TName extends string>(name: TName, config: NodeConfig<TName, any>): void {
    this.schemaNodes.set(name, config);
  }

  registerNodes(nodes: Record<string, NodeConfig<any, any>>): void {
    for (const [name, config] of Object.entries(nodes)) {
      this.schemaNodes.set(name, config);
    }
  }

  getDriver(): DriverAdapter {
    return this.driver;
  }

  async disconnect(): Promise<void> {
    await this.driver.disconnect();
  }

  getNodeConfig(label: string): NodeConfig<any, any> {
    const config = this.schemaNodes.get(label);
    if (!config) {
      throw new Error(
        `Node "${label}" is not registered in the schema. ` +
        `Did you forget to call registerNode() or pass schemaNodes to the constructor?`
      );
    }
    return config;
  }

  async findMany<T extends Record<string, unknown>>(
    label: string,
    options: FindManyOptions<T> = {}
  ): Promise<T[]> {
    const nodeConfig = this.getNodeConfig(label);
    const query = this.compiler.compileFindMany(label, options);
    const result = await this.driver.runQuery(query.cypher, query.params);
    const records = result.records;
    const items = records.map((record) => this.toObject<T>(record));

    if (options.include && items.length > 0) {
      return await this.hydrateRelations(items, options.include, nodeConfig);
    }

    return items;
  }

  async findUnique<T extends Record<string, unknown>>(
    label: string,
    options: FindUniqueOptions<T>
  ): Promise<T | null> {
    const nodeConfig = this.getNodeConfig(label);
    const query = this.compiler.compileFindUnique(label as string, options.where, nodeConfig);
    const result = await this.driver.runQuery(query.cypher, query.params);

    if (result.records.length === 0) return null;

    const record = result.records[0]!;
    const item = this.toObject<T>(record);

    if (options.include) {
      const hydrated = await this.hydrateRelations([item], options.include, nodeConfig);
      return hydrated[0] ?? null;
    }

    return item;
  }

  async create<T extends Record<string, unknown>>(
    label: string,
    options: CreateOptions<T>
  ): Promise<T> {
    const nodeConfig = this.getNodeConfig(label);
    const query = options.relations
      ? this.compiler.compileCreateAndConnect(label as string, options.data, options.relations, nodeConfig)
      : this.compiler.compileCreate(label as string, options.data, nodeConfig);

    const result = await this.driver.runQuery(query.cypher, query.params);
    if (result.records.length === 0) throw new Error(`Failed to create ${label}`);
    const record = result.records[0]!;
    return this.toObject<T>(record);
  }

  async update<T extends Record<string, unknown>>(
    label: string,
    options: UpdateOptions<T>
  ): Promise<T> {
    const nodeConfig = this.getNodeConfig(label);
    const query = this.compiler.compileUpdate(label as string, options.where, options.data, nodeConfig);
    const result = await this.driver.runQuery(query.cypher, query.params);

    if (result.records.length === 0) {
      throw new Error(`Failed to update ${label}: record not found`);
    }

    const record = result.records[0]!;
    return this.toObject<T>(record);
  }

  async delete<T extends Record<string, unknown>>(
    label: string,
    options: DeleteOptions<T>
  ): Promise<void> {
    const nodeConfig = this.getNodeConfig(label);
    const query = this.compiler.compileDelete(label as string, options.where, nodeConfig);
    await this.driver.runQuery(query.cypher, query.params);
  }

  async upsert<T extends Record<string, unknown>>(
    label: string,
    options: UpsertOptions<T>
  ): Promise<T> {
    const nodeConfig = this.getNodeConfig(label);
    const query = this.compiler.compileUpsert(
      label as string,
      options.where,
      options.create,
      options.update,
      nodeConfig
    );
    const result = await this.driver.runQuery(query.cypher, query.params);
    const record = result.records[0]!;
    return this.toObject<T>(record);
  }

  async count(
    label: string,
    where?: WhereCondition<Record<string, unknown>>
  ): Promise<number> {
    const query = this.compiler.compileAggregate(label, 'count', undefined, where);
    const result = await this.driver.runQuery(query.cypher, query.params);

    if (result.records.length === 0) return 0;
    const record = result.records[0]!;
    const value = record.get('result');
    return neo4jIntegerToNumber(value);
  }

  async aggregate(
    label: string,
    aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max',
    field?: string,
    where?: WhereCondition<Record<string, unknown>>
  ): Promise<number> {
    const query = this.compiler.compileAggregate(label, aggregation, field, where);
    const result = await this.driver.runQuery(query.cypher, query.params);

    if (result.records.length === 0) return 0;
    const record = result.records[0]!;
    const value = record.get('result');
    return neo4jIntegerToNumber(value);
  }

  async relate(
    fromLabel: string,
    fromId: string,
    relationType: string,
    toLabel: string,
    toId: string,
    direction: 'IN' | 'OUT' | 'BOTH' = 'OUT'
  ): Promise<void> {
    const query = this.compiler.compileCreateRelation(fromId, relationType, toId, direction);
    await this.driver.runQuery(query.cypher, query.params);
  }

  async unrelate(
    fromLabel: string,
    fromId: string,
    relationType: string,
    toLabel: string,
    toId: string,
    direction: 'IN' | 'OUT' | 'BOTH' = 'OUT'
  ): Promise<void> {
    const query = this.compiler.compileDeleteRelation(fromId, relationType, toId, direction);
    await this.driver.runQuery(query.cypher, query.params);
  }

  async raw<T = Record<string, unknown>>(
    cypher: string,
    params?: Record<string, unknown>
  ): Promise<T[]> {
    const query = this.compiler.compileRaw(cypher, params);
    const result = await this.driver.runQuery(query.cypher, query.params);
    return result.records.map((record) => this.toObject<T>(record));
  }

  async transaction<T>(
    work: (tx: MetalTransaction) => Promise<T>
  ): Promise<T> {
    return await this.driver.runInTransaction(async (txc: TransactionContext) => {
      const tx = new MetalTransaction(this.compiler, txc, this.schemaNodes);
      return await work(tx);
    });
  }

  async traverse(
    fromLabel: string,
    relationType: string,
    toLabel: string,
    options: {
      fromId?: string;
      fromWhere?: Record<string, unknown>;
      minDepth?: number;
      maxDepth?: number;
      direction?: 'IN' | 'OUT' | 'BOTH';
      limit?: number;
    }
  ): Promise<Record<string, unknown>[]> {
    const query = this.compiler.compilePath(fromLabel, relationType, toLabel, options);
    const result = await this.driver.runQuery(query.cypher, query.params);
    return result.records.map((record) => this.toObject(record));
  }

  async findShortestPath(
    fromLabel: string,
    relationType: string,
    toLabel: string,
    options: {
      fromId?: string;
      fromWhere?: Record<string, unknown>;
      toId?: string;
      toWhere?: Record<string, unknown>;
      maxDepth?: number;
      direction?: 'IN' | 'OUT' | 'BOTH';
    }
  ): Promise<{ nodes: Record<string, unknown>[]; path: unknown } | null> {
    const query = this.compiler.compileShortestPath(fromLabel, relationType, toLabel, options);
    const result = await this.driver.runQuery(query.cypher, query.params);
    if (result.records.length === 0) return null;
    const record = result.records[0]!;
    return {
      nodes: [this.toObject(record.get('n')), this.toObject(record.get('m'))],
      path: record.get('path'),
    };
  }

  async findAllShortestPaths(
    fromLabel: string,
    relationType: string,
    toLabel: string,
    options: {
      fromId?: string;
      fromWhere?: Record<string, unknown>;
      toId?: string;
      toWhere?: Record<string, unknown>;
      maxDepth?: number;
      direction?: 'IN' | 'OUT' | 'BOTH';
    }
  ): Promise<{ nodes: Record<string, unknown>[]; path: unknown }[]> {
    const query = this.compiler.compileAllShortestPaths(fromLabel, relationType, toLabel, options);
    const result = await this.driver.runQuery(query.cypher, query.params);
    return result.records.map((record) => ({
      nodes: [this.toObject(record.get('n')), this.toObject(record.get('m'))],
      path: record.get('path'),
    }));
  }

  private async hydrateRelations<T extends Record<string, unknown>>(
    items: T[],
    include: IncludeInput<Record<string, any>>,
    nodeConfig: NodeConfig<any, any>
  ): Promise<T[]> {
    for (const [relName, includeConfig] of Object.entries(include)) {
      if (!includeConfig) continue;

      const relConfig = nodeConfig.relations[relName] as RelationConfig<string, string> | undefined;
      if (!relConfig) continue;

      for (const item of items) {
        const itemId = (item as Record<string, unknown>)['id'];
        if (!itemId) continue;

        const targetAlias = relConfig.direction === 'IN' ? 'a' : 'b';
        const fromAlias = relConfig.direction === 'IN' ? 'b' : 'a';

        let cypher: string;
        if (relConfig.direction === 'OUT') {
          cypher = `MATCH (${fromAlias}:${nodeConfig.label} {id: $id})-[r:${relConfig.type}]->(${targetAlias}:${relConfig.target}) RETURN ${targetAlias}`;
        } else if (relConfig.direction === 'IN') {
          cypher = `MATCH (${fromAlias}:${nodeConfig.label} {id: $id})<-[r:${relConfig.type}]-(${targetAlias}:${relConfig.target}) RETURN ${targetAlias}`;
        } else {
          cypher = `MATCH (${fromAlias}:${nodeConfig.label} {id: $id})-[r:${relConfig.type}]-(${targetAlias}:${relConfig.target}) RETURN ${targetAlias}`;
        }

        const result = await this.driver.runQuery(cypher, { id: String(itemId) });

        if (includeConfig === true || typeof includeConfig !== 'object') {
          if (relConfig.multiple) {
            (item as Record<string, unknown>)[String(relName)] = result.records.map((r) =>
              this.toObject(r)
            );
          } else {
            (item as Record<string, unknown>)[String(relName)] =
              result.records.length > 0 ? this.toObject(result.records[0]!) : null;
          }
        } else if (typeof includeConfig === 'object') {
          const hydratedItems: Record<string, unknown>[] = result.records.map((r: any) => this.toObject(r));
          const targetNodeConfig = this.schemaNodes.get(relConfig.target);
          if (targetNodeConfig) {
            const deeplyHydrated = await this.hydrateRelations(
              hydratedItems,
              includeConfig as IncludeInput<Record<string, any>>,
              targetNodeConfig
            );
            if (relConfig.multiple) {
              (item as Record<string, unknown>)[String(relName)] = deeplyHydrated;
            } else {
              (item as Record<string, unknown>)[String(relName)] =
                deeplyHydrated.length > 0 ? deeplyHydrated[0] : null;
            }
          } else {
            if (relConfig.multiple) {
              (item as Record<string, unknown>)[String(relName)] = hydratedItems;
            } else {
              (item as Record<string, unknown>)[String(relName)] =
                hydratedItems.length > 0 ? hydratedItems[0] : null;
            }
          }
        }
      }
    }

    return items;
  }

  private toObject<T>(record: any): T {
    const obj = typeof record.toObject === 'function' ? record.toObject() : record;
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(obj)) {
      result[key] = parseNeo4jValue(obj[key]);
    }

    return result as T;
  }
}

export class MetalTransaction {
  private compiler: QueryCompiler;
  private txc: TransactionContext;
  private schemaNodes: Map<string, NodeConfig<any, any>>;

  constructor(
    compiler: QueryCompiler,
    txc: TransactionContext,
    schemaNodes: Map<string, NodeConfig<any, any>>
  ) {
    this.compiler = compiler;
    this.txc = txc;
    this.schemaNodes = schemaNodes;
  }

  private async runQuery(cypher: string, params: Record<string, unknown>): Promise<QueryResult> {
    return await this.txc.run(cypher, params);
  }

  getNodeConfig(label: string): NodeConfig<any, any> {
    const config = this.schemaNodes.get(label);
    if (!config) {
      throw new Error(
        `Node "${label}" is not registered in the schema.`
      );
    }
    return config;
  }

  async findOne<T extends Record<string, unknown>>(
    label: string,
    where: WhereCondition<T> & { id?: string }
  ): Promise<T | null> {
    const nodeConfig = this.getNodeConfig(label);
    const query = this.compiler.compileFindUnique(label, where, nodeConfig);
    if (!query.cypher) return null;

    const result = await this.runQuery(query.cypher, query.params);
    if (result.records.length === 0) return null;
    return result.records[0]!.toObject() as T;
  }

  async findMany<T extends Record<string, unknown>>(
    label: string,
    options: FindManyOptions<T> = {}
  ): Promise<T[]> {
    const query = this.compiler.compileFindMany(label, options);
    const result = await this.runQuery(query.cypher, query.params);
    return result.records.map((r) => r.toObject() as T);
  }

  async create<T extends Record<string, unknown>>(
    label: string,
    options: CreateOptions<T>
  ): Promise<T> {
    const nodeConfig = this.getNodeConfig(label);
    const query = options.relations
      ? this.compiler.compileCreateAndConnect(label, options.data, options.relations, nodeConfig)
      : this.compiler.compileCreate(label, options.data, nodeConfig);
    const result = await this.runQuery(query.cypher, query.params);
    if (result.records.length === 0) throw new Error(`Failed to create ${label}`);
    return result.records[0]!.toObject() as T;
  }

  async update<T extends Record<string, unknown>>(
    label: string,
    options: UpdateOptions<T>
  ): Promise<T> {
    const nodeConfig = this.getNodeConfig(label);
    const query = this.compiler.compileUpdate(label, options.where, options.data, nodeConfig);
    const result = await this.runQuery(query.cypher, query.params);
    if (result.records.length === 0) throw new Error(`Failed to update ${label}: record not found`);
    return result.records[0]!.toObject() as T;
  }

  async delete<T extends Record<string, unknown>>(
    label: string,
    options: DeleteOptions<T>
  ): Promise<void> {
    const nodeConfig = this.getNodeConfig(label);
    const query = this.compiler.compileDelete(label, options.where, nodeConfig);
    await this.runQuery(query.cypher, query.params);
  }

  async raw<T = Record<string, unknown>>(
    cypher: string,
    params?: Record<string, unknown>
  ): Promise<T[]> {
    const query = this.compiler.compileRaw(cypher, params);
    const result = await this.runQuery(query.cypher, query.params);
    return result.records.map((r) => r.toObject() as T);
  }

  async traverse(
    fromLabel: string,
    relationType: string,
    toLabel: string,
    options: {
      fromId?: string;
      fromWhere?: Record<string, unknown>;
      minDepth?: number;
      maxDepth?: number;
      direction?: 'IN' | 'OUT' | 'BOTH';
      limit?: number;
    }
  ): Promise<Record<string, unknown>[]> {
    const query = this.compiler.compilePath(fromLabel, relationType, toLabel, options);
    const result = await this.runQuery(query.cypher, query.params);
    return result.records.map((record) => record.toObject());
  }
}

function parseNeo4jValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'object' && value !== null) {
    const v = value as Record<string, unknown>;
    if ('low' in v && 'high' in v && 'toNumber' in v) {
      return neo4jIntegerToNumber(v);
    }
    if (value instanceof Date) {
      return value;
    }
    if (typeof (value as any).toDate === 'function') {
      try {
        return new Date((value as any).toString());
      } catch {
        return (value as any).toString();
      }
    }
    if (typeof (value as any).toNumber === 'function') {
      return (value as any).toNumber();
    }
    if (Array.isArray(value)) {
      return (value as unknown[]).map(parseNeo4jValue);
    }
  }

  return value;
}

function neo4jIntegerToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null) {
    const v = value as any;
    if (typeof v.toNumber === 'function') return v.toNumber() as number;
    if (typeof v.low === 'number') return v.low;
  }
  return Number(value);
}

export { parseNeo4jValue, neo4jIntegerToNumber };