import type { FailureClass } from './failure.js';

export const PAYMENT_METHODS = ['upi', 'netbanking', 'card', 'wallet'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const UPI_FLOWS = ['intent', 'collect'] as const;
export type UpiFlow = (typeof UPI_FLOWS)[number];

export const PAYMENT_STATES = [
  'CREATED',
  'ROUTED',
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'UNKNOWN',
  'FAILOVER_ROUTED',
] as const;
export type PaymentState = (typeof PAYMENT_STATES)[number];

export const ATTEMPT_STATES = ['ROUTED', 'PENDING', 'SUCCEEDED', 'FAILED', 'UNKNOWN'] as const;
export type AttemptState = (typeof ATTEMPT_STATES)[number];

/** Amount in minor units. INR 499.00 is `49900`. */
export type AmountMinor = number;

/** A VPA that has already passed through `maskVpa`. */
export type MaskedVpa = string & { readonly __brand: 'MaskedVpa' };

/**
 * Customer fields accepted from the merchant. `vpa` is raw and may be forwarded
 * to a gateway for UPI collect. It must never be logged or copied onto `Payment`.
 */
export interface CustomerInput {
  readonly id?: string;
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly vpa?: string;
}

/** What we persist and return. The VPA, when present, is masked. */
export interface StoredCustomer {
  readonly id?: string;
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly vpa?: MaskedVpa;
}

export type NextAction =
  | { readonly type: 'upi_intent'; readonly uri: string }
  | { readonly type: 'collect_pending' }
  | { readonly type: 'redirect'; readonly url: string }
  | { readonly type: 'none' };

export interface PaymentAttempt {
  readonly id: string;
  readonly paymentId: string;
  readonly attemptNumber: number;
  readonly gatewayId: string;
  readonly state: AttemptState;
  readonly failureClass?: FailureClass;
  readonly gatewayRef?: string;
  readonly errorCode?: string;
  readonly idempotencyKey: string;
  readonly startedAt: string;
  readonly finishedAt?: string;
  readonly latencyMs?: number;
}

export interface Payment {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly merchantId: string;
  readonly orderId: string;
  readonly amount: AmountMinor;
  readonly currency: string;
  readonly method: PaymentMethod;
  readonly upiFlow?: UpiFlow;
  readonly customer: StoredCustomer;
  readonly state: PaymentState;
  readonly attempts: readonly PaymentAttempt[];
  readonly nextAction?: NextAction;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Raised when a failed-over attempt and an earlier attempt both capture.
 * Phase 5 turns this into a refund plus an alert. Creating it must not
 * create another charge.
 */
export interface DoubleCaptureRisk {
  readonly paymentId: string;
  readonly originalAttemptId: string;
  readonly failoverAttemptId: string;
  readonly detectedAt: string;
  readonly action: 'refund_required';
}

export interface ApiErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
  };
}
