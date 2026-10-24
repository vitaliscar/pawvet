/// <reference path="../pb_data/types.d.ts" />

// Motor de citas: catálogo de servicios por vet y campos/índices de reserva en
// appointments. Idempotente: en instalaciones nuevas la migración inicial ya
// importa todo desde pb_schema.json y esta no cambia nada.
migrate((app) => {
  const schema = JSON.parse(toString($os.readFile($os.getwd() + '/pb_schema.json')));
  const definitionOf = (name) => schema.find((d) => d.name === name);

  let services;
  try {
    services = app.findCollectionByNameOrId('vet_services');
  } catch {
    const definition = definitionOf('vet_services');
    for (const field of definition.fields) {
      if (field.type === 'relation') {
        field.collectionId = app.findCollectionByNameOrId(field.collectionId).id;
      }
    }
    app.importCollections([definition], false);
    services = app.findCollectionByNameOrId('vet_services');
  }

  const appointments = app.findCollectionByNameOrId('appointments');
  if (!appointments.fields.getByName('service_id')) {
    appointments.fields.add(
      new RelationField({ name: 'service_id', collectionId: services.id, maxSelect: 1 }),
    );
  }
  if (!appointments.fields.getByName('idempotency_key')) {
    appointments.fields.add(new TextField({ name: 'idempotency_key', max: 100 }));
  }
  if (!appointments.fields.getByName('cancel_reason')) {
    appointments.fields.add(new TextField({ name: 'cancel_reason', max: 500 }));
  }
  appointments.indexes = definitionOf('appointments').indexes;
  app.save(appointments);
});
