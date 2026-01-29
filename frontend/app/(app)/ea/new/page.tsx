// app/(app)/ea/new/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type EligibleSa = {
  id: string;
  sa_number: string;
  supplier_name: string | null;
  due_date: string;
  quantity_initial: number;
  quantity_apured: number;
  sa_remaining: number;       // quantité SA restante
  remaining_quantity: number; // quantité EA max imputable
  quantity_unit: string;
  scrap_percent?: number;
};

type CustomerOption = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

export default function EaNewPage() {
  const router = useRouter();

  // Champs EA
  const [eaNumber, setEaNumber] = useState('');
  const [exportDate, setExportDate] = useState('');
  const [customerId, setCustomerId] = useState('');      // <-- ID du client
  const [customerName, setCustomerName] = useState('');  // nom du client sélectionné
  const [destinationCountry, setDestinationCountry] = useState('');
  const [productRef, setProductRef] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [totalQuantity, setTotalQuantity] = useState<number | ''>('');
  const [quantityUnit, setQuantityUnit] = useState('TONNE');

  // Référentiel clients
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // SA éligibles pour apurement auto
  const [eligibleSa, setEligibleSa] = useState<EligibleSa[]>([]);
  const [linkedSaId, setLinkedSaId] = useState('');
  const [linkedQuantity, setLinkedQuantity] = useState<number | ''>('');

  const [loadingSa, setLoadingSa] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Charger les clients
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const res = await fetch('/api/customers', { cache: 'no-store' });
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok) {
          console.error('Erreur /api/customers:', res.status, data);
          throw new Error(
            data?.message ||
              `Erreur chargement des clients (HTTP ${res.status})`,
          );
        }

        const list = Array.isArray(data) ? data : [];
        setCustomers(list);

        // Si tu veux pré-sélectionner le premier client actif
        const firstActive = list.find((c) => c.is_active);
        if (firstActive) {
          setCustomerId(String(firstActive.id));
          setCustomerName(firstActive.name);
        }
      } catch (err: any) {
        console.error('loadCustomers error:', err);
        setErrorMsg(
          err?.message || 'Erreur lors du chargement de la liste des clients.',
        );
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, []);

  // Charger les SA éligibles
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

        setEligibleSa(data || []);
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

  // Quand on choisit une SA et qu'on a saisi une quantité totale EA,
  // on pré-remplit la quantité liée avec la quantité totale
  useEffect(() => {
    if (linkedSaId && typeof totalQuantity === 'number') {
      setLinkedQuantity(totalQuantity);
    }
  }, [linkedSaId, totalQuantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!eaNumber.trim()) {
      setErrorMsg('Le numéro EA est obligatoire.');
      return;
    }
    if (!exportDate) {
      setErrorMsg("La date d'export est obligatoire.");
      return;
    }
    if (!customerId) {
      setErrorMsg('Le client est obligatoire.');
      return;
    }
    if (totalQuantity === '' || totalQuantity <= 0) {
      setErrorMsg('La quantité totale doit être un nombre positif.');
      return;
    }

    // Si SA liée, on vérifie que la quantité EA ne dépasse pas le max imputable
    if (linkedSaId) {
      const sa = eligibleSa.find((s) => s.id === linkedSaId);
      if (!sa) {
        setErrorMsg('SA sélectionnée introuvable.');
        return;
      }
      if (linkedQuantity === '' || linkedQuantity <= 0) {
        setErrorMsg(
          'La quantité à lier à la SA doit être un nombre positif.',
        );
        return;
      }
      if (linkedQuantity > sa.remaining_quantity) {
        setErrorMsg(
          `La quantité EA dépasse le maximum imputable sur cette SA (${sa.remaining_quantity} T).`,
        );
        return;
      }
    }

    // Payload aligné avec le nouveau DTO :
    // - customer_id (obligatoire)
    // - customer_name en plus (pratique / fallback)
    const payload: any = {
      ea_number: eaNumber.trim(),
      export_date: exportDate,
      customer_id: customerId,
      customer_name: customerName || null,
      destination_country: destinationCountry || null,
      product_ref: productRef || null,
      product_desc: productDesc || null,
      total_quantity: Number(totalQuantity),
      quantity_unit: quantityUnit,
    };

    // Lien SA optionnel : apurement auto
    if (linkedSaId) {
      payload.linked_sa_id = linkedSaId;
      payload.linked_quantity = Number(linkedQuantity);
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/ea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error('EA creation error:', data);
        setErrorMsg(
          data?.message ||
            "Erreur lors de la création de l'EA (vérifier quantité / SA / client).",
        );
        return;
      }

      setSuccessMsg('EA créée avec succès.');
      setTimeout(() => {
        router.push('/ea');
      }, 800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Erreur réseau lors de la création de l'EA.");
    } finally {
      setSubmitting(false);
    }
  };

  // Quand on change de client dans la liste déroulante, on met à jour id + nom
  const handleChangeCustomer = (value: string) => {
    setCustomerId(value);
    const c = customers.find((cus) => String(cus.id) === value);
    setCustomerName(c?.name ?? '');
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="mb-4 text-2xl font-semibold">Nouvelle EA</h1>

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
        {/* Bloc infos EA */}
        <section className="space-y-4 rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-medium">Informations EA</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Numéro EA
              <input
                className="rounded-md border px-2 py-1 text-sm"
                value={eaNumber}
                onChange={(e) => setEaNumber(e.target.value)}
                placeholder="EA250001"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Date d&apos;export
              <input
                type="date"
                className="rounded-md border px-2 py-1 text-sm"
                value={exportDate}
                onChange={(e) => setExportDate(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Client
              <select
                className="rounded-md border px-2 py-1 text-sm"
                value={customerId}
                onChange={(e) => handleChangeCustomer(e.target.value)}
              >
                <option value="">
                  {loadingCustomers
                    ? 'Chargement…'
                    : '-- Sélectionner un client --'}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.code ? `${c.code} • ${c.name}` : c.name}
                    {!c.is_active ? ' (inactif)' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Pays de destination
              <input
                className="rounded-md border px-2 py-1 text-sm"
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
                placeholder="France, Italie..."
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Référence produit
              <input
                className="rounded-md border px-2 py-1 text-sm"
                value={productRef}
                onChange={(e) => setProductRef(e.target.value)}
                placeholder="PRD-001"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Quantité totale (TONNES)
              <input
                type="number"
                step="0.001"
                min={0}
                className="rounded-md border px-2 py-1 text-sm"
                value={totalQuantity}
                onChange={(e) =>
                  setTotalQuantity(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Unité
              <select
                className="rounded-md border px-2 py-1 text-sm"
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
              >
                <option value="TONNE">TONNE</option>
                <option value="KG">KG</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Description
            <textarea
              className="rounded-md border px-2 py-1 text-sm"
              rows={3}
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
            />
          </label>
        </section>

        {/* Bloc Lien SA (optionnel) */}
        <section className="space-y-4 rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-medium">Lien SA (optionnel)</h2>
            {loadingSa && (
              <span className="text-xs text-gray-500">
                Chargement des SA éligibles…
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Si tu choisis une SA et une quantité, le système créera
            automatiquement l&apos;apurement (avec le coefficient famille :
            5&nbsp;% / 6&nbsp;% / 8&nbsp;%).
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              SA à lier
              <select
                className="rounded-md border px-2 py-1 text-sm"
                value={linkedSaId}
                onChange={(e) => setLinkedSaId(e.target.value)}
              >
                <option value="">– Aucune (EA simple) –</option>
                {eligibleSa.map((sa) => (
                  <option key={sa.id} value={sa.id}>
                    {sa.sa_number} • {sa.supplier_name ?? '—'} • Restant SA:{' '}
                    {sa.sa_remaining} {sa.quantity_unit} • Max EA:{' '}
                    {sa.remaining_quantity} {sa.quantity_unit}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Quantité EA à lier (TONNES)
              <input
                type="number"
                step="0.001"
                min={0}
                className="rounded-md border px-2 py-1 text-sm"
                value={linkedQuantity}
                onChange={(e) =>
                  setLinkedQuantity(
                    e.target.value === ''
                      ? ''
                      : Number(e.target.value),
                  )
                }
                disabled={!linkedSaId}
              />
              {linkedSaId && (
                <span className="text-[11px] text-gray-500">
                  Max EA imputable sur cette SA :{' '}
                  {
                    eligibleSa.find((s) => s.id === linkedSaId)
                      ?.remaining_quantity
                  }{' '}
                  T.
                </span>
              )}
            </label>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-sm"
            onClick={() => router.push('/ea')}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer EA'}
          </button>
        </div>
      </form>
    </div>
  );
}
