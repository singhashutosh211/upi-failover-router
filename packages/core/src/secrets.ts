/**
 * UPI collect failover needs the original VPA. The payment record stores only
 * the masked value. Implementations must encrypt at rest and callers must not
 * log the string returned by `getVpa`. Phase 2 supplies memory and encrypted
 * stores behind this interface.
 */
export interface VpaSecretStore {
  put(paymentId: string, vpa: string): Promise<void>;
  getVpa(paymentId: string): Promise<string | null>;
  delete(paymentId: string): Promise<void>;
}
