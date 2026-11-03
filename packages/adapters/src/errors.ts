export class AdapterNotImplementedError extends Error {
  readonly gatewayId: string;

  constructor(gatewayId: string) {
    super(
      `${gatewayId} adapter is not implemented yet. Sandbox calls ship in Phase 3 and stay behind USE_REAL_GATEWAYS. Mocks are the default.`,
    );
    this.name = 'AdapterNotImplementedError';
    this.gatewayId = gatewayId;
  }
}

export function assertNonEmpty(gatewayId: string, fields: Record<string, string>): void {
  for (const [name, value] of Object.entries(fields)) {
    if (value.trim() === '') {
      throw new Error(
        `${gatewayId} credential ${name} is empty. Refusing to construct an adapter.`,
      );
    }
  }
}
