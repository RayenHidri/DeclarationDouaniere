'use client';

export default function SaControls() {
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
      <a
        href="/sa/new"
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Nouvelle SA
      </a>

      <button
        onClick={handleExport}
        className="rounded-md border px-3 py-1.5 text-sm font-medium"
      >
        Exporter Excel
      </button>
    </div>
  );
}
