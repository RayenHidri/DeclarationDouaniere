// app/(app)/ea/new/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
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

  // Familles & articles (nouveau)
  const [families, setFamilies] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [familyId, setFamilyId] = useState('');
  const [productId, setProductId] = useState('');
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articleSearch, setArticleSearch] = useState('');
  // cache local en mémoire par famille -> évite rechargements inutiles
  const articlesCacheRef = useRef<Map<string, any[]>>(new Map());

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

  // Charger familles (pour produit -> calcul déchet)
  useEffect(() => {
    const loadFamilies = async () => {
      try {
        const res = await fetch('/api/sa-families', { cache: 'no-store' });
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || 'Erreur chargement familles');
        setFamilies(data || []);
      } catch (err: any) {
        console.error('loadFamilies error:', err);
      }
    };

    loadFamilies();
  }, []);

  // Charger articles quand on choisit une famille
  useEffect(() => {
    const loadArticles = async () => {
      if (!familyId) {
        setArticles([]);
        setProductId('');
        return;
      }

      // reset local search + produit sélectionné lors du changement de famille
      setArticleSearch('');
      setProductId('');
      setProductRef('');
      setProductDesc('');

      // si on a déjà chargé cette famille, on utilise le cache local
      const cached = articlesCacheRef.current.get(familyId);
      if (cached) {
        setArticles(cached);
        return;
      }

      try {
        setLoadingArticles(true);
        const res = await fetch(`/api/articles?family_id=${familyId}`, { cache: 'no-store' });
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || 'Erreur chargement articles');
        const list = data || [];
        articlesCacheRef.current.set(familyId, list);
        setArticles(list);
      } catch (err: any) {
        console.error('loadArticles error:', err);
        setArticles([]);
      } finally {
        setLoadingArticles(false);
      }
    };

    loadArticles();
  }, [familyId]);

  // Quand on choisit une SA et qu'on a saisi une quantité totale EA,
  // on pré-remplit la quantité liée avec la quantité totale
  useEffect(() => {
    if (linkedSaId && typeof totalQuantity === 'number') {
      setLinkedQuantity(totalQuantity);
    }
  }, [linkedSaId, totalQuantity]);

  // Quand on choisit une SA, on appelle l'endpoint backend qui fournit
  // les valeurs pré-remplies pour créer l'EA à partir de la SA (famille,
  // description, quantité max exportable, unité, etc.). On ne force
  // pas le produit sélectionné (productId) car la liste d'articles peut
  // ne pas contenir le produit suggéré; on remplit le champ texte.
  useEffect(() => {
    const loadSaForEa = async () => {
      if (!linkedSaId) return;

      try {
        const res = await fetch(`/api/sa/for-ea/${linkedSaId}`, { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          console.warn('/api/sa/for-ea error', res.status, data);
          return;
        }

        // Pré-remplissage non-invasif : n'écrase pas si utilisateur a déjà changé
        if (data.family_id && !familyId) setFamilyId(String(data.family_id));
        if (data.suggested_product_ref && !productRef) setProductRef(data.suggested_product_ref);
        if (data.suggested_product_desc && !productDesc) setProductDesc(data.suggested_product_desc);
        if (data.description && !productDesc) setProductDesc(data.description);
        if (data.quantity_unit) setQuantityUnit(data.quantity_unit);

        // Quantités : on propose la quantité max exportable pour la SA
        if (typeof data.max_export_quantity === 'number') {
          setLinkedQuantity(data.max_export_quantity);
          if (totalQuantity === '') setTotalQuantity(data.max_export_quantity);
        }
      } catch (err: any) {
        console.error('loadSaForEa error:', err);
      }
    };

    loadSaForEa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedSaId]);

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

    // produit & famille obligatoires
    if (!familyId) {
      setErrorMsg('La famille est obligatoire.');
      return;
    }
    if (!productId) {
      setErrorMsg('L\'article est obligatoire.');
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
      family_id: familyId,
      product_id: productId,
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

  // déchet théorique pour cette EA = total_quantity * (t / (1 - t))
  const selectedFamily = families.find((f) => f.id === familyId);
  const scrapPercent = selectedFamily?.scrap_percent ?? 0;
  const t = scrapPercent / 100;
  const dechetPreview =
    typeof totalQuantity === 'number' && t > 0 && t < 1
      ? Number((Number(totalQuantity) * (t / (1 - t))).toFixed(3))
      : 0;

  // Filtrage local des articles par référence ou libellé (recherche instantanée)
  const filteredArticles = articles.filter((a) => {
    if (!articleSearch) return true;
    const s = articleSearch.toLowerCase();
    return (
      String(a.product_ref ?? '').toLowerCase().includes(s) ||
      String(a.label ?? '').toLowerCase().includes(s)
    );
  });

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

            {/* Famille & article */}
            <label className="flex flex-col gap-1 text-sm">
              Famille
              <select
                className="rounded-md border px-2 py-1 text-sm"
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
              >
                <option value="">-- Sélectionner --</option>
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({f.scrap_percent}%)
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Article
              <input
                className="mb-2 rounded-md border px-2 py-1 text-sm"
                placeholder="Rechercher par référence ou libellé (ex: REF123)"
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
              />

              {loadingArticles ? (
                <div className="text-xs text-gray-500">Chargement des articles…</div>
              ) : null}

              {!loadingArticles && articles.length === 0 ? (
                <div className="text-xs text-gray-500">Aucun article pour cette famille.</div>
              ) : null}

              <select
                className="rounded-md border px-2 py-1 text-sm"
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  const art = articles.find((a) => String(a.id) === e.target.value);
                  setProductRef(art?.product_ref ?? '');
                  setProductDesc(art?.label ?? '');
                }}
              >
                <option value="">-- Sélectionner --</option>
                {filteredArticles.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.product_ref} • {a.label}
                  </option>
                ))}
              </select>

              <div className="text-[11px] text-gray-500 mt-1">Astuce: utilise la recherche ci-dessus pour trouver rapidement par référence.</div>
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

          {/* Aperçu du déchet (nouveau) */}
          <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
            <div className="font-semibold mb-1">Aperçu droit de déchet</div>
            <div>
              Famille : <strong>{selectedFamily ? `${selectedFamily.label} (${scrapPercent} %)` : '—'}</strong>
            </div>
            <div>Formule : déchet = Qté EA × (t / (1 - t))</div>
            <div className="mt-1">
              Estimation déchet : <strong>{dechetPreview.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} T</strong>
            </div>
          </div>
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
