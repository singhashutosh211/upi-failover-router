import { describe, expect, it } from 'vitest';
import {
  FAILURE_CLASSES,
  isAmbiguous,
  isFailureClass,
  isFailoverEligible,
} from '@upi-failover/core';

describe('failure classification policy', () => {
  it('failsover only for a confirmed gateway or bank outage', () => {
    expect(isFailoverEligible('GATEWAY_DOWN')).toBe(true);
    expect(isFailoverEligible('BANK_DOWN')).toBe(true);
  });

  it('does not fail over customer declines, abandonment, or ambiguous timeouts', () => {
    expect(isFailoverEligible('DEFINITIVE_DECLINE')).toBe(false);
    expect(isFailoverEligible('USER_ABANDONED')).toBe(false);
    expect(isFailoverEligible('TIMEOUT_AMBIGUOUS')).toBe(false);
    expect(isAmbiguous('TIMEOUT_AMBIGUOUS')).toBe(true);
    expect(isAmbiguous('GATEWAY_DOWN')).toBe(false);
  });

  it('covers every failure class in the policy table', () => {
    const eligible = FAILURE_CLASSES.filter((failureClass) => isFailoverEligible(failureClass));
    expect(eligible).toEqual(['GATEWAY_DOWN', 'BANK_DOWN']);
    expect(isFailureClass('BANK_DOWN')).toBe(true);
    expect(isFailureClass('CARD_EXPIRED')).toBe(false);
  });
});
