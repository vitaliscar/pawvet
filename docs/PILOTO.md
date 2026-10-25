# PAWVET — Alcance del piloto

Estado: **aprobado el 24-10-2026** (Fase 0), tal como está escrito. Decisiones tomadas:
comunas Providencia y Ñuñoa; cancelación del tutor sin costo hasta la hora de inicio;
cobertura por la comuna elegida al registrarse más el radio de búsqueda.

## Comunas

Providencia y Ñuñoa (Santiago). Son contiguas, densas en hogares con mascotas
y permiten traslados cortos entre visitas. _Decisión:_ confirmar o reemplazar
por otro par contiguo.

## Servicios

Cuatro servicios, todos a domicilio. Cada veterinario define precio y duración
(15–60 min) en `PUT /api/vets/me/services`.

| Código | Servicio | Duración sugerida |
| --- | --- | --- |
| `general_consult` | Consulta general a domicilio | 45 min |
| `vaccination` | Vacunación | 30 min |
| `deworming` | Desparasitación | 20 min |
| `wellness_check` | Control preventivo | 40 min |

## Cobertura y agenda

- Cada cita ocupa un bloque de 60 min que incluye atención y traslado.
- El veterinario publica ventanas semanales en `PUT /api/vets/me/availability`;
  la API ofrece solo bloques completos dentro de ellas (`GET /api/vets/:id/slots`).
- Precio final = precio del servicio + recargo de traslado del veterinario. Se
  muestra antes de confirmar.
- Solo aparecen veterinarios verificados por un admin. No se exige suscripción.
- _Decisión:_ cómo restringir la dirección a las dos comunas (lista de comunas
  por veterinario o polígono). Hoy se guarda la ubicación y la distancia.

## Flujo de reserva

1. El tutor crea su cuenta y registra su mascota.
2. Busca veterinarios por ubicación y elige servicio.
3. Elige día y bloque libre; ve el precio final.
4. Confirma. La cita queda `pending`; la API impide dos reservas del mismo bloque
   y reintentos duplicados.
5. El veterinario confirma (`confirmed`) y, tras la visita, la completa (`completed`)
   y registra notas clínicas cifradas.
6. El tutor paga directamente al veterinario. PAWVET no cobra en el piloto.

Cancelación: tutor, veterinario o admin pueden cancelar una cita pendiente o
confirmada antes de su inicio, con motivo opcional. _Decisión:_ plazo mínimo de
aviso (hoy: hasta la hora de inicio).

## Veterinarios

Reclutar 5–10 en las dos comunas. Requisitos para publicarlos: RUT, título o
inscripción vigente, seguro de responsabilidad civil y acuerdo de profesional
independiente firmado. Un admin aprueba en `/dashboard/vets`.

## Medición (4 semanas)

Búsqueda → reserva, citas completadas, cancelaciones e inasistencias, y reservas
por veterinario. Ampliar comunas solo con estos datos.
