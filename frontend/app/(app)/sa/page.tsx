// app/(app)/sa/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SaTable, SaItem } from './SaTable';
import SaControls from './SaControls';
import DebugUserRole from '../debugUserRole';
import { decodeJwt } from '../decodeJwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function loadSa(): Promise<SaItem[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  const res = await fetch(`${API_URL}/sa`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('Erreur chargement SA:', res.status);
    return [];
  }

  const raw = await res.json();

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((sa: any): SaItem => {
    const declRaw = sa.declaration_date;
    const dueRaw = sa.due_date;

    const declaration_date =
      declRaw instanceof Date
        ? declRaw.toISOString().slice(0, 10)
        : typeof declRaw === 'string'
        ? declRaw
        : '';

    const due_date =
      dueRaw instanceof Date
        ? dueRaw.toISOString().slice(0, 10)
        : typeof dueRaw === 'string'
        ? dueRaw
        : '';

    return {
      id: String(sa.id),
      sa_number: sa.sa_number,
      regime_code: sa.regime_code,
      declaration_date,
      due_date,
      status: sa.status,
      quantity_initial: Number(sa.quantity_initial ?? 0),
      quantity_unit: sa.quantity_unit,
      quantity_apured: Number(sa.quantity_apured ?? 0),
      supplier_name:
        sa.supplier_name ?? sa.supplier?.name ?? 'Non renseigné',

      family_label: sa.family_label ?? null,
      scrap_percent:
        sa.scrap_percent != null ? Number(sa.scrap_percent) : null,
      scrap_quantity_ton:
        sa.scrap_quantity_ton != null
          ? Number(sa.scrap_quantity_ton)
          : null,
      amount_ds:
        sa.amount_ds != null ? Number(sa.amount_ds) : null,
      currency_code: sa.currency_code ?? null,
    };
  });
}

export default async function SaPage() {
  const items = await loadSa();
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
          <h1 className="text-xl font-semibold">Déclarations SA</h1>
          <p className="text-sm text-slate-500">
            Suivi des admissions temporaires (SA) et de leur apurement.
          </p>
        </div>
        <div>
          <SaControls email={email} roles={roles} />
        </div>
      </div>
      <SaTable items={items} />
    </div>
  );
}
