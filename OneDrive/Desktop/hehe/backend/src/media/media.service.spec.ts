import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(() => {
    service = new MediaService();
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

  describe('uploadToS3', () => {
    it('throws when S3 not configured', async () => {
      const file = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('data'),
        size: 4,
      };
      await expect(service.uploadToS3(file)).rejects.toThrow('S3 not configured');
    });
  });
});
