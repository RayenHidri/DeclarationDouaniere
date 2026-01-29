import { NotFoundException } from '@nestjs/common';
import { SaService } from './sa.service';

describe('SaService (unit)', () => {
  let saService: SaService;

  const mockSaRepo: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockFamilyRepo: any = {
    findOne: jest.fn(),
  };
  const mockSupplierRepo: any = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    saService = new SaService(mockSaRepo, mockFamilyRepo, mockSupplierRepo);
  });

  it('getEligibleForAllocation computes remaining_quantity using (1 - t)', async () => {
    const sa = {
      id: '1',
      sa_number: 'SA250001',
      quantity_initial: '100',
      quantity_apured: '0',
      quantity_unit: 'TONNE',
      family: { scrap_percent: 5 },
      supplier: { name: 'F' },
      due_date: new Date('2026-01-01'),
    };

    mockSaRepo.find.mockResolvedValue([sa]);

    const list = await saService.getEligibleForAllocation();

    expect(list).toHaveLength(1);
    const item = list[0];
    expect(item.remaining_quantity).toBeCloseTo(95.0, 3); // 100 * (1 - 0.05)
  });

  it('create computes scrap_quantity_ton and amount_ds', async () => {
    const dto: any = {
      sa_number: '250001',
      declaration_date: '2026-01-01',
      due_date: '2026-02-01',
      quantity_invoiced_ton: 200,
      supplier_id: '10',
      family_id: '20',
      invoice_amount: 1000,
      fx_rate: 3.0,
      currency_code: 'EUR',
      description: 'test',
    };

    mockSupplierRepo.findOne.mockResolvedValue({ id: '10', name: 'Sup' });
    mockFamilyRepo.findOne.mockResolvedValue({ id: '20', scrap_percent: 5 });

    // emulate created entity saved
    mockSaRepo.create.mockImplementation((v: any) => ({ ...v, id: '99' }));
    mockSaRepo.save.mockImplementation(async (entity: any) => ({ ...entity }));

    const user: any = { id: 'u1' };

    const res = await saService.create(dto, user);

    expect(res.sa_number).toBe('SA250001');
    expect(res.scrap_quantity_ton).toBeCloseTo(10.0, 3); // 200 * 0.05
    expect(res.amount_ds).toBeCloseTo(3000.0, 3); // 1000 * 3
  });

  it('exportExcel returns an xlsx buffer', async () => {
    mockSaRepo.find.mockResolvedValue([]);
    const buf = await saService.exportExcel({});
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
  });

  it('getForEa returns a prefilled DTO for EA with computed max_export_quantity', async () => {
    const sa = {
      id: '5',
      sa_number: 'SA250005',
      quantity_initial: '100',
      quantity_apured: '10',
      quantity_unit: 'TONNE',
      family: { id: '2', label: 'Fils machine', scrap_percent: 6 },
      supplier: { name: 'Fourn A' },
      description: 'desc here',
    };

    mockSaRepo.findOne.mockResolvedValue(sa);

    const r = await saService.getForEa('5');
    expect(r.id).toBe('5');
    expect(r.family_label).toBe('Fils machine');
    expect(r.quantity_initial).toBe(100);
    // saRemaining = 90, max_export_quantity = 90 * (1 - 0.06) = 84.6
    expect(r.max_export_quantity).toBeCloseTo(84.6, 3);
    expect(r.suggested_product_ref).toBeNull();
  });
});
