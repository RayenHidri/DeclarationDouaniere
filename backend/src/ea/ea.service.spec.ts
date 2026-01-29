import { EaService } from './ea.service';

describe('EaService (unit)', () => {
  let service: EaService;

  const mockEaRepo: any = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockApurementService: any = {
    createAllocation: jest.fn(),
    hasAllocationsForEa: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EaService(mockEaRepo, mockApurementService);
  });

  it('normalize ea_number on create', async () => {
    mockEaRepo.create.mockImplementation((v: any) => ({ ...v, id: '1' }));
    mockEaRepo.save.mockImplementation(async (e: any) => ({ ...e }));

    const user: any = { id: 'u1' };

    const dto: any = {
      ea_number: '250001',
      export_date: '2026-01-01',
      customer_name: 'Client X',
      total_quantity: 5,
      quantity_unit: 'TONNE',
    };

    const saved = await service.create(dto, user);
    expect(saved.ea_number).toBe('EA250001');
  });

  it('create with linked_sa calls apurement service', async () => {
    mockEaRepo.create.mockImplementation((v: any) => ({ ...v, id: '2' }));
    mockEaRepo.save.mockImplementation(async (e: any) => ({ ...e }));

    const user: any = { id: 'u1' };

    const dto: any = {
      ea_number: '250002',
      export_date: '2026-01-01',
      customer_name: 'Client X',
      total_quantity: 12,
      quantity_unit: 'TONNE',
      linked_sa_id: '10',
      linked_quantity: 2,
    };

    mockApurementService.createAllocation.mockResolvedValue({ id: 'alloc1' });

    const saved = await service.create(dto, user);
    expect(mockApurementService.createAllocation).toHaveBeenCalledWith(
      expect.objectContaining({ sa_id: '10', ea_id: '2', quantity: 2 }),
      user,
    );
  });
});