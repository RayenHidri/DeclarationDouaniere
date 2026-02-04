import type { ReactNode } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LogoutButton } from './LogoutButton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

  // Styles communs pour les liens de navigation
  const navLinkClass =
    'text-sm font-medium text-muted-foreground transition-colors hover:text-primary';

  return (
    <div className="min-h-screen bg-muted/40 font-sans antialiased">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4">

          {/* Logo / Brand */}
          <div className="mr-8 flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold tracking-tight">SAE</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Suivi Douane
              </span>
            </div>
          </div>

          {/* Navigation Principale */}
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/sa" className={navLinkClass}>
              SA
            </Link>
            <Link href="/ea" className={navLinkClass}>
              EA
            </Link>
            <Link href="/apurement" className={navLinkClass}>
              Apurement
            </Link>
          </nav>

          {/* Séparateur flexible pour pousser le reste à droite */}
          <div className="flex-1" />

          {/* Navigation Secondaire (Référentiels) + User */}
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4 text-sm border-r pr-4 mr-1 border-border/50">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider hidden md:inline-block">
                Référentiel
              </span>
              <Link href="/suppliers" className={navLinkClass}>
                Fournisseurs
              </Link>
              <Link href="/customers" className={navLinkClass}>
                Clients
              </Link>
            </nav>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  );
}
