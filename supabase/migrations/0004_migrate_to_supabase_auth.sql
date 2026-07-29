-- PAWVET — Migración de Clerk a Supabase Auth
-- clerk_id -> auth_user_id (uuid, FK a auth.users). El JWT de Supabase Auth
-- ya expone "sub" = auth.users.id, así que las policies RLS se simplifican
-- a auth.uid() en vez de comparar contra un texto externo.

alter table users rename column clerk_id to auth_user_id;
alter table users alter column auth_user_id type uuid using auth_user_id::uuid;
alter table users add constraint users_auth_user_id_fkey
  foreign key (auth_user_id) references auth.users(id) on delete cascade;

drop index if exists idx_users_clerk_id;
create index idx_users_auth_user_id on users(auth_user_id);

create or replace function current_app_user_id()
returns uuid language sql stable security definer as $$
  select id from users where auth_user_id = auth.uid()
$$;

create or replace function is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from users
    where auth_user_id = auth.uid() and role = 'admin'
  )
$$;

drop policy if exists users_self_select on users;
create policy users_self_select on users
  for select using (auth_user_id = auth.uid() or is_admin());

-- Sincroniza auth.users -> public.users (reemplaza el webhook Svix de Clerk).
-- El rol por defecto es 'owner'; admins se promueven manualmente vía panel.
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (auth_user_id, email, role)
  values (new.id, new.email, 'owner')
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- La FK ya tiene "on delete cascade": al borrar en auth.users se borra la fila
-- en public.users automáticamente. No se necesita trigger de borrado.
