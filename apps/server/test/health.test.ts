import { describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../src/app.js';

async function withRequest(
  logger: boolean,
  run: (request: ReturnType<typeof supertest>) => Promise<void>,
) {
  const app = buildApp({ logger });
  await app.ready();
  try {
    await run(supertest(app.server));
  } finally {
    await app.close();
  }
}

describe('health routes', () => {
  it('reports process health, empty gateway health, and a prometheus gauge', async () => {
    await withRequest(false, async (request) => {
      const health = await request.get('/health').set('x-request-id', 'req_phase1').expect(200);
      expect(health.body).toEqual({ status: 'ok' });
      expect(health.headers['x-request-id']).toBe('req_phase1');

      const gateways = await request.get('/v1/health/gateways').expect(200);
      expect(gateways.body).toEqual({ gateways: [] });

      const metrics = await request.get('/metrics').expect(200);
      expect(metrics.text).toContain('upi_router_info{version="0.0.0",phase="1"} 1');
      expect(metrics.headers['content-type']).toContain('text/plain');
    });
  });

  it('returns a structured not-found error', async () => {
    await withRequest(false, async (request) => {
      const response = await request.get('/v1/payments/pay_1').expect(404);
      expect(response.body.error.code).toBe('not_found');
      expect(response.body.error.requestId).toEqual(expect.any(String));
    });
  });

  it('constructs a logged app', async () => {
    const previous = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'silent';
    try {
      await withRequest(true, async (request) => {
        await request.get('/health').expect(200);
      });
    } finally {
      if (previous === undefined) delete process.env.LOG_LEVEL;
      else process.env.LOG_LEVEL = previous;
    }
  });
});
