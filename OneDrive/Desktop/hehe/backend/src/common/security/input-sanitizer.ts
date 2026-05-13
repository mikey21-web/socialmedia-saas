/**
 * Input sanitization helpers to prevent XSS and other content-based attacks.
 * Used for user-generated content like post captions, comments, brand profiles.
 */

const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAG_REGEX = /<\/?[^>]+(>|$)/g;
const ON_EVENT_REGEX = /\son\w+\s*=/gi;
const JAVASCRIPT_PROTOCOL_REGEX = /javascript:/gi;

/**
 * Strip HTML tags from text. For plain-text fields like captions.
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(SCRIPT_TAG_REGEX, '')
    .replace(HTML_TAG_REGEX, '')
    .replace(ON_EVENT_REGEX, '')
    .replace(JAVASCRIPT_PROTOCOL_REGEX, '')
    .trim();
}

/**
 * Escape HTML entities. For when content needs to be rendered as text inside HTML.
 */
export function escapeHtml(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and normalize a URL. Rejects javascript:, data:, and file: schemes.
 */
export function sanitizeUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Limit string length to prevent abuse.
 */
export function truncate(input: string | null | undefined, maxLength: number): string {
  if (!input) return '';
  return input.length > maxLength ? input.slice(0, maxLength) : input;
}
