/// <reference path="../pb_data/types.d.ts" />

// PocketBase trata 0 como vacío en campos numéricos requeridos: weekday = 0
// (domingo) era imposible de guardar. La API valida ambos con Zod; price_clp es
// heredado (el precio sale de vet_services).
migrate((app) => {
  const availability = app.findCollectionByNameOrId('vet_availability');

  const weekday = availability.fields.getByName('weekday');
  weekday.required = false;
  weekday.min = 0;
  weekday.max = 6;
  weekday.onlyInt = true;

  availability.fields.getByName('price_clp').required = false;
  app.save(availability);
});
