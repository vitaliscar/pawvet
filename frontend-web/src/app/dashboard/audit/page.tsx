import { apiFetch } from '@/lib/api';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export default async function AuditPage() {
  const res = await apiFetch<AuditLog[]>('/api/admin/audit-logs?limit=50');
  const logs = res.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-paw-900">Registros de auditoría</h1>
      <p className="mt-1 text-sm text-ink/70">
        Quién accedió a qué, cuándo y desde dónde. Retención legal: 2 años.
      </p>

      {!res.success && (
        <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{res.error}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-paw-100 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-paw-50 text-left text-paw-900">
            <tr>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Acción</th>
              <th className="px-4 py-3 font-semibold">Recurso</th>
              <th className="px-4 py-3 font-semibold">Usuario</th>
              <th className="px-4 py-3 font-semibold">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-paw-100">
                <td className="whitespace-nowrap px-4 py-3">
                  {new Date(log.created_at).toLocaleString('es-CL')}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                <td className="px-4 py-3">{log.resource_type ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.user_id ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.ip_address ?? '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/60">
                  Sin registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
