# Load Tests

k6 load test scripts for Diyaa AI. Run these against staging before every major release.

## Install k6

```bash
# macOS
brew install k6

# Windows (Chocolatey)
choco install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## Running Tests

```bash
# Quick smoke test (5 users, 30s)
k6 run --vus 5 --duration 30s load-tests/publish-workflow.js

# Full load test against staging
BASE_URL=https://api-staging.diyaa.ai TEST_TOKEN=your-jwt k6 run load-tests/publish-workflow.js

# All tests
k6 run load-tests/publish-workflow.js
k6 run load-tests/onboarding-flow.js
k6 run load-tests/analytics-dashboard.js
```

## Test Files

| File | What it tests | Target VUs |
|------|--------------|-----------|
| `publish-workflow.js` | Create post → schedule → publish | 50 |
| `onboarding-flow.js` | Signup → brand profile → onboarding complete | 20 |
| `analytics-dashboard.js` | Analytics summary, ROI, insights (read-heavy) | 100 |

## Thresholds

All tests fail if:
- 95th percentile response time > 2-5s (varies by endpoint)
- Error rate > 2-5%

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:3001` | API base URL |
| `TEST_TOKEN` | `test-jwt-token` | JWT for authenticated requests |

## Interpreting Results

```
✓ http_req_duration............: avg=234ms  p(95)=890ms
✓ errors.......................: 0.00%
✓ publish_duration.............: avg=1.2s   p(95)=3.1s
```

- `avg` — average response time
- `p(95)` — 95th percentile (what 95% of users experience)
- `errors` — percentage of failed requests

If `p(95)` is close to the threshold, investigate before launch.
