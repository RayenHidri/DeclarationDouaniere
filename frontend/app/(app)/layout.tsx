import type { ReactNode } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LogoutButton } from './LogoutButton';

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo / titre appli */}
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              SAE
            </span>
            <span className="text-sm font-medium text-slate-700">
              Suivi SA / EA
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6 text-sm">
            {/* Bloc navigation métier */}
            <div className="flex items-center gap-4">
              <Link href="/sa" className="text-slate-700 hover:text-blue-600">
                SA
              </Link>
              <Link href="/ea" className="text-slate-700 hover:text-blue-600">
                EA
              </Link>
              <Link
                href="/apurement"
                className="text-slate-700 hover:text-blue-600"
              >
                Apurement
              </Link>
            </div>

            {/* séparateur */}
            <div className="h-5 w-px bg-slate-200" />

            {/* Bloc référentiel */}
            <div className="flex items-center gap-3 text-xs">
              <span className="uppercase tracking-wide text-slate-400">
                Référentiel
              </span>
              <Link
                href="/suppliers"
                className="text-slate-700 hover:text-blue-600"
              >
                Fournisseurs
              </Link>
              <Link
                href="/customers"
                className="text-slate-700 hover:text-blue-600"
              >
                Clients
              </Link>
            </div>

            {/* séparateur */}
            <div className="h-5 w-px bg-slate-200" />

            {/* Déconnexion */}
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="bg-slate-50">{children}</main>
    </div>
  );
}
