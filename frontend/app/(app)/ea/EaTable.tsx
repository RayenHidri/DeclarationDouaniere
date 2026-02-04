'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  product_desc?: string | null;
  total_quantity: number;
  quantity_unit: string;
  scrap_percent?: number | string | null;
  scrap_quantity?: number | string | null;
  allocation_id?: string | null;
  sa_number?: string | null;
  sa_supplier?: string | null;
  allocated_quantity?: number | null;
  allocated_scrap_quantity?: number | null;
  sa_family_name?: string | null;
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

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select-native';
import { getUserRole } from '../useUserRole';

export function EaTable({ items }: { items: EaItem[] }) {
  const role = getUserRole(); // Use this for future edit/delete restrictions
  const router = useRouter();

  // search / filters / sort / pagination / selection
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'ea_number' | 'export_date' | 'total_quantity' | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => setPage(1), [query, statusFilter, pageSize]);

  const statuses = useMemo(() => {
    const s = new Set<string>();
    items.forEach((it) => s.add(it.status));
    return Array.from(s);
  }, [items]);

  function handleRowClick(id: string) {
    router.push(`/ea/${id}`);
  }

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(col);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    let list = items.slice();
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((it) => {
        return (
          it.ea_number.toLowerCase().includes(q) ||
          (it.customer_name ?? '').toLowerCase().includes(q) ||
          (it.product_ref ?? '').toLowerCase().includes(q)
        );
      });
    }
    if (statusFilter) list = list.filter((it) => it.status === statusFilter);
    if (sortBy) {
      list.sort((a, b) => {
        let av: any = a[sortBy as keyof EaItem];
        let bv: any = b[sortBy as keyof EaItem];
        if (sortBy === 'total_quantity') {
          av = Number(av ?? 0);
          bv = Number(bv ?? 0);
        }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [items, query, statusFilter, sortBy, sortDir]);

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

  async function exportSelected() {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return;

    try {
      const q = ids.map((i) => `ids=${encodeURIComponent(i)}`).join('&');
      const res = await fetch(`/api/ea/export?${q}`);
      if (!res.ok) return;
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ea_selected_export_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export selected EA failed', err);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Aucune déclaration EA pour le moment.
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Recherche par numéro, client ou référence"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full md:w-[350px]"
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[180px]"
            >
              <option value="">Tous statuts</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{getStatusLabel(s as EaStatus)}</option>
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
                variant={Object.values(selected).filter(Boolean).length > 0 ? "default" : "outline"}
                size="sm"
                onClick={exportSelected}
                disabled={items.length === 0}
              >
                Exporter
              </Button>
            </div>
          </div>
        </Card>

        <div className="overflow-hidden rounded-md border bg-card">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-2 py-2 text-left font-medium text-slate-600"><input aria-label="Sélectionner tout" type="checkbox" onChange={(e) => selectAllVisible(e.target.checked)} /></th>
                <th className="w-28 px-3 py-2 text-left font-medium text-slate-600 cursor-pointer" onClick={() => toggleSort('ea_number')}>N° EA {sortBy === 'ea_number' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                <th className="w-32 px-3 py-2 text-left font-medium text-slate-600">Client</th>
                <th className="w-24 px-3 py-2 text-left font-medium text-slate-600">Pays</th>
                <th className="w-28 px-3 py-2 text-left font-medium text-slate-600">N° SA</th>
                <th className="w-32 px-3 py-2 text-left font-medium text-slate-600">Famille</th>
                <th className="w-32 px-3 py-2 text-left font-medium text-slate-600">Référence</th>
                <th className="w-48 px-3 py-2 text-left font-medium text-slate-600">Désignation</th>
                <th className="w-28 px-3 py-2 text-left font-medium text-slate-600 cursor-pointer" onClick={() => toggleSort('export_date')}>Date export {sortBy === 'export_date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                <th className="w-28 px-3 py-2 text-right font-medium text-slate-600 cursor-pointer" onClick={() => toggleSort('total_quantity')}>Quantité {sortBy === 'total_quantity' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                <th className="w-20 px-3 py-2 text-left font-medium text-slate-600">Unité</th>
                <th className="w-24 px-3 py-2 text-left font-medium text-slate-600">Déchet</th>
                <th className="w-24 px-3 py-2 text-left font-medium text-slate-600">Statut</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paged.map((ea, idx) => {
                // Vérifier si la ligne précédente a le même EA number (pour groupement visuel)
                const prevEa = idx > 0 ? paged[idx - 1] : null;
                const isSameEaGroup = prevEa && prevEa.ea_number === ea.ea_number;

                return (
                  <tr
                    key={ea.allocation_id ? `${ea.id}-alloc-${ea.allocation_id}` : `ea-only-${ea.id}-${idx}`}
                    className={`hover:bg-slate-50 ${isSameEaGroup ? 'border-t-0' : ''}`}
                    style={isSameEaGroup ? { borderTop: '1px dashed #e2e8f0' } : {}}
                  >
                    {/*
                  To restrict edit/delete actions:
                  Only show edit/delete for role === 'export' or 'admin'.
                  Example:
                  { (role === 'export' || role === 'admin') && <EditDeleteButtons /> }
                */}
                    <td className="px-2 py-2 text-slate-700"><input type="checkbox" aria-label={`select-${ea.ea_number}-${idx}`} checked={!!selected[ea.id]} onChange={() => toggleSelect(ea.id)} /></td>
                    <td className="px-3 py-2 font-medium text-slate-900 cursor-pointer" onClick={() => handleRowClick(ea.id)}>
                      {isSameEaGroup ? (
                        <span className="text-slate-400 text-xs">↳</span>
                      ) : (
                        ea.ea_number
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-700 text-sm">{isSameEaGroup ? '' : ea.customer_name}</td>
                    <td className="px-3 py-2 text-slate-700 text-sm">{isSameEaGroup ? '' : (ea.destination_country ?? '-')}</td>
                    <td className="px-3 py-2 text-slate-700 text-sm font-medium">{ea.sa_number ?? '-'}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{ea.sa_family_name ?? '-'}</td>
                    <td className="px-3 py-2 text-slate-700 text-sm">{isSameEaGroup ? '' : (ea.product_ref ?? '-')}</td>
                    <td className="px-3 py-2 text-slate-700 text-sm">{isSameEaGroup ? '' : (ea.product_desc ?? '-')}</td>
                    <td className="px-3 py-2 text-slate-700 text-sm">{isSameEaGroup ? '' : ea.export_date}</td>
                    <td className="px-3 py-2 text-slate-700 text-sm text-right font-medium">
                      {ea.allocated_quantity != null
                        ? ea.allocated_quantity.toLocaleString('fr-FR')
                        : ea.total_quantity.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-3 py-2 text-slate-700 text-sm">{ea.quantity_unit}</td>
                    <td className="px-3 py-2 text-slate-700 text-sm">
                      {ea.allocated_scrap_quantity != null ? (
                        <div className="flex flex-col">
                          <span className="text-emerald-600 font-medium">
                            {Number(ea.allocated_scrap_quantity).toLocaleString('fr-FR', { maximumFractionDigits: 3 })} {ea.quantity_unit}
                          </span>
                          {!isSameEaGroup && ea.scrap_percent != null && Number(ea.scrap_percent) > 0 && (
                            <span className="text-[10px] text-slate-400">({ea.scrap_percent}%)</span>
                          )}
                        </div>
                      ) : (
                        isSameEaGroup ? '' : (
                          ea.scrap_quantity != null && Number(ea.scrap_quantity) > 0 ? (
                            <div className="flex flex-col">
                              <span>{Number(ea.scrap_quantity).toLocaleString('fr-FR', { maximumFractionDigits: 3 })} {ea.quantity_unit}</span>
                              {ea.scrap_percent != null && Number(ea.scrap_percent) > 0 && (
                                <span className="text-[10px] text-slate-400">({ea.scrap_percent}%)</span>
                              )}
                            </div>
                          ) : <span className="text-slate-400 text-xs">-</span>
                        )
                      )}
                    </td>
                    <td className="px-3 py-2"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(ea.status)}`}>{isSameEaGroup ? '' : getStatusLabel(ea.status)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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
