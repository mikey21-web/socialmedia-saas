import { Test } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService, UploadedFile } from './media.service';
import { BadRequestException } from '@nestjs/common';

const mockService = {
  validateMimeType: jest.fn(),
  uploadToS3: jest.fn().mockResolvedValue('https://s3.example.com/test.jpg'),
  generateImage: jest.fn().mockResolvedValue('https://replicate.delivery/test.jpg'),
  generateVideo: jest.fn().mockResolvedValue('https://replicate.delivery/test.mp4'),
};

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
      const file: UploadedFile = {
        fieldname: 'file',
        originalname: 'img.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('data'),
        size: 4,
      };
      const result = await controller.upload(file);
      expect(mockService.validateMimeType).toHaveBeenCalledWith('image/jpeg');
      expect(mockService.uploadToS3).toHaveBeenCalledWith(file);
      expect(result).toEqual({ url: 'https://s3.example.com/test.jpg' });
    });

    it('throws when no file provided', async () => {
      await expect(controller.upload(undefined as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateImage', () => {
    it('returns url from Replicate', async () => {
      const result = await controller.generateImage({ prompt: 'a red fox' });
      expect(result).toEqual({ url: 'https://replicate.delivery/test.jpg' });
    });

    it('throws when prompt missing', async () => {
      await expect(controller.generateImage({ prompt: '' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateVideo', () => {
    it('returns url from Replicate', async () => {
      const result = await controller.generateVideo({ prompt: 'a sunset timelapse' });
      expect(result).toEqual({ url: 'https://replicate.delivery/test.mp4' });
    });
  });
});
