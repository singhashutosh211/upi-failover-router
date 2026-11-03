import { describe, expect, it } from 'vitest';
import { DEFAULT_ROUTING_CONFIG, DEFAULT_ROUTING_WEIGHTS, systemClock } from '@upi-failover/core';

describe('default routing config', () => {
  it('lets success dominate a weight vector that sums to 1', () => {
    const { success, latency, cost } = DEFAULT_ROUTING_WEIGHTS;
    expect(success).toBeGreaterThan(latency);
    expect(success).toBeGreaterThan(cost);
    expect(success + latency + cost).toBeCloseTo(1);
  });

  it('uses the spec budgets for attempts, windows, and near-top selection', () => {
    expect(DEFAULT_ROUTING_CONFIG.maxAttempts).toBe(2);
    expect(DEFAULT_ROUTING_CONFIG.attemptTimeoutMs).toBe(4000);
    expect(DEFAULT_ROUTING_CONFIG.nearTopEpsilon).toBe(0.02);
    expect(DEFAULT_ROUTING_CONFIG.windowsMs).toEqual([60_000, 300_000]);
    expect(DEFAULT_ROUTING_CONFIG.circuit.minSuccessRate).toBeLessThan(1);
    expect(DEFAULT_ROUTING_CONFIG.circuit.halfOpenProbeRate).toBeGreaterThan(0);
    expect(DEFAULT_ROUTING_CONFIG.circuit.halfOpenProbeRate).toBeLessThan(1);
    expect(systemClock.now()).toBeGreaterThan(0);
    expect(systemClock.iso()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
