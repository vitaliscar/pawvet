export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-paw-900">Resumen</h1>
      <p className="mt-2 text-sm text-ink/70">
        Panel de administración PAWVET. Usa el menú lateral para verificar veterinarios,
        revisar citas y consultar los registros de auditoría.
      </p>
      {/* TODO(FASE 1): métricas — vets pendientes, citas de hoy, suscripciones activas */}
    </div>
  );
}
