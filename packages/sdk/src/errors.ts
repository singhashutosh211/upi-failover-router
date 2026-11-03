export class PaymentRouterError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'PaymentRouterError';
    this.code = code;
  }
}
