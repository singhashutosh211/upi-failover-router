# Flash-sale simulation

Phase 7. The script will run 10,000 payments against `mock-flaky` with one gateway degraded to about 50% success, then print success rate with the orchestrator beside a single-gateway baseline.

The headline check is not the chart. It is that no payment is captured twice, including the timeout-after-success case.

No numbers are published here yet.
