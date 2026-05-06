import { proxyActivities, sleep } from '@temporalio/workflow';

type TokenRefreshWorkflowInput = {
  teamId: string;
  platform: string;
  userId: string;
  credentialId: string;
};

type TokenRefreshActivities = {
  checkTokenExpiry: (input: TokenRefreshWorkflowInput) => Promise<{
    needsRefresh: boolean;
    expiresAt: Date | null;
  }>;
  doTokenRefresh: (input: TokenRefreshWorkflowInput) => Promise<void>;
};

const activities = proxyActivities<TokenRefreshActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
    nonRetryableErrorTypes: ['NoRefreshToken', 'PlatformNotSupported'],
  },
});

export async function tokenRefreshWorkflow(input: TokenRefreshWorkflowInput): Promise<void> {
  const result = await activities.checkTokenExpiry(input);

  if (result.needsRefresh) {
    await activities.doTokenRefresh(input);
  }

  const now = Date.now();
  const expiresAtMs = result.expiresAt ? new Date(result.expiresAt).getTime() : now + 30 * 60 * 1000;
  const waitMs = Math.max(expiresAtMs - now - 60 * 60 * 1000, 60 * 1000);
  await sleep(waitMs);

  await tokenRefreshWorkflow(input);
}
