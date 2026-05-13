import { stripHtml, escapeHtml, sanitizeUrl, truncate } from './input-sanitizer';

describe('input-sanitizer', () => {
  describe('stripHtml', () => {
    it('removes script tags and their content', () => {
      expect(stripHtml('Hello <script>alert("xss")</script> World')).toBe('Hello  World');
    });

    it('removes all HTML tags', () => {
      expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
    });

    it('removes inline event handlers', () => {
      expect(stripHtml('<div onclick="evil()">test</div>')).not.toContain('onclick');
    });

    it('strips javascript: protocol', () => {
      expect(stripHtml('Click <a href="javascript:alert(1)">here</a>')).not.toContain('javascript:');
    });

    it('handles null and undefined', () => {
      expect(stripHtml(null)).toBe('');
      expect(stripHtml(undefined)).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('a & b')).toBe('a &amp; b');
      expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    });
  });

  describe('sanitizeUrl', () => {
    it('accepts http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('accepts https URLs', () => {
      expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
    });

    it('rejects javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('rejects data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('rejects file: URLs', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
    });

    it('rejects malformed URLs', () => {
      expect(sanitizeUrl('not a url')).toBeNull();
    });

    it('returns null for empty input', () => {
      expect(sanitizeUrl('')).toBeNull();
      expect(sanitizeUrl(null)).toBeNull();
    });
  });

  describe('truncate', () => {
    it('truncates strings exceeding max length', () => {
      expect(truncate('hello world', 5)).toBe('hello');
    });

    it('returns original string when shorter than max', () => {
      expect(truncate('hi', 10)).toBe('hi');
    });

    it('handles null', () => {
      expect(truncate(null, 5)).toBe('');
    });
  });
});
