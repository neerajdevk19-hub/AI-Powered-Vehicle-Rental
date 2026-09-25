import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service';
import { PrismaService } from '../prisma/prisma.service';
import { PythonClientService } from '../python-client/python-client.service';

describe('VehiclesService', () => {
  let service: VehiclesService;

  const mockPrismaService = {
    vehicle: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'veh-001',
          name: 'Mahindra Thar 4x4',
          brand: 'Mahindra',
          type: 'SUV',
          transmission: 'Automatic',
          pricePerDay: 3200,
          securityDeposit: 3000,
          latitude: 22.7533,
          longitude: 75.8937,
          rating: 4.9,
        },
      ]),
      findUnique: jest.fn().mockResolvedValue({
        id: 'veh-001',
        name: 'Mahindra Thar 4x4',
        brand: 'Mahindra',
        type: 'SUV',
        transmission: 'Automatic',
        pricePerDay: 3200,
        securityDeposit: 3000,
        latitude: 22.7533,
        longitude: 75.8937,
        rating: 4.9,
      }),
    },
    reservation: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockPythonClientService = {
    rankVehicles: jest.fn().mockImplementation((payload) => {
      return Promise.resolve({
        rankedVehicleIds: payload.candidates.map((c: any) => c.id),
        scores: { 'veh-001': 8.5 },
      });
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PythonClientService, useValue: mockPythonClientService },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate price correctly including GST and deposit', () => {
    const price = service.calculatePrice(
      'veh-001',
      3000,
      2000,
      '2026-09-25T10:00:00Z',
      '2026-09-27T10:00:00Z',
    );
    expect(price.days).toBe(2);
    expect(price.basePrice).toBe(6000);
    expect(price.gstTaxes).toBe(1080); // 18% of 6000
    expect(price.securityDeposit).toBe(2000);
    expect(price.totalPrice).toBe(9080);
  });

  it('should search vehicles and include distance and recommendation score', async () => {
    const results = await service.search({
      lat: 22.7196,
      lng: 75.8577,
      type: 'SUV',
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].distanceFromUser).toBeDefined();
    expect(results[0].recommendationScore).toBe(8.5);
  });
});
