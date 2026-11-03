import type { GatewayAdapter, PaymentMethod } from '@upi-failover/core';
import { AdapterNotImplementedError, assertNonEmpty } from './errors.js';

export const STRIPE_CAPABILITIES = {
  methods: ['card', 'upi'] as const satisfies readonly PaymentMethod[],
  currencies: ['INR', 'USD'] as const,
};

export interface StripeCredentials {
  readonly secretKey: string;
  readonly webhookSecret: string;
}

export function createStripeAdapter(credentials: StripeCredentials): GatewayAdapter {
  assertNonEmpty('stripe', {
    secretKey: credentials.secretKey,
    webhookSecret: credentials.webhookSecret,
  });
  throw new AdapterNotImplementedError('stripe');
}
