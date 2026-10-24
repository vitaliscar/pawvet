# Estado de PAWVET — 24 de octubre de 2026

El directorio aún no tiene .git. El código usa PocketBase; Supabase y Clerk aparecen solo en documentos históricos. PocketBase 0.40.6 y las dependencias de API/web están instaladas localmente. Las credenciales de desarrollo se guardan en archivos ignorados.

## Operativo ahora

- PocketBase aplica dos migraciones y crea ocho colecciones. El superusuario autentica y la API administrativa devolvió HTTP 200 desde la base local.
- La API Hono valida entradas con Zod y cifra datos médicos con AES-256-GCM. El usuario del panel tiene rol admin; la web comprueba el rol antes de abrir /dashboard.
- La portada web presenta PAWVET con identidad propia y comunica que la reserva aún está en preparación. API y web compilan.
- Docker Compose incluye PocketBase persistente, API, web y Nginx. La configuración pasa docker compose config; el daemon Docker no estaba disponible para probar la imagen.

## Pendientes prioritarios

1. Escapar los filtros de auditoría en backend/src/routes/admin.ts. La ruta exige admin, pero parámetros maliciosos pueden alterar el filtro.
2. Completar citas: disponibilidad, prevención de doble reserva, precio y transiciones de estado. La reserva pública no debe abrirse antes.
3. Corregir la fecha de auditoría en la web: el panel lee created_at y PocketBase entrega created. Completar métricas pendientes del panel.
4. Corregir roles inconsistentes en rutas de dueños/mascotas y las coordenadas de marcadores en móvil.
5. Probar contenedores y certificados TLS cuando Docker esté disponible. Revisar el plan histórico en docs/CLAUDE.md antes de usarlo como guía.

La comparación de servicios y el modelo de piloto están en [MODELO-NEGOCIO-REFERENTES.md](MODELO-NEGOCIO-REFERENTES.md).
