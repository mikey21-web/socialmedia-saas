export const SESSION_UNAUTHORIZED_EVENT = "postiz:session-unauthorized";

export function emitSessionUnauthorized(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(SESSION_UNAUTHORIZED_EVENT));
}
