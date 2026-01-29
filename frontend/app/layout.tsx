import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAE - Suivi SA / EA',
  description: 'Application interne pour le suivi des déclarations SA et EA crée par Rayen HIDRI - RRR',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
