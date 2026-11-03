import { describe, expect, it } from 'vitest';
import {
  ATTEMPT_TRANSITIONS,
  InvalidTransitionError,
  PAYMENT_STATES,
  assertAttemptTransition,
  assertTransition,
  canTransition,
  canTransitionAttempt,
  isAttemptState,
  isPaymentState,
} from '@upi-failover/core';

describe('payment state machine', () => {
  it('follows the spec chain into a terminal success', () => {
    expect(canTransition('CREATED', 'ROUTED')).toBe(true);
    expect(canTransition('ROUTED', 'PENDING')).toBe(true);
    expect(canTransition('PENDING', 'SUCCEEDED')).toBe(true);
    expect(canTransition('PENDING', 'FAILED')).toBe(true);
    expect(canTransition('PENDING', 'UNKNOWN')).toBe(true);
  });

  it('allows failover only after a definitive failure', () => {
    expect(canTransition('FAILED', 'FAILOVER_ROUTED')).toBe(true);
    expect(canTransition('FAILOVER_ROUTED', 'PENDING')).toBe(true);
  });

  it('does not allow failover while the outcome is unknown', () => {
    expect(canTransition('UNKNOWN', 'FAILOVER_ROUTED')).toBe(false);
    expect(canTransition('PENDING', 'FAILOVER_ROUTED')).toBe(false);
    expect(canTransition('ROUTED', 'FAILOVER_ROUTED')).toBe(false);
    expect(() => assertTransition('UNKNOWN', 'FAILOVER_ROUTED')).toThrow(InvalidTransitionError);
  });

  it('keeps a captured payment terminal', () => {
    for (const state of PAYMENT_STATES) {
      expect(canTransition('SUCCEEDED', state)).toBe(false);
      expect(canTransition(state, state)).toBe(false);
    }
  });

  it('lets reconciliation resolve UNKNOWN, and a lone failure become success', () => {
    expect(canTransition('UNKNOWN', 'SUCCEEDED')).toBe(true);
    expect(canTransition('UNKNOWN', 'FAILED')).toBe(true);
    expect(canTransition('FAILED', 'SUCCEEDED')).toBe(true);
    assertTransition('FAILED', 'SUCCEEDED');
  });

  it('rejects skipping from CREATED straight to PENDING', () => {
    expect(canTransition('CREATED', 'PENDING')).toBe(false);
    expect(canTransition('CREATED', 'SUCCEEDED')).toBe(false);
  });

  it('recognises every declared state and rejects unknown names', () => {
    for (const state of PAYMENT_STATES) {
      expect(isPaymentState(state)).toBe(true);
    }
    expect(isPaymentState('FAILOVER')).toBe(false);
  });
});

describe('attempt state machine', () => {
  it('never enters FAILOVER_ROUTED', () => {
    for (const targets of Object.values(ATTEMPT_TRANSITIONS)) {
      expect(targets).not.toContain('FAILOVER_ROUTED');
    }
    expect(isAttemptState('FAILOVER_ROUTED')).toBe(false);
    expect(isAttemptState('PENDING')).toBe(true);
  });

  it('allows a late success on the same attempt and nothing after success', () => {
    expect(canTransitionAttempt('FAILED', 'SUCCEEDED')).toBe(true);
    expect(canTransitionAttempt('UNKNOWN', 'FAILED')).toBe(true);
    expect(canTransitionAttempt('SUCCEEDED', 'FAILED')).toBe(false);
    assertAttemptTransition('ROUTED', 'UNKNOWN');
    expect(() => assertAttemptTransition('SUCCEEDED', 'PENDING')).toThrow(InvalidTransitionError);
  });
});
