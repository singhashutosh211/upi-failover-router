# Routing

Not implemented. The contract and the defaults are.

```
score = w_success * successRate + w_latency * (1 - normLatency) - w_cost * normMDR
```

`DEFAULT_ROUTING_WEIGHTS` in `packages/core/src/routing.config.ts`:

| Term    | Weight |
| ------- | -----: |
| success |   0.70 |
| latency |   0.25 |
| cost    |   0.05 |

Success is the largest term on purpose. MDR is configured per gateway and per method through `GatewayAdapter.mdr`. UPI P2M is often zero, so for UPI the cost term is zero and the rank is success rate plus latency. Cards, netbanking, and wallets keep the cost term. Do not special-case that in the formula; set MDR to `0` in config.

Other defaults:

- Near-top epsilon `0.02`. Phase 4 will weighted-random among scores within that band so one gateway is not given every request and the others stop producing samples.
- Minimum samples `20`. Below that, strategies must use `priorSuccessRate` (`0.9`) instead of the measured rate.
- Circuit opens when success rate is below `0.8` with enough samples, then half-opens and probes `5%` of traffic.

`RoutingStrategy.select` is the plug point. Planned strategies: `SuccessRateStrategy`, `CostOptimizedStrategy`, `StickyStrategy`.

OPEN circuits are excluded. A gateway that does not `supports(method, currency)` is excluded. Every decision will carry a `ScoreBreakdown` so an audit log can answer why a gateway was chosen.

Phase 4 implements the math. Phase 1 only locks the inputs so the math cannot silently change the weights.
