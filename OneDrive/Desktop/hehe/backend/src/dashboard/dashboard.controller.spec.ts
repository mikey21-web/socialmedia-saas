import { Test } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController.engagement', () => {
  let controller: DashboardController;
  const service = { getSummary: jest.fn(), getEngagement: jest.fn() } as unknown as DashboardService;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: service }],
    }).compile();
    controller = mod.get(DashboardController);
  });

  it('returns engagement series for 30d', async () => {
    (service.getEngagement as jest.Mock).mockResolvedValue({ days: [], series: { likes: [], comments: [], reach: [] } });
    const result = await controller.engagement({ user: { team_id: 't1' } } as any, '30d');
    expect(result).toEqual({ days: [], series: { likes: [], comments: [], reach: [] } });
    expect(service.getEngagement).toHaveBeenCalledWith('t1', '30d');
  });
});
