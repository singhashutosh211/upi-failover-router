# Project spec

Source of truth for remaining phases. Phase 1 is the scaffold, contracts, and health API. Do not contradict the rules below without asking.

## Product

One SDK plus a REST API. Behind it: Razorpay, Cashfree, and Stripe sandbox adapters, plus `mock-flaky`. Default is mocks and zero credentials.

1. Health engine per gateway, method, and optional bank: success rate, latency, error rate, 1 minute and 5 minute windows.
2. Route with `score = w_success * successRate + w_latency * (1 - normLatency) - w_cost * normMDR`.
3. If gateway A definitively fails a UPI intent, retry on gateway B without re-collecting customer details. The shopper may still have to approve the new intent.

## Hard rules

- Never double-charge. On timeout, 5xx, or a network error after the request was sent, query the original gateway's status API with a bounded retry. Fail over only when the attempt definitively failed or the status check shows no capture. If it is still unknown, mark `UNKNOWN`, schedule reconciliation, and do not create a second charge.
- Every `createPayment` requires an idempotency key. The same key returns the same payment.
- Parent states: `CREATED → ROUTED → PENDING → (SUCCEEDED | FAILED | UNKNOWN)` and `FAILED → FAILOVER_ROUTED → PENDING`. Guards live in `packages/core/src/state-machine.ts`. `UNKNOWN` cannot enter `FAILOVER_ROUTED`.
- UPI failover creates a new intent or collect. Response `nextAction` is `{ type: "upi_intent", uri }` or `{ type: "collect_pending" }`.
- No PAN or CVV touches this service. Gateway-hosted tokens only. Never log a full VPA, a secret, or a token.
- MDR is config per gateway per method. Do not hardcode UPI as free inside the scorer.

## Stack

TypeScript strict, Node 20, pnpm workspaces. Fastify, Zod, Pino. Redis for windows, circuit state, and idempotency, with an in-memory implementation of the same interface. Postgres via Drizzle or Prisma, SQLite for local dev. Vitest and supertest. Docker Compose. OpenAPI 3.1 generated from Zod in Phase 6. ESLint, Prettier, Husky, lint-staged, commitlint.

## Interfaces

`GatewayAdapter`: `id`, `supports`, `createPayment(req, { idempotencyKey, signal })`, `getPaymentStatus`, `verifyWebhook`, `mdr`.

`FailureClass`: `DEFINITIVE_DECLINE | GATEWAY_DOWN | TIMEOUT_AMBIGUOUS | USER_ABANDONED | BANK_DOWN`.

Only `GATEWAY_DOWN` and confirmed `BANK_DOWN` are failover-eligible.

## API v1

- `POST /v1/payments` with `Idempotency-Key` and `Authorization: Bearer`
- `GET /v1/payments/:id`
- `POST /v1/webhooks/:gateway`
- `GET /v1/health/gateways` (mounted)
- `GET /metrics` (mounted, placeholder gauge)
- `POST /v1/admin/gateways/:id/override`

Auth is hashed API keys, per-key rate limits, request ids, structured errors.

## Phases

1. Scaffold, tooling, CI, types, interfaces. **This phase.**
2. State machine engine, idempotency store, persistence.
3. Adapters and mock chaos.
4. Health engine, circuit breaker, routing strategies.
5. Failover orchestration, webhooks, reconciliation.
6. API auth, generated OpenAPI, SDK HTTP client. Optional dashboard.
7. Simulation, benchmark, docs, demo.
8. Lint, coverage, security review, release.

After Phase 1, confirm the GitHub repo name before `gh repo create`. The suggested name is `upi-failover-router`.

## Done

`docker compose up` runs on mocks, `pnpm test` passes, the simulation shows a higher success rate than one gateway, no test double-captures, the README is honest, and the public repo has a green CI badge plus a `v0.1.0` tag.
