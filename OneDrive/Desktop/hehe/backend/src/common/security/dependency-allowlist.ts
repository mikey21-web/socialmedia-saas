/**
 * Centralized list of trusted external endpoints that the backend may contact.
 * Use this as an SSRF defense for any user-supplied URL we fetch (website scrapes, webhooks, etc).
 */

export const ALLOWED_OUTBOUND_HOSTS = [
  // Platform APIs
  'api.twitter.com',
  'graph.instagram.com',
  'graph.facebook.com',
  'api.linkedin.com',
  'open.tiktokapis.com',
  'youtube.googleapis.com',
  'oauth2.googleapis.com',
  'www.googleapis.com',

  // AI providers
  'api.anthropic.com',
  'api.groq.com',
  'api.voyageai.com',
  'api.openai.com',
  'api.replicate.com',

  // Payments
  'api.stripe.com',

  // Email
  'api.resend.com',
  'api.sendgrid.com',

  // Storage
  's3.amazonaws.com',
];

export const BLOCKED_IP_RANGES = [
  '10.',           // Private network
  '172.16.',       // Private network (some)
  '192.168.',      // Private network
  '127.',          // Loopback
  '169.254.',      // Link-local
  '::1',           // IPv6 loopback
  'fc00:',         // IPv6 ULA
  'fe80:',         // IPv6 link-local
];

export function isAllowedOutboundHost(hostname: string): boolean {
  return ALLOWED_OUTBOUND_HOSTS.some((allowed) =>
    hostname === allowed || hostname.endsWith(`.${allowed}`),
  );
}

export function isBlockedInternalAddress(hostname: string): boolean {
  return BLOCKED_IP_RANGES.some((range) => hostname.startsWith(range)) ||
    hostname === 'localhost' ||
    hostname === '0.0.0.0';
}
