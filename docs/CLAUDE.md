# 🐾 PAWVET — Instrucciones de Desarrollo

**Proyecto:** Plataforma de Citas Veterinarias a Domicilio  
**Mercado:** Chile  
**Team:** [Tu Nombre + Equipo]

---

## 🎯 **Misión**

Conectar dueños de mascotas con veterinarios verificados para citas a domicilio o en consultorio. Sistema de suscripción veterinaria con seguridad médica de nivel hospitalario.

---

## 📋 **Decisiones Confirmadas**

### **Branding**
```
Nombre:     PAWVET (Paw + Veterinario)
Concepto:   Huella Amiga
Dominio:    pawvet.net
Email:      info@pawvet.net, support@pawvet.net, noreply@pawvet.net
```

### **Infraestructura**
```
VPS:        Hetzner CX31 (2vCores, 8GB, 160GB SSD, €9.90/mes)
SO:         Ubuntu 22.04 LTS
Containers: Docker + Docker Compose
Proxy:      Nginx
SSL:        Let's Encrypt (HTTPS)
Ubicación:  Falkenstein, Germany
```

### **Stack Tech (FINAL)**
```
Frontend Móvil:     React Native + Expo (iOS/Android)
Frontend Web:       Next.js 14 + TypeScript
Backend:            Node.js + Hono + TypeScript
Base de Datos:      Supabase (PostgreSQL)
Autenticación:      Clerk (2FA nativo)
Geolocalización:    Google Maps API
Pagos:              Transbank WebPay
Email Transaccional: SendGrid
Push Notif:         Firebase Cloud Messaging
Encriptación:       AES-256 (reposo) + TLS 1.3 (tránsito)
WAF:                Cloudflare
Security Audit:     Cyber Neo (OWASP 2025)
```

---

## 🔐 **SEGURIDAD (NO NEGOCIABLE)**

### **Datos Médicos**
```
✅ Encriptación AES-256 end-to-end
✅ RLS (Row Level Security) en Supabase
✅ Cada usuario ve SOLO sus datos
✅ Auditoría completa (pgAudit)
✅ Retención 3 años máximo
```

### **Autenticación**
```
✅ Clerk: 2FA obligatorio veterinarios
✅ JWT: 15 min access, 7 días refresh
✅ Rate limiting: 5 intentos/15 min login
✅ Sessions: máximo 3 dispositivos simultáneos
✅ Validación HTTPS/TLS 1.3 siempre
```

### **Datos Bancarios**
```
✅ Transbank maneja tarjetas (NO nosotros)
✅ Solo almacenar: transaction_id, amount, status
✅ NUNCA guardar números de tarjeta
✅ Tokens de pago de Transbank
```

### **Verificación de Veterinarios**
```
✅ RUT validado contra SII
✅ Licencia verificada Colegio de Veterinarios
✅ Admin verifica documentos manualmente
✅ Firma digital acuerdo independiente
✅ Renovación anual de credenciales
✅ Seguro responsabilidad civil obligatorio
```

---

## 🚀 **BUILD ORDER (20 Semanas, 5 Fases)**

### **FASE 1: Core Backend + Admin (Semanas 1-4)**

**Tasks:**
- [ ] Infraestructura Hetzner: Docker, Nginx, SSL, firewall
- [ ] Supabase: schema completo, RLS policies, pgAudit
- [ ] Clerk: integración auth + 2FA setup
- [ ] Hono API:
  - [ ] Auth endpoints (signup, login, refresh)
  - [ ] Users CRUD (dueños, vets, admin)
  - [ ] Veterinarians: CRUD + verificación
  - [ ] Appointments: CRUD + estado
  - [ ] Geolocalización búsqueda vets (Google Maps)
- [ ] Next.js admin dashboard:
  - [ ] Login
  - [ ] Panel: verificar vets
  - [ ] Ver citas
  - [ ] Audit logs viewer

**Deliverable:** API funcionando + admin web básico

---

### **FASE 2: Mobile App + Pagos (Semanas 5-8)**

**Tasks:**
- [ ] React Native + Expo:
  - [ ] Setup proyecto
  - [ ] Login (Clerk)
  - [ ] Home: mapa con vets cercanos
  - [ ] Filtro: radio + tipo servicio
  - [ ] Perfil vet: precios, rating, disponibilidad
  - [ ] Agendar cita: date/time picker
- [ ] Transbank WebPay:
  - [ ] Integración API
  - [ ] Suscripción recurrente
  - [ ] Webhooks procesamiento
- [ ] Firebase Cloud Messaging:
  - [ ] Push setup
  - [ ] Notificaciones cita confirmada
- [ ] Supabase Realtime:
  - [ ] Live updates de citas
  - [ ] Cambios estado en tiempo real

**Deliverable:** App móvil en TestFlight + Play Store Beta

---

### **FASE 3: Seguridad + Compliance (Semanas 9-12)**

**Tasks:**
- [ ] Encriptación:
  - [ ] AES-256 historiales médicos
  - [ ] Encrypted fields en BD
- [ ] RLS Policies:
  - [ ] Dueño ve SOLO sus mascotas/citas
  - [ ] Vet ve SOLO sus citas
  - [ ] Admin ve todo
- [ ] Auditoría:
  - [ ] pgAudit en Supabase
  - [ ] Audit logs API endpoint
  - [ ] Dashboard de accesos
- [ ] Documentos Legales:
  - [ ] Términos de Servicio
  - [ ] Política Privacidad (Ley 19.628)
  - [ ] Acuerdo Vet Independiente
  - [ ] Política Arbitraje
  - [ ] Publicar web + app
- [ ] 2FA:
  - [ ] Obligatorio en signup vet
  - [ ] TOTP authenticator
- [ ] Cyber Neo:
  - [ ] /cyber-neo scan completo
  - [ ] Fix 0 critical findings

**Deliverable:** App 100% segura, docs legales listos

---

### **FASE 4: Verificación Vet + Admin (Semanas 13-16)**

**Tasks:**
- [ ] Validación RUT:
  - [ ] Integración SII (si existe API)
  - [ ] Manual verification fallback
- [ ] Colegio Veterinarios:
  - [ ] Admin carga lista de vets colegiados
  - [ ] Validación automática por licencia
  - [ ] Renovación anual
- [ ] Admin Dashboard:
  - [ ] Panel vets pendientes
  - [ ] Aprobar/rechazar
  - [ ] Ver audit logs
  - [ ] Gestionar suscripciones
  - [ ] Soporte tickets
- [ ] Webhooks:
  - [ ] Clerk → BD sincronización
  - [ ] Transbank → BD confirmación pago
  - [ ] Citas cambio estado → notificaciones

**Deliverable:** Sistema verificación funcional, admin robusto

---

### **FASE 5: Testing + Deploy (Semanas 17-20)**

**Tasks:**
- [ ] Unit Tests:
  - [ ] 80%+ cobertura
  - [ ] Vitest (backend)
  - [ ] Jest (frontend)
- [ ] E2E Tests (Playwright):
  - [ ] Dueño: signup → buscar vet → agendar cita
  - [ ] Vet: signup → aceptar cita
  - [ ] Admin: verificar vet
- [ ] Load Testing:
  - [ ] Geolocalización 1000 req/s
  - [ ] Websockets simultáneos
- [ ] Security Pentest:
  - [ ] Profesional externo
  - [ ] Vulnerabilidades corregidas
- [ ] Monitoring 24/7:
  - [ ] Sentry: error tracking
  - [ ] Datadog/New Relic: performance
  - [ ] Alertas automáticas
- [ ] Deploy Production:
  - [ ] Docker images buildadas
  - [ ] Cloudflare activo
  - [ ] Backups automatizados
  - [ ] Comunicación Colegio Veterinarios

**Deliverable:** PAWVET en producción, monitoreado, seguro

---

## 📋 **Checklists de Calidad**

### **Pre-Commit**
```
[ ] TypeScript strict mode (no any)
[ ] ESLint pasando
[ ] Prettier formateado
[ ] No console.logs en producción
[ ] No hardcoded secrets (.env only)
[ ] Tests pasen (si aplica)
```

### **Pre-Push**
```
[ ] Código review completado (2 approvals mínimo)
[ ] Tests 80%+ cobertura
[ ] No secrets en git (git-secrets)
[ ] Branch actualizado con main
[ ] CI/CD pasando
```

### **Pre-Launch**
```
[ ] Cyber Neo: 0 critical findings
[ ] Abogado: docs legales aprobados
[ ] Security pentest: issues corregidos
[ ] Monitoring: alertas configuradas
[ ] Backups: verificados y automatizados
[ ] Beta testing: 10-20 vets probaron
[ ] Seguros: responsabilidad civil activo
```

---

## 🔧 **Git Workflow**

```
main
  ↓
develop (staging)
  ↓
feature/nombre → PR → review → merge develop
  ↓
release/vX.X.X → testing → merge main + develop

Commits:
  feat: add geolocation search
  fix: correct timezone handling
  docs: update database schema
  test: add unit tests for payments
  chore: update dependencies
```

---

## 🤝 **Reglas de Desarrollo**

### **Code Quality**
- TypeScript strict mode siempre
- Funciones < 50 líneas
- Archivos < 800 líneas
- No nesting > 4 niveles
- Error handling explícito
- Immutable data structures

### **Security**
- Validar inputs en backend + frontend
- SQL parameterizado (Drizzle ORM)
- Sanitizar user input (XSS)
- JWT siempre (no sessions)
- Rate limiting en endpoints sensibles

### **Performance**
- LCP < 2.5s (web)
- INP < 200ms (web)
- Bundle < 300kb gzipped (Next.js)
- API response < 200ms

### **Testing**
- Unit: 80%+ cobertura
- E2E: happy path + edge cases
- Manual: antes de deploy
- Load test: geolocalización

---

## 📞 **Agentes/Skills a Usar**

| Tarea | Agente | Cuándo |
|-------|--------|--------|
| Bugs | debugger | Problema no entiende |
| Código | code-reviewer | Después de escribir |
| Security | security-reviewer | Inputs/auth/pagos |
| Performance | performance-optimizer | Lento detectado |
| Build error | build-error-resolver | Build falla |
| Tests | tdd-guide | Nueva feature |
| Seguridad cibernética | /cyber-neo | Cada 2 sprints |

---

## 🎯 **Recursos**

- **Blueprint:** pawvet-blueprint.md
- **Documentos Legales:** legal-templates.md
- **Setup Infraestructura:** PAWVET-INFRA-SETUP.md
- **Skillset:** /cyber-neo (seguridad)
- **Transbank Docs:** https://www.transbank.com/desarrolladores
- **Supabase Docs:** https://supabase.com/docs
- **Clerk Docs:** https://clerk.com/docs

---

## ✅ **Lanzamiento**

```
1. [ ] Cyber Neo: 0 critical
2. [ ] Abogado: docs aprobados
3. [ ] 10-20 vets beta testing
4. [ ] Monitoring activo
5. [ ] Comunicación Colegio Veterinarios
6. [ ] Campaña marketing
7. [ ] LANZAR 🚀
```

---

**Proyecto PAWVET está 100% documentado y listo para desarrollo.**

¿Dudas? Revisa los archivos o contacta a [responsable].

