'use client';

import { useRouter } from 'next/navigation';

export type SaStatus =
  | 'OPEN'
  | 'PARTIALLY_APURED'
  | 'FULLY_APURED'
  | 'EXPIRED'
  | string;

export type SaItem = {
  id: string;
  sa_number: string;
  regime_code: string;
  declaration_date: string; // yyyy-mm-dd
  due_date: string;
  status: SaStatus;
  quantity_initial: number;
  quantity_unit: string;
  quantity_apured: number;
  supplier_name: string;

  // 🆕 champs issus du nouveau SA.mapSa
  family_label?: string | null;
  scrap_percent?: number | null;
  scrap_quantity_ton?: number | null;
  amount_ds?: number | null;
  currency_code?: string | null;
};

function getStatusLabel(status: SaStatus) {
  switch (status) {
    case 'OPEN':
      return 'Ouverte';
    case 'PARTIALLY_APURED':
      return 'Partiellement apurée';
    case 'FULLY_APURED':
      return 'Totalement apurée';
    case 'EXPIRED':
      return 'Échue';
    default:
      return status;
  }
}

function getStatusClass(status: SaStatus) {
  switch (status) {
    case 'OPEN':
      return 'bg-slate-100 text-slate-800';
    case 'PARTIALLY_APURED':
      return 'bg-amber-100 text-amber-800';
    case 'FULLY_APURED':
      return 'bg-emerald-100 text-emerald-800';
    case 'EXPIRED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

export function SaTable({ items }: { items: SaItem[] }) {
  const router = useRouter();

  function handleRowClick(id: string) {
    router.push(`/sa/${id}`);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Aucune déclaration SA pour le moment.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              N° SA
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Fournisseur
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Déclaration
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Échéance
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Quantité
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Apurée
            </th>
            {/* 🆕 Famille / Droit de déchet */}
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Famille / Déchet
            </th>
            {/* 🆕 Montant DS */}
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Montant DS
            </th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">
              Statut
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((sa) => {
            const pct =
              sa.quantity_initial > 0
                ? Math.round(
                    (sa.quantity_apured / sa.quantity_initial) * 100,
                  )
                : 0;

            const scrapQty =
              sa.scrap_quantity_ton != null
                ? sa.scrap_quantity_ton
                : null;

            const amountDs =
              sa.amount_ds != null ? sa.amount_ds : null;

            return (
              <tr
                key={sa.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleRowClick(sa.id)}
              >
                <td className="px-4 py-2 font-medium text-slate-900">
                  {sa.sa_number}
                </td>
                <td className="px-4 py-2 text-slate-700">
                  {sa.supplier_name}
                </td>
                <td className="px-4 py-2 text-slate-700">
                  {sa.declaration_date}
                </td>
                <td className="px-4 py-2 text-slate-700">
                  {sa.due_date}
                </td>
                <td className="px-4 py-2 text-slate-700">
                  {sa.quantity_initial.toLocaleString('fr-FR', {
                    maximumFractionDigits: 3,
                  })}{' '}
                  {sa.quantity_unit}
                </td>
                <td className="px-4 py-2 text-slate-700">
                  <div className="flex items-center gap-2">
                    <span>
                      {sa.quantity_apured.toLocaleString('fr-FR', {
                        maximumFractionDigits: 3,
                      })}{' '}
                      {sa.quantity_unit}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({pct}%)
                    </span>
                  </div>
                </td>

                {/* Famille / déchet */}
                <td className="px-4 py-2 text-slate-700">
                  {sa.family_label ? (
                    <div className="flex flex-col">
                      <span>{sa.family_label}</span>
                      <span className="text-xs text-slate-500">
                        Déchet :{' '}
                        {scrapQty != null
                          ? scrapQty.toLocaleString('fr-FR', {
                              maximumFractionDigits: 3,
                            })
                          : '-'}{' '}
                        {sa.quantity_unit}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">
                      Non renseigné
                    </span>
                  )}
                </td>

                {/* Montant DS */}
                <td className="px-4 py-2 text-slate-700">
                  {amountDs != null ? (
                    <span>
                      {amountDs.toLocaleString('fr-FR', {
                        maximumFractionDigits: 3,
                      })}{' '}
                      {/* DS est en devise société (TND en pratique) */}
                      DS
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">-</span>
                  )}
                </td>

                <td className="px-4 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(
                      sa.status,
                    )}`}
                  >
                    {getStatusLabel(sa.status)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
