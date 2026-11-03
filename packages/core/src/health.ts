import type { FailureClass } from './failure.js';
import type { PaymentMethod } from './payment.js';

export const CIRCUIT_STATES = ['CLOSED', 'OPEN', 'HALF_OPEN'] as const;
export type CircuitState = (typeof CIRCUIT_STATES)[number];

export interface HealthWindow {
  readonly windowMs: number;
  readonly attempts: number;
  readonly successes: number;
  readonly failuresByClass: Partial<Record<FailureClass, number>>;
  readonly latencyP50Ms: number;
  readonly latencyP95Ms: number;
}

export interface GatewayHealthSnapshot {
  readonly gatewayId: string;
  readonly method: PaymentMethod;
  readonly bank?: string;
  readonly circuit: CircuitState;
  readonly windows: readonly HealthWindow[];
  readonly updatedAt: string;
}

export interface HealthEvent {
  readonly gatewayId: string;
  readonly method: PaymentMethod;
  readonly bank?: string;
  readonly outcome: 'success' | 'failure';
  readonly failureClass?: FailureClass;
  readonly latencyMs: number;
  readonly at: string;
}

/** Sliding-window store. Redis in production, in-memory in tests. Phase 4. */
export interface HealthRecorder {
  record(event: HealthEvent): Promise<void>;
  snapshot(): Promise<readonly GatewayHealthSnapshot[]>;
}

export interface CircuitBreaker {
  state(gatewayId: string, method: PaymentMethod): CircuitState;
  /** `reject` means the circuit is OPEN and this call must not be sent. */
  beforeRequest(gatewayId: string, method: PaymentMethod): 'allow' | 'probe' | 'reject';
  record(gatewayId: string, method: PaymentMethod, success: boolean): void;
}

export interface Clock {
  now(): number;
  iso(): string;
}

export const systemClock: Clock = {
  now: () => Date.now(),
  iso: () => new Date().toISOString(),
};
