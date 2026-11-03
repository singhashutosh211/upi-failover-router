import { describe, expect, it } from 'vitest';
import {
  AdapterNotImplementedError,
  SAFE_CHAOS_PROFILE,
  createCashfreeAdapter,
  createMockFlakyAdapter,
  createRazorpayAdapter,
  createStripeAdapter,
  parseChaosProfile,
} from '@upi-failover/adapters';

const razorpayCredentials = {
  keyId: 'rzp_test_key',
  keySecret: 'rzp_test_secret',
  webhookSecret: 'whsec_razorpay',
};

describe('sandbox adapters', () => {
  it('refuses to construct a live adapter with empty credentials', () => {
    expect(() =>
      createRazorpayAdapter({ keyId: '', keySecret: 'secret', webhookSecret: 'whsec' }),
    ).toThrow(/credential keyId is empty/);
    expect(() => createStripeAdapter({ secretKey: ' ', webhookSecret: 'whsec' })).toThrow(
      /credential secretKey is empty/,
    );
    expect(() =>
      createCashfreeAdapter({ clientId: 'id', clientSecret: '', webhookSecret: 'whsec' }),
    ).toThrow(/credential clientSecret is empty/);
  });

  it('does not call a real gateway when credentials are present', () => {
    expect(() => createRazorpayAdapter(razorpayCredentials)).toThrow(AdapterNotImplementedError);
    expect(() => createStripeAdapter({ secretKey: 'sk_test', webhookSecret: 'whsec' })).toThrow(
      /USE_REAL_GATEWAYS/,
    );
    expect(() =>
      createCashfreeAdapter({
        clientId: 'cf_test',
        clientSecret: 'cf_secret',
        webhookSecret: 'whsec',
      }),
    ).toThrow(AdapterNotImplementedError);
    expect(() => createMockFlakyAdapter(SAFE_CHAOS_PROFILE)).toThrow(AdapterNotImplementedError);
  });
});

describe('parseChaosProfile', () => {
  it('accepts a safe profile and a scheduled outage', () => {
    expect(parseChaosProfile(SAFE_CHAOS_PROFILE)).toEqual(SAFE_CHAOS_PROFILE);
    expect(
      parseChaosProfile({
        ...SAFE_CHAOS_PROFILE,
        failureRate: 0.5,
        latencyMs: { min: 10, max: 40 },
        outageWindows: [{ start: '2026-11-03T10:00:00.000Z', end: '2026-11-03T10:05:00.000Z' }],
      }).failureRate,
    ).toBe(0.5);
  });

  it('rejects rates outside 0..1, inverted latency, and invalid windows', () => {
    expect(() => parseChaosProfile({ ...SAFE_CHAOS_PROFILE, failureRate: 1.2 })).toThrow(
      /failureRate/,
    );
    expect(() =>
      parseChaosProfile({ ...SAFE_CHAOS_PROFILE, latencyMs: { min: 20, max: 10 } }),
    ).toThrow(/latencyMs.max/);
    expect(() =>
      parseChaosProfile({
        ...SAFE_CHAOS_PROFILE,
        outageWindows: [{ start: 'not-a-date', end: '2026-11-03T10:00:00.000Z' }],
      }),
    ).toThrow(/outage window/);
    expect(() =>
      parseChaosProfile({ ...SAFE_CHAOS_PROFILE, timeoutAfterSuccessRate: Number.NaN }),
    ).toThrow(/timeoutAfterSuccessRate/);
  });
});
