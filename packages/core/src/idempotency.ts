import { createHash } from 'node:crypto';
import { IdempotencyConflictError } from './errors.js';

export interface IdempotencyRecord<T> {
  readonly key: string;
  readonly scope: string;
  readonly requestHash: string;
  readonly statusCode: number;
  readonly body: T;
  readonly createdAt: string;
}

/**
 * Same key + same request hash returns the stored record.
 * Same key + different hash throws `IdempotencyConflictError` and must not
 * create a payment. Phase 2 supplies memory and Redis implementations.
 */
export interface IdempotencyStore {
  get<T>(scope: string, key: string): Promise<IdempotencyRecord<T> | null>;
  putIfAbsent<T>(record: IdempotencyRecord<T>): Promise<IdempotencyRecord<T>>;
}

export function canonicalRequestHash(payload: unknown): string {
  return createHash('sha256').update(stableStringify(payload)).digest('hex');
}

export function assertSameRequest(existingHash: string, nextHash: string, key: string): void {
  if (existingHash !== nextHash) {
    throw new IdempotencyConflictError(key);
  }
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortValue(entry));
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    );
    const sorted: Record<string, unknown> = {};
    for (const [key, child] of entries) {
      sorted[key] = sortValue(child);
    }
    return sorted;
  }
  return value;
}
