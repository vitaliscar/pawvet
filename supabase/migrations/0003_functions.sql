-- PAWVET — Funciones de negocio

-- Búsqueda de vets verificados dentro de un radio (km) desde un punto.
-- Usada por GET /search/vets. Devuelve distancia en km ordenada ascendente.
create or replace function search_vets_nearby(
  lat double precision,
  lon double precision,
  radius_km int default 10,
  wanted_service service_type default null
)
returns table (
  vet_id uuid,
  full_name text,
  clinic_name text,
  avatar_url text,
  bio text,
  offers_home_visits boolean,
  offers_clinic_visits boolean,
  distance_km numeric
)
language sql stable as $$
  select
    v.id,
    v.full_name,
    v.clinic_name,
    v.avatar_url,
    v.bio,
    v.offers_home_visits,
    v.offers_clinic_visits,
    round((st_distance(
      v.clinic_location,
      st_setsrid(st_makepoint(lon, lat), 4326)::geography
    ) / 1000.0)::numeric, 2) as distance_km
  from veterinarians v
  where v.verified = true
    and v.subscription_status = 'active'
    and v.clinic_location is not null
    and st_dwithin(
      v.clinic_location,
      st_setsrid(st_makepoint(lon, lat), 4326)::geography,
      radius_km * 1000
    )
    and (
      wanted_service is null
      or (wanted_service = 'home_visit' and v.offers_home_visits)
      or (wanted_service = 'clinic_visit' and v.offers_clinic_visits)
    )
  order by distance_km asc
  limit 100;
$$;

-- Rating promedio de un vet
create or replace function vet_average_rating(p_vet_id uuid)
returns numeric language sql stable as $$
  select round(avg(owner_rating)::numeric, 1)
  from appointments
  where vet_id = p_vet_id and owner_rating is not null;
$$;
