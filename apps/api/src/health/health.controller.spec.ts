import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DATABASE_CONNECTION } from '../database/database.module';

describe('HealthController', () => {
  let controller: HealthController;

  const mockPool = {
    query: jest.fn().mockResolvedValue({ rows: [{ ping: 1 }] }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPool.query.mockResolvedValue({ rows: [{ ping: 1 }] });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DATABASE_CONNECTION,
          useValue: mockPool,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status ok with complete telemetry', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('student-housing-api');
    expect(result.version).toBe('1.0.0');
    expect(result.timestamp).toBeDefined();
    expect(result.uptime.seconds).toBeGreaterThanOrEqual(0);
    expect(result.uptime.formatted).toBeDefined();
    expect(result.database.status).toBe('up');
    expect(result.database.pingResult).toBe('healthy');
    expect(result.memory.heapUsed).toBeDefined();
    expect(result.memory.raw.heapUsed).toBeGreaterThan(0);
  });

  it('should return ok for liveness probe', () => {
    const result = controller.liveness();
    expect(result.status).toBe('ok');
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should return ok for readiness probe when DB is reachable', async () => {
    const result = await controller.readiness();
    expect(result.status).toBe('ok');
    expect(result.database.status).toBe('up');
  });

  it('should report degraded status when database fails', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('Connection failed'));
    const result = await controller.check();
    expect(result.status).toBe('degraded');
    expect(result.database.status).toBe('down');
    expect(result.database.pingResult).toBe('unhealthy');
  });
});
