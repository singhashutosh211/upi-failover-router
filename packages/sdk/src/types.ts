export type ClientPaymentMethod = 'upi' | 'netbanking' | 'card' | 'wallet';
export type ClientUpiFlow = 'intent' | 'collect';

export interface PaymentRouterOptions {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly fetch?: typeof fetch;
  readonly timeoutMs?: number;
}

export interface CreatePaymentInput {
  readonly amount: number;
  readonly currency: string;
  readonly method: ClientPaymentMethod;
  readonly upiFlow?: ClientUpiFlow;
  readonly orderId: string;
  readonly customer: {
    readonly id?: string;
    readonly name?: string;
    readonly email?: string;
    readonly phone?: string;
    readonly vpa?: string;
  };
  readonly idempotencyKey: string;
  readonly metadata?: Readonly<Record<string, string>>;
  /** Opaque gateway-hosted token. Never a PAN, CVV, or card number. */
  readonly paymentToken?: string;
}

export type ClientNextAction =
  | { readonly type: 'upi_intent'; readonly uri: string }
  | { readonly type: 'collect_pending' }
  | { readonly type: 'redirect'; readonly url: string }
  | { readonly type: 'none' };

export interface PaymentResult {
  readonly id: string;
  readonly state: string;
  readonly attempts: readonly unknown[];
  readonly nextAction?: ClientNextAction;
}

export interface WaitOptions {
  readonly timeoutMs?: number;
}
