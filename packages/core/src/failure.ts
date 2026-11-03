export const FAILURE_CLASSES = [
  'DEFINITIVE_DECLINE',
  'GATEWAY_DOWN',
  'TIMEOUT_AMBIGUOUS',
  'USER_ABANDONED',
  'BANK_DOWN',
] as const;

export type FailureClass = (typeof FAILURE_CLASSES)[number];

/**
 * Fail over only when the current attempt is definitively not captured.
 * `TIMEOUT_AMBIGUOUS` is not in this set: the caller must query status first
 * and must not open a second charge while the outcome is unknown.
 * `USER_ABANDONED` and `DEFINITIVE_DECLINE` (insufficient funds, wrong PIN,
 * and other customer-caused declines) are never retried on another gateway.
 */
const FAILOVER_ELIGIBLE: ReadonlySet<FailureClass> = new Set(['GATEWAY_DOWN', 'BANK_DOWN']);

export function isFailureClass(value: string): value is FailureClass {
  return (FAILURE_CLASSES as readonly string[]).includes(value);
}

export function isFailoverEligible(failureClass: FailureClass): boolean {
  return FAILOVER_ELIGIBLE.has(failureClass);
}

export function isAmbiguous(failureClass: FailureClass): boolean {
  return failureClass === 'TIMEOUT_AMBIGUOUS';
}
