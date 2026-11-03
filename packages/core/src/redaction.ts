import type { MaskedVpa } from './payment.js';

const SECRET_KEY =
  /secret|token|password|authorization|api[-_]?key|pan|card|cvv|otp|\bpin\b|webhook/i;
const VPA_KEY = /vpa/i;
const EMBEDDED_HANDLE = /\b[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9.-]+\b/g;
const UPI_HANDLE = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;
const MAX_DEPTH = 8;

export function maskVpa(vpa: string): MaskedVpa {
  const trimmed = vpa.trim();
  const at = trimmed.indexOf('@');
  if (at <= 0 || at !== trimmed.lastIndexOf('@') || at >= trimmed.length - 1) {
    throw new Error('Invalid VPA');
  }
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  return `${maskLocal(local)}@${domain}` as MaskedVpa;
}

function maskLocal(local: string): string {
  if (local.length <= 1) return '*';
  const first = local.slice(0, 1);
  if (local.length === 2) return `${first}*`;
  return `${first}${'*'.repeat(local.length - 2)}${local.slice(-1)}`;
}

export function redact(value: unknown): unknown {
  return redactValue(value, 0, new WeakSet());
}

function redactValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (depth > MAX_DEPTH) return '[MaxDepth]';
  if (typeof value === 'string') return maskEmbeddedVpas(value);
  if (value === null || typeof value !== 'object') return value;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) return '[Buffer]';
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry, depth + 1, seen));
  }

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    output[key] = redactKey(key, child, depth, seen);
  }
  return output;
}

function redactKey(key: string, child: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (VPA_KEY.test(key)) {
    if (typeof child !== 'string') return '[REDACTED]';
    try {
      return maskVpa(child);
    } catch {
      return '[REDACTED]';
    }
  }
  if (SECRET_KEY.test(key)) return '[REDACTED]';
  return redactValue(child, depth + 1, seen);
}

function maskEmbeddedVpas(value: string): string {
  return value.replace(EMBEDDED_HANDLE, (match) => {
    if (match.includes('.') || !UPI_HANDLE.test(match)) return match;
    return maskVpa(match);
  });
}
