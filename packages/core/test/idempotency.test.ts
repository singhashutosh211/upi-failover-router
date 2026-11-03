import { describe, expect, it } from 'vitest';
import {
  IdempotencyConflictError,
  assertSameRequest,
  canonicalRequestHash,
} from '@upi-failover/core';

describe('canonicalRequestHash', () => {
  it('is stable across object key order', () => {
    const left = canonicalRequestHash({ b: 1, a: { d: 2, c: 3 }, list: [1, { z: 1, y: 2 }] });
    const right = canonicalRequestHash({ a: { c: 3, d: 2 }, list: [1, { y: 2, z: 1 }], b: 1 });
    expect(left).toBe(right);
    expect(left).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when the amount changes', () => {
    expect(canonicalRequestHash({ amount: 49900 })).not.toBe(
      canonicalRequestHash({ amount: 50000 }),
    );
  });

  it('rejects a reused key whose body hash differs', () => {
    expect(() => assertSameRequest('abc', 'abc', 'key-1')).not.toThrow();
    expect(() => assertSameRequest('abc', 'def', 'key-1')).toThrow(IdempotencyConflictError);
  });
});
