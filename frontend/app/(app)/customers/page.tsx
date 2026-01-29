// app/(app)/customers/page.tsx
'use client';

import { useEffect, useState } from 'react';

type Customer = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type FormMode = 'create' | 'edit';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [mode, setMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/customers', { cache: 'no-store' });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || `Erreur chargement clients (${res.status})`);
      }

      setCustomers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('loadCustomers error:', err);
      setErrorMsg(err?.message || 'Erreur lors du chargement des clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const resetForm = () => {
    setCode('');
    setName('');
    setIsActive(true);
    setEditingId(null);
    setMode('create');
  };

  const startEdit = (c: Customer) => {
    setMode('edit');
    setEditingId(c.id);
    setCode(c.code);
    setName(c.name);
    setIsActive(c.is_active);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      setErrorMsg('Code et nom sont obligatoires.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const payload = {
        code: code.trim(),
        name: name.trim(),
        is_active: isActive,
      };

      let res: Response;
      if (mode === 'create') {
        res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        if (!editingId) {
          throw new Error('Aucun client sélectionné pour la modification.');
        }
        res = await fetch(`/api/customers/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `Erreur sauvegarde client (${res.status})`);
      }

      setSuccessMsg(
        mode === 'create'
          ? 'Client créé avec succès.'
          : 'Client mis à jour avec succès.',
      );

      resetForm();
      await loadCustomers();
    } catch (err: any) {
      console.error('handleSubmit customer error:', err);
      setErrorMsg(err?.message || 'Erreur lors de la sauvegarde du client.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Customer) => {
    const ok = window.confirm(
      `Supprimer le client "${c.code} - ${c.name}" ?`,
    );
    if (!ok) return;

    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/customers/${c.id}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `Erreur suppression client (${res.status})`);
      }

      setSuccessMsg('Client supprimé avec succès.');
      if (editingId === c.id) {
        resetForm();
      }
      await loadCustomers();
    } catch (err: any) {
      console.error('handleDelete customer error:', err);
      setErrorMsg(err?.message || 'Erreur lors de la suppression du client.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold mb-2">Clients</h1>
      <p className="text-sm text-slate-600">
        Gestion du référentiel clients (code, nom, actif).
      </p>

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

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            {mode === 'create' ? 'Nouveau client' : 'Modifier le client'}
          </h2>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-500 hover:underline"
            >
              Annuler l’édition
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={20}
              required
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="block text-xs font-medium text-slate-700">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Actif
            </label>
            <div className="flex items-center gap-2">
              <input
                id="customer-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="customer-active" className="text-xs text-slate-600">
                Actif
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {saving
              ? 'Enregistrement…'
              : mode === 'create'
              ? 'Créer le client'
              : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-4 text-sm text-slate-500">Chargement…</div>
        ) : customers.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">
            Aucun client pour le moment.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-600">
                  Code
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">
                  Nom
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">
                  Actif
                </th>
                <th className="px-3 py-2 text-right font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {c.code}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{c.name}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {c.is_active ? (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
