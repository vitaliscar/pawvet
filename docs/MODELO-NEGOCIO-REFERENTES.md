# PAWVET: modelos de negocio y prácticas observadas

Revisión del 24 de octubre de 2026. Usé REA para inspeccionar las páginas públicas, perfiles y primeros pasos de reserva en escritorio y móvil. También abrí las aplicaciones web públicas de Clinipet y PetCheck. No accedí a cuentas privadas ni completé pagos; cifras de ventas, retención y costos internos no son observables desde estas páginas.

## Cuatro modelos comparables

| Referente | Cómo atrae y atiende | Ingreso visible | Aprendizaje para PAWVET |
| --- | --- | --- | --- |
| [EncuentraVet](https://www.encuentravet.cl/planes) | Directorio por comuna y especialidad; perfil verificado, precios, horarios, reseñas, reserva y WhatsApp. | Listado gratuito, 0% de comisión y planes para profesionales desde $9.990/mes; cobra por herramientas y visibilidad. | La verificación no se compra. Dar acceso gratis crea oferta; cobrar cuando el veterinario reciba valor medible. |
| [Clinipet](https://www.clinipet.cl/) | Software para clínicas y veterinarios a domicilio; agenda, fichas, cobros y app del tutor. | Clínica gratis si conecta Mercado Pago; tutor paga 5% por reserva, con tope de $800. Alternativa: suscripción de $23.990/mes para la clínica. | Explica quién paga y cuánto antes de pedir registro. Evita cobrar simultáneamente a ambos lados sin una propuesta clara. |
| [PetCheck](https://www.petcheck.cl/) | Plataforma de atención a domicilio y teleconsulta. El [flujo público](https://app.petcheck.cl/booking/pet-service) ordena servicio, ubicación, fecha y pago, con resumen y precios visibles. | Vende servicios al tutor; su margen o acuerdo con veterinarios no está publicado. Sus [términos](https://www.petcheck.cl/terminos-condiciones/) describen profesionales independientes. | Usar cobertura y precio final antes de confirmar. Mostrar quién atenderá y qué incluye el servicio. |
| [HomeVet Care](https://homevetcare.cl/index.php) | Servicio operado bajo una marca: agenda online o WhatsApp, visita, teleconsulta y paquetes de exámenes. | Cobra servicios y paquetes; no muestra una tarifa de marketplace. | WhatsApp sirve como respaldo operativo y los paquetes elevan el valor de clientes recurrentes. |

## Modelo recomendado para PAWVET

**Marketplace curado de visitas veterinarias a domicilio.** El tutor reserva gratis con precio total visible; paga la atención directamente al veterinario durante el piloto. El veterinario entra gratis tras verificar identidad y título. Una suscripción opcional para profesionales puede financiar agenda avanzada, recordatorios, estadísticas y mayor exposición cuando PAWVET demuestre que trae pacientes. La verificación y la seguridad nunca dependen del plan pagado.

Esta elección combina la adquisición local de EncuentraVet con la claridad de reserva de PetCheck. Un SaaS clínico completo como Clinipet exige muchos módulos ajenos a la primera reserva. Una operación propia como HomeVet Care exige contratar o coordinar capacidad clínica directamente. El precio y la disposición a pagar por una suscripción son **hipótesis** para validar, no datos probados de PAWVET.

## Cómo operarlo y validarlo

1. Reclutar 5–10 veterinarios en dos comunas contiguas de Santiago y verificar sus credenciales antes de publicarlos.
2. Publicar cuatro servicios iniciales con duración, comunas cubiertas, recargo por traslado y precio final. El veterinario define horarios y tiempo de traslado entre visitas.
3. Permitir elegir servicio, dirección y hora disponible desde la web móvil. Enviar confirmación y recordatorio; ofrecer WhatsApp si falla la reserva.
4. Registrar atención completada, cancelación, seguimiento y reseña. Medir reservas completadas por veterinario, conversión de búsqueda a reserva, inasistencias, repetición y costo de adquisición.
5. Tras cuatro semanas, preguntar a los veterinarios cuánto pagarían por las reservas adicionales y probar **un** plan de pago. Mantener la reserva gratuita para tutores mientras se mide conversión.

## Brecha frente al código actual

Las reglas de escritura de PocketBase ya quedaron cerradas. Antes del piloto, cambiar `backend/src/routes/search.ts` para que los veterinarios verificados gratuitos aparezcan sin exigir `subscription_status='active'`. Completar en `appointments.ts` disponibilidad real, bloqueo de doble reserva, precio con traslado y transiciones de estado. La web presenta el servicio y el panel admin; falta la reserva para tutores. La app móvil muestra todos los marcadores en la posición del usuario y todavía no agenda.
