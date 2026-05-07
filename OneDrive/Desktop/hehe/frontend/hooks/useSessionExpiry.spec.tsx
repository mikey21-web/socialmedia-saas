import { render } from "@testing-library/react";
import { vi } from "vitest";
import { useSessionExpiry, type SessionExpiryReason } from "@/hooks/useSessionExpiry";
import { SESSION_UNAUTHORIZED_EVENT } from "@/lib/session-events";

function createTestJwt(expSecondsFromNow: number): string {
  const payload = {
    exp: Math.floor((Date.now() + expSecondsFromNow * 1000) / 1000),
  };
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${encodedPayload}.signature`;
}

function HookHarness({
  token,
  onExpire,
}: {
  token: string | null;
  onExpire: (reason: SessionExpiryReason) => void;
}) {
  useSessionExpiry({ token, onExpire });
  return null;
}

describe("useSessionExpiry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("triggers expiry callback one minute before token expiration", () => {
    const onExpire = vi.fn();
    const token = createTestJwt(65);

    render(<HookHarness token={token} onExpire={onExpire} />);

    vi.advanceTimersByTime(4000);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(onExpire).toHaveBeenCalledWith("expired");
  });

  it("triggers unauthorized callback on API 401 event", () => {
    const onExpire = vi.fn();

    render(<HookHarness token={null} onExpire={onExpire} />);

    window.dispatchEvent(new CustomEvent(SESSION_UNAUTHORIZED_EVENT));
    expect(onExpire).toHaveBeenCalledWith("unauthorized");
  });
});
