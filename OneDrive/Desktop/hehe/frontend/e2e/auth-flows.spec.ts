import { expect, test } from "@playwright/test";

function createUnsignedJwt(expiresInSecondsFromNow: number): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" }))
    .toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "e2e-user",
      email: "e2e@example.com",
      team_id: "team-1",
      exp: Math.floor(Date.now() / 1000) + expiresInSecondsFromNow,
    }),
  ).toString("base64url");

  return `${header}.${payload}.signature`;
}

test("google oauth redirect callback reaches dashboard", async ({ page }) => {
  const callbackToken = createUnsignedJwt(3600);

  await page.route("**/auth/google", async (route) => {
    await route.fulfill({
      status: 302,
      headers: {
        location: `http://127.0.0.1:3000/auth/google/callback?token=${callbackToken}`,
      },
      body: "",
    });
  });

  await page.goto("/signin");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("session expiry modal appears when token reaches timeout window", async ({ page }) => {
  const expiringToken = createUnsignedJwt(61);

  await page.addInitScript((token) => {
    localStorage.setItem("auth", JSON.stringify({ state: { token }, version: 0 }));
  }, expiringToken);

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Session expired" })).toBeVisible({
    timeout: 6000,
  });
  await expect(page.getByText("Your session expired. Please sign in again.")).toBeVisible();
});

test("401 API response triggers session-expired modal", async ({ page }) => {
  const validToken = createUnsignedJwt(3600);

  await page.addInitScript((token) => {
    localStorage.setItem("auth", JSON.stringify({ state: { token }, version: 0 }));
  }, validToken);

  await page.route("**/oauth/youtube/url", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Token expired" }),
    });
  });

  await page.goto("/settings");
  await page.getByRole("button", { name: "Connect YouTube" }).click();
  await expect(page.getByRole("heading", { name: "Session expired" })).toBeVisible();
});
