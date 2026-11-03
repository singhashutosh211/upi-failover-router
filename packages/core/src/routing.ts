import type { PaymentMethod } from './payment.js';
import type { CircuitState } from './health.js';

export interface RoutingWeights {
  readonly success: number;
  readonly latency: number;
  readonly cost: number;
}

export interface RoutingCandidate {
  readonly gatewayId: string;
  readonly method: PaymentMethod;
  readonly successRate: number;
  readonly latencyMs: number;
  readonly mdr: number;
  readonly circuit: CircuitState;
  readonly sampleSize: number;
}

export interface ScoreBreakdown {
  readonly gatewayId: string;
  readonly score: number;
  readonly successComponent: number;
  readonly latencyComponent: number;
  readonly costComponent: number;
  readonly excluded?: string;
}

/**
 * score = w_success * successRate + w_latency * (1 - normLatency) - w_cost * normMDR
 * Phase 4 implements this. OPEN circuits are excluded. Near-top scores are
 * chosen with weighted random so one gateway does not take every request.
 */
export interface RoutingContext {
  readonly method: PaymentMethod;
  readonly currency: string;
  readonly amount: number;
  readonly excludeGatewayIds: readonly string[];
  readonly weights: RoutingWeights;
  readonly nearTopEpsilon: number;
  readonly minSamples: number;
  readonly priorSuccessRate: number;
  readonly random?: () => number;
}

export interface RoutingDecision {
  readonly gatewayId: string;
  readonly strategy: string;
  readonly candidates: readonly ScoreBreakdown[];
  readonly selectedScore: number;
  readonly reason: string;
}

export interface RoutingStrategy {
  readonly name: string;
  select(candidates: readonly RoutingCandidate[], context: RoutingContext): RoutingDecision;
}
