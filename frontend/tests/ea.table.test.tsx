import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

import { EaTable } from '../app/(app)/ea/EaTable';

const items = [
  {
    id: '1',
    ea_number: 'EA1001',
    regime_code: 'R1',
    export_date: '2025-05-01',
    status: 'SUBMITTED',
    customer_name: 'Client A',
    destination_country: 'FR',
    product_ref: 'PR-1',
    total_quantity: 10,
    quantity_unit: 'TONNE',
    scrap_percent: 5,
  },
  {
    id: '2',
    ea_number: 'EA1002',
    regime_code: 'R1',
    export_date: '2025-05-02',
    status: 'CANCELLED',
    customer_name: 'Client B',
    destination_country: 'IT',
    product_ref: 'PR-2',
    total_quantity: 20,
    quantity_unit: 'TONNE',
    scrap_percent: 0,
  },
];

describe('EaTable', () => {
  test('renders and filters', () => {
    render(<EaTable items={items as any} />);
    expect(screen.getByText('EA1001')).toBeInTheDocument();
    expect(screen.getByText('EA1002')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Recherche par numéro, client ou référence');
    fireEvent.change(input, { target: { value: 'EA1001' } });

    expect(screen.getByText('EA1001')).toBeInTheDocument();
    expect(screen.queryByText('EA1002')).not.toBeInTheDocument();
  });

  test('select and export selected calls API', async () => {
    const mockBuf = new ArrayBuffer(8);
    global.fetch = jest.fn((url: RequestInfo) => {
      const s = String(url);
      if (s.startsWith('/api/ea/export')) return Promise.resolve({ ok: true, arrayBuffer: async () => mockBuf } as any);
      return Promise.resolve({ ok: true, json: async () => [] } as any);
    });

    const originalCreateObjectURL = (URL as any).createObjectURL;
    const originalRevoke = (URL as any).revokeObjectURL;
    (URL as any).createObjectURL = jest.fn().mockReturnValue('blob:fake');
    (URL as any).revokeObjectURL = jest.fn();

    const originalCreateElement = document.createElement;
    const realAnchor = originalCreateElement.call(document, 'a') as HTMLAnchorElement;
    const clickSpy = jest.fn();
    (realAnchor as any).click = clickSpy;
    const createSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return realAnchor;
      return originalCreateElement.call(document, tag as any);
    });

    render(<EaTable items={items as any} />);

    // select first row
    const cb = screen.getByLabelText('select-EA1001') as HTMLInputElement;
    fireEvent.click(cb);

    const btn = screen.getByRole('button', { name: /Exporter/i });
    fireEvent.click(btn);

    // wait for async export
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/ea/export?ids=1')));
    await waitFor(() => expect((URL as any).createObjectURL).toHaveBeenCalled());
    expect(clickSpy).toHaveBeenCalled();

    createSpy.mockRestore();
    (URL as any).createObjectURL = originalCreateObjectURL;
    (URL as any).revokeObjectURL = originalRevoke;
  });
});
