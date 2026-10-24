# VetConnect — CLAUDE.md para Desarrollo

**Copiar este archivo a tu proyecto como `CLAUDE.md`**

---

## 🎯 Misión

Plataforma de citas veterinarias a domicilio en Chile. Dueños de mascotas buscan vets cercanos (radio seleccionable), agendan citas, vets verificados manejan su calendario. Sistema de suscripción veterinaria + pagos Transbank. Seguridad médica de nivel hospitalario.

---

## 🔧 Stack Tech (Decidido)

```
Frontend Móvil:    React Native + Expo (iOS/Android compartido)
Frontend Web:      Next.js 14 + TypeScript
Backend:           Node.js + Hono + TypeScript
Base de Datos:     Supabase (PostgreSQL)
Autenticación:     Clerk (2FA nativo)
Geolocalización:   Google Maps API
Pagos:             Transbank WebPay
Emails:            SendGrid
Push Notif:        Firebase Cloud Messaging (FCM)
Hosting:           VPS + Docker + Nginx
Encriptación:      AES-256 (reposo) + TLS 1.3 (tránsito)
WAF:               Cloudflare
Security Audit:    Cyber Neo (OWASP 2025)
```

---

## 🔐 SEGURIDAD (NO NEGOCIABLE)

### Datos Médicos
- **Encriptados end-to-end** (AES-256)
- Historiales visibles SOLO para: vet + dueño de mascota
- RLS (Row Level Security) en Supabase: fuerza esto a nivel BD

### Datos Bancarios
- **Transbank maneja tarjetas** (nosotros NO almacenamos números)
- SOLO almacenar: transaction_id, monto, estado
- Tokens de pago de Transbank

### Autenticación
- 2FA **OBLIGATORIO** para veterinarios (Clerk lo maneja)
- Dueños: email/password o Google OAuth
- JWT tokens: 15 min access, 7 días refresh
- Sessions: máximo 3 dispositivos simultáneos

### Auditoría
- **pgAudit:** cada query a BD registrada
- **Audit logs:** quién accedió qué, cuándo, IP
- **Alertas:** acceso anómalo (vet viendo datos que no debe)
- Retención: 2 años

### Verificación de Vet
- RUT validado contra SII
- Licencia verificada Colegio Veterinarios
- Admin verifica documentos manualmente
- Renovación anual obligatoria

---

## 📋 Checklist Pre-Lanzamiento

### Seguridad Cibernética
- [ ] TLS 1.3 en producción (HTTPS everywhere)
- [ ] Encriptación AES-256 de historiales médicos
- [ ] RLS policies implementadas en Supabase
- [ ] 2FA obligatorio para vets (verificar en Clerk)
- [ ] Audit logs funcionando (pgAudit)
- [ ] Firewall VPS configurado (solo 80, 443, 22)
- [ ] Fail2Ban bloqueando brute force
- [ ] Cloudflare WAF activo
- [ ] Backups encriptados cada 6 horas
- [ ] Cyber Neo audit pasando (0 critical findings)

### Compliance Legal
- [ ] Abogado revisó Términos de Servicio
- [ ] Abogado revisó Política de Privacidad (Ley 19.628)
- [ ] Abogado revisó Acuerdo de Vet Independiente
- [ ] Abogado revisó Política de Arbitraje
- [ ] Todos los docs publicados en web + app
- [ ] Usuarios deben aceptar T&S antes de usar
- [ ] Vets firman digitalmente acuerdo independiente
- [ ] Verificación Colegio Veterinarios automatizada

### Pagos & Suscripción
- [ ] Transbank WebPay integrado
- [ ] Suscripción recurrente funcionando
- [ ] Webhooks de Transbank procesando
- [ ] Facturación SII automática
- [ ] Refunds funcionan
- [ ] Cancelación de suscripción limpia

### Testing
- [ ] Unit tests: 80%+ cobertura
- [ ] E2E tests (Playwright): happy path + edge cases
- [ ] Load testing: geolocalización aguanta 1000 req/s
- [ ] Security pentest profesional (antes de lanzar)

### Monitoring 24/7
- [ ] Sentry: errores en tiempo real
- [ ] Datadog/New Relic: performance
- [ ] AlertIf API down, DMs al team
- [ ] Logs centralizados

---

## 🏗️ Arquitectura de BD (Simplificado)

```sql
-- Usuarios (base)
users (id, clerk_id, email, role)

-- Dueños mascota
pet_owners (id, user_id, address, lat/lon, preferred_radius)

-- Veterinarios (verificados)
veterinarians (
  id, user_id, rut, license_number, 
  verified, verified_at,
  offers_home_visits, offers_clinic_visits,
  subscription_status, subscription_plan,
  independent_contractor_agreement_signed
)

-- Mascotas
pets (id, owner_id, name, species, medical_history_ENCRYPTED)

-- Citas
appointments (
  id, pet_id, vet_id, owner_id,
  service_type (home_visit|clinic_visit),
  scheduled_date, scheduled_time,
  vet_notes_ENCRYPTED, diagnosis_ENCRYPTED,
  status (pending|confirmed|completed|cancelled)
)

-- Auditoría (crítico)
audit_logs (user_id, action, resource_type, resource_id, timestamp)
```

**TODO dato médico debe tener `_ENCRYPTED` suffix para recordarte encriptar.**

---

## 🚀 Build Order (20 Semanas)

### SEMANAS 1-4: Core Backend + Web Admin
1. [ ] Infraestructura VPS (Docker, Nginx, Firewall)
2. [ ] Supabase: schema completo, RLS policies
3. [ ] Clerk: integración auth + 2FA setup
4. [ ] Hono API:
   - Auth endpoints (signup, login)
   - Users CRUD
   - Veterinarians CRUD (con verificación)
   - Appointments CRUD
5. [ ] Next.js admin dashboard (login, verificar vets, ver citas)
6. [ ] Google Maps API: búsqueda de vets por ubicación

### SEMANAS 5-8: Mobile App + Pagos
1. [ ] React Native app (Expo):
   - Login (Clerk)
   - Home: mapa con vets cercanos
   - Filtro: radio + tipo servicio
   - Perfil vet: precios, rating, disponibilidad
   - Agendar cita: date/time picker
2. [ ] Transbank WebPay: flujo suscripción
3. [ ] Firebase Cloud Messaging: push notifications
4. [ ] Supabase Realtime: cita updates en tiempo real

### SEMANAS 9-12: Seguridad + Compliance
1. [ ] Encriptación AES-256:
   - Historiales médicos en BD
   - Datos en tránsito (TLS 1.3)
2. [ ] RLS Policies: cada usuario ve SOLO sus datos
3. [ ] Auditoría:
   - pgAudit en Supabase
   - Audit logs API endpoint
4. [ ] Documentos legales:
   - T&S, Privacidad, Acuerdos
   - Publicar en web + app
   - Firma digital en signup
5. [ ] Cyber Neo: security audit inicial

### SEMANAS 13-16: Verificación Vet + Admin
1. [ ] Validación RUT automática (SII API si existe, sino manual)
2. [ ] Verificación Colegio Veterinarios:
   - Admin carga lista de vets colegiados
   - Validación automática por licencia
   - Renovación anual
3. [ ] Admin dashboard:
   - Panel de vets pendientes de verificación
   - Aprobar/rechazar
   - Ver audit logs
   - Gestionar suscripciones
4. [ ] Webhooks: Clerk → BD sincronización

### SEMANAS 17-20: Testing + Deploy
1. [ ] Unit tests (vitest): 80%+ cobertura
2. [ ] E2E tests (Playwright):
   - Dueño: buscar vet → agendar cita
   - Vet: gestionar disponibilidad → aceptar cita
   - Admin: verificar vet
3. [ ] Load testing: geolocalización
4. [ ] Security pentest profesional
5. [ ] Deploy to production:
   - Configurar VPS
   - Docker images
   - Nginx SSL
   - Cloudflare WAF
   - Monitoring (Sentry, Datadog)

---

## 🤝 Reglas de Desarrollo

### Git Workflow
```
main = producción
develop = staging (donde integras antes de main)

Para cada feature:
git checkout -b feature/nombre
... commits ...
git push -u origin feature/nombre
→ Pull Request a develop
→ Code review (2 approvals)
→ Merge
→ Luego PR develop → main
```

### Commit Messages
```
feat: add geolocation search for veterinarians
fix: correct timezone handling in appointment scheduling
docs: update database schema documentation
test: add unit tests for payment processing
chore: update dependencies
```

### Code Quality
- [ ] TypeScript strict mode
- [ ] No `any` types (especificar tipos)
- [ ] 80%+ test coverage
- [ ] ESLint passing
- [ ] Prettier formatted
- [ ] No console.logs en producción
- [ ] No hardcoded secrets (env vars only)

### Security
- [ ] No SQL injection (Drizzle ORM + parameterized)
- [ ] No XSS (sanitize user input)
- [ ] No auth bypass (verify JWT siempre)
- [ ] No secrets en git (usar .env.local, nunca commit)
- [ ] Validate ALL inputs (frontend + backend)

---

## 📚 Documentación Generada

Incluida en este proyecto:

- `vet-clinic-blueprint.md` — Arquitectura completa
- `legal-templates.md` — Templates T&S, privacidad, acuerdos
- `CLAUDE-vet-clinic.md` — Este archivo (instrucciones desarrollo)

---

## 🆘 Si Algo Falla

### Build error
→ Usa build-error-resolver agent

### Security issue found
→ Usa security-reviewer agent INMEDIATAMENTE

### Test failing
→ Usa tdd-guide agent

### Performance problem
→ Usa performance-optimizer agent

### Code quality
→ Usa code-reviewer agent después de escribir

---

## 📞 Contacto

Preguntas sobre proyecto:
- Arquitectura: [TU NOMBRE]
- Seguridad: [SECURITY LEAD]
- Legal: Abogado chileno TBD
- Devops: [DEVOPS LEAD]

---

## ✅ Lanzamiento Checklist

1. [ ] Todos los tests pasando
2. [ ] Cyber Neo audit: 0 critical findings
3. [ ] Abogado aprueba documentos legales
4. [ ] Beta testers (10-20 vets) prueban
5. [ ] Monitoring en vivo
6. [ ] Comunicación a Colegio Veterinarios (notificación)
7. [ ] Campaña de marketing
8. [ ] LANZAR 🚀

---

**Última actualización:** [HOY]
**Próxima revisión:** [2 SEMANAS]

