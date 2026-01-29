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
};

type SaAllocationForEaDetail = {
  id: string;
  quantity: number;
  created_at: string;
  sa?: {
    id: string;
    sa_number: string;
    supplier_name: string;
    due_date: string;
    quantity_initial: number;
    quantity_apured: number;
    quantity_unit: string;
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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <a
        href="/ea"
        className="mb-4 inline-block text-sm text-blue-600 hover:underline"
      >
        ← Retour à la liste
      </a>

      <h1 className="mb-2 text-2xl font-semibold text-slate-900">
        EA {ea.ea_number}
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        Client : {ea.customer_name}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Informations
          </h2>
          <dl className="space-y-1 text-sm text-slate-700">
            <div className="flex justify-between">
              <dt className="text-slate-500">Régime</dt>
              <dd>{ea.regime_code}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Date export</dt>
              <dd>{ea.export_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Pays destination</dt>
              <dd>{ea.destination_country ?? '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Statut</dt>
              <dd>{ea.status}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Quantité
          </h2>
          <dl className="space-y-1 text-sm text-slate-700">
            <div className="flex justify-between">
              <dt className="text-slate-500">Totale</dt>
              <dd>
                {ea.total_quantity.toLocaleString('fr-FR')}{' '}
                {ea.quantity_unit}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {ea.product_desc && (
        <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Description produit
          </h2>
          <p className="text-sm text-slate-700">{ea.product_desc}</p>
        </div>
      )}

      {/* Section Apurement des SA */}
      <div className="mt-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Apurement des SA
          </h2>
          <div className="text-xs text-slate-500">
            <div>
              Quantité EA totale :{' '}
              {ea.total_quantity.toLocaleString('fr-FR')}{' '}
              {ea.quantity_unit}
            </div>
            <div>
              Déjà imputée :{' '}
              {totalAllocatedOnEa.toLocaleString('fr-FR')}{' '}
              {ea.quantity_unit}
            </div>
            <div>
              Non imputée :{' '}
              {remainingOnEa.toLocaleString('fr-FR')}{' '}
              {ea.quantity_unit}
            </div>
          </div>
        </div>

        {allocations.length === 0 ? (
          <p className="text-sm text-slate-500">
            Cette EA n&apos;est pas encore imputée sur des SA.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    N° SA
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Fournisseur
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Échéance
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">
                    Quantité imputée
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">
                    Quantité SA initiale
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((a) => {
                  if (!a.sa) return null;
                  return (
                    <tr key={a.id}>
                      <td className="px-3 py-2">
                        <a
                          href={`/sa/${a.sa.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {a.sa.sa_number}
                        </a>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {a.sa.supplier_name}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {a.sa.due_date}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {a.quantity.toLocaleString('fr-FR')}{' '}
                        {a.sa.quantity_unit}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
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
      </div>
    </div>
  );
}
