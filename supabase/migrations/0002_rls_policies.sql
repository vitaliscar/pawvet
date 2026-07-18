-- PAWVET — Row Level Security
-- Cada usuario ve SOLO sus datos. El backend usa service_role (bypass RLS)
-- y filtra por usuario autenticado; estas policies protegen acceso directo
-- vía anon/authenticated keys (apps cliente con Supabase Realtime).

alter table users enable row level security;
alter table pet_owners enable row level security;
alter table veterinarians enable row level security;
alter table admins enable row level security;
alter table pets enable row level security;
alter table vet_availability enable row level security;
alter table appointments enable row level security;
alter table subscriptions enable row level security;
alter table audit_logs enable row level security;

-- Helper: user id interno a partir del JWT de Clerk (claim "sub" = clerk_id)
create or replace function current_app_user_id()
returns uuid language sql stable security definer as $$
  select id from users where clerk_id = auth.jwt()->>'sub'
$$;

create or replace function is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from users
    where clerk_id = auth.jwt()->>'sub' and role = 'admin'
  )
$$;

-- users: cada quien ve su propia fila; admin ve todo
create policy users_self_select on users
  for select using (clerk_id = auth.jwt()->>'sub' or is_admin());

-- pet_owners
create policy owners_self on pet_owners
  for all using (user_id = current_app_user_id() or is_admin());

-- veterinarians: perfil público SOLO si verificado; el vet gestiona el suyo
create policy vets_public_select on veterinarians
  for select using (verified = true or user_id = current_app_user_id() or is_admin());
create policy vets_self_update on veterinarians
  for update using (user_id = current_app_user_id() or is_admin());

-- admins: solo admins
create policy admins_only on admins
  for all using (is_admin());

-- pets: dueño, o vet con cita sobre esa mascota
create policy pets_owner on pets
  for all using (
    owner_id in (select id from pet_owners where user_id = current_app_user_id())
    or is_admin()
  );
create policy pets_vet_with_appointment on pets
  for select using (
    exists (
      select 1 from appointments a
      join veterinarians v on v.id = a.vet_id
      where a.pet_id = pets.id and v.user_id = current_app_user_id()
    )
  );

-- vet_availability: lectura pública (vets verificados), escritura del propio vet
create policy availability_public_select on vet_availability
  for select using (true);
create policy availability_vet_write on vet_availability
  for all using (
    vet_id in (select id from veterinarians where user_id = current_app_user_id())
    or is_admin()
  );

-- appointments: dueño y vet involucrados
create policy appointments_parties on appointments
  for all using (
    owner_id in (select id from pet_owners where user_id = current_app_user_id())
    or vet_id in (select id from veterinarians where user_id = current_app_user_id())
    or is_admin()
  );

-- subscriptions: el vet dueño y admin
create policy subscriptions_vet on subscriptions
  for select using (
    vet_id in (select id from veterinarians where user_id = current_app_user_id())
    or is_admin()
  );

-- audit_logs: SOLO admin lee; nadie escribe desde cliente (solo service_role)
create policy audit_admin_select on audit_logs
  for select using (is_admin());
