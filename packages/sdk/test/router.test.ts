import { describe, expect, it } from 'vitest';
import { PaymentRouter, PaymentRouterError } from '../src/index.js';

const options = { apiKey: 'dev_test_key', baseUrl: 'http://localhost:3000' };

describe('PaymentRouter', () => {
  it('rejects missing config before any network call', () => {
    expect(() => new PaymentRouter({ apiKey: ' ', baseUrl: 'http://localhost:3000' })).toThrow(
      PaymentRouterError,
    );
    expect(() => new PaymentRouter({ apiKey: 'key', baseUrl: 'not a url' })).toThrow(/baseUrl/);
    expect(() => new PaymentRouter({ apiKey: 'key', baseUrl: 'ftp://example.com' })).toThrow(
      /baseUrl/,
    );
    expect(
      () => new PaymentRouter({ apiKey: 'key', baseUrl: 'http://localhost:3000', timeoutMs: 0 }),
    ).toThrow(/timeoutMs/);
  });

  it('requires an idempotency key and does not pretend to create a payment', () => {
    const router = new PaymentRouter(options);
    expect(() =>
      router.payments.create({
        amount: 49900,
        currency: 'INR',
        method: 'upi',
        orderId: 'order_1',
        customer: {},
        idempotencyKey: 'short',
      }),
    ).toThrowError(/idempotencyKey/);

    try {
      router.payments.create({
        amount: 49900,
        currency: 'INR',
        method: 'upi',
        upiFlow: 'intent',
        orderId: 'order_1',
        customer: { id: 'cust_1' },
        idempotencyKey: 'idem_12345678',
      });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PaymentRouterError);
      expect((error as PaymentRouterError).code).toBe('not_implemented');
    }
  });

  it('validates follow-up calls and webhook secrets', () => {
    const router = new PaymentRouter(options);
    expect(() => router.payments.get('')).toThrowError(/paymentId/);
    expect(() => router.payments.waitForFinalState('pay_1', { timeoutMs: -1 })).toThrow(
      /timeoutMs/,
    );
    expect(() => router.payments.waitForFinalState('pay_1')).toThrowError(/Phase 6/);
    expect(() => router.webhooks.verify('{}', 'sig', '')).toThrow(/webhook secret/);
    expect(() => router.webhooks.verify('{}', 'sig', 'whsec')).toThrowError(/Phase 6/);
  });
});
