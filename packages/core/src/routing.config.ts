import type { RoutingWeights } from './routing.js';

/**
 * Success dominates. Cost stays in the formula because cards, netbanking, and
 * wallets have a non-zero MDR; UPI P2M MDR is configured per gateway and is
 * often zero, so UPI ranking collapses to success rate and latency.
 */
export const DEFAULT_ROUTING_WEIGHTS: RoutingWeights = {
  success: 0.7,
  latency: 0.25,
  cost: 0.05,
};

export const DEFAULT_ROUTING_CONFIG = {
  weights: DEFAULT_ROUTING_WEIGHTS,
  /** Gateways within this absolute score of the leader share traffic. */
  nearTopEpsilon: 0.02,
  minSamples: 20,
  /** Used until a gateway+method pair has `minSamples` observations. */
  priorSuccessRate: 0.9,
  maxAttempts: 2,
  attemptTimeoutMs: 4_000,
  totalTimeoutMs: 8_000,
  windowsMs: [60_000, 300_000],
  circuit: {
    /** Open the circuit when the success rate drops below this. */
    minSuccessRate: 0.8,
    minSamples: 20,
    openDurationMs: 30_000,
    halfOpenProbeRate: 0.05,
  },
} as const;
