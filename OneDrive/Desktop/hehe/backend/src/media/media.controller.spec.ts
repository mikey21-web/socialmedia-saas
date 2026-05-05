import { Test } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { BadRequestException } from '@nestjs/common';

const mockService = {
  validateMimeType: jest.fn(),
  getFileUrl: jest.fn().mockReturnValue('/uploads/test.jpg'),
  generateImage: jest.fn().mockResolvedValue('https://replicate.delivery/test.jpg'),
};

const mockUser = { userId: 'u1', email: 'a@b.com', team_id: 't1' };

describe('MediaController', () => {
  let controller: MediaController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [{ provide: MediaService, useValue: mockService }],
    }).compile();
    controller = module.get(MediaController);
  });

  describe('upload', () => {
    it('returns url for valid file', async () => {
      mockService.validateMimeType.mockReturnValueOnce(undefined);
      const file = { originalname: 'img.jpg', mimetype: 'image/jpeg', filename: 'abc.jpg' } as Express.Multer.File;
      const result = await controller.upload({ user: mockUser } as any, file);
      expect(result).toEqual({ url: '/uploads/test.jpg' });
    });

    it('throws when no file provided', async () => {
      await expect(
        controller.upload({ user: mockUser } as any, undefined as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateImage', () => {
    it('returns url from Replicate', async () => {
      const result = await controller.generateImage(
        { user: mockUser } as any,
        { prompt: 'a red fox' },
      );
      expect(result).toEqual({ url: 'https://replicate.delivery/test.jpg' });
    });
  });
});
