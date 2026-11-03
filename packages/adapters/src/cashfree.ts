import type { GatewayAdapter, PaymentMethod } from '@upi-failover/core';
import { AdapterNotImplementedError, assertNonEmpty } from './errors.js';

export const CASHFREE_CAPABILITIES = {
  methods: ['upi', 'netbanking', 'card', 'wallet'] as const satisfies readonly PaymentMethod[],
  currencies: ['INR'] as const,
};

export interface CashfreeCredentials {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly webhookSecret: string;
}

export function createCashfreeAdapter(credentials: CashfreeCredentials): GatewayAdapter {
  assertNonEmpty('cashfree', {
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    webhookSecret: credentials.webhookSecret,
  });
  throw new AdapterNotImplementedError('cashfree');
}
