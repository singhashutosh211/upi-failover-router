import { randomUUID } from 'node:crypto';
import type { ApiErrorBody } from '@upi-failover/core';
import Fastify, { type FastifyError } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { gatewayHealthResponseSchema } from './schemas/payment.js';

export interface BuildAppOptions {
  readonly logger?: boolean;
}

export function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger: options.logger
      ? {
          level: process.env.LOG_LEVEL ?? 'info',
          redact: {
            paths: ['req.headers.authorization', 'req.headers["x-api-key"]'],
            censor: '[REDACTED]',
          },
        }
      : false,
    requestIdHeader: 'x-request-id',
    genReqId: (request) => {
      const incoming = request.headers['x-request-id'];
      if (typeof incoming === 'string' && incoming.length > 0 && incoming.length <= 200) {
        return incoming;
      }
      return randomUUID();
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.addHook('onRequest', async (request, reply) => {
    void reply.header('x-request-id', request.id);
  });

  app.setNotFoundHandler((request, reply) => {
    const body: ApiErrorBody = {
      error: {
        code: 'not_found',
        message: `Route ${request.method} ${request.url} not found`,
        requestId: request.id,
      },
    };
    return reply.status(404).send(body);
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    const body: ApiErrorBody = {
      error: {
        code: statusCode >= 500 ? 'internal_error' : 'bad_request',
        message: statusCode >= 500 ? 'Internal error' : error.message,
        requestId: request.id,
      },
    };
    return reply.status(statusCode).send(body);
  });

  app.get('/health', async () => ({ status: 'ok' as const }));

  app.get('/v1/health/gateways', async () => {
    return gatewayHealthResponseSchema.parse({ gateways: [] });
  });

  app.get('/metrics', async (_request, reply) => {
    return reply
      .type('text/plain; version=0.0.4; charset=utf-8')
      .send(
        [
          '# HELP upi_router_info Orchestrator process info',
          '# TYPE upi_router_info gauge',
          'upi_router_info{version="0.0.0",phase="1"} 1',
          '',
        ].join('\n'),
      );
  });

  return app;
}
