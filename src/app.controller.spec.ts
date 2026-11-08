import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  const mockDataSource = {
    query: vi.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health check', () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return database health status when connected', async () => {
      mockDataSource.query.mockResolvedValueOnce([{ '?column?': 1 }]);
      const result = await appController.getDatabaseHealth();
      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
    });
  });
});
