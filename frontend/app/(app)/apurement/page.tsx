// app/(app)/apurement/page.tsx
'use client';

import React, { useEffect, useState } from 'react';

type EligibleSa = {
  id: string;
  sa_number: string;
  supplier_name: string | null;
  due_date: string;
  quantity_initial: number;
  quantity_apured: number;
  sa_remaining: number;       // SA restante
  remaining_quantity: number; // EA max imputable
  quantity_unit: string;
  scrap_percent?: number;
};

type EaItem = {
  id: string;
  ea_number: string;
  export_date: string;
  customer_name: string;
  total_quantity: string | number;
  quantity_unit: string;
};

export default function ApurementPage() {
  const [saList, setSaList] = useState<EligibleSa[]>([]);
  const [eaList, setEaList] = useState<EaItem[]>([]);

  const [selectedSaId, setSelectedSaId] = useState('');
  const [selectedEaId, setSelectedEaId] = useState('');
  const [quantityEa, setQuantityEa] = useState<number | ''>('');

  const [loadingSa, setLoadingSa] = useState(false);
  const [loadingEa, setLoadingEa] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadSa = async () => {
      try {
        setLoadingSa(true);
        const res = await fetch('/api/sa/eligible', { cache: 'no-store' });
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok) {
          console.error('Erreur /api/sa/eligible:', res.status, data);
          throw new Error(
            data?.message ||
            `Erreur chargement SA éligibles (HTTP ${res.status})`,
          );
        }

        setSaList(data || []);
      } catch (err: any) {
        console.error('loadSa error:', err);
        setErrorMsg(
          err?.message || 'Erreur lors du chargement des SA éligibles.',
        );
      } finally {
        setLoadingSa(false);
      }
    };

    loadSa();
  }, []);

  useEffect(() => {
    const loadEa = async () => {
      try {
        setLoadingEa(true);
        const res = await fetch('/api/ea?unique=true', { cache: 'no-store' });
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok) {
          console.error('Erreur /api/ea:', res.status, data);
          throw new Error(
            data?.message || `Erreur chargement EA (HTTP ${res.status})`,
          );
        }

        setEaList(
          (data || []).map((ea: any) => ({
            id: ea.id,
            ea_number: ea.ea_number,
            export_date: ea.export_date,
            customer_name: ea.customer_name,
            total_quantity:
              typeof ea.total_quantity === 'string'
                ? Number(ea.total_quantity)
                : ea.total_quantity,
            quantity_unit: ea.quantity_unit,
          })),
        );
      } catch (err: any) {
        console.error('loadEa error:', err);
        setErrorMsg(err?.message || 'Erreur lors du chargement des EA.');
      } finally {
        setLoadingEa(false);
      }
    };

    loadEa();
  }, []);

  const selectedSa = saList.find((sa) => sa.id === selectedSaId) || null;
  const selectedEa = eaList.find((ea) => ea.id === selectedEaId) || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedSaId) {
      setErrorMsg('Merci de choisir une SA.');
      return;
    }
    if (!selectedEaId) {
      setErrorMsg('Merci de choisir une EA.');
      return;
    }
    if (quantityEa === '' || quantityEa <= 0) {
      setErrorMsg('La quantité EA à imputer doit être un nombre positif.');
      return;
    }

    if (selectedSa && quantityEa > selectedSa.remaining_quantity) {
      setErrorMsg(
        `La quantité EA dépasse le maximum imputable sur cette SA (${selectedSa.remaining_quantity} T).`,
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/apurement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sa_id: selectedSaId,
          ea_id: selectedEaId,
          quantity: Number(quantityEa),
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        console.error('Erreur création apurement:', res.status, data);
        setErrorMsg(
          data?.message ||
          `Erreur lors de l'enregistrement de l'apurement (HTTP ${res.status}).`,
        );
        return;
      }

      setSuccessMsg("Apurement enregistré avec succès.");

      // refresh SA éligibles après apurement
      try {
        const saRes = await fetch('/api/sa/eligible', { cache: 'no-store' });
        const saData = await saRes.json();
        if (saRes.ok) setSaList(saData || []);
      } catch (err) {
        console.error('Erreur refresh SA après apurement:', err);
      }

      setQuantityEa('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Erreur réseau lors de l'enregistrement de l'apurement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold mb-2">Apurement SA / EA</h1>
      <p className="text-sm text-gray-600 mb-4">
        Associe une déclaration SA à une déclaration EA avec une quantité à
        imputer. Les coefficients (5&nbsp;%, 6&nbsp;%, 8&nbsp;%) sont appliqués
        côté serveur selon la famille de la SA.
      </p>

      {errorMsg && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SA */}
        <section className="space-y-4 rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-medium">SA</h2>
            {loadingSa && (
              <span className="text-xs text-gray-500">
                Chargement des SA éligibles…
              </span>
            )}
          </div>

          <label className="flex flex-col gap-1 text-sm">
            SA à imputer
            <select
              className="rounded-md border px-2 py-1 text-sm"
              value={selectedSaId}
              onChange={(e) => setSelectedSaId(e.target.value)}
            >
              <option value="">– Sélectionne une SA –</option>
              {saList.map((sa) => (
                <option key={sa.id} value={sa.id}>
                  {sa.sa_number} • {sa.supplier_name ?? '—'} • Restant SA :{' '}
                  {sa.sa_remaining} {sa.quantity_unit} • Max EA :{' '}
                  {sa.remaining_quantity} {sa.quantity_unit} • échéance{' '}
                  {sa.due_date}
                </option>
              ))}
            </select>
          </label>

          {selectedSa && (
            <div className="text-xs text-gray-600 mt-2 space-y-1">
              <div>
                Initiale :{' '}
                <strong>
                  {selectedSa.quantity_initial} {selectedSa.quantity_unit}
                </strong>
              </div>
              <div>
                Déjà apurée (consommée) :{' '}
                <strong>
                  {selectedSa.quantity_apured} {selectedSa.quantity_unit}
                </strong>
              </div>
              <div>
                Restante SA :{' '}
                <strong>
                  {selectedSa.sa_remaining} {selectedSa.quantity_unit}
                </strong>
              </div>
              <div>
                Max EA imputable :{' '}
                <strong>
                  {selectedSa.remaining_quantity} {selectedSa.quantity_unit}
                </strong>{' '}
                {selectedSa.scrap_percent !== undefined && (
                  <span>
                    (coef famille : 1 +
                    {selectedSa.scrap_percent}
                    %)
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* EA */}
        <section className="space-y-4 rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-medium">EA</h2>
            {loadingEa && (
              <span className="text-xs text-gray-500">
                Chargement des EA…
              </span>
            )}
          </div>

          <label className="flex flex-col gap-1 text-sm">
            EA à utiliser
            <select
              className="rounded-md border px-2 py-1 text-sm"
              value={selectedEaId}
              onChange={(e) => setSelectedEaId(e.target.value)}
            >
              <option value="">– Sélectionne une EA –</option>
              {eaList.map((ea) => (
                <option key={ea.id} value={ea.id}>
                  {ea.ea_number} • {ea.customer_name} •{' '}
                  {ea.total_quantity} {ea.quantity_unit} • export{' '}
                  {ea.export_date}
                </option>
              ))}
            </select>
          </label>

          {selectedEa && (
            <div className="text-xs text-gray-600 mt-2">
              Quantité EA totale :{' '}
              <strong>
                {selectedEa.total_quantity} {selectedEa.quantity_unit}
              </strong>
            </div>
          )}

          <label className="flex flex-col gap-1 text-sm mt-2">
            Quantité EA à imputer (TONNES)
            <input
              type="number"
              step="0.001"
              min={0}
              max={selectedSa ? selectedSa.remaining_quantity : undefined}
              className="rounded-md border px-2 py-1 text-sm"
              value={quantityEa}
              onChange={(e) =>
                setQuantityEa(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
            />
            <span className="text-[11px] text-gray-500">
              C&apos;est la quantité EA. La quantité réellement consommée sur
              la SA sera calculée côté serveur avec le coefficient famille
              (5&nbsp;% / 6&nbsp;% / 8&nbsp;%).
            </span>
          </label>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer apurement'}
          </button>
        </div>
      </form>
    </div>
  );
}
