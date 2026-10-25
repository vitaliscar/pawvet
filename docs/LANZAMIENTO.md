# PAWVET — Lista de lanzamiento del piloto

El código del piloto está completo y verificado en CI. Estos pasos requieren
decisiones, cuentas o acciones de personas. Orden sugerido:

## 1. Decisiones (Fase 0 y 1)

- [ ] Aprobar [PILOTO.md](PILOTO.md): comunas, plazo de cancelación y regla de cobertura.
- [ ] Aprobar [DECISION-POCKETBASE.md](DECISION-POCKETBASE.md) y la frecuencia de backup.
- [ ] Revisar con abogado `legal-templates.md` (términos, privacidad Ley 19.628, acuerdo de veterinario independiente).

## 2. Cuentas y secretos

- [ ] Generar `MEDICAL_DATA_ENCRYPTION_KEY` (`openssl rand -hex 32`) y guardarla en el gestor de contraseñas **y** en copia física.
- [ ] Cuenta SendGrid: dominio `pawvet.net` verificado (SPF/DKIM) y `SENDGRID_API_KEY` en `backend/.env`.
- [ ] Bucket S3 compatible (B2, R2 o AWS) configurado en PocketBase → Settings → Backups.
- [ ] Cuenta Expo: `cd mobile && npx eas login && npx eas build -p android --profile preview`.

## 3. Despliegue (Hetzner)

- [ ] `docker compose -f infra/docker-compose.yml up -d --build` (las imágenes ya compilan en CI).
- [ ] Certificados TLS en `/etc/letsencrypt` y DNS de `pawvet.net` y `api.pawvet.net` vía Cloudflare.
- [ ] Crear el superusuario de PocketBase y la cuenta admin del panel (rol `admin`).
- [ ] Monitoreo externo de `https://api.pawvet.net/health` cada 5 min (UptimeRobot o similar) con alerta al correo del equipo.
- [ ] Simulacro de restauración en el servidor ([infra/RESTAURACION.md](../infra/RESTAURACION.md)).

## 4. Veterinarios

- [ ] Reclutar 5–10 en las comunas del piloto.
- [ ] Verificar RUT, título, seguro y acuerdo firmado; aprobar en `/dashboard/vets`.
- [ ] Cada vet completa `/vet/perfil` (comuna base), `/vet/servicios` y `/vet/disponibilidad`.

## 5. Piloto medido (4 semanas)

- [ ] Abrir la reserva a tutores de las dos comunas.
- [ ] Revisar semanalmente `/dashboard` → sección Piloto: búsqueda→reserva, completadas,
      cancelación y reservas por veterinario.
- [ ] Al cierre: decidir ampliación de comunas y modelo de cobro (Fase 8: Transbank).
