import type { FailureClass } from './failure.js';
import type { AmountMinor, NextAction, PaymentMethod, UpiFlow } from './payment.js';

export const KNOWN_GATEWAY_IDS = ['razorpay', 'stripe', 'cashfree', 'mock-flaky'] as const;
export type KnownGatewayId = (typeof KNOWN_GATEWAY_IDS)[number];

export type GatewayOutcome = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';

/**
 * Passed to an adapter for one create call. `vpa` is raw so UPI collect can be
 * retried without asking the customer again. Adapters must not log it.
 * There is no field for PAN, CVV, or a full card number.
 */
export interface GatewayCustomer {
  readonly id?: string;
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly vpa?: string;
}

export interface GatewayPaymentRequest {
  readonly amount: AmountMinor;
  readonly currency: string;
  readonly method: PaymentMethod;
  readonly upiFlow?: UpiFlow;
  readonly orderId: string;
  readonly customer: GatewayCustomer;
  readonly description?: string;
  readonly metadata?: Readonly<Record<string, string>>;
  readonly returnUrl?: string;
  /** Opaque gateway-hosted token. Never a PAN. */
  readonly paymentToken?: string;
}

export interface GatewayResult {
  readonly gatewayRef: string;
  readonly status: GatewayOutcome;
  readonly failureClass?: FailureClass;
  readonly errorCode?: string;
  readonly errorMessage?: string;
  readonly nextAction?: NextAction;
}

export interface GatewayStatus {
  readonly gatewayRef: string;
  readonly status: GatewayOutcome;
  readonly failureClass?: FailureClass;
  readonly capturedAmount?: AmountMinor;
  readonly errorCode?: string;
}

export interface WebhookEvent {
  readonly id: string;
  readonly gatewayId: string;
  readonly gatewayRef: string;
  readonly type: 'payment.succeeded' | 'payment.failed' | 'payment.pending' | 'refund.created';
  readonly status: GatewayOutcome;
  readonly failureClass?: FailureClass;
  readonly occurredAt: string;
}

export interface GatewayAdapter {
  readonly id: KnownGatewayId | (string & {});
  supports(method: PaymentMethod, currency: string): boolean;
  createPayment(
    req: GatewayPaymentRequest,
    ctx: { readonly idempotencyKey: string; readonly signal: AbortSignal },
  ): Promise<GatewayResult>;
  /**
   * Optional `signal` lets the ambiguous-status poll respect the time budget.
   * The spec requires the gateway ref; cancellation is an extension.
   */
  getPaymentStatus(
    gatewayRef: string,
    ctx?: { readonly signal?: AbortSignal },
  ): Promise<GatewayStatus>;
  /** Return null when the signature does not match. Do not throw for a bad signature. */
  verifyWebhook(rawBody: Buffer, headers: Record<string, string>): WebhookEvent | null;
  /** MDR as a fraction, from config. UPI is often 0; do not hardcode that here. */
  mdr(method: PaymentMethod): number;
  /** Cheap sandbox probe used by the health engine when there is no traffic. */
  probe?(signal: AbortSignal): Promise<{ ok: boolean; latencyMs: number }>;
}
