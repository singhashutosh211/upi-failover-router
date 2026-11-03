import type { GatewayAdapter } from '@upi-failover/core';
import { AdapterNotImplementedError } from '../errors.js';
import { parseChaosProfile, type ChaosProfile } from './chaos.js';

export function createMockFlakyAdapter(profile: ChaosProfile): GatewayAdapter {
  parseChaosProfile(profile);
  throw new AdapterNotImplementedError('mock-flaky');
}
