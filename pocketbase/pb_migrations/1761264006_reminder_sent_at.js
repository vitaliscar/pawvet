/// <reference path="../pb_data/types.d.ts" />

// Marca de recordatorio enviado (backend/src/lib/appointment-notifier.ts) para
// no repetir el correo del día anterior. Idempotente.
migrate((app) => {
  const appointments = app.findCollectionByNameOrId('appointments');
  if (!appointments.fields.getByName('reminder_sent_at')) {
    appointments.fields.add(new DateField({ name: 'reminder_sent_at' }));
    app.save(appointments);
  }
});
