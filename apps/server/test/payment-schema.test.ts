import { PAYMENT_METHODS } from '@upi-failover/core';
import { describe, expect, it } from 'vitest';
import {
  createPaymentBodySchema,
  gatewayHealthResponseSchema,
  idempotencyKeySchema,
  nextActionSchema,
  paymentMethodSchema,
} from '../src/schemas/payment.js';

const upiIntent = {
  amount: 49900,
  currency: 'INR',
  method: 'upi',
  upiFlow: 'intent',
  orderId: 'order_1',
  customer: { id: 'cust_1' },
};

describe('createPaymentBodySchema', () => {
  it('accepts a UPI intent and stays aligned with core payment methods', () => {
    expect(createPaymentBodySchema.parse(upiIntent)).toMatchObject(upiIntent);
    expect(paymentMethodSchema.options).toEqual([...PAYMENT_METHODS]);
    expect(gatewayHealthResponseSchema.parse({ gateways: [] })).toEqual({ gateways: [] });
    expect(
      nextActionSchema.parse({ type: 'upi_intent', uri: 'upi://pay?pa=merchant@okaxis' }),
    ).toEqual({
      type: 'upi_intent',
      uri: 'upi://pay?pa=merchant@okaxis',
    });
    expect(nextActionSchema.parse({ type: 'collect_pending' })).toEqual({
      type: 'collect_pending',
    });
  });

  it('requires a VPA for collect and a token for card, and rejects PAN-shaped fields', () => {
    const collect = createPaymentBodySchema.safeParse({
      ...upiIntent,
      upiFlow: 'collect',
    });
    expect(collect.success).toBe(false);

    const collectWithVpa = createPaymentBodySchema.safeParse({
      ...upiIntent,
      upiFlow: 'collect',
      customer: { vpa: 'user@okaxis' },
    });
    expect(collectWithVpa.success).toBe(true);

    expect(createPaymentBodySchema.safeParse({ ...upiIntent, method: 'card' }).success).toBe(false);
    expect(
      createPaymentBodySchema.safeParse({
        ...upiIntent,
        method: 'card',
        paymentToken: 'tok_gateway_123',
      }).success,
    ).toBe(true);

    expect(
      createPaymentBodySchema.safeParse({ ...upiIntent, cardNumber: '4111111111111111' }).success,
    ).toBe(false);
    expect(
      createPaymentBodySchema.safeParse({
        ...upiIntent,
        metadata: { pan: '4111111111111111' },
      }).success,
    ).toBe(false);
    expect(createPaymentBodySchema.safeParse({ ...upiIntent, amount: 49.9 }).success).toBe(false);
    expect(idempotencyKeySchema.safeParse('short').success).toBe(false);
    expect(idempotencyKeySchema.safeParse('idem_12345678').success).toBe(true);
  });
});
