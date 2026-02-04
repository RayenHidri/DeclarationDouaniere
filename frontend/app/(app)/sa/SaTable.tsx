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

import React, { useEffect, useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select-native';
import { getUserRole } from '../useUserRole';

export function SaTable({ items }: { items: SaItem[] }) {
  const role = getUserRole(); // Use this for future edit/delete restrictions
  const router = useRouter();

  // Controls state
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [familyFilter, setFamilyFilter] = useState<string>('');

  // Sorting
  const [sortBy, setSortBy] = useState<'sa_number' | 'due_date' | 'quantity_initial' | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, familyFilter, pageSize]);

  const families = useMemo(() => {
    const s = new Set<string>();
    items.forEach((it) => {
      if (it.family_label) s.add(it.family_label);
    });
    return Array.from(s);
  }, [items]);

  const statuses = useMemo(() => {
    const s = new Set<string>();
    items.forEach((it) => s.add(it.status));
    return Array.from(s);
  }, [items]);

  function handleRowClick(id: string) {
    router.push(`/sa/${id}`);
  }

  function toggleSort(column: typeof sortBy) {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    let list = items.slice();

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((it) => {
        return (
          it.sa_number.toLowerCase().includes(q) ||
          (it.supplier_name ?? '').toLowerCase().includes(q) ||
          (it.family_label ?? '').toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter) {
      list = list.filter((it) => it.status === statusFilter);
    }

    if (familyFilter) {
      list = list.filter((it) => it.family_label === familyFilter);
    }

    if (sortBy) {
      list.sort((a, b) => {
        let av: any = a[sortBy];
        let bv: any = b[sortBy];

        if (sortBy === 'quantity_initial') {
          av = Number(av ?? 0);
          bv = Number(bv ?? 0);
        }

        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [items, query, statusFilter, familyFilter, sortBy, sortDir]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function toggleSelect(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function selectAllVisible(val: boolean) {
    const visibleIds = paged.map((p) => p.id);
    setSelected((s) => {
      const copy = { ...s };
      visibleIds.forEach((id) => (copy[id] = val));
      return copy;
    });
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  async function exportSelected() {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return;

    try {
      const q = ids.map((i) => `ids=${encodeURIComponent(i)}`).join('&');
      const res = await fetch(`/api/sa/export?${q}`);
      if (!res.ok) return;
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sa_selected_export_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export selected SA failed', err);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Aucune déclaration SA pour le moment.
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Recherche par numéro, fournisseur..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full md:w-[300px]"
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[180px]"
            >
              <option value="">Tous statuts</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {getStatusLabel(s as SaStatus)}
                </option>
              ))}
            </Select>

            <Select
              value={familyFilter}
              onChange={(e) => setFamilyFilter(e.target.value)}
              className="w-[180px]"
            >
              <option value="">Toutes familles</option>
              {families.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>

            <div className="flex-1" />

            <Select
              value={String(pageSize)}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-[70px]"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectAllVisible(true)}
              >
                Tout cocher
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectAllVisible(false)}
              >
                Décocher
              </Button>
              <Button
                variant={selectedCount > 0 ? "default" : "outline"}
                size="sm"
                onClick={exportSelected}
                disabled={selectedCount === 0}
              >
                Export ({selectedCount})
              </Button>
            </div>
          </div>
        </Card>

        <div className="overflow-hidden rounded-md border bg-card">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600">
                  <input
                    type="checkbox"
                    aria-label="Sélectionner tout"
                    onChange={(e) => selectAllVisible(e.target.checked)}
                  />
                </th>

                <th
                  className="px-4 py-2 text-left font-medium text-slate-600 cursor-pointer"
                  onClick={() => toggleSort('sa_number')}
                >
                  N° SA {sortBy === 'sa_number' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>

                <th className="px-4 py-2 text-left font-medium text-slate-600">
                  Fournisseur
                </th>

                <th className="px-4 py-2 text-left font-medium text-slate-600">
                  Déclaration
                </th>

                <th
                  className="px-4 py-2 text-left font-medium text-slate-600 cursor-pointer"
                  onClick={() => toggleSort('due_date')}
                >
                  Échéance {sortBy === 'due_date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>

                <th
                  className="px-4 py-2 text-left font-medium text-slate-600 cursor-pointer"
                  onClick={() => toggleSort('quantity_initial')}
                >
                  Quantité {sortBy === 'quantity_initial' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>

                <th className="px-4 py-2 text-left font-medium text-slate-600">Apurée</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Famille</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Montant DS</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Statut</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paged.map((sa) => {
                /*
                  To restrict edit/delete actions:
                  Only show edit/delete for role === 'achat' or 'admin'.
                  Example:
                  { (role === 'achat' || role === 'admin') && <EditDeleteButtons /> }
                */
                const pct =
                  sa.quantity_initial > 0
                    ? Math.round((sa.quantity_apured / sa.quantity_initial) * 100)
                    : 0;

                const scrapQty = sa.scrap_quantity_ton != null ? sa.scrap_quantity_ton : null;
                const amountDs = sa.amount_ds != null ? sa.amount_ds : null;

                return (
                  <tr key={sa.id} className="hover:bg-slate-50">
                    {/* Sélection */}
                    <td className="px-4 py-2 text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!selected[sa.id]}
                        onChange={() => toggleSelect(sa.id)}
                        aria-label={`select-${sa.sa_number}`}
                      />
                    </td>
                    {/* N° SA */}
                    <td
                      className="px-4 py-2 font-medium text-slate-900 cursor-pointer"
                      onClick={() => handleRowClick(sa.id)}
                    >
                      {sa.sa_number}
                    </td>
                    {/* Fournisseur */}
                    <td className="px-4 py-2 text-slate-700">{sa.supplier_name}</td>
                    {/* Déclaration */}
                    <td className="px-4 py-2 text-slate-700">{sa.declaration_date}</td>
                    {/* Échéance */}
                    <td className="px-4 py-2 text-slate-700">{sa.due_date}</td>
                    {/* Quantité */}
                    <td className="px-4 py-2 text-slate-700">
                      {sa.quantity_initial.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} {sa.quantity_unit}
                    </td>
                    {/* Apurée */}
                    <td className="px-4 py-2 text-slate-700">
                      <div className="flex items-center gap-2">
                        <span>
                          {sa.quantity_apured.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} {sa.quantity_unit}
                        </span>
                        <span className="text-xs text-slate-500">({pct}%)</span>
                      </div>
                    </td>
                    {/* Famille */}
                    <td className="px-4 py-2 text-slate-700">{sa.family_label ?? <span className="text-slate-400 text-xs">-</span>}</td>
                    {/* Montant DS */}
                    <td className="px-4 py-2 text-slate-700">
                      {amountDs != null ? (amountDs.toLocaleString('fr-FR', { maximumFractionDigits: 3 }) + ' DS') : <span className="text-slate-400 text-xs">-</span>}
                    </td>
                    {/* Statut */}
                    <td className="px-4 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(sa.status)}`}>
                        {getStatusLabel(sa.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{filtered.length} résultats</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <span className="text-sm font-medium min-w-[20px] text-center">{page}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= filtered.length}
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
