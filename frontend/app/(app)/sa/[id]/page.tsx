// app/(app)/sa/[id]/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <div className="mx-auto max-w-5xl space-y-6 pt-6">
      <Link href="/sa">
        <Button variant="ghost" size="sm" className="gap-1 pl-0 text-muted-foreground">
          ← Retour à la liste
        </Button>
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              SA {sa.sa_number ?? ''}
            </h1>
            <Badge variant={
              sa.status === 'FULLY_APURED' ? 'success' :
                sa.status === 'PARTIALLY_APURED' ? 'warning' :
                  sa.status === 'OPEN' ? 'info' : 'secondary'
            }>
              {formatStatus(sa.status)}
            </Badge>
          </div>

          <p className="mt-1 text-lg text-muted-foreground">
            {supplierName}
          </p>
          {sa.family_label && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Famille :</span> {sa.family_label}
              {scrapPercent > 0 && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {scrapPercent.toLocaleString('fr-FR')}% déchet
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations Générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-1">
              <span className="text-muted-foreground">N° SA</span>
              <span className="font-medium">{sa.sa_number}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-muted-foreground">Régime</span>
              <span>{sa.regime_code ?? '-'}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-muted-foreground">Date déclaration</span>
              <span>{sa.declaration_date}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-muted-foreground">Date échéance</span>
              <span>{sa.due_date}</span>
            </div>
            {sa.description && (
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">Description</span>
                <span>{sa.description}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quantités */}
        <Card>
          <CardHeader>
            <CardTitle>Suivi des Quantités</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progression Apurement</span>
                <span className="font-medium">{Math.min(100, Math.round((apured / initial) * 100))}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, (apured / initial) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Initiale</p>
                <p className="text-lg font-semibold">{initial.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} <span className="text-sm font-normal text-muted-foreground">{sa.quantity_unit}</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Apurée</p>
                <p className="text-lg font-semibold text-emerald-600">{apured.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} <span className="text-sm font-normal text-muted-foreground">{sa.quantity_unit}</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Restante</p>
                <p className="text-lg font-semibold text-amber-600">{remaining.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} <span className="text-sm font-normal text-muted-foreground">{sa.quantity_unit}</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Droit Déchet</p>
                <p className="text-lg font-semibold">{scrapQty.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} <span className="text-sm font-normal text-muted-foreground">{sa.quantity_unit}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Données Financières</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Montant Facture</p>
              <p className="font-medium">
                {invoiceAmount !== null
                  ? invoiceAmount.toLocaleString('fr-FR', { maximumFractionDigits: 3 })
                  : '-'
                } {sa.currency_code}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Taux de Change</p>
              <p className="font-medium">
                {fxRate !== null
                  ? fxRate.toLocaleString('fr-FR', { maximumFractionDigits: 6 })
                  : '-'
                }
              </p>
            </div>
            <div className="col-span-2 pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Montant DS</span>
                <span className="text-lg font-bold">
                  {amountDs !== null
                    ? amountDs.toLocaleString('fr-FR', { maximumFractionDigits: 3 })
                    : '-'
                  } DS
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
