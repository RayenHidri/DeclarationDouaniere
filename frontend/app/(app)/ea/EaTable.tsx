'use client';

import { useRouter } from 'next/navigation';

export type EaStatus = 'SUBMITTED' | 'CANCELLED' | string;

export type EaItem = {
  id: string;
  ea_number: string;
  regime_code: string;
  export_date: string;
  status: EaStatus;
  customer_name: string;
  destination_country: string | null;
  product_ref: string | null;
  total_quantity: number;
  quantity_unit: string;
  // optional scrap percent (from family) for dechet calculation
  scrap_percent?: number | null;
};

function getStatusLabel(status: EaStatus) {
  switch (status) {
    case 'SUBMITTED':
      return 'Soumise';
    case 'CANCELLED':
      return 'Annulée';
    default:
      return status;
  }
}

function getStatusClass(status: EaStatus) {
  switch (status) {
    case 'SUBMITTED':
      return 'bg-emerald-100 text-emerald-800';
    case 'CANCELLED':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

export function EaTable({ items }: { items: EaItem[] }) {
  const router = useRouter();

  function handleRowClick(id: string) {
    router.push(`/ea/${id}`);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Aucune déclaration EA pour le moment.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              N° EA
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Client
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Pays
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Date export
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Produit
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Quantité
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Déchet (est.)
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Statut
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((ea) => (
            <tr
              key={ea.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => handleRowClick(ea.id)}
            >
              <td className="px-4 py-2 font-medium text-slate-900">
                {ea.ea_number}
              </td>
              <td className="px-4 py-2 text-slate-700">
                {ea.customer_name}
              </td>
              <td className="px-4 py-2 text-slate-700">
                {ea.destination_country ?? '-'}
              </td>
              <td className="px-4 py-2 text-slate-700">
                {ea.export_date}
              </td>
              <td className="px-4 py-2 text-slate-700">
                {ea.product_ref ?? '-'}
              </td>
              <td className="px-4 py-2 text-slate-700">
                {ea.total_quantity.toLocaleString('fr-FR')}{' '}
                {ea.quantity_unit}
              </td>
              <td className="px-4 py-2 text-slate-700">
                {ea.scrap_percent != null && ea.scrap_percent > 0 ? (
                  <span>
                    {Number(
                      (
                        ea.total_quantity * (ea.scrap_percent / 100) /
                        (1 - ea.scrap_percent / 100)
                      ).toFixed(3),
                    ).toLocaleString('fr-FR', { maximumFractionDigits: 3 })}{' '}
                    {ea.quantity_unit}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">-</span>
                )}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(
                    ea.status,
                  )}`}
                >
                  {getStatusLabel(ea.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
