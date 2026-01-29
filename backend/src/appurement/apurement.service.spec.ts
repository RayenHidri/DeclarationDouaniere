import { BadRequestException } from '@nestjs/common';
import { ApurementService } from './apurement.service';

describe('ApurementService (unit)', () => {
  let service: ApurementService;

  const mockAllocRepo: any = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const mockSaRepo: any = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockEaRepo: any = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ApurementService(mockAllocRepo, mockSaRepo, mockEaRepo);
  });

  it('createAllocation computes consumedOnSa using 1/(1-t) and updates SA apurement', async () => {
    // SA with scrap_percent 5 % and initial 100
    const sa = { id: '10', quantity_initial: '100', family: { scrap_percent: 5 } };
    mockSaRepo.findOne.mockResolvedValue(sa);

    const ea = { id: '20' };
    mockEaRepo.findOne.mockResolvedValue(ea);

    // Before allocation, no allocations
    mockAllocRepo.find.mockResolvedValue([]);

    // Make allocRepo.create produce the allocation object and saving returns it with an id
    mockAllocRepo.create.mockImplementation((a: any) => ({ ...a }));
    mockAllocRepo.save.mockImplementation(async (a: any) => ({ ...a, id: 'a1' }));

    // After save, getTotalAllocatedForSa will read allocations; simulate it returning consumed value
    const consumedExpected = Number((10 / (1 - 0.05)).toFixed(3)); // EA=10
    mockAllocRepo.find.mockResolvedValue([{ quantity: consumedExpected.toString() }]);

    const user: any = { id: 'u1' };

    const saved = await service.createAllocation({ sa_id: '10', ea_id: '20', quantity: 10 }, user);

    expect(saved).toBeDefined();
    // Verify saved allocation stores SA-consumed quantity (string) close to expected
    expect(Number(saved.quantity)).toBeCloseTo(consumedExpected, 3);

    // After allocation, SA should be saved with updated quantity_apured
    expect(mockSaRepo.save).toHaveBeenCalled();
    const savedSaArg = mockSaRepo.save.mock.calls[0][0];
    expect(Number(savedSaArg.quantity_apured)).toBeCloseTo(consumedExpected, 3);
  });

  it('createAllocation throws on invalid scrap percent (>=100%)', async () => {
    const sa = { id: '11', quantity_initial: '50', family: { scrap_percent: 100 } };
    mockSaRepo.findOne.mockResolvedValue(sa);
    const ea = { id: '21' };
    mockEaRepo.findOne.mockResolvedValue(ea);

    await expect(
      service.createAllocation({ sa_id: '11', ea_id: '21', quantity: 1 }, { id: 'u1' } as any),
    ).rejects.toThrow(BadRequestException);
  });
});