import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// mock next/router useRouter for tests
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

import { SaTable, SaItem } from '../app/(app)/sa/SaTable';

const sample: SaItem[] = [
  {
    id: '1',
    sa_number: 'SA1001',
    regime_code: 'R1',
    declaration_date: '2025-01-01',
    due_date: '2025-02-01',
    status: 'OPEN',
    quantity_initial: 100,
    quantity_unit: 'TONNE',
    quantity_apured: 10,
    supplier_name: 'Fourn A',
    family_label: 'Fam A',
  },
  {
    id: '2',
    sa_number: 'SA1002',
    regime_code: 'R1',
    declaration_date: '2025-01-02',
    due_date: '2025-02-02',
    status: 'PARTIALLY_APURED',
    quantity_initial: 200,
    quantity_unit: 'TONNE',
    quantity_apured: 100,
    supplier_name: 'Fourn B',
    family_label: 'Fam B',
  },
];

describe('SaTable', () => {
  test('renders and filters by search', () => {
    render(<SaTable items={sample} />);

    expect(screen.getByText('SA1001')).toBeInTheDocument();
    expect(screen.getByText('SA1002')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Recherche par numéro, fournisseur ou famille');
    fireEvent.change(input, { target: { value: 'SA1001' } });

    expect(screen.getByText('SA1001')).toBeInTheDocument();
    expect(screen.queryByText('SA1002')).not.toBeInTheDocument();
  });

  test('sorts by quantity', () => {
    render(<SaTable items={sample} />);

    // click on Quantity header
    const qtyHeader = screen.getByText('Quantité');
    fireEvent.click(qtyHeader);

    // After sorting asc, first page first row should be SA1001 (100)
    const firstRow = screen.getAllByRole('row')[1];
    expect(firstRow).toHaveTextContent('SA1001');

    // toggle to desc
    fireEvent.click(qtyHeader);
    const firstRowDesc = screen.getAllByRole('row')[1];
    expect(firstRowDesc).toHaveTextContent('SA1002');
  });

  test('selects and shows export count', () => {
    render(<SaTable items={sample} />);

    const checkbox = screen.getByLabelText('select-SA1001') as HTMLInputElement;
    fireEvent.click(checkbox);

    const exportBtn = screen.getByText('Exporter (1)');
    expect(exportBtn).toBeInTheDocument();
  });

  test('export selected calls backend and triggers download', async () => {
    const mockBuf = new ArrayBuffer(8);
    global.fetch = jest.fn((url: RequestInfo) => {
      const s = String(url);
      if (s.startsWith('/api/sa/export')) return Promise.resolve({ ok: true, arrayBuffer: async () => mockBuf } as any);
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

    render(<SaTable items={sample} />);

    // select first row
    const cb = screen.getByLabelText('select-SA1001') as HTMLInputElement;
    fireEvent.click(cb);

    const btn = screen.getByRole('button', { name: /Exporter/i });
    fireEvent.click(btn);

    // wait for async export to perform fetch and download
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/sa/export?ids=1')));
    await waitFor(() => expect((URL as any).createObjectURL).toHaveBeenCalled());
    expect(clickSpy).toHaveBeenCalled();

    createSpy.mockRestore();
    (URL as any).createObjectURL = originalCreateObjectURL;
    (URL as any).revokeObjectURL = originalRevoke;
  });
});
