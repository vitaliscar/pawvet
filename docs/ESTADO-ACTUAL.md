# Estado de PAWVET — 24 de octubre de 2026

El directorio aún no tiene .git. El código usa PocketBase; Supabase y Clerk aparecen solo en documentos históricos. PocketBase 0.40.6 y las dependencias de API/web están instaladas localmente. Las credenciales de desarrollo se guardan en archivos ignorados.

## Operativo ahora

- PocketBase aplica dos migraciones y crea ocho colecciones. El superusuario autentica y la API administrativa devolvió HTTP 200 desde la base local.
- La API Hono valida entradas con Zod y cifra datos médicos con AES-256-GCM. El usuario del panel tiene rol admin; la web comprueba el rol antes de abrir /dashboard.
- La portada web presenta PAWVET con identidad propia y comunica que la reserva aún está en preparación. API y web compilan.
- Docker Compose incluye PocketBase persistente, API, web y Nginx. La configuración pasa docker compose config; el daemon Docker no estaba disponible para probar la imagen.

## Resuelto

- Filtros de auditoría escapados con `pb.filter`; rutas de dueños/mascotas solo para rol owner; el panel lee `created`.
- Motor de citas: catálogo `vet_services`, grilla de 60 min, precio con traslado, máquina de estados y cancelación con motivo. Índices únicos impiden doble cupo y reservas duplicadas por reintento (verificado: dos reservas simultáneas → 201 y 409).
- Búsqueda y reserva ya no exigen suscripción (fuera del piloto).

## Pendientes prioritarios

1. Aprobar el alcance del piloto en [PILOTO.md](PILOTO.md): comunas, plazo de cancelación y regla de cobertura.
2. Completar métricas del panel admin y un panel mínimo para veterinarios (servicios, agenda, notas clínicas).
3. Construir la reserva web para tutores contra la API real.
4. Corregir las coordenadas de marcadores en móvil y completar «Agendar».
5. Probar contenedores y certificados TLS cuando Docker esté disponible. Revisar el plan histórico en docs/CLAUDE.md antes de usarlo como guía.

La comparación de servicios y el modelo de piloto están en [MODELO-NEGOCIO-REFERENTES.md](MODELO-NEGOCIO-REFERENTES.md).
