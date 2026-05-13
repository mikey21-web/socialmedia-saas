/**
 * k6 Load Test — Publish Workflow
 *
 * Tests the critical path: create post → schedule → publish
 * under concurrent load.
 *
 * Run:
 *   k6 run load-tests/publish-workflow.js
 *   k6 run --vus 50 --duration 60s load-tests/publish-workflow.js
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const publishDuration = new Trend('publish_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // ramp up to 10 users
    { duration: '60s', target: 50 },   // ramp up to 50 users
    { duration: '60s', target: 50 },   // hold at 50 users
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    errors: ['rate<0.05'],              // error rate under 5%
    publish_duration: ['p(95)<5000'],   // publish endpoint under 5s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const TEST_TOKEN = __ENV.TEST_TOKEN || 'test-jwt-token';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TEST_TOKEN}`,
};

export default function () {
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check 200': (r) => r.status === 200,
    'health check db ok': (r) => {
      try {
        return JSON.parse(r.body).db === 'ok';
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);

  // 2. Create a draft post
  const createStart = Date.now();
  const createRes = http.post(
    `${BASE_URL}/posts`,
    JSON.stringify({
      content: `Load test post ${Date.now()} — testing concurrent publish workflows`,
      platforms: ['twitter'],
      status: 'draft',
    }),
    { headers },
  );

  const createOk = check(createRes, {
    'create post 201': (r) => r.status === 201,
    'create post has id': (r) => {
      try {
        return !!JSON.parse(r.body).id;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!createOk);

  if (!createOk) {
    sleep(1);
    return;
  }

  const postId = JSON.parse(createRes.body).id;

  sleep(0.3);

  // 3. Schedule the post
  const scheduleRes = http.patch(
    `${BASE_URL}/posts/${postId}`,
    JSON.stringify({
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 60000).toISOString(),
    }),
    { headers },
  );

  check(scheduleRes, {
    'schedule post 200': (r) => r.status === 200,
  });

  sleep(0.3);

  // 4. Trigger publish
  const publishStart = Date.now();
  const publishRes = http.post(
    `${BASE_URL}/posts/${postId}/publish`,
    JSON.stringify({}),
    { headers },
  );

  const publishDurationMs = Date.now() - publishStart;
  publishDuration.add(publishDurationMs);

  const publishOk = check(publishRes, {
    'publish 200 or 202': (r) => r.status === 200 || r.status === 202,
    'publish has workflowId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return !!body.workflowId || !!body.success;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!publishOk);

  sleep(1);
}
