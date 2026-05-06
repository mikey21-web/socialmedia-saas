import { Test } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService, UploadedFile } from './media.service';
import { BadRequestException } from '@nestjs/common';

const mockService = {
  uploadFile: jest.fn().mockResolvedValue({
    url: 'https://s3.example.com/test.jpg',
    asset: { id: 'asset_1' },
  }),
  generateImage: jest.fn().mockResolvedValue({
    url: 'https://replicate.delivery/test.jpg',
    asset: { id: 'asset_2' },
  }),
  generateVideo: jest.fn().mockResolvedValue({
    url: 'https://replicate.delivery/test.mp4',
    asset: { id: 'asset_3' },
  }),
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
      const result = await controller.upload('team_1', file);
      expect(mockService.uploadFile).toHaveBeenCalledWith('team_1', file);
      expect(result).toEqual({
        url: 'https://s3.example.com/test.jpg',
        asset: { id: 'asset_1' },
      });
    });

    it('throws when no file provided', async () => {
      await expect(controller.upload('team_1', undefined as never)).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateImage', () => {
    it('returns url from Replicate', async () => {
      const result = await controller.generateImage('team_1', { prompt: 'a red fox' });
      expect(result).toEqual({
        url: 'https://replicate.delivery/test.jpg',
        asset: { id: 'asset_2' },
      });
    });

    it('throws when prompt missing', async () => {
      await expect(controller.generateImage('team_1', { prompt: '' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateVideo', () => {
    it('returns url from Replicate', async () => {
      const result = await controller.generateVideo('team_1', { prompt: 'a sunset timelapse' });
      expect(result).toEqual({
        url: 'https://replicate.delivery/test.mp4',
        asset: { id: 'asset_3' },
      });
    });
  });
});
