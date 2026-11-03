export interface OutageWindow {
  readonly start: string;
  readonly end: string;
}

/**
 * Phase 3 reads this profile and injects failures, latency, timeout-after-success,
 * duplicate and out-of-order webhooks, and scheduled outages. Phase 1 only parses it.
 */
export interface ChaosProfile {
  readonly failureRate: number;
  readonly latencyMs: { readonly min: number; readonly max: number };
  readonly timeoutAfterSuccessRate: number;
  readonly duplicateWebhookRate: number;
  readonly outOfOrderWebhookRate: number;
  readonly outageWindows: readonly OutageWindow[];
}

export const SAFE_CHAOS_PROFILE: ChaosProfile = {
  failureRate: 0,
  latencyMs: { min: 0, max: 0 },
  timeoutAfterSuccessRate: 0,
  duplicateWebhookRate: 0,
  outOfOrderWebhookRate: 0,
  outageWindows: [],
};

export function parseChaosProfile(input: ChaosProfile): ChaosProfile {
  assertUnitInterval(input.failureRate, 'failureRate');
  assertUnitInterval(input.timeoutAfterSuccessRate, 'timeoutAfterSuccessRate');
  assertUnitInterval(input.duplicateWebhookRate, 'duplicateWebhookRate');
  assertUnitInterval(input.outOfOrderWebhookRate, 'outOfOrderWebhookRate');
  if (!Number.isFinite(input.latencyMs.min) || input.latencyMs.min < 0) {
    throw new Error('latencyMs.min must be >= 0');
  }
  if (!Number.isFinite(input.latencyMs.max) || input.latencyMs.max < input.latencyMs.min) {
    throw new Error('latencyMs.max must be >= latencyMs.min');
  }
  for (const window of input.outageWindows) {
    const start = Date.parse(window.start);
    const end = Date.parse(window.end);
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      throw new Error('outage window must have an end after its start');
    }
  }
  return input;
}

function assertUnitInterval(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be between 0 and 1`);
  }
}
