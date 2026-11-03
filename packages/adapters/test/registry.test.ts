import type { GatewayAdapter, PaymentMethod } from '@upi-failover/core';
import { describe, expect, it } from 'vitest';
import { AdapterRegistry } from '@upi-failover/adapters';

function fake(id: string, methods: readonly PaymentMethod[]): GatewayAdapter {
  return {
    id,
    supports(method) {
      return methods.includes(method);
    },
    async createPayment() {
      return { gatewayRef: `${id}_ref`, status: 'PENDING' };
    },
    async getPaymentStatus(gatewayRef) {
      return { gatewayRef, status: 'PENDING' };
    },
    verifyWebhook() {
      return null;
    },
    mdr() {
      return 0;
    },
  };
}

describe('AdapterRegistry', () => {
  it('rejects a duplicate id and filters by method support', () => {
    const registry = new AdapterRegistry();
    registry.register(fake('razorpay', ['upi', 'card']));
    registry.register(fake('stripe', ['card']));
    expect(() => registry.register(fake('razorpay', ['upi']))).toThrow(/already registered/);
    expect(registry.supporting('upi', 'INR').map((adapter) => adapter.id)).toEqual(['razorpay']);
    expect(registry.get('stripe')?.id).toBe('stripe');
    expect(registry.get('missing')).toBeUndefined();
    expect(registry.list()).toHaveLength(2);
  });
});
