# Express checkout demo

Phase 7. This folder will be a small merchant app that creates one UPI payment through `@upi-failover/upi-router-sdk` and renders `nextAction`.

It is not wired up. The SDK in Phase 1 rejects `payments.create` after checking the idempotency key, which is the behaviour a demo must not paper over.
