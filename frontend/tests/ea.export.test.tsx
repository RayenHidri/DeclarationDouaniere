import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EaTable } from '../app/(app)/ea/EaTable';

// mock next/navigation
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

beforeEach(() => {
  jest.resetAllMocks();
});

import EaControls from '../app/(app)/ea/EaControls';

test('clicking Exporter Excel calls /api/ea/export and triggers download', async () => {
  const mockArrayBuffer = new ArrayBuffer(8);
  global.fetch = jest.fn((url: RequestInfo) => {
    const s = String(url);
    if (s.endsWith('/api/ea/export')) {
      return Promise.resolve({ ok: true, arrayBuffer: async () => mockArrayBuffer } as any);
    }
    return Promise.resolve({ ok: true, json: async () => [] } as any);
  });

  const originalCreateElement = document.createElement;
  const realAnchor = originalCreateElement.call(document, 'a') as HTMLAnchorElement;
  const clickSpy = jest.fn();
  const removeSpy = jest.fn();
  (realAnchor as any).click = clickSpy;
  (realAnchor as any).remove = removeSpy;

  const createSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') return realAnchor;
    return originalCreateElement.call(document, tag as any);
  });

  const originalCreateObjectURL = (URL as any).createObjectURL;
  const originalRevoke = (URL as any).revokeObjectURL;
  (URL as any).createObjectURL = jest.fn().mockReturnValue('blob:fake');
  (URL as any).revokeObjectURL = jest.fn();

  render(<EaControls />);
  const btn = screen.getByRole('button', { name: /Exporter Excel/i });
  await userEvent.click(btn);

  expect(global.fetch).toHaveBeenCalledWith('/api/ea/export');
  expect((URL as any).createObjectURL).toHaveBeenCalled();
  expect(clickSpy).toHaveBeenCalled();

  createSpy.mockRestore();
  (URL as any).createObjectURL = originalCreateObjectURL;
  (URL as any).revokeObjectURL = originalRevoke;
});

test('clicking Exporter Excel handles non-ok response gracefully', async () => {
  global.fetch = jest.fn((url: RequestInfo) => {
    const s = String(url);
    if (s.endsWith('/api/ea/export')) {
      return Promise.resolve({ ok: false } as any);
    }
    return Promise.resolve({ ok: true, json: async () => [] } as any);
  });

  const originalCreateObjectURL = (URL as any).createObjectURL;
  (URL as any).createObjectURL = jest.fn();

  render(<EaControls />);
  const btn = screen.getByRole('button', { name: /Exporter Excel/i });

  // If fetch is not ok we should not create anchor and not throw
  await userEvent.click(btn);

  expect(global.fetch).toHaveBeenCalledWith('/api/ea/export');
  // createObjectURL should not be called when response is not ok
  expect((URL as any).createObjectURL).not.toHaveBeenCalled();

  (URL as any).createObjectURL = originalCreateObjectURL;
});

test('EaTable shows computed dechet from scrap_percent', () => {
  const items = [
    {
      id: '1',
      ea_number: 'EA250001',
      customer_name: 'C1',
      destination_country: 'FR',
      export_date: '2026-01-01',
      product_ref: 'PRD-1',
      total_quantity: 10,
      quantity_unit: 'TONNE',
      status: 'SUBMITTED',
      scrap_percent: 5,
    },
  ];

  render(<EaTable items={items as any} />);

  // Expect dechet cell to contain 10 * 0.05 / 0.95 = 0.526 -> displayed as 0,526
  expect(screen.getByText(/0,526/)).toBeInTheDocument();
});