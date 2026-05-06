import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;
  const prisma = {
    mediaAsset: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MediaService(prisma as never);
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
      const mediaService = service as unknown as {
        awsConfigured: boolean;
        awsBucket?: string;
        awsRegion?: string;
      };
      mediaService.awsConfigured = false;
      mediaService.awsBucket = undefined;
      mediaService.awsRegion = undefined;

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

  describe('saveAsset', () => {
    it('persists asset metadata', async () => {
      prisma.mediaAsset.create.mockResolvedValue({ id: 'asset_1' });

      const result = await service.saveAsset('team_1', {
        url: 'https://cdn.example.com/test.jpg',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
      });

      expect(prisma.mediaAsset.create).toHaveBeenCalledWith({
        data: {
          teamId: 'team_1',
          url: 'https://cdn.example.com/test.jpg',
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 0,
          width: null,
          height: null,
          source: 'upload',
          tags: [],
        },
      });
      expect(result).toEqual({ id: 'asset_1' });
    });
  });
});
