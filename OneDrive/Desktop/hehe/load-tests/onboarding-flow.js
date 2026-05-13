/**
 * k6 Load Test — Onboarding Flow
 *
 * Tests the signup → onboarding → first post creation flow.
 *
 * Run:
 *   k6 run load-tests/onboarding-flow.js
 *   k6 run --vus 20 --duration 60s load-tests/onboarding-flow.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const errorRate = new Rate('errors');
const signupDuration = new Trend('signup_duration');
const onboardingDuration = new Trend('onboarding_duration');

export const options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '40s', target: 20 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    errors: ['rate<0.05'],
    signup_duration: ['p(95)<2000'],
    onboarding_duration: ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  const email = `loadtest-${randomString(8)}@test.diyaa.ai`;
  const password = 'LoadTest123!';

  // 1. Sign up
  const signupStart = Date.now();
  const signupRes = http.post(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({ name: 'Load Test User', email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  signupDuration.add(Date.now() - signupStart);

  const signupOk = check(signupRes, {
    'signup 201': (r) => r.status === 201,
    'signup has token': (r) => {
      try {
        return !!JSON.parse(r.body).token;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!signupOk);
  if (!signupOk) {
    sleep(1);
    return;
  }

  const token = JSON.parse(signupRes.body).token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  sleep(0.5);

  // 2. Create brand profile (onboarding step 1)
  const onboardStart = Date.now();
  const brandRes = http.post(
    `${BASE_URL}/brand/profile`,
    JSON.stringify({
      brandName: 'Load Test Brand',
      industry: 'saas',
      description: 'A test brand for load testing purposes.',
    }),
    { headers },
  );

  check(brandRes, {
    'brand profile 201': (r) => r.status === 201,
  });

  sleep(0.3);

  // 3. Complete onboarding
  const completeRes = http.post(`${BASE_URL}/onboarding/complete`, '{}', { headers });

  onboardingDuration.add(Date.now() - onboardStart);

  check(completeRes, {
    'onboarding complete 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(0.5);

  // 4. Get subscription status
  const subRes = http.get(`${BASE_URL}/subscriptions/status`, { headers });
  check(subRes, {
    'subscription status 200': (r) => r.status === 200,
  });

  sleep(1);
}
