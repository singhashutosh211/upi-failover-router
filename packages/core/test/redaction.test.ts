import { describe, expect, it } from 'vitest';
import { maskVpa, redact } from '@upi-failover/core';

describe('maskVpa', () => {
  it('keeps the first and last character of the local part', () => {
    const masked = maskVpa('user@okaxis');
    expect(masked).toBe('u**r@okaxis');
    expect(masked.includes('use')).toBe(false);
  });

  it('masks short local parts without revealing them', () => {
    expect(maskVpa('ab@ybl')).toBe('a*@ybl');
    expect(maskVpa('a@ybl')).toBe('*@ybl');
  });

  it('rejects values that are not a single local@domain handle', () => {
    expect(() => maskVpa('not-a-vpa')).toThrow(/Invalid VPA/);
    expect(() => maskVpa('a@b@ybl')).toThrow(/Invalid VPA/);
    expect(() => maskVpa('@ybl')).toThrow(/Invalid VPA/);
  });
});

describe('redact', () => {
  it('masks VPA fields and redacts secrets without touching emails', () => {
    const redacted = redact({
      vpa: 'user@okaxis',
      email: 'user@gmail.com',
      apiKey: 'sk_live_secret',
      nested: { token: 'tok_123', note: 'paid by user@paytm today, cc ab@a' },
      attempts: [{ pin: '1234' }],
    });

    expect(redacted).toEqual({
      vpa: 'u**r@okaxis',
      email: 'user@gmail.com',
      apiKey: '[REDACTED]',
      nested: { token: '[REDACTED]', note: 'paid by u**r@paytm today, cc ab@a' },
      attempts: [{ pin: '[REDACTED]' }],
    });
  });

  it('redacts a VPA field that is not a string', () => {
    expect(redact({ vpa: { raw: 'user@okaxis' } })).toEqual({ vpa: '[REDACTED]' });
  });

  it('redacts an unusable VPA instead of logging it', () => {
    expect(redact({ vpa: 'not a vpa' })).toEqual({ vpa: '[REDACTED]' });
  });

  it('survives cycles, buffers, and deep nesting', () => {
    const box: { self?: unknown } = {};
    box.self = box;
    let deep: unknown = { secret: 'x' };
    for (let i = 0; i < 10; i += 1) deep = { child: deep };
    const serialized = JSON.stringify(redact(deep));
    expect(redact(box)).toEqual({ self: '[Circular]' });
    expect(serialized).toContain('[MaxDepth]');
    expect(serialized).not.toContain('secret');
    expect(redact(Buffer.from('pan'))).toBe('[Buffer]');
    expect(redact(12)).toBe(12);
    expect(redact(null)).toBeNull();
  });
});
