// app/(app)/sa/[id]/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

type SaDetail = {
  id: string;
  sa_number: string;
  regime_code?: string;
  declaration_date: string;
  due_date: string;
  status: string;

  quantity_initial: number;
  quantity_apured: number;
  quantity_unit: string;

  // nouveau modèle à plat
  scrap_quantity_ton?: number | null;
  family_label?: string | null;
  scrap_percent?: number | null;

  supplier_name?: string | null;

  invoice_amount?: number | null;
  currency_code?: string | null;
  fx_rate?: number | null;
  amount_ds?: number | null;

  description?: string | null;
};

type SaDetailPageProps = {
  // Next 16 : params est un Promise
  params: Promise<{ id: string }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default async function SaDetailPage({ params }: SaDetailPageProps) {
  // On "unwrap" le Promise comme demandé par Next
  const { id } = await params;

  // Sécurité de base sur l'id
  if (!id || id === 'undefined' || id === 'null') {
    return (
      <div className="max-w-4xl mx-auto p-6 text-sm text-gray-600">
        Identifiant SA invalide dans l’URL.
        <div className="mt-3">
          <Link
            href="/sa"
            className="text-xs text-blue-600 hover:underline"
          >
            ← Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  // Auth : on récupère le token depuis les cookies
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    // Si plus connecté → retour login
    redirect('/auth/login');
  }

  // Appel direct au backend Nest
  const res = await fetch(`${API_URL}/sa/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = `Erreur chargement SA (HTTP ${res.status})`;
    try {
      const json = text ? JSON.parse(text) : null;
      if (json?.message) message = json.message;
    } catch {
      // ignore
    }

    return (
      <div className="max-w-4xl mx-auto p-6 text-sm text-gray-600">
        {message}
        <div className="mt-3">
          <Link
            href="/sa"
            className="text-xs text-blue-600 hover:underline"
          >
            ← Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const sa = (await res.json()) as SaDetail;

  // -------- Calculs métier --------
  const initial = Number(sa.quantity_initial ?? 0);
  const apured = Number(sa.quantity_apured ?? 0);
  const remaining = Number(Math.max(initial - apured, 0).toFixed(3));

  const scrapPercent =
    sa.scrap_percent != null ? Number(sa.scrap_percent) : 0;

  const scrapQty =
    sa.scrap_quantity_ton !== null && sa.scrap_quantity_ton !== undefined
      ? Number(sa.scrap_quantity_ton)
      : Number(((initial * scrapPercent) / 100).toFixed(3));

  const supplierName = sa.supplier_name ?? 'Non renseigné';

  const amountDs =
    sa.amount_ds !== null && sa.amount_ds !== undefined
      ? Number(sa.amount_ds)
      : null;

  const invoiceAmount =
    sa.invoice_amount !== null && sa.invoice_amount !== undefined
      ? Number(sa.invoice_amount)
      : null;

  const fxRate =
    sa.fx_rate !== null && sa.fx_rate !== undefined
      ? Number(sa.fx_rate)
      : null;

  const formatStatus = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'Ouverte';
      case 'PARTIALLY_APURED':
        return 'Partiellement apurée';
      case 'FULLY_APURED':
        return 'Totalement apurée';
      default:
        return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PARTIALLY_APURED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FULLY_APURED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  // -------- Rendu --------
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link
        href="/sa"
        className="mb-2 inline-block text-xs text-blue-600 hover:underline"
      >
        ← Retour à la liste
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            SA {sa.sa_number ?? ''}
          </h1>
          <p className="text-sm text-gray-600">
            Fournisseur : <strong>{supplierName}</strong>
          </p>
          {sa.family_label && (
            <p className="text-xs text-gray-500">
              Famille : <strong>{sa.family_label}</strong>{' '}
              {scrapPercent
                ? `(${scrapPercent.toLocaleString('fr-FR')} % déchet)`
                : ''}
            </p>
          )}
        </div>
        <div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusColor(
              sa.status,
            )}`}
          >
            Statut : {formatStatus(sa.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="font-semibold text-gray-900">Informations</h2>
          <p>
            <span className="text-gray-500">N° SA : </span>
            <span className="font-medium">{sa.sa_number}</span>
          </p>
          <p>
            <span className="text-gray-500">Régime : </span>
            <span>{sa.regime_code ?? '-'}</span>
          </p>
          <p>
            <span className="text-gray-500">Date déclaration : </span>
            <span>{sa.declaration_date}</span>
          </p>
          <p>
            <span className="text-gray-500">Date échéance : </span>
            <span>{sa.due_date}</span>
          </p>
          {sa.description && (
            <p>
              <span className="text-gray-500">Description : </span>
              <span>{sa.description}</span>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold text-gray-900">Quantités</h2>
          <p>
            <span className="text-gray-500">Quantité initiale : </span>
            <span>
              {initial.toLocaleString('fr-FR', {
                maximumFractionDigits: 3,
              })}{' '}
              {sa.quantity_unit}
            </span>
          </p>
          <p>
            <span className="text-gray-500">Quantité apurée : </span>
            <span>
              {apured.toLocaleString('fr-FR', {
                maximumFractionDigits: 3,
              })}{' '}
              {sa.quantity_unit}
            </span>
          </p>
          <p>
            <span className="text-gray-500">Reste SA : </span>
            <span>
              {remaining.toLocaleString('fr-FR', {
                maximumFractionDigits: 3,
              })}{' '}
              {sa.quantity_unit}
            </span>
          </p>
          <p>
            <span className="text-gray-500">Droit déchet théorique : </span>
            <span>
              {scrapQty.toLocaleString('fr-FR', {
                maximumFractionDigits: 3,
              })}{' '}
              {sa.quantity_unit}
              {scrapPercent
                ? ` (${scrapPercent.toLocaleString('fr-FR')} %)`
                : ''}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="font-semibold text-gray-900">Montant facture</h2>
          <p>
            <span className="text-gray-500">Montant : </span>
            <span>
              {invoiceAmount !== null
                ? invoiceAmount.toLocaleString('fr-FR', {
                    maximumFractionDigits: 3,
                  })
                : '-'}{' '}
              {sa.currency_code ?? ''}
            </span>
          </p>
          <p>
            <span className="text-gray-500">Taux de change : </span>
            <span>
              {fxRate !== null
                ? fxRate.toLocaleString('fr-FR', {
                    maximumFractionDigits: 6,
                  })
                : '-'}
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold text-gray-900">Montant DS</h2>
          <p>
            <span className="text-gray-500">Montant DS : </span>
            <span>
              {amountDs !== null
                ? amountDs.toLocaleString('fr-FR', {
                    maximumFractionDigits: 3,
                  })
                : '-'}{' '}
              DS
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
