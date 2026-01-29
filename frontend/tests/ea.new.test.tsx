import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EaNewPage from '../app/(app)/ea/new/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('EA new page (client validations)', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // mock fetch for customers, families, articles and eligible SA
    global.fetch = jest.fn((url: RequestInfo) => {
      const s = String(url);
      if (s.endsWith('/api/customers')) {
        return Promise.resolve({ ok: true, json: async () => [{ id: '1', name: 'Client A', is_active: true }] } as any);
      }
      if (s.endsWith('/api/sa/eligible')) {
        return Promise.resolve({ ok: true, json: async () => [
          {
            id: '10',
            sa_number: 'SA250001',
            supplier_name: 'Fourn A',
            due_date: '2026-01-01',
            quantity_initial: 100,
            quantity_apured: 0,
            sa_remaining: 100,
            remaining_quantity: 5,
            quantity_unit: 'TONNE',
            scrap_percent: 5,
          },
        ] } as any);
      }
      if (s.endsWith('/api/sa-families')) {
        return Promise.resolve({ ok: true, json: async () => [{ id: 'f1', label: 'Rond à béton', scrap_percent: 5 }] } as any);
      }
      if (s.includes('/api/articles')) {
        return Promise.resolve({ ok: true, json: async () => [{ id: 'a1', product_ref: 'PRD-1', label: 'Art 1' }] } as any);
      }
      // default
      return Promise.resolve({ ok: true, json: async () => [] } as any);
    });
  });

  it('shows required field error when submitting empty', async () => {
    render(<EaNewPage />);

    // wait for initial loads
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const submit = await screen.findByRole('button', { name: /Enregistrer EA/ });
    await userEvent.click(submit);

    const err = await screen.findByText(/Le numéro EA est obligatoire/);
    expect(err).toBeInTheDocument();
  });

  it('prevents linking EA when linked quantity exceeds remaining_quantity', async () => {
    render(<EaNewPage />);

    // wait for customers and SA to be loaded
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // fill minimal required fields
    const eaNumber = screen.getByPlaceholderText('EA250001');
    await userEvent.type(eaNumber, '250010');

    const dateInput = screen.getByLabelText("Date d'export");
    await userEvent.type(dateInput, '2026-02-01');

    // customer select should be populated and first active auto-selected; ensure it's present
    expect(await screen.findByText(/Client A/)).toBeInTheDocument();

    const totalQtyInput = screen.getByLabelText('Quantité totale (TONNES)');
    await userEvent.type(totalQtyInput, '12');

    // select family & article (required now)
    const famSelect = await screen.findByRole('combobox', { name: /Famille/i });
    await userEvent.selectOptions(famSelect, 'f1');
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/articles?family_id=f1', expect.any(Object)));
    const artSelect = await screen.findByLabelText(/Article/i, { selector: 'select' });
    await userEvent.selectOptions(artSelect, 'a1');

    // select the SA to link
    const saSelect = screen.getByLabelText('SA à lier');
    await userEvent.selectOptions(saSelect, '10');

    // linked quantity > remaining_quantity (5)
    const linkedQty = screen.getByRole('spinbutton', { name: /Quantité EA/i });
    // override auto-filled value to a value exceeding remaining_quantity
    await userEvent.clear(linkedQty);
    await userEvent.type(linkedQty, '10');

    const submit = screen.getByRole('button', { name: /Enregistrer EA/ });
    await userEvent.click(submit);

    const err = await screen.findByText(/dépasse le maximum imputable sur cette SA \(5 T\)/i);
    expect(err).toBeInTheDocument();
  });
});
