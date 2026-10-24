-- PAWVET — Seed de desarrollo (NO ejecutar en producción)
-- Usuarios de prueba: los clerk_id son placeholders; reemplazar con ids reales
-- de tu instancia de Clerk en desarrollo.

insert into users (id, clerk_id, email, role) values
  ('00000000-0000-0000-0000-000000000001', 'clerk_dev_admin', 'admin@pawvet.net', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'clerk_dev_owner', 'owner@pawvet.net', 'owner'),
  ('00000000-0000-0000-0000-000000000003', 'clerk_dev_vet', 'vet@pawvet.net', 'vet');

insert into admins (user_id, permissions) values
  ('00000000-0000-0000-0000-000000000001', '{verify_vets,view_audit,manage_subscriptions}');

insert into pet_owners (id, user_id, full_name, address, location) values
  ('10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000002',
   'María Pérez', 'Av. Providencia 1234, Santiago',
   st_setsrid(st_makepoint(-70.6190, -33.4265), 4326)::geography);

insert into veterinarians (
  id, user_id, full_name, rut, license_number, clinic_name, clinic_address,
  clinic_location, verified, subscription_status, subscription_plan,
  offers_home_visits, offers_clinic_visits
) values (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'Dr. Juan Soto', '12345678-9', 'CVET-001', 'Clínica Huella Amiga',
  'Av. Las Condes 5678, Santiago',
  st_setsrid(st_makepoint(-70.5710, -33.4090), 4326)::geography,
  true, 'active', 'pro', true, true
);

insert into pets (id, owner_id, name, species, breed, age_years) values
  ('30000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   'Firulais', 'dog', 'Golden Retriever', 3);

insert into vet_availability (vet_id, weekday, start_time, end_time, service_type, price_clp) values
  ('20000000-0000-0000-0000-000000000001', 1, '08:00', '18:00', 'home_visit', 35000),
  ('20000000-0000-0000-0000-000000000001', 1, '08:00', '18:00', 'clinic_visit', 25000),
  ('20000000-0000-0000-0000-000000000001', 6, '09:00', '13:00', 'clinic_visit', 25000);
