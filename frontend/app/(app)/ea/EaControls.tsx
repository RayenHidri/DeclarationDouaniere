'use client';

import { Button } from '@/components/ui/button';

type Props = { email: string | null, roles: string[] };
export default function EaControls({ email, roles }: Props) {
  async function handleExport() {
    try {
      const res = await fetch('/api/ea/export');
      if (!res.ok) return;
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ea_export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Only show add EA for export@intermetal.com or EXPORT/ADMIN role */}
      {(
        email === 'export@intermetal.com' ||
        (roles && (roles.includes('EXPORT') || roles.includes('ADMIN')))
      ) && (
          <a href="/ea/new">
            <Button size="sm">
              Nouvelle EA
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
