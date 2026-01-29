import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EaNewPage from '../app/(app)/ea/new/page';

// mock next/navigation
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

beforeEach(() => {
  jest.resetAllMocks();
});

test('family selection loads articles and computes dechet preview', async () => {
  // mock families and articles endpoints
  global.fetch = jest.fn((url: RequestInfo) => {
    const s = String(url);
    if (s.endsWith('/api/sa-families')) {
      return Promise.resolve({ ok: true, json: async () => [{ id: 'f1', label: 'Rond à béton', scrap_percent: 5 }] } as any);
    }
    if (s.includes('/api/articles')) {
      return Promise.resolve({ ok: true, json: async () => [{ id: 'a1', product_ref: 'PRD-1', label: 'Art 1' }] } as any);
    }
    // customers + sa/eligible
    if (s.endsWith('/api/customers')) {
      return Promise.resolve({ ok: true, json: async () => [{ id: '1', name: 'Client A', is_active: true }] } as any);
    }
    if (s.endsWith('/api/sa/eligible')) {
      return Promise.resolve({ ok: true, json: async () => [] } as any);
    }
    return Promise.resolve({ ok: true, json: async () => [] } as any);
  });

  render(<EaNewPage />);

  // wait for families to be loaded
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/sa-families', expect.any(Object)));

  // select family (use role to avoid ambiguous label text elsewhere)
  const famSelect = await screen.findByRole('combobox', { name: /Famille/i });
  await userEvent.selectOptions(famSelect, 'f1');

  // ensure articles were loaded and can be selected
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/articles?family_id=f1', expect.any(Object)));
  const artSelect = await screen.findByLabelText(/Article/i, { selector: 'select' });
  await userEvent.selectOptions(artSelect, 'a1');

  // fill total quantity and check dechet calculation
  const totalQty = screen.getByLabelText(/Quantité totale/i);
  await userEvent.clear(totalQty);
  await userEvent.type(totalQty, '10');

  // dechet formula: EA_net * (t / (1 - t)) with t=0.05 -> 10 * 0.05/0.95 = 0.526315... rounded to 3 decimals -> 0.526
  const dechetNode = await screen.findByText(/Estimation déchet/i);
  expect(dechetNode).toHaveTextContent('0,526');
});