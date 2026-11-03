## Summary

## Test plan

- [ ] `pnpm test` passes
- [ ] No payment can be captured twice, including timeout-then-success
- [ ] Idempotency keys are unchanged for repeated requests
- [ ] Logs do not contain raw VPAs, tokens, or secrets
- [ ] Docs updated if the routing, failover, or public API changed
