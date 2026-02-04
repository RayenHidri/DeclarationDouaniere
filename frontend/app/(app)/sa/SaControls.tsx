'use client';

import { Button } from '@/components/ui/button';

type Props = { email: string | null, roles: string[] };
export default function SaControls({ email, roles }: Props) {
  async function handleExport() {
    try {
      const res = await fetch('/api/sa/export');
      if (!res.ok) return;
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sa_export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      // silent for now; user can see console
      console.error('Export failed', err);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Only show add SA for achat@intermetal.com or ACHAT/ADMIN role */}
      {(
        email === 'achat@intermetal.com' ||
        (roles && (roles.includes('ACHAT') || roles.includes('ADMIN')))
      ) && (
          <a href="/sa/new">
            <Button size="sm">
              Nouvelle SA
            </Button>
          </a>
        )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
      >
        Exporter Excel
      </Button>
    </div>
  );
}
