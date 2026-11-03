import { PaymentRouterError } from './errors.js';
import type {
  CreatePaymentInput,
  PaymentResult,
  PaymentRouterOptions,
  WaitOptions,
} from './types.js';

const NOT_READY =
  'Client calls ship in Phase 6. This build only locks the public types and validates config.';

export class PaymentRouter {
  readonly payments: PaymentClient;
  readonly webhooks: WebhookClient;

  constructor(options: PaymentRouterOptions) {
    assertOptions(options);
    this.payments = new PaymentClient(options);
    this.webhooks = new WebhookClient();
  }
}

export class PaymentClient {
  constructor(private readonly options: PaymentRouterOptions) {}

  create(input: CreatePaymentInput): Promise<PaymentResult> {
    if (typeof input.idempotencyKey !== 'string' || input.idempotencyKey.length < 8) {
      throw new PaymentRouterError(
        'idempotency_key_required',
        'idempotencyKey is required (min 8 characters)',
      );
    }
    void this.options;
    throw new PaymentRouterError('not_implemented', `payments.create: ${NOT_READY}`);
  }

  get(paymentId: string): Promise<PaymentResult> {
    if (typeof paymentId !== 'string' || paymentId.length === 0) {
      throw new PaymentRouterError('invalid_payment_id', 'paymentId is required');
    }
    throw new PaymentRouterError('not_implemented', `payments.get: ${NOT_READY}`);
  }

  waitForFinalState(paymentId: string, options: WaitOptions = {}): Promise<PaymentResult> {
    if (
      options.timeoutMs !== undefined &&
      (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)
    ) {
      throw new PaymentRouterError('invalid_config', 'timeoutMs must be a positive number');
    }
    return this.get(paymentId);
  }
}

export class WebhookClient {
  verify(_rawBody: Uint8Array | string, _signature: string, secret: string): boolean {
    if (typeof secret !== 'string' || secret.length === 0) {
      throw new PaymentRouterError('invalid_config', 'webhook secret is required');
    }
    throw new PaymentRouterError('not_implemented', `webhooks.verify: ${NOT_READY}`);
  }
}

function assertOptions(options: PaymentRouterOptions): void {
  if (options === undefined || typeof options.apiKey !== 'string' || options.apiKey.trim() === '') {
    throw new PaymentRouterError('invalid_config', 'apiKey is required');
  }
  let url: URL;
  try {
    url = new URL(options.baseUrl);
  } catch {
    throw new PaymentRouterError('invalid_config', 'baseUrl must be an absolute http(s) URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new PaymentRouterError('invalid_config', 'baseUrl must be an absolute http(s) URL');
  }
  if (
    options.timeoutMs !== undefined &&
    (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)
  ) {
    throw new PaymentRouterError('invalid_config', 'timeoutMs must be a positive number');
  }
}
