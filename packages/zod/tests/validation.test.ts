// @metal/zod/tests/validation.test.ts
import { describe, it, expect } from 'vitest';
import {
  toZodSchema,
  toCreateSchema,
  toUpdateSchema,
  validateCreate,
  validateUpdate,
  validationHooks,
} from '../src/index';

const mockNodeConfig = {
  label: 'User' as const,
  properties: {
    id: { type: 'string' as const, primary: true },
    name: { type: 'string' as const },
    email: { type: 'string' as const, unique: true },
    age: { type: 'number' as const, nullable: true },
    score: { type: 'float' as const, default: 0 },
  },
  relations: {},
};

describe('toZodSchema', () => {
  it('generates a valid Zod schema for a node config', () => {
    const schema = toZodSchema(mockNodeConfig);
    expect(schema).toBeDefined();
    expect(schema.shape).toHaveProperty('id');
    expect(schema.shape).toHaveProperty('name');
    expect(schema.shape).toHaveProperty('email');
    expect(schema.shape).toHaveProperty('age');
  });

  it('parses valid data correctly', () => {
    const schema = toZodSchema(mockNodeConfig);
    const result = schema.parse({
      id: 'abc-123',
      name: 'Alice',
      email: 'alice@test.com',
      age: 30,
      score: 100,
    });

    expect(result.id).toBe('abc-123');
    expect(result.name).toBe('Alice');
    expect(result.email).toBe('alice@test.com');
    expect(result.age).toBe(30);
  });

  it('rejects invalid data', () => {
    const schema = toZodSchema(mockNodeConfig);
    expect(() => schema.parse({ id: 123, name: 456 })).toThrow();
  });

  it('allows nullable fields to be null', () => {
    const schema = toZodSchema(mockNodeConfig);
    const result = schema.parse({
      id: 'abc',
      name: 'Alice',
      email: 'alice@test.com',
      age: null,
    });

    expect(result.age).toBeNull();
  });
});

describe('toCreateSchema', () => {
  it('allows optional fields with defaults', () => {
    const schema = toCreateSchema(mockNodeConfig);
    const result = schema.parse({
      id: 'abc',
      name: 'Alice',
      email: 'alice@test.com',
    });

    expect(result.id).toBe('abc');
    expect(result.name).toBe('Alice');
    expect(result.score).toBe(0);
  });

  it('does not require nullable fields', () => {
    const schema = toCreateSchema(mockNodeConfig);
    const result = schema.parse({
      id: 'abc',
      name: 'Alice',
      email: 'alice@test.com',
    });

    expect(result.age).toBeUndefined();
  });
});

describe('validateCreate', () => {
  it('returns success for valid data', () => {
    const result = validateCreate(mockNodeConfig, {
      id: 'abc',
      name: 'Alice',
      email: 'alice@test.com',
    });

    expect(result.success).toBe(true);
  });

  it('returns error for invalid data', () => {
    const result = validateCreate(mockNodeConfig, {
      id: 'abc',
      name: 'Alice',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

describe('validateUpdate', () => {
  it('returns success with partial data', () => {
    const result = validateUpdate(mockNodeConfig, {
      name: 'Alice Updated',
    });

    expect(result.success).toBe(true);
  });

  it('does not allow updating primary key', () => {
    const schema = toUpdateSchema(mockNodeConfig);
    expect(schema.shape).not.toHaveProperty('id');
  });
});

describe('validationHooks', () => {
  it('creates beforeCreate hook', () => {
    const hooks = validationHooks(mockNodeConfig);
    expect(hooks.beforeCreate).toBeDefined();
    expect(() => hooks.beforeCreate!({})).toThrow();
  });

  it('beforeCreate validates and returns data', () => {
    const hooks = validationHooks(mockNodeConfig);
    const data = hooks.beforeCreate!({
      id: 'abc',
      name: 'Alice',
      email: 'alice@test.com',
    });
    expect(data).toBeDefined();
  });

  it('creates beforeUpdate hook', () => {
    const hooks = validationHooks(mockNodeConfig);
    expect(hooks.beforeUpdate).toBeDefined();
  });
});