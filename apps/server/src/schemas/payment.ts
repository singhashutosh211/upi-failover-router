import { z } from 'zod';

export const paymentMethodSchema = z.enum(['upi', 'netbanking', 'card', 'wallet']);
export const upiFlowSchema = z.enum(['intent', 'collect']);

export const customerSchema = z
  .object({
    id: z.string().min(1).max(128).optional(),
    name: z.string().min(1).max(128).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(8).max(20).optional(),
    vpa: z
      .string()
      .regex(/^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/, 'Invalid VPA')
      .optional(),
  })
  .strict();

const FORBIDDEN_METADATA_KEY = /pan|cvv|card|pin|otp|secret|vpa/i;

export const createPaymentBodySchema = z
  .object({
    amount: z.number().int().positive().max(1_000_000_000),
    currency: z.string().regex(/^[A-Z]{3}$/),
    method: paymentMethodSchema,
    upiFlow: upiFlowSchema.optional(),
    orderId: z.string().min(1).max(128),
    customer: customerSchema,
    description: z.string().max(256).optional(),
    metadata: z.record(z.string().max(64), z.string().max(256)).optional(),
    paymentToken: z.string().min(1).max(256).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.method === 'upi' && value.upiFlow === 'collect' && value.customer.vpa === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'customer.vpa is required for UPI collect',
        path: ['customer', 'vpa'],
      });
    }
    if (value.method === 'card' && value.paymentToken === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'paymentToken is required for card. Raw card data is not accepted.',
        path: ['paymentToken'],
      });
    }
    if (value.metadata) {
      for (const key of Object.keys(value.metadata)) {
        if (FORBIDDEN_METADATA_KEY.test(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `metadata.${key} is not allowed`,
            path: ['metadata', key],
          });
        }
      }
    }
  });

export const idempotencyKeySchema = z.string().min(8).max(255);

export const gatewayHealthResponseSchema = z.object({
  gateways: z.array(
    z.object({
      gatewayId: z.string(),
      method: paymentMethodSchema,
      circuit: z.enum(['CLOSED', 'OPEN', 'HALF_OPEN']),
    }),
  ),
});

export const nextActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('upi_intent'), uri: z.string().min(1) }),
  z.object({ type: z.literal('collect_pending') }),
  z.object({ type: z.literal('redirect'), url: z.string().url() }),
  z.object({ type: z.literal('none') }),
]);

export type CreatePaymentBody = z.infer<typeof createPaymentBodySchema>;
