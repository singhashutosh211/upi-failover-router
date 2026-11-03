import { OrchestratorError } from './errors.js';
import { ATTEMPT_STATES, PAYMENT_STATES, type AttemptState, type PaymentState } from './payment.js';

/**
 * Parent payment transitions.
 *
 * The spec chain is CREATED → ROUTED → PENDING → (SUCCEEDED | FAILED | UNKNOWN)
 * and FAILED → FAILOVER_ROUTED → PENDING.
 *
 * Extra edges, and why they exist:
 * - ROUTED → FAILED | UNKNOWN, and FAILOVER_ROUTED → FAILED | UNKNOWN: a create
 *   call can fail before the customer ever sees a pending intent.
 * - FAILED → SUCCEEDED: a status poll or webhook proves the only attempt
 *   actually captured, before any failover. This is not permission to charge
 *   a second gateway.
 * - UNKNOWN → SUCCEEDED | FAILED: reconciliation resolved the attempt.
 *
 * UNKNOWN must not move to FAILOVER_ROUTED. An unknown outcome is not a
 * definitive failure, and failing over from it can double-charge.
 * SUCCEEDED is terminal. Same-state updates are idempotent no-ops, not transitions.
 */
export const PAYMENT_TRANSITIONS = {
  CREATED: ['ROUTED'],
  ROUTED: ['PENDING', 'FAILED', 'UNKNOWN'],
  PENDING: ['SUCCEEDED', 'FAILED', 'UNKNOWN'],
  FAILED: ['FAILOVER_ROUTED', 'SUCCEEDED'],
  FAILOVER_ROUTED: ['PENDING', 'FAILED', 'UNKNOWN'],
  SUCCEEDED: [],
  UNKNOWN: ['SUCCEEDED', 'FAILED'],
} as const satisfies Record<PaymentState, readonly PaymentState[]>;

/**
 * One gateway call. Attempts never enter FAILOVER_ROUTED; the parent does.
 * FAILED → SUCCEEDED is a late confirmation of this same attempt.
 */
export const ATTEMPT_TRANSITIONS = {
  ROUTED: ['PENDING', 'SUCCEEDED', 'FAILED', 'UNKNOWN'],
  PENDING: ['SUCCEEDED', 'FAILED', 'UNKNOWN'],
  FAILED: ['SUCCEEDED'],
  UNKNOWN: ['SUCCEEDED', 'FAILED'],
  SUCCEEDED: [],
} as const satisfies Record<AttemptState, readonly AttemptState[]>;

export class InvalidTransitionError extends OrchestratorError {
  readonly from: string;
  readonly to: string;
  readonly entity: 'payment' | 'attempt';

  constructor(entity: 'payment' | 'attempt', from: string, to: string) {
    super('invalid_transition', `Cannot transition ${entity} from ${from} to ${to}`);
    this.entity = entity;
    this.from = from;
    this.to = to;
  }
}

export function isPaymentState(value: string): value is PaymentState {
  return (PAYMENT_STATES as readonly string[]).includes(value);
}

export function isAttemptState(value: string): value is AttemptState {
  return (ATTEMPT_STATES as readonly string[]).includes(value);
}

export function canTransition(from: PaymentState, to: PaymentState): boolean {
  const allowed: readonly PaymentState[] = PAYMENT_TRANSITIONS[from];
  return allowed.includes(to);
}

export function canTransitionAttempt(from: AttemptState, to: AttemptState): boolean {
  const allowed: readonly AttemptState[] = ATTEMPT_TRANSITIONS[from];
  return allowed.includes(to);
}

export function assertTransition(from: PaymentState, to: PaymentState): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError('payment', from, to);
  }
}

export function assertAttemptTransition(from: AttemptState, to: AttemptState): void {
  if (!canTransitionAttempt(from, to)) {
    throw new InvalidTransitionError('attempt', from, to);
  }
}
