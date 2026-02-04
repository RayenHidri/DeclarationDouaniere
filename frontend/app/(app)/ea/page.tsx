// app/(app)/ea/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EaTable, EaItem } from './EaTable';
import EaControls from './EaControls';
import DebugUserRole from '../debugUserRole';
import { decodeJwt } from '../decodeJwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function loadEa(): Promise<EaItem[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  const res = await fetch(`${API_URL}/ea`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('Erreur chargement EA:', res.status);
    return [];
  }

  const raw = await res.json();

  if (!Array.isArray(raw)) {
    return [];
  }

  // mapping propre vers EaItem
  return raw.map((e: any): EaItem => {
    const exportDateRaw = e.export_date;
    const exportDate =
      exportDateRaw instanceof Date
        ? exportDateRaw.toISOString().slice(0, 10)
        : typeof exportDateRaw === 'string'
          ? exportDateRaw
          : '';

    return {
      id: String(e.id),
      ea_number: e.ea_number,
      regime_code: e.regime_code,
      export_date: exportDate,
      status: e.status,
      customer_name: e.customer_name ?? e.customer?.name ?? '',
      destination_country: e.destination_country ?? null,
      product_ref: e.product_ref ?? null,
      product_desc: e.product_desc ?? null,
      total_quantity: Number(e.total_quantity ?? 0),
      quantity_unit: e.quantity_unit,
      scrap_percent: e.scrap_percent != null ? Number(e.scrap_percent) : null,
      scrap_quantity: e.scrap_quantity != null ? Number(e.scrap_quantity) : null,
      // Nouveaux champs pour les allocations
      allocation_id: e.allocation_id ?? null,
      sa_number: e.sa_number ?? null,
      sa_supplier: e.sa_supplier ?? null,
      allocated_quantity: e.allocated_quantity != null ? Number(e.allocated_quantity) : null,
      allocated_scrap_quantity: e.allocated_scrap_quantity != null ? Number(e.allocated_scrap_quantity) : null,
      sa_family_name: e.sa_family_name ?? null,
    };
  });
}

export default async function EaPage() {
  const items = await loadEa();
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  let email = null, roles: string[] = [];
  if (token) {
    const decoded = decodeJwt(token);
    email = decoded.email;
    roles = decoded.roles;
  }
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <DebugUserRole email={email} roles={roles} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Déclarations EA</h1>
          <p className="text-sm text-slate-500">
            Suivi des déclarations d&apos;exportation (EA).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EaControls email={email} roles={roles} />
        </div>
      </div>
      <EaTable items={items} />
    </div>
  );
}
