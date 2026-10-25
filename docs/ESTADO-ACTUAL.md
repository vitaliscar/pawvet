# Estado de PAWVET — 24 de octubre de 2026

El código del piloto está completo. CI (6 jobs) verifica en cada cambio: tipos y tests
del backend (18), web, app móvil, E2E contra PocketBase y API reales, build de las 3
imágenes Docker y escaneo de secretos.

## Por fase

| Fase | Estado | Verificación |
| --- | --- | --- |
| 0 — Piloto | Propuesta escrita ([PILOTO.md](PILOTO.md)); falta aprobación | — |
| 1 — Base de datos | 7 migraciones idempotentes, backup diario, decisión documentada | Simulacro de restauración con conteos idénticos |
| 2 — Permisos y datos sensibles | Filtros escapados, campos personales ocultos, rotación de clave médica | E2E: matriz owner/vet/admin vía API y PocketBase directo |
| 3 — Motor de citas | Servicios, grilla de 60 min, precio con traslado, estados, idempotencia | Dos reservas simultáneas → 201 y 409 (CI) |
| 4 — Operación interna | Panel admin con métricas; panel vet (agenda, notas cifradas, servicios, disponibilidad, perfil) | Cita operada de principio a fin en navegador |
| 5 — Reserva web | Registro, reserva en 5 pasos, mis citas, portada con cobertura y condiciones | Reserva completa en navegador a 390 px |
| 6 — Diseño | Mobile-first, animaciones con `motion-safe`, SEO e ícono | Lighthouse móvil 100/100/100 en portada y registro |
| 7 — App móvil | Sesión en llavero, marcadores reales, alternativa a ubicación, reserva y mis citas | Typecheck + bundle Android; falta build EAS en dispositivo |
| 8 — Comunicaciones | Correos de reserva, confirmación, cancelación y recordatorio | Simulacro de recordatorio: 1 envío y luego 0. Cobros: fuera del piloto |
| 9 — Lanzamiento | E2E y Docker en CI, métricas del piloto en el panel | Falta desplegar y medir 4 semanas |

## Lo que queda

Todo lo pendiente requiere decisiones, cuentas o acciones de personas:
ver [LANZAMIENTO.md](LANZAMIENTO.md).

## Límites conocidos

- Grilla fija de 60 min por cita (servicio + traslado); servicios más largos requieren bloques contiguos.
- Rate limiter y recordatorios en memoria: correctos con una sola instancia de la API.
- La cobertura se apoya en la comuna elegida al registrarse y en el radio de búsqueda; no hay polígono de comuna.
