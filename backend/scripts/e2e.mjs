// E2E de reservas y matriz de permisos contra PocketBase + API reales.
// Usar SOLO contra una base desechable: crea usuarios y citas de prueba.
//   PB_URL=http://127.0.0.1:8099 API_URL=http://127.0.0.1:3099 \
//   PB_SUPERUSER_EMAIL=... PB_SUPERUSER_PASSWORD=... node scripts/e2e.mjs
const PB = process.env.PB_URL ?? 'http://127.0.0.1:8099';
const API = process.env.API_URL ?? 'http://127.0.0.1:3099';
const PASS = 'Passw0rd-e2e-123';
const DATE = '2030-01-07'; // lunes futuro

let failures = 0;
async function req(base, method, path, token, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}
function must(r, label, ...ok) {
  if (!ok.includes(r.status)) throw new Error(`${label}: ${r.status} ${JSON.stringify(r.json)}`);
  return r.json;
}
function check(cond, label) {
  console.log(`${cond ? '✓' : '✗'} ${label}`);
  if (!cond) failures += 1;
}
const expectStatus = async (promise, expected, label) => {
  const r = await promise;
  check(expected.includes(r.status), `${label} → ${r.status}`);
  return r;
};

// ── Preparación (superuser) ─────────────────────────────────────────────
const su = must(
  await req(PB, 'POST', '/api/collections/_superusers/auth-with-password', null, {
    identity: process.env.PB_SUPERUSER_EMAIL,
    password: process.env.PB_SUPERUSER_PASSWORD,
  }),
  'superuser',
  200,
).token;
const run = Date.now();
const pbCreate = async (collection, data) =>
  must(await req(PB, 'POST', `/api/collections/${collection}/records`, su, data), collection, 200);

async function makeUser(tag, role) {
  const email = `${tag}${run}@e2e.pawvet.local`;
  const user = await pbCreate('users', { email, password: PASS, passwordConfirm: PASS, role });
  // El hook default_role fuerza 'owner' en todo create; el rol real se asigna después.
  must(await req(PB, 'PATCH', `/api/collections/users/records/${user.id}`, su, { role }), 'role', 200);
  const auth = must(
    await req(PB, 'POST', '/api/collections/users/auth-with-password', null, { identity: email, password: PASS }),
    'login',
    200,
  );
  return { user, token: `Bearer ${auth.token}` };
}

const ownerA = await makeUser('owner-a', 'owner');
const ownerB = await makeUser('owner-b', 'owner');
const vetA = await makeUser('vet-a', 'vet');
const vetB = await makeUser('vet-b', 'vet');
const admin = await makeUser('admin', 'admin');

const profileA = await pbCreate('pet_owners', { user_id: ownerA.user.id, full_name: 'Tutora A', preferred_radius_km: 10 });
await pbCreate('pet_owners', { user_id: ownerB.user.id, full_name: 'Tutor B', preferred_radius_km: 10 });
const vetProfileA = await pbCreate('veterinarians', { user_id: vetA.user.id, full_name: 'Vet A', rut: '11111111-1', license_number: 'E2E-A', verified: true });
await pbCreate('veterinarians', { user_id: vetB.user.id, full_name: 'Vet B', rut: '22222222-2', license_number: 'E2E-B', verified: true });

// ── Reserva ─────────────────────────────────────────────────────────────
console.log('\n# Reserva');
const petA = must(await req(API, 'POST', '/api/pets', ownerA.token,
  { name: 'Firulais', species: 'dog', medical_history: 'Alergia a penicilina' }), 'pet', 201).data;
const petB = must(await req(API, 'POST', '/api/pets', ownerB.token, { name: 'Michi', species: 'cat' }), 'pet', 201).data;

const service = must(await req(API, 'PUT', '/api/vets/me/services', vetA.token,
  [{ kind: 'general_consult', duration_min: 45, price_clp: 30000, home_visit_fee_clp: 5000 }]), 'services', 200).data[0];
must(await req(API, 'PUT', '/api/vets/me/availability', vetA.token,
  [{ weekday: 1, start_time: '09:00', end_time: '12:00', service_type: 'home_visit', price_clp: 30000 }]), 'availability', 200);

const slots = must(await req(API, 'GET', `/api/vets/${vetProfileA.id}/slots?date=${DATE}`, ownerA.token), 'slots', 200).data.slots;
check(JSON.stringify(slots) === '["09:00","10:00","11:00"]', `bloques libres ${JSON.stringify(slots)}`);

const booking = (pet, key, time = '10:00') => ({ pet_id: pet.id, vet_id: vetProfileA.id, service_id: service.id,
  service_type: 'home_visit', scheduled_date: DATE, scheduled_time: time, idempotency_key: key });

const race = await Promise.all([
  req(API, 'POST', '/api/appointments', ownerA.token, booking(petA, `a-${run}`)),
  req(API, 'POST', '/api/appointments', ownerB.token, booking(petB, `b-${run}`)),
]);
const statuses = race.map((r) => r.status).sort();
check(JSON.stringify(statuses) === '[201,409]', `dos tutores, mismo bloque, simultáneo → ${JSON.stringify(statuses)}`);
const winner = race.find((r) => r.status === 201);
const winnerIsA = race[0].status === 201;
const appt = winner.json.data;
check(appt.price_clp === 35000, `precio final con traslado = ${appt.price_clp}`);

const winnerOwner = winnerIsA ? ownerA : ownerB;
const winnerPet = winnerIsA ? petA : petB;
const loserOwner = winnerIsA ? ownerB : ownerA;
const retry = await req(API, 'POST', '/api/appointments', winnerOwner.token, booking(winnerPet, winnerIsA ? `a-${run}` : `b-${run}`));
check(retry.status === 200 && retry.json?.data?.id === appt.id, `reintento idempotente devuelve la misma cita → ${retry.status}`);
await expectStatus(req(API, 'POST', '/api/appointments', ownerA.token, booking(petA, `c-${run}`, '10:30')), [422], 'bloque fuera de grilla');
await expectStatus(req(API, 'POST', '/api/appointments', ownerA.token, booking(petB, `d-${run}`, '11:00')), [404], 'reservar con mascota ajena');

// ── Matriz de permisos (API) ────────────────────────────────────────────
console.log('\n# Permisos API');
await expectStatus(req(API, 'GET', '/api/admin/metrics', null), [401], 'sin sesión → métricas');
for (const [who, actor] of [['tutor', ownerA], ['vet', vetA]]) {
  await expectStatus(req(API, 'GET', '/api/admin/metrics', actor.token), [403], `${who} → métricas admin`);
  await expectStatus(req(API, 'GET', '/api/admin/audit-logs', actor.token), [403], `${who} → auditoría`);
}
await expectStatus(req(API, 'GET', '/api/pets', vetA.token), [403], 'vet → mascotas');
await expectStatus(req(API, 'GET', '/api/pets', admin.token), [403], 'admin → rutas de tutor');
await expectStatus(req(API, 'PUT', '/api/vets/me/services', ownerA.token, []), [403], 'tutor → catálogo de vet');
await expectStatus(req(API, 'POST', '/api/appointments', vetA.token, booking(petA, `e-${run}`)), [403], 'vet → reservar');
await expectStatus(req(API, 'GET', `/api/pets/${petB.id}`, ownerA.token), [404], 'tutor A → mascota de B');
await expectStatus(req(API, 'GET', `/api/appointments/${appt.id}/medical-notes`, loserOwner.token), [404], 'tutor ajeno → notas médicas');
await expectStatus(req(API, 'GET', `/api/appointments/${appt.id}/medical-notes`, vetB.token), [404], 'vet ajeno → notas médicas');
await expectStatus(req(API, 'PUT', `/api/appointments/${appt.id}/medical-notes`, vetB.token, { diagnosis: 'x' }), [404], 'vet ajeno → escribir notas');
await expectStatus(req(API, 'PATCH', `/api/appointments/${appt.id}/status`, loserOwner.token, { status: 'cancelled' }), [404], 'tutor ajeno → cancelar');

console.log('\n# Estados y notas cifradas');
const st = (actor, status) => req(API, 'PATCH', `/api/appointments/${appt.id}/status`, actor.token, { status });
await expectStatus(st(winnerOwner, 'confirmed'), [409], 'tutor no confirma');
await expectStatus(st(vetA, 'completed'), [409], 'pending → completed');
await expectStatus(st(vetA, 'confirmed'), [200], 'vet confirma');
await expectStatus(req(API, 'PUT', `/api/appointments/${appt.id}/medical-notes`, vetA.token,
  { diagnosis: 'Otitis leve', treatment: 'Gotas 7 días' }), [200], 'vet asignado escribe notas');
const notes = await expectStatus(req(API, 'GET', `/api/appointments/${appt.id}/medical-notes`, winnerOwner.token), [200], 'tutor lee sus notas');
check(notes.json?.data?.diagnosis === 'Otitis leve', 'notas descifradas para el tutor');
await expectStatus(st(vetA, 'completed'), [200], 'vet completa');
await expectStatus(st(winnerOwner, 'cancelled'), [409], 'no se cancela una cita completada');

console.log('\n# Admin');
const metrics = await expectStatus(req(API, 'GET', '/api/admin/metrics', admin.token), [200], 'admin → métricas');
check(metrics.json?.data?.appointments?.completed >= 1, 'métricas cuentan la cita completada');
const injection = encodeURIComponent('" || id != "');
const logs = await expectStatus(req(API, 'GET', `/api/admin/audit-logs?action=${injection}`, admin.token), [200], 'filtro de auditoría con comillas');
check(logs.json?.data?.length === 0, 'la inyección no amplía el filtro');

// ── PocketBase directo con token de usuario (reglas de colección) ───────
console.log('\n# Permisos PocketBase directo');
const pbList = async (actor, collection) =>
  (await req(PB, 'GET', `/api/collections/${collection}/records?perPage=200`, actor.token)).json?.items ?? [];
check((await pbList(loserOwner, 'appointments')).length === 0, 'tutor ajeno no lista la cita');
check(!(await pbList(ownerA, 'pets')).some((p) => p.id === petB.id), 'tutor A no lista mascotas de B');
check((await pbList(ownerA, 'audit_logs')).length === 0, 'tutor no lista auditoría');
const directPet = (await pbList(ownerA, 'pets')).find((p) => p.id === petA.id);
check(!directPet || !String(directPet.medical_history_enc ?? '').includes('penicilina'), 'historial médico cifrado en reposo');
const publicVet = (await pbList(ownerA, 'veterinarians')).find((v) => v.id === vetProfileA.id);
check(publicVet && !publicVet.rut && !publicVet.rut_document_url && !publicVet.license_document_url,
  'perfil público del vet no expone RUT ni documentos');
await expectStatus(req(PB, 'POST', '/api/collections/appointments/records', ownerA.token,
  { ...booking(petA, `f-${run}`, '11:00'), owner_id: profileA.id, status: 'confirmed' }), [400, 403], 'crear cita saltándose la API');
await expectStatus(req(PB, 'PATCH', `/api/collections/veterinarians/records/${vetProfileA.id}`, vetA.token, { verified: true }), [400, 403, 404], 'vet se auto-verifica');
await expectStatus(req(PB, 'PATCH', `/api/collections/users/records/${ownerA.user.id}`, ownerA.token, { role: 'admin' }), [400, 403, 404], 'tutor se asciende a admin');

console.log(failures === 0 ? '\nOK: todas las comprobaciones pasaron' : `\nFALLARON ${failures} comprobaciones`);
process.exit(failures === 0 ? 0 : 1);
