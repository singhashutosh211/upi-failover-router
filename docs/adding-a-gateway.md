# Adding a gateway

Implement `GatewayAdapter` from `@upi-failover/core`:

- `supports(method, currency)` so the router never sends a method the gateway cannot do.
- `createPayment(req, ctx)` must forward `ctx.idempotencyKey` and honour `ctx.signal`.
- `getPaymentStatus(gatewayRef)` is mandatory. Ambiguous timeouts are resolved here, not by charging someone else.
- `verifyWebhook` returns `null` on a bad signature. It does not throw.
- `mdr(method)` reads config. Return the configured fraction. Do not hardcode UPI as zero inside the adapter if config says otherwise.
- Map every gateway and bank error code into a `FailureClass`. Only `GATEWAY_DOWN` and `BANK_DOWN` are failover-eligible.

Do not log `req.customer.vpa`, the credential object, or the webhook secret. Do not put the gateway's raw response on `GatewayResult`; copy the fields the orchestrator needs and drop the rest.

Phase 1 factories for Razorpay, Cashfree, and Stripe validate that credentials are non-empty and then throw `AdapterNotImplementedError`. Replace that throw in Phase 3. Keep the default path on `mock-flaky`, and gate real sandbox calls behind `USE_REAL_GATEWAYS=true`.

Register the instance on `AdapterRegistry`. A second `register` of the same id throws.
