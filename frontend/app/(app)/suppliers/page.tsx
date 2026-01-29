// app/(app)/suppliers/page.tsx
'use client';

import { useEffect, useState } from 'react';

type Supplier = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type FormMode = 'create' | 'edit';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [mode, setMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);

  // ---------- Load list ----------
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/suppliers', { cache: 'no-store' });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || `Erreur chargement fournisseurs (${res.status})`);
      }

      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('loadSuppliers error:', err);
      setErrorMsg(err?.message || 'Erreur lors du chargement des fournisseurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // ---------- Helpers formulaire ----------
  const resetForm = () => {
    setCode('');
    setName('');
    setIsActive(true);
    setEditingId(null);
    setMode('create');
  };

  const startEdit = (supplier: Supplier) => {
    setMode('edit');
    setEditingId(supplier.id);
    setCode(supplier.code);
    setName(supplier.name);
    setIsActive(supplier.is_active);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // ---------- Submit create/update ----------
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
        res = await fetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        if (!editingId) {
          throw new Error('Aucun fournisseur sélectionné pour la modification.');
        }
        res = await fetch(`/api/suppliers/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `Erreur sauvegarde fournisseur (${res.status})`);
      }

      setSuccessMsg(
        mode === 'create'
          ? 'Fournisseur créé avec succès.'
          : 'Fournisseur mis à jour avec succès.',
      );

      resetForm();
      await loadSuppliers();
    } catch (err: any) {
      console.error('handleSubmit supplier error:', err);
      setErrorMsg(err?.message || 'Erreur lors de la sauvegarde du fournisseur.');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Delete ----------
  const handleDelete = async (supplier: Supplier) => {
    const ok = window.confirm(
      `Supprimer le fournisseur "${supplier.code} - ${supplier.name}" ?`,
    );
    if (!ok) return;

    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `Erreur suppression fournisseur (${res.status})`);
      }

      setSuccessMsg('Fournisseur supprimé avec succès.');
      // si on supprimait celui en cours d’édition, on reset le formulaire
      if (editingId === supplier.id) {
        resetForm();
      }
      await loadSuppliers();
    } catch (err: any) {
      console.error('handleDelete supplier error:', err);
      setErrorMsg(err?.message || 'Erreur lors de la suppression du fournisseur.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold mb-2">Fournisseurs</h1>
      <p className="text-sm text-slate-600">
        Gestion du référentiel fournisseurs (code, nom, actif).
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

      {/* Formulaire création / édition */}
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            {mode === 'create' ? 'Nouveau fournisseur' : 'Modifier le fournisseur'}
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
                id="supplier-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="supplier-active" className="text-xs text-slate-600">
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
              ? 'Créer le fournisseur'
              : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>

      {/* Tableau des fournisseurs */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-4 text-sm text-slate-500">Chargement…</div>
        ) : suppliers.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">
            Aucun fournisseur pour le moment.
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
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {s.code}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{s.name}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {s.is_active ? (
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
                      onClick={() => startEdit(s)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
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
