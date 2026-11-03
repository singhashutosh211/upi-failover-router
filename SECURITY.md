# Security

## Reporting

Use a private GitHub security advisory on this repository. Do not open a public issue, and do not include VPAs, PANs, API keys, webhook secrets, or tokens.

## Rules this codebase has to keep

- No card number, CVV, or PAN is accepted. `createPaymentBodySchema` is strict, and card payments require an opaque `paymentToken`.
- Raw VPAs are not placed on the persisted `Payment`. Logs go through `redact` / `maskVpa`. Pino redacts `Authorization` and `x-api-key`.
- An ambiguous gateway result (`TIMEOUT_AMBIGUOUS`, or a parent state of `UNKNOWN`) must not create another charge. The state machine rejects `UNKNOWN → FAILOVER_ROUTED`.
- Idempotency keys are mandatory. A reused key with a different body hash is a conflict, not a new payment.
- Gateway credential fields are checked for emptiness and then the Phase 1 factories throw `AdapterNotImplementedError`. They do not open a socket.
- `.env` is gitignored. `.env.example` contains empty secrets only.

## What this is not

This repository is not a PCI-DSS environment. It is not a production payment processor. Sandbox credentials, when they are added in a later phase, belong in the environment or a secret manager, never in git.
