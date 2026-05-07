import { act, render, screen } from "@testing-library/react";
import { SessionExpiryProvider } from "@/components/session-expiry-provider";
import { SESSION_UNAUTHORIZED_EVENT } from "@/lib/session-events";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe("SessionExpiryProvider", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    localStorage.setItem("auth", JSON.stringify({ state: { token: "abc" } }));
  });

  it("shows session expired modal when unauthorized event is emitted", async () => {
    render(
      <SessionExpiryProvider>
        <div>App Content</div>
      </SessionExpiryProvider>,
    );

    await act(async () => {
      window.dispatchEvent(new CustomEvent(SESSION_UNAUTHORIZED_EVENT));
    });

    expect(await screen.findByText("Session expired")).toBeInTheDocument();
    expect(await screen.findByText("Your session expired. Please sign in again.")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });
});
