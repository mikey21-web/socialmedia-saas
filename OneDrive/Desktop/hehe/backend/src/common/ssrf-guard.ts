import { ForbiddenException } from '@nestjs/common';
import { lookup } from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(lookup);

/**
 * CIDR helpers — check whether a resolved IP falls in a private/loopback range.
 * Blocked ranges:
 *   - 127.0.0.0/8   (loopback)
 *   - 10.0.0.0/8    (RFC-1918)
 *   - 172.16.0.0/12 (RFC-1918)
 *   - 192.168.0.0/16(RFC-1918)
 *   - 169.254.0.0/16(link-local)
 *   - 0.0.0.0
 *   - ::1           (IPv6 loopback)
 *   - fc00::/7      (IPv6 unique-local)
 *   - fe80::/10     (IPv6 link-local)
 */
function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts as [number, number, number, number];

  if (a === 127) return true;                        // 127.0.0.0/8  loopback
  if (a === 10) return true;                         // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true;           // 192.168.0.0/16
  if (a === 169 && b === 254) return true;           // 169.254.0.0/16 link-local
  if (a === 0) return true;                          // 0.0.0.0

  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, '');

  if (normalized === '::1') return true;             // loopback
  if (normalized === '::') return true;              // unspecified
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // fc00::/7 unique-local
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9')
    || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return true; // fe80::/10 link-local
  }

  return false;
}

/**
 * Resolve the hostname in a user-supplied URL, then throw ForbiddenException
 * if the resolved IP is in a private/loopback/internal range (SSRF protection).
 *
 * @throws {ForbiddenException} if the URL points to a private/internal IP
 * @throws {ForbiddenException} if the URL uses a non-http(s) scheme
 */
export async function assertSsrfSafe(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ForbiddenException(`Invalid URL: ${rawUrl}`);
  }

  const { protocol, hostname } = parsed;

  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new ForbiddenException(`URL scheme "${protocol}" is not allowed (only http/https)`);
  }

  // Block literal private hostnames before DNS resolution
  const lowerHost = hostname.toLowerCase();
  if (lowerHost === 'localhost' || lowerHost === '0.0.0.0') {
    throw new ForbiddenException(`Requests to "${hostname}" are not allowed (SSRF protection)`);
  }

  // Resolve the hostname and check the resolved IP
  let resolvedAddress: string;
  try {
    const result = await dnsLookup(hostname);
    resolvedAddress = result.address;
  } catch {
    throw new ForbiddenException(`Could not resolve hostname: ${hostname}`);
  }

  const blocked = isPrivateIpv4(resolvedAddress) || isPrivateIpv6(resolvedAddress);
  if (blocked) {
    throw new ForbiddenException(
      `Requests to private/internal IP addresses are not allowed (SSRF protection). ` +
      `Resolved "${hostname}" to "${resolvedAddress}"`,
    );
  }
}
