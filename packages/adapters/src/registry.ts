import type { GatewayAdapter, PaymentMethod } from '@upi-failover/core';

export class AdapterRegistry {
  private readonly adapters = new Map<string, GatewayAdapter>();

  register(adapter: GatewayAdapter): void {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`Adapter already registered: ${adapter.id}`);
    }
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): GatewayAdapter | undefined {
    return this.adapters.get(id);
  }

  list(): GatewayAdapter[] {
    return [...this.adapters.values()];
  }

  supporting(method: PaymentMethod, currency: string): GatewayAdapter[] {
    return this.list().filter((adapter) => adapter.supports(method, currency));
  }
}
