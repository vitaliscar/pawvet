# PAWVET — Copias de seguridad y restauración

## Qué se respalda

| Qué | Dónde | Cómo |
| --- | --- | --- |
| Base de datos (PocketBase) | volumen `pocketbase_data` → `/pb/pb_data/backups/*.zip` | Automático diario 07:00 UTC, se guardan 14 (migración `1761264005`) |
| `MEDICAL_DATA_ENCRYPTION_KEY` | gestor de contraseñas del equipo + copia impresa en lugar seguro | Manual, una vez y en cada rotación |
| `backend/.env` y `frontend-web/.env.production` | gestor de contraseñas del equipo | Manual en cada cambio |

**Sin la clave médica, un backup restaurado deja los historiales clínicos ilegibles.**
Nunca guardes la clave junto a los zip de backup.

## Copia fuera del servidor (obligatoria antes del piloto)

Los zip viven en el mismo VPS: si el disco falla se pierden. Elige una opción:

1. **S3 compatible (recomendado):** en el panel de PocketBase → Settings → Backups → S3
   (Backblaze B2, Cloudflare R2 o AWS). PocketBase sube cada backup automáticamente.
2. **Copia diaria con rsync** desde otra máquina:
   ```bash
   rsync -az usuario@vps:/var/lib/docker/volumes/infra_pocketbase_data/_data/backups/ ./pawvet-backups/
   ```

## Backup manual (antes de migraciones o despliegues)

```bash
TOKEN=$(curl -s -X POST https://api.pawvet.net/pb/api/collections/_superusers/auth-with-password \
  -H 'Content-Type: application/json' -d '{"identity":"ADMIN_EMAIL","password":"ADMIN_PASSWORD"}' | jq -r .token)
curl -X POST https://api.pawvet.net/pb/api/backups -H "Authorization: $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"pre_deploy.zip"}'
```

## Restaurar

1. Detén PocketBase: `docker compose -f infra/docker-compose.yml stop pocketbase`.
2. Copia el `pb_data` actual a un lado (no lo borres hasta validar).
3. Descomprime el zip elegido en un `pb_data` vacío (contiene `data.db` y `auxiliary.db`).
4. Arranca PocketBase: aplica solo las migraciones posteriores al backup.
5. Valida: cantidad de `users`, `appointments` y `pets`; abre una cita con notas clínicas
   desde el panel del vet para comprobar que se descifran con la clave actual.

Alternativa sin consola: panel de PocketBase → Settings → Backups → Restore.

## Simulacro verificado

24-10-2026, PocketBase 0.40.6: backup por API (326 KB) → restaurado en directorio
limpio → conteos idénticos (users 24, appointments 8, pets 11, vet_services 8).
Repetir el simulacro una vez al mes durante el piloto.
