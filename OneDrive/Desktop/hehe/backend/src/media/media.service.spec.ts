import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(() => {
    service = new MediaService();
  });

  describe('getFileUrl', () => {
    it('returns a /uploads/ prefixed URL for a filename', () => {
      const result = service.getFileUrl('abc123.jpg');
      expect(result).toBe('/uploads/abc123.jpg');
    });
  });

  describe('validateMimeType', () => {
    it('accepts image/jpeg', () => {
      expect(() => service.validateMimeType('image/jpeg')).not.toThrow();
    });

    it('accepts video/mp4', () => {
      expect(() => service.validateMimeType('video/mp4')).not.toThrow();
    });

    it('rejects text/plain', () => {
      expect(() => service.validateMimeType('text/plain')).toThrow('Unsupported file type');
    });
  });
});
