import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { EaStatus } from '../EaTable';

const NEST_API_URL = process.env.NEST_API_URL;

type EaDetail = {
  id: string;
  ea_number: string;
  regime_code: string;
  export_date: string;
  status: EaStatus;
  customer_name: string;
  destination_country: string | null;
  product_ref: string | null;
  product_desc: string | null;
  total_quantity: number;
  quantity_unit: string;
  created_at: string;
  updated_at: string;
  family_id: string | null;
};

type SaAllocationForEaDetail = {
  id: string;
  quantity: number;
  created_at: string;
  scrap_quantity?: number;
  sa?: {
    id: string;
    sa_number: string;
    supplier_name: string;
    due_date: string;
    quantity_initial: number;
    quantity_apured: number;
    quantity_unit: string;
    family_name?: string | null;
    description?: string | null;
    family_id?: string | null;
  };
};

async function getEa(id: string): Promise<EaDetail> {
  if (!NEST_API_URL) {
    throw new Error('NEST_API_URL is not configured');
  }

  if (!id) {
    redirect('/ea');
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  const res = await fetch(`${NEST_API_URL}/ea/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/auth/login');
  }

  if (res.status === 400 || res.status === 404) {
    redirect('/ea');
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch EA: ${res.status}`);
  }

  return res.json();
}

async function getEaAllocations(eaId: string): Promise<SaAllocationForEaDetail[]> {
  if (!NEST_API_URL) {
    throw new Error('NEST_API_URL is not configured');
  }

  if (!eaId) {
    return [];
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  const res = await fetch(`${NEST_API_URL}/apurement/ea/${eaId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/auth/login');
  }

  if (!res.ok) {
    console.error('Failed to fetch EA allocations:', res.status);
    return [];
  }

  return res.json();
}

export default async function EaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [ea, allocations] = await Promise.all([
    getEa(id),
    getEaAllocations(id),
  ]);

  const totalAllocatedOnEa = allocations.reduce(
    (sum, a) => sum + (a.quantity || 0),
    0,
  );
  const remainingOnEa = ea.total_quantity - totalAllocatedOnEa;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pt-6">
      <Link href="/ea">
        <Button variant="ghost" size="sm" className="gap-1 pl-0 text-muted-foreground">
          ← Retour à la liste
        </Button>
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              EA {ea.ea_number}
            </h1>
            <Badge variant={
              ea.status === 'SUBMITTED' ? 'success' :
                ea.status === 'CANCELLED' ? 'secondary' : 'default'
            }>
              {ea.status === 'SUBMITTED' ? 'Soumise' : ea.status === 'CANCELLED' ? 'Annulée' : ea.status}
            </Badge>
          </div>
          <p className="mt-1 text-lg text-muted-foreground">
            Client : {ea.customer_name}
          </p>
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
              <span className="text-muted-foreground">Régime</span>
              <span className="font-medium">{ea.regime_code}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-muted-foreground">Date export</span>
              <span>{ea.export_date}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-muted-foreground">Pays destination</span>
              <span>{ea.destination_country ?? '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quantités */}
        <Card>
          <CardHeader>
            <CardTitle>Quantité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-1">
              <span className="text-muted-foreground">Totale</span>
              <span className="text-lg font-semibold">{ea.total_quantity.toLocaleString('fr-FR')} <span className="text-sm font-normal text-muted-foreground">{ea.quantity_unit}</span></span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article Exporté</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Référence:</span>
            <span className="text-sm font-medium">{ea.product_ref || '-'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Désignation:</span>
            <p className="text-base font-medium text-foreground">{ea.product_desc || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Section Apurement des SA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Apurement des SA</CardTitle>
            <div className="text-xs text-muted-foreground flex gap-4">
              <div>
                Quantité EA totale :{' '}
                <span className="font-medium text-foreground">{ea.total_quantity.toLocaleString('fr-FR')} {ea.quantity_unit}</span>
              </div>
              <div>
                Déjà imputée :{' '}
                <span className="font-medium text-emerald-600">{totalAllocatedOnEa.toLocaleString('fr-FR')} {ea.quantity_unit}</span>
              </div>
              <div>
                Non imputée :{' '}
                <span className="font-medium text-amber-600">{remainingOnEa.toLocaleString('fr-FR')} {ea.quantity_unit}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Cette EA n&apos;est pas encore imputée sur des SA.
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      N° SA
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Fournisseur
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Article
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Famille
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                      Quantité imputée
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                      Qté déchet
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                      Quantité SA initiale
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allocations.map((a, idx) => {
                    if (!a.sa) return null;
                    const isFirstRow = idx === 0;
                    return (
                      <tr key={a.id} className="hover:bg-muted/50">
                        <td className="px-3 py-2">
                          <Link
                            href={`/sa/${a.sa.id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {a.sa.sa_number}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                          {a.sa.supplier_name}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{ea.product_ref || '-'}</span>
                            {isFirstRow && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={ea.product_desc || ''}>
                                {ea.product_desc}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            {a.sa.family_name || '-'}
                            {ea.family_id && a.sa.family_id && String(ea.family_id) !== String(a.sa.family_id) && (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800" title="Cette SA appartient à une famille différente de l'EA">
                                mismatch
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-foreground font-medium">
                          {a.quantity.toLocaleString('fr-FR')}{' '}
                          {a.sa.quantity_unit}
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-600 font-medium whitespace-nowrap">
                          {a.scrap_quantity ? `+${a.scrap_quantity.toLocaleString('fr-FR')}` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {a.sa.quantity_initial.toLocaleString('fr-FR')}{' '}
                          {a.sa.quantity_unit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
