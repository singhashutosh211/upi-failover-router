# Contributing

## Setup

```bash
corepack enable
pnpm install
pnpm test
pnpm typecheck
pnpm lint
```

Node 20 is required (`.nvmrc`). Package manager is pnpm 10 (`packageManager` field).

`pnpm.overrides` pins `light-my-request` to 6.6.0. Version 6.8 depends on `cookie@2`, which declares `engines.node >= 22`. The pin keeps the API on Node 20, which is what this repo targets.

## Commits

Commitlint enforces Conventional Commits via Husky. Examples: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.

The pre-commit hook runs Prettier and ESLint on staged files. Do not skip hooks unless a maintainer asks you to.

## Payments changes

Read [docs/failover.md](docs/failover.md) before touching state transitions. A change that lets `UNKNOWN` or `TIMEOUT_AMBIGUOUS` open a second gateway attempt will be rejected.

Do not log raw VPAs, tokens, or secrets. Do not add a schema field for PAN, CVV, or a full card number.

## Tests

`pnpm test` runs unit and API tests. `pnpm test:coverage` enforces at least 85% coverage on `packages/core`. Phase 1 does not need Postgres or Redis; CI still starts both so later phases can use them.

## Releases

Changesets live in `.changeset`. Publishing the SDK and the GHCR image happens from a `v*` tag. See `.github/workflows/release.yml`.
