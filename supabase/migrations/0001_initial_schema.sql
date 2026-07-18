-- PAWVET — Schema inicial
-- Ejecutar en Supabase SQL editor o via CLI: supabase db push

create extension if not exists "uuid-ossp";
create extension if not exists postgis;

-- ─────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────
create type user_role as enum ('owner', 'vet', 'admin');
create type pet_species as enum ('dog', 'cat', 'bird', 'rabbit', 'other');
create type service_type as enum ('home_visit', 'clinic_visit');
create type appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type subscription_status as enum ('active', 'cancelled', 'expired');
create type subscription_plan as enum ('basic', 'pro', 'premium');

-- ─────────────────────────────────────────────
-- Usuarios
-- ─────────────────────────────────────────────
create table users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text unique not null,
  phone text,
  role user_role not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table pet_owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  full_name text not null,
  address text,
  location geography(point, 4326),
  preferred_radius_km int not null default 10 check (preferred_radius_km between 1 and 100),
  verified boolean not null default false,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table veterinarians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  full_name text not null,
  rut text unique not null,
  license_number text unique not null,
  clinic_name text,
  clinic_address text,
  clinic_location geography(point, 4326),
  bio text,
  avatar_url text,
  phone text,

  -- Verificación (RUT + Colegio de Veterinarios)
  verified boolean not null default false,
  rut_document_url text,
  license_document_url text,
  verified_by_admin_id uuid references users(id),
  verified_at timestamptz,

  -- Suscripción
  subscription_status subscription_status,
  subscription_plan subscription_plan,
  subscription_start timestamptz,
  subscription_end timestamptz,

  -- Servicios
  offers_home_visits boolean not null default true,
  offers_clinic_visits boolean not null default false,

  -- Acuerdo legal
  independent_contractor_agreement_signed boolean not null default false,
  agreement_signed_at timestamptz,
  has_liability_insurance boolean not null default false,
  insurance_expiry date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  permissions text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Mascotas y citas
-- ─────────────────────────────────────────────
create table pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references pet_owners(id) on delete cascade,
  name text not null,
  species pet_species not null,
  breed text,
  age_years int check (age_years >= 0),
  medical_history_enc text, -- AES-256-GCM, encriptado en backend
  photo_url text,
  created_at timestamptz not null default now()
);

create table vet_availability (
  id uuid primary key default gen_random_uuid(),
  vet_id uuid not null references veterinarians(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0 = domingo
  start_time time not null,
  end_time time not null,
  service_type service_type not null,
  price_clp numeric(10, 0) not null check (price_clp >= 0),
  unique (vet_id, weekday, start_time, service_type)
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id),
  vet_id uuid not null references veterinarians(id),
  owner_id uuid not null references pet_owners(id),

  service_type service_type not null,
  service_location geography(point, 4326),
  distance_km numeric(5, 2),

  scheduled_date date not null,
  scheduled_time time not null,
  actual_date timestamptz,

  price_clp numeric(10, 0),
  status appointment_status not null default 'pending',

  -- Notas médicas — encriptadas AES-256-GCM en backend
  vet_notes_enc text,
  diagnosis_enc text,
  treatment_enc text,
  medications_enc text,
  follow_up_required boolean,

  owner_rating int check (owner_rating between 1 and 5),
  owner_review text,
  vet_rating int check (vet_rating between 1 and 5),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  vet_id uuid not null references veterinarians(id) on delete cascade,
  plan subscription_plan not null,
  price_clp numeric(10, 0) not null,
  transbank_transaction_id text, -- SOLO el id — nunca datos de tarjeta
  status subscription_status not null default 'active',
  start_date timestamptz not null default now(),
  end_date timestamptz,
  auto_renew boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Auditoría (compliance Ley 19.628)
-- ─────────────────────────────────────────────
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  action text not null,
  resource_type text,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Índices
-- ─────────────────────────────────────────────
create index idx_users_clerk_id on users(clerk_id);
create index idx_vets_location on veterinarians using gist(clinic_location);
create index idx_vets_verified on veterinarians(verified) where verified = true;
create index idx_appointments_vet on appointments(vet_id, scheduled_date);
create index idx_appointments_owner on appointments(owner_id, scheduled_date);
create index idx_audit_logs_user on audit_logs(user_id, created_at);
create index idx_pets_owner on pets(owner_id);

-- ─────────────────────────────────────────────
-- updated_at trigger
-- ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger trg_users_updated before update on users
  for each row execute function set_updated_at();
create trigger trg_vets_updated before update on veterinarians
  for each row execute function set_updated_at();
create trigger trg_appointments_updated before update on appointments
  for each row execute function set_updated_at();
