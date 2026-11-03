import type { GatewayAdapter, PaymentMethod } from '@upi-failover/core';
import { AdapterNotImplementedError, assertNonEmpty } from './errors.js';

export const RAZORPAY_CAPABILITIES = {
  methods: ['upi', 'netbanking', 'card', 'wallet'] as const satisfies readonly PaymentMethod[],
  currencies: ['INR'] as const,
};

export interface RazorpayCredentials {
  readonly keyId: string;
  readonly keySecret: string;
  readonly webhookSecret: string;
}

export function createRazorpayAdapter(credentials: RazorpayCredentials): GatewayAdapter {
  assertNonEmpty('razorpay', {
    keyId: credentials.keyId,
    keySecret: credentials.keySecret,
    webhookSecret: credentials.webhookSecret,
  });
  throw new AdapterNotImplementedError('razorpay');
}
