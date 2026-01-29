'use client';

import { FormEvent, useState } from 'react';
import type { SaOption, EaOption } from './page';

type Props = {
  saOptions: SaOption[];
  eaOptions: EaOption[];
};

export function ApurementForm({ saOptions, eaOptions }: Props) {
  const [selectedSaId, setSelectedSaId] = useState<string>('');
  const [selectedEaId, setSelectedEaId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedSa =
    selectedSaId && saOptions.length
      ? saOptions.find((s) => s.id === selectedSaId) ?? null
      : null;

  const selectedEa =
    selectedEaId && eaOptions.length
      ? eaOptions.find((e) => e.id === selectedEaId) ?? null
      : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const qty =
      typeof quantity === 'number' ? quantity : Number(quantity);

    if (!selectedSaId) {
      setError('Veuillez choisir une SA.');
      return;
    }

    if (!selectedEaId) {
      setError('Veuillez choisir une EA.');
      return;
    }

    if (Number.isNaN(qty) || qty <= 0) {
      setError('La quantité doit être un nombre positif.');
      return;
    }

    if (selectedSa && qty > selectedSa.remaining_quantity + 1e-6) {
      setError(
        `La quantité imputée (${qty.toLocaleString(
          'fr-FR',
        )} ${selectedSa.quantity_unit}) dépasse la quantité restante de la SA (${selectedSa.remaining_quantity.toLocaleString(
          'fr-FR',
        )} ${selectedSa.quantity_unit}).`,
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/apurement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sa_id: selectedSaId,
          ea_id: selectedEaId,
          quantity: qty,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          data?.message ??
            "Erreur lors de la création de l'apurement.",
        );
        return;
      }

      setSuccess("Apurement enregistré avec succès.");
      setQuantity('');
    } catch (err) {
      console.error(err);
      setError(
        "Erreur réseau. Impossible d'appeler le serveur d'apurement.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* SA */}
        <div>
          <label
            htmlFor="saSelect"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            SA
          </label>
          <select
            id="saSelect"
            value={selectedSaId}
            onChange={(e) => setSelectedSaId(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">
              {saOptions.length === 0
                ? 'Aucune SA éligible'
                : 'Choisir une SA'}
            </option>
            {saOptions.map((sa) => (
              <option key={sa.id} value={sa.id}>
                {sa.sa_number} – {sa.supplier_name} – reste{' '}
                {sa.remaining_quantity.toLocaleString('fr-FR')}{' '}
                {sa.quantity_unit} – échéance {sa.due_date}
              </option>
            ))}
          </select>
          {selectedSa && (
            <p className="mt-1 text-xs text-slate-500">
              Quantité initiale :{' '}
              {selectedSa.quantity_initial.toLocaleString('fr-FR')}{' '}
              {selectedSa.quantity_unit} | apurée :{' '}
              {selectedSa.quantity_apured.toLocaleString('fr-FR')}{' '}
              {selectedSa.quantity_unit}
            </p>
          )}
        </div>

        {/* EA */}
        <div>
          <label
            htmlFor="eaSelect"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            EA
          </label>
          <select
            id="eaSelect"
            value={selectedEaId}
            onChange={(e) => setSelectedEaId(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">
              {eaOptions.length === 0
                ? 'Aucune EA disponible'
                : 'Choisir une EA'}
            </option>
            {eaOptions.map((ea) => (
              <option key={ea.id} value={ea.id}>
                {ea.ea_number} – {ea.customer_name} –{' '}
                {ea.total_quantity.toLocaleString('fr-FR')}{' '}
                {ea.quantity_unit} – export {ea.export_date}
              </option>
            ))}
          </select>
          {selectedEa && (
            <p className="mt-1 text-xs text-slate-500">
              Quantité totale EA :{' '}
              {selectedEa.total_quantity.toLocaleString('fr-FR')}{' '}
              {selectedEa.quantity_unit}
            </p>
          )}
        </div>
      </div>

      {/* Quantité */}
      <div className="max-w-xs">
        <label
          htmlFor="quantity"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Quantité à imputer
        </label>
        <input
          id="quantity"
          type="number"
          step="0.001"
          value={quantity}
          onChange={(e) =>
            setQuantity(
              e.target.value === '' ? '' : Number(e.target.value),
            )
          }
          required
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {selectedSa && (
          <p className="mt-1 text-xs text-slate-500">
            Max sur cette SA :{' '}
            {selectedSa.remaining_quantity.toLocaleString('fr-FR')}{' '}
            {selectedSa.quantity_unit}
          </p>
        )}
      </div>

      {/* Messages */}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-600" role="status">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? 'Enregistrement…' : 'Enregistrer apurement'}
      </button>
    </form>
  );
}