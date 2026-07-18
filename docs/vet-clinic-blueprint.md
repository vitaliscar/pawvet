# VetConnect — Plataforma de Citas Veterinarias a Domicilio

**Arquitectura Completa | Chile | 2026**

---

## 1. VISIÓN

Marketplace que conecta dueños de mascotas con veterinarios cercanos para citas a domicilio o en consultorio. Sistema de suscripción veterinaria con verificación profesional, geolocalización en tiempo real, pagos mediante Transbank, y cumplimiento total de seguridad médica y normativa chilena.

---

## 2. STACK TECH

| Componente | Tecnología | Razón |
|-----------|-----------|-------|
| **Móvil iOS/Android** | React Native + Expo | ~80% código compartido, deployment a ambas stores simultáneo |
| **Web** | Next.js 14 + TypeScript | Admin dashboard + cliente web responsive |
| **Backend API** | Node.js + Hono + TypeScript | Lightweight, ultra-rápido, perfectamente para geolocalización real-time |
| **Base de Datos** | Supabase (PostgreSQL) | RLS (Row Level Security), Realtime, backups automáticos, compliance GDPR |
| **Autenticación** | Clerk | 2FA nativo, OAuth, mobile + web compatible |
| **Geolocalización** | Google Maps API | Precisión por metros, radio seleccionable |
| **Pagos** | Transbank WebPay | Suscripciones recurrentes (pago más usado en Chile) |
| **Email** | SendGrid | Confirmaciones, recordatorios, notificaciones |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Citas confirmadas, recordatorios en tiempo real |
| **Hosting** | VPS + Docker | Nginx reverse proxy, containerizado |
| **Encriptación** | AES-256 (reposo) + TLS 1.3 (tránsito) | Datos médicos y bancarios |
| **WAF** | Cloudflare | DDoS protection, rate limiting, bot management |
| **Security Audit** | Cyber Neo | OWASP 2025 + CWE Top 25 scanning |

---

## 3. ARQUITECTURA DE DATOS

### Usuarios (3 roles)

```sql
-- Tabla usuarios base
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role ENUM ('owner', 'vet', 'admin'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Dueño de mascota
CREATE TABLE pet_owners (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  full_name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  preferred_radius_km INT DEFAULT 10, -- usuario selecciona
  verified BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMP,
  privacy_accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Veterinario (requiere verificación)
CREATE TABLE veterinarians (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  full_name TEXT NOT NULL,
  rut TEXT UNIQUE NOT NULL, -- Cédula chilena
  license_number TEXT UNIQUE NOT NULL, -- Colegio Veterinarios
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_latitude DECIMAL(10, 8),
  clinic_longitude DECIMAL(11, 8),
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  
  -- Verificación
  verified BOOLEAN DEFAULT false,
  rut_document_url TEXT,
  license_document_url TEXT,
  verified_by_admin_id UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  
  -- Suscripción
  subscription_status ENUM ('active', 'cancelled', 'expired'),
  subscription_plan ENUM ('basic', 'pro', 'premium'),
  subscription_start TIMESTAMP,
  subscription_end TIMESTAMP,
  
  -- Servicios ofrecidos
  offers_home_visits BOOLEAN DEFAULT true,
  offers_clinic_visits BOOLEAN DEFAULT false,
  
  -- Acuerdo legal
  independent_contractor_agreement_signed BOOLEAN DEFAULT false,
  agreement_signed_at TIMESTAMP,
  has_liability_insurance BOOLEAN DEFAULT false,
  insurance_expiry DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin
CREATE TABLE admins (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Mascotas y Citas

```sql
-- Mascotas
CREATE TABLE pets (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES pet_owners(id),
  name TEXT NOT NULL,
  species ENUM ('dog', 'cat', 'bird', 'rabbit', 'other'),
  breed TEXT,
  age_years INT,
  medical_history TEXT, -- encriptado
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Citas
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  pet_id UUID REFERENCES pets(id),
  vet_id UUID REFERENCES veterinarians(id),
  owner_id UUID REFERENCES pet_owners(id),
  
  -- Tipo de servicio
  service_type ENUM ('home_visit', 'clinic_visit'),
  
  -- Ubicación y distancia
  service_location_lat DECIMAL(10, 8),
  service_location_lon DECIMAL(11, 8),
  distance_km DECIMAL(5, 2), -- calculado
  
  -- Cronograma
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  actual_date TIMESTAMP,
  
  -- Precio (vet define)
  price_aud DECIMAL(10, 2),
  
  -- Estado
  status ENUM ('pending', 'confirmed', 'completed', 'cancelled'),
  
  -- Notas médicas (encriptadas)
  vet_notes TEXT,
  diagnosis TEXT,
  treatment TEXT,
  medications TEXT,
  follow_up_required BOOLEAN,
  
  -- Rating
  owner_rating INT, -- 1-5
  owner_review TEXT,
  vet_rating INT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Suscripción (para tracking de pagos)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  vet_id UUID REFERENCES veterinarians(id),
  plan ENUM ('basic', 'pro', 'premium'),
  price_clp DECIMAL(10, 2),
  transbank_transaction_id TEXT,
  status ENUM ('active', 'cancelled'),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Auditoría (crítico para compliance)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 4. FLUJOS CLAVE

### Flujo: Dueño busca vet

```
1. Abre app → Selecciona radio (5, 10, 20, 50 km)
2. Selecciona tipo: "Domicilio" o "Consultorio"
3. Mapa muestra vets verificados cercanos + distancia en metros
4. Tap en vet → Ve perfil, precios, rating, disponibilidad
5. Tap "Agendar" → Selecciona fecha/hora disponible
6. Confirma datos mascota + ubicación
7. Paga directamente (o al llegar si es domicilio)
8. Confirmación en tiempo real
```

### Flujo: Vet gestiona disponibilidad

```
1. Accede app/web
2. Configura horarios (lunes-viernes 8-18, sábado 9-13)
3. Define servicios: "Domicilio" "Consultorio" "Ambos"
4. Define precios por tipo (ej: domicilio +20% por viaje)
5. Recibe notificación de nueva cita
6. Acepta/rechaza
7. Accede a historial médico encriptado de mascota
8. Registra diagnóstico, tratamiento (encriptado)
9. Genera receta/recomendaciones
10. Usuario califica
```

---

## 5. SEGURIDAD CIBERNÉTICA

### Encriptación

- **En tránsito:** TLS 1.3 obligatorio (HTTPS)
- **En reposo:** 
  - Historiales médicos: AES-256
  - Datos personales: PII encryption en Supabase
  - Contraseñas: bcrypt (via Clerk)

### Autenticación & Autorización

- Clerk: 2FA obligatorio para vets
- JWT tokens: 15 min access, 7 días refresh
- Rate limiting: 5 intentos login/15 min
- RLS en Supabase: cada usuario ve SOLO sus datos
- Session management: máximo 3 dispositivos simultáneos

### Auditoría

- pgAudit: cada query registrada
- Audit logs: quién accedió qué, cuándo, desde dónde
- Retención: 2 años (legal)
- Alertas: acceso anómalo (vet viendo datos que no debe)

### Infraestructura VPS

- Firewall: Solo puertos 80, 443, 22
- Fail2Ban: bloquea brute force
- Cloudflare WAF: DDoS + inyecciones
- Backups encriptados: cada 6 horas, ubicación remota
- Updates automáticas de seguridad

### Verificación de Vet

- RUT validado contra SII
- Licencia verificada contra Colegio de Veterinarios de Chile
- Admin verifica documentos manualmente
- Renovación anual de credenciales
- Baja automática si licencia vence

---

## 6. PAGOS & MONETIZACIÓN

### Transbank WebPay (pago más usado en Chile)

```
Flujo:
1. Vet se suscribe (básico $9.99 USD/mes, pro $19.99, premium $49.99)
2. Redirige a WebPay
3. Usuario ingresa tarjeta/webpay/transferencia
4. Transbank procesa pago recurrente
5. App recibe webhook de confirmación
6. Suscripción activada
7. Sistema genera factura automática (SII compliance)
```

### Comisión (futuro)

Por ahora: solo suscripción. Después: 10% comisión por cita.

---

## 7. DOCUMENTOS LEGALES (TEMPLATES INCLUIDOS)

Se incluyen templates adaptados a Chile:

1. **Términos de Servicio** - Disclaimers, limitación de responsabilidad
2. **Política de Privacidad** - GDPR + Ley 19.628
3. **Acuerdo de Vet Independiente** - Indemnización, responsabilidad médica
4. **Política de Eliminación de Datos** - Retención y GDPR derecho al olvido
5. **Procedimiento de Arbitraje** - Resolución de disputas sin juicio

---

## 8. COMPLIANCE

- [ ] **Ley 19.628 Chile** - Protección de datos personales
- [ ] **CCPA** - Si expanden a USA
- [ ] **Colegio de Veterinarios** - Verificación de licencias
- [ ] **SII Chile** - Facturación de suscripciones
- [ ] **Seguros** - Responsabilidad civil (~$5k USD/año)
- [ ] **RLS + Auditoría** - Implementadas en BD
- [ ] **2FA obligatorio** - Para vets, Clerk lo maneja

---

## 9. BUILD ORDER (FASES)

### FASE 1: MVP Core (Semanas 1-4)

- [ ] Infraestructura VPS + Docker setup
- [ ] Clerk authentication integrado
- [ ] Supabase BD con schema completo
- [ ] API Hono básica (usuarios, citas CRUD)
- [ ] Google Maps integration (búsqueda de vets)
- [ ] Web admin dashboard (Next.js)

### FASE 2: Mobile + Pagos (Semanas 5-8)

- [ ] React Native app (iOS/Android)
- [ ] Transbank WebPay integration
- [ ] Push notifications (FCM)
- [ ] Real-time cita updates (Supabase Realtime)

### FASE 3: Seguridad & Compliance (Semanas 9-12)

- [ ] Encriptación end-to-end de datos médicos
- [ ] RLS policies en BD
- [ ] Auditoría logs (pgAudit)
- [ ] Documentos legales finalizados
- [ ] 2FA mandatory para vets
- [ ] Cyber Neo security scan

### FASE 4: Verificación Vet (Semanas 13-16)

- [ ] Integración SII para validar RUT
- [ ] Verificación manual Colegio Veterinarios
- [ ] Workflow de aprobación admin
- [ ] Webhooks Clerk → BD sincronización

### FASE 5: Testing + Deployment (Semanas 17-20)

- [ ] E2E testing con Playwright
- [ ] Load testing (geolocalización)
- [ ] Security pentest
- [ ] Deployment a producción
- [ ] Monitoring 24/7 (Sentry, Datadog)

---

## 10. CLAUDE.md PARA TU EQUIPO

```markdown
# VetConnect — Instrucciones de Desarrollo

## Stack Tech
- Frontend: React Native (Expo) + Next.js
- Backend: Node.js + Hono
- BD: Supabase
- Auth: Clerk
- Pagos: Transbank WebPay

## Seguridad Crítica
- 2FA obligatorio dev
- Encriptación historiales médicos
- RLS en BD: cada usuario ve SOLO sus datos
- Auditoría de accesos
- No hardcodear secrets

## Compliance
- Ley 19.628 (privacidad Chile)
- Colegio Veterinarios (verificación)
- Documentos legales listos

## Testing
- 80% cobertura mínimo
- E2E Playwright
- Security: Cyber Neo

## Deploy
- Docker en VPS
- Nginx reverse proxy
- Cloudflare WAF
- Backups cada 6h
```

---

**PRÓXIMO PASO:** Generar documentos legales completos (T&S, Privacidad, Acuerdos).
