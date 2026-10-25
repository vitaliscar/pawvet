# Decisión: ¿PocketBase para los datos clínicos del piloto?

Estado: **recomendación pendiente de aprobación** (Fase 1) · 24-10-2026

## Recomendación

**Sí para el piloto** (2 comunas, 5–10 veterinarios), con las mitigaciones de abajo y
criterios explícitos para migrar a PostgreSQL antes de ampliar.

## Por qué alcanza para el piloto

- **Volumen:** decenas de citas al día. SQLite con un solo servidor atiende esto con margen.
- **Integridad de reservas:** la base impide el doble cupo con un índice único y la CI lo
  verifica en cada cambio (`npm run e2e`, job `e2e`).
- **Datos clínicos:** se cifran en la API (AES-256-GCM) antes de llegar a PocketBase; un
  volcado de la base no expone historiales sin la clave.
- **Permisos:** reglas por colección cerradas para escrituras; la API es la única vía de
  escritura y la matriz owner/vet/admin está automatizada (44 comprobaciones).
- **Respaldo:** backup diario automático y restauración probada (`infra/RESTAURACION.md`).

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| PocketBase aún no es 1.0: puede romper compatibilidad entre versiones | Versión fijada (`PB_VERSION=0.40.6` en Dockerfile y CI); actualizar solo tras correr el E2E y un simulacro de restauración |
| Un solo servidor: si cae el VPS, cae el servicio | Backup externo diario (S3/rsync) y procedimiento de restauración probado; aceptable para un piloto |
| Sin réplica ni recuperación a un punto en el tiempo | Pérdida máxima de 24 h de datos; reducir a 6 h con cron `0 */6 * * *` si el piloto lo requiere |
| Consultas analíticas limitadas | Métricas del piloto por API; exportar a CSV si hace falta |

## Cuándo migrar a PostgreSQL

Migrar antes de cumplir **cualquiera** de estos hitos:

1. Más de 2 comunas o más de 30 veterinarios activos.
2. Requisito contractual o legal de réplica, alta disponibilidad o recuperación a un punto en el tiempo.
3. Más de una instancia de la API (el rate limiter en memoria también debe pasar a Redis).
4. Una actualización de PocketBase que rompa migraciones o reglas.

El modelo de datos histórico en `supabase/migrations/` sirve como punto de partida.

## Pendiente de decidir

- Proveedor de backup externo (B2, R2 o AWS) y quién custodia la clave médica.
- Frecuencia de backup: diaria (actual) o cada 6 h.
