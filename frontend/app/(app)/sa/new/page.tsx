// app/(app)/sa/new/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Supplier = {
  id: string;
  name: string;
};

type SaFamily = {
  id: string;
  code: string;
  label: string;
  scrap_percent: number;
};

const CURRENCIES = ['TND', 'EUR', 'USD', 'GBP'];

export default function SaNewPage() {
  const router = useRouter();

  const [saNumberDigits, setSaNumberDigits] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [declarationDate, setDeclarationDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [quantityInvoiced, setQuantityInvoiced] = useState<number | ''>('');
  const [familyId, setFamilyId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState('EUR');
  const [fxRate, setFxRate] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [families, setFamilies] = useState<SaFamily[]>([]);

  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // charge fournisseurs + familles
  useEffect(() => {
    const loadMeta = async () => {
      try {
        setLoadingMeta(true);
        setErrorMsg(null);

        const [supRes, famRes] = await Promise.all([
          fetch('/api/suppliers', { cache: 'no-store' }),
          fetch('/api/sa-families', { cache: 'no-store' }),
        ]);

        const supData = await supRes.json().catch(() => []);
        const famData = await famRes.json().catch(() => []);

        if (!supRes.ok) {
          throw new Error(
            supData?.message ||
              `Erreur chargement fournisseurs (HTTP ${supRes.status})`,
          );
        }
        if (!famRes.ok) {
          throw new Error(
            famData?.message ||
              `Erreur chargement familles (HTTP ${famRes.status})`,
          );
        }

        setSuppliers(supData || []);
        setFamilies(famData || []);
      } catch (err: any) {
        console.error('loadMeta error:', err);
        setErrorMsg(
          err?.message ||
            'Erreur lors du chargement des fournisseurs / familles.',
        );
      } finally {
        setLoadingMeta(false);
      }
    };

    loadMeta();
  }, []);

  const selectedFamily = families.find((f) => f.id === familyId);
  const scrapPercent = selectedFamily?.scrap_percent ?? 0;

  const scrapQuantityPreview =
    typeof quantityInvoiced === 'number'
      ? Number(((quantityInvoiced * scrapPercent) / 100).toFixed(3))
      : 0;

  const amountDsPreview =
    typeof invoiceAmount === 'number' && typeof fxRate === 'number'
      ? Number((invoiceAmount * fxRate).toFixed(3))
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!saNumberDigits.trim() || saNumberDigits.trim().length !== 6) {
      setErrorMsg('Le numéro SA doit contenir exactement 6 chiffres.');
      return;
    }
    if (!supplierId) {
      setErrorMsg('Le fournisseur est obligatoire.');
      return;
    }
    if (!declarationDate || !dueDate) {
      setErrorMsg('Les dates déclaration et échéance sont obligatoires.');
      return;
    }
    if (quantityInvoiced === '' || quantityInvoiced <= 0) {
      setErrorMsg('La quantité facturée doit être un nombre positif.');
      return;
    }
    if (!familyId) {
      setErrorMsg('La famille est obligatoire.');
      return;
    }
    if (invoiceAmount === '' || invoiceAmount <= 0) {
      setErrorMsg('Le montant facture doit être un nombre positif.');
      return;
    }
    if (fxRate === '' || fxRate <= 0) {
      setErrorMsg('Le taux de change doit être un nombre positif.');
      return;
    }

    const payload = {
      sa_number: saNumberDigits.trim(), // le back ajoutera "SA" + padding
      declaration_date: declarationDate,
      due_date: dueDate,
      quantity_invoiced_ton: Number(quantityInvoiced),
      supplier_id: supplierId,
      family_id: familyId,
      invoice_amount: Number(invoiceAmount),
      currency_code: currency,
      fx_rate: Number(fxRate),
      description: description || null,
    };

    try {
      setSubmitting(true);
      const res = await fetch('/api/sa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error('SA create error:', res.status, data);
        setErrorMsg(
          data?.message ||
            "Erreur lors de la création de la déclaration SA.",
        );
        return;
      }

      setSuccessMsg('Déclaration SA créée avec succès.');
      setTimeout(() => {
        router.push('/sa');
      }, 800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Erreur réseau lors de l'enregistrement de la SA.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold mb-2">Nouvelle déclaration SA</h1>

      {errorMsg && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* bloc principal */}
        <section className="space-y-4 rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-medium">Informations SA</h2>
            {loadingMeta && (
              <span className="text-xs text-gray-500">
                Chargement fournisseurs / familles…
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Numéro SA (6 chiffres)
              <div className="flex items-center gap-1">
                <span className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                  SA
                </span>
                <input
                  className="flex-1 rounded-r-md border border-gray-300 px-2 py-1 text-sm"
                  value={saNumberDigits}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setSaNumberDigits(v);
                  }}
                  placeholder="251111"
                />
              </div>
              <span className="text-[11px] text-gray-500">
                Tu saisis 6 chiffres, le système enregistrera par exemple
                &quot;SA251111&quot;.
              </span>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Fournisseur
              <select
                className="rounded-md border px-2 py-1 text-sm"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">– Sélectionner –</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Date déclaration
              <input
                type="date"
                className="rounded-md border px-2 py-1 text-sm"
                value={declarationDate}
                onChange={(e) => setDeclarationDate(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Date d&apos;échéance
              <input
                type="date"
                className="rounded-md border px-2 py-1 text-sm"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Quantité facturée (T)
              <input
                type="number"
                step="0.001"
                min={0}
                className="rounded-md border px-2 py-1 text-sm"
                value={quantityInvoiced}
                onChange={(e) =>
                  setQuantityInvoiced(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Famille
              <select
                className="rounded-md border px-2 py-1 text-sm"
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
              >
                <option value="">– Sélectionner –</option>
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({f.scrap_percent}%)
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-gray-500">
                Rond à béton 5 %, Fils machine 6 %, Fer carré 8 % (modifiable
                par admin).
              </span>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Description
            <textarea
              className="rounded-md border px-2 py-1 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </section>

        {/* bloc financier */}
        <section className="space-y-4 rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-medium">Montant & devise</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Montant facture
              <input
                type="number"
                step="0.01"
                min={0}
                className="rounded-md border px-2 py-1 text-sm"
                value={invoiceAmount}
                onChange={(e) =>
                  setInvoiceAmount(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Devise
              <select
                className="rounded-md border px-2 py-1 text-sm"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Taux de change
              <input
                type="number"
                step="0.0001"
                min={0}
                className="rounded-md border px-2 py-1 text-sm"
                value={fxRate}
                onChange={(e) =>
                  setFxRate(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
            <div className="rounded-md bg-gray-50 px-3 py-2">
              <div className="font-semibold mb-1">Droit déchet (théorique)</div>
              <div>
                Famille :{' '}
                <strong>
                  {selectedFamily
                    ? `${selectedFamily.label} (${scrapPercent} %)`
                    : '—'}
                </strong>
              </div>
              <div>
                Qté déchet = Qté facturée × % famille
              </div>
              <div className="mt-1">
                Prévision :{' '}
                <strong>
                  {scrapQuantityPreview.toLocaleString('fr-FR', {
                    maximumFractionDigits: 3,
                  })}{' '}
                  T
                </strong>
              </div>
            </div>

            <div className="rounded-md bg-gray-50 px-3 py-2">
              <div className="font-semibold mb-1">Montant DS (prévision)</div>
              <div>
                Formule : montant facture × taux de change = montant en devise
                société (DS).
              </div>
              <div className="mt-1">
                Prévision :{' '}
                <strong>
                  {amountDsPreview.toLocaleString('fr-FR', {
                    maximumFractionDigits: 3,
                  })}{' '}
                  DS
                </strong>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-sm"
            onClick={() => router.push('/sa')}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer SA'}
          </button>
        </div>
      </form>
    </div>
  );
}
