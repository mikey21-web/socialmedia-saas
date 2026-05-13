/**
 * k6 Load Test — Analytics Dashboard
 *
 * Tests the analytics endpoints under concurrent read load.
 * These are the most expensive queries in the system.
 *
 * Run:
 *   k6 run load-tests/analytics-dashboard.js
 *   k6 run --vus 100 --duration 60s load-tests/analytics-dashboard.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const summaryDuration = new Trend('analytics_summary_duration');
const roiDuration = new Trend('roi_duration');

export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '60s', target: 100 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    errors: ['rate<0.02'],
    analytics_summary_duration: ['p(95)<2000'],
    roi_duration: ['p(95)<1500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const TEST_TOKEN = __ENV.TEST_TOKEN || 'test-jwt-token';

const headers = {
  Authorization: `Bearer ${TEST_TOKEN}`,
};

export default function () {
  // 1. Analytics summary (most expensive query)
  const summaryStart = Date.now();
  const summaryRes = http.get(
    `${BASE_URL}/analytics/summary?from=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`,
    { headers },
  );
  summaryDuration.add(Date.now() - summaryStart);

  const summaryOk = check(summaryRes, {
    'analytics summary 200': (r) => r.status === 200,
    'analytics summary has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.totalImpressions === 'number';
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!summaryOk);

  sleep(0.2);

  // 2. ROI summary
  const roiStart = Date.now();
  const roiRes = http.get(`${BASE_URL}/analytics/roi`, { headers });
  roiDuration.add(Date.now() - roiStart);

  check(roiRes, {
    'roi 200': (r) => r.status === 200,
  });

  sleep(0.2);

  // 3. Smart suggestions
  const suggestRes = http.get(`${BASE_URL}/analytics/smart-suggestions`, { headers });
  check(suggestRes, {
    'smart suggestions 200': (r) => r.status === 200,
  });

  sleep(0.2);

  // 4. Learning loop insights
  const insightsRes = http.get(`${BASE_URL}/analytics/learning-loop/insights`, { headers });
  check(insightsRes, {
    'insights 200': (r) => r.status === 200,
  });

  sleep(1);
}
