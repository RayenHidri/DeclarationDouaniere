import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EaNewPage from '../app/(app)/ea/new/page';

// Basic mocks for global fetch
const mockCustomers = [{ id: 1, code: 'C1', name: 'Client 1', is_active: true }];
const mockFamilies = [{ id: 2, label: 'Famille A', scrap_percent: 5 }, { id: 3, label: 'Famille B', scrap_percent: 6 }];
const mockEligible = [
  {
    id: '5',
    sa_number: 'SA250005',
    supplier_name: 'Fourn',
    due_date: '2025-12-31',
    quantity_initial: 100,
    quantity_apured: 10,
    sa_remaining: 90,
    remaining_quantity: 85.5,
    quantity_unit: 'TONNE',
  },
];

const articlesByFamily: any = {
  '2': [
    { id: 21, product_ref: 'REF-AAA', label: 'Produit A' },
    { id: 22, product_ref: 'REF-BBB', label: 'Produit B' },
  ],
  '3': [
    { id: 31, product_ref: 'REF-CCC', label: 'Produit C' },
  ],
};

describe('EA new page SA→EA prefill', () => {
  beforeEach(() => {
    let articleCalls: Record<string, number> = {};

    global.fetch = jest.fn((input: RequestInfo) => {
      const url = String(input);
      if (url.endsWith('/api/customers')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCustomers) } as any);
      }
      if (url.endsWith('/api/sa/eligible')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockEligible) } as any);
      }
      if (url.endsWith('/api/sa-families')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockFamilies) } as any);
      }
      if (url.includes('/api/sa/for-ea/5')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: '5', family_id: 2, max_export_quantity: 85.5, quantity_unit: 'TONNE', description: 'Article SA' }) } as any);
      }
      if (url.includes('/api/articles')) {
        const m = url.match(/family_id=(\d+)/);
        const fid = m ? m[1] : 'unknown';
        articleCalls[fid] = (articleCalls[fid] || 0) + 1;
        return Promise.resolve({ ok: true, json: () => Promise.resolve(articlesByFamily[fid] || []) } as any);
      }

      // fallback
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as any);
    }) as any;
  });



  afterEach(() => {
    // @ts-ignore
    global.fetch.mockRestore && global.fetch.mockRestore();
  });

  it('prefills family and quantities when a SA is selected', async () => {
    render(<EaNewPage />);

    // Wait for SA options to load
    await waitFor(() => expect(screen.queryByText('SA250005 • Fourn')).toBeInTheDocument());

    // Select SA
    const select = screen.getByLabelText(/SA à lier/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '5' } });

    // Expect fetch for /api/sa/for-ea/5 to be called (implicit) and fields updated
    await waitFor(() => expect((screen.getByLabelText(/Famille/i) as HTMLSelectElement).value).toBe('2'));

    // linked quantity input should be prefilled
    const linkedInput = screen.getByLabelText(/Quantité EA à lier/i) as HTMLInputElement;
    expect(linkedInput.value).toBe('85.5');
  });

  it('search filters articles and cache avoids reloading', async () => {
    render(<EaNewPage />);

    // select family 2
    const famSelect = await screen.findByLabelText(/Famille/i);
    fireEvent.change(famSelect, { target: { value: '2' } });

    // Wait for articles to be visible
    await waitFor(() => expect(screen.queryByText('REF-AAA • Produit A')).toBeInTheDocument());

    // Type search to filter
    const search = screen.getByPlaceholderText(/Rechercher par référence/i) as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'AAA' } });

    // Only REF-AAA should be present
    await waitFor(() => expect(screen.queryByText('REF-AAA • Produit A')).toBeInTheDocument());
    expect(screen.queryByText('REF-BBB • Produit B')).not.toBeInTheDocument();

    // switch to family 3 and back to 2 (should use cached articles for 2)
    fireEvent.change(famSelect, { target: { value: '3' } });
    await waitFor(() => expect(screen.queryByText('REF-CCC • Produit C')).toBeInTheDocument());

    // back to family 2
    fireEvent.change(famSelect, { target: { value: '2' } });
    // cached list should show REF-AAA and REF-BBB (independent of network)
    await waitFor(() => expect(screen.queryByText('REF-AAA • Produit A')).toBeInTheDocument());
    expect(screen.queryByText('REF-BBB • Produit B')).toBeInTheDocument();
  });
});
