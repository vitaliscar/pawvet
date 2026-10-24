/// <reference path="../pb_data/types.d.ts" />

// Los vets verificados son listables por cualquiera (listRule), así que los
// datos personales y documentos quedan ocultos: solo el superuser (backend) los ve.
const HIDDEN_FIELDS = ['rut', 'phone', 'rut_document_url', 'license_document_url', 'verified_by_admin_id'];

migrate((app) => {
  const vets = app.findCollectionByNameOrId('veterinarians');
  for (const name of HIDDEN_FIELDS) {
    const field = vets.fields.getByName(name);
    if (field) field.hidden = true;
  }
  app.save(vets);
});
