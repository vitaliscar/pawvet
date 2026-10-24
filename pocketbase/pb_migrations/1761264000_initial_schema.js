/// <reference path="../pb_data/types.d.ts" />

// Import in dependency order so relation fields always receive real collection IDs.
migrate((app) => {
  const schema = JSON.parse(toString($os.readFile($os.getwd() + '/pb_schema.json')));

  for (const definition of schema) {
    for (const field of definition.fields) {
      if (field.type === 'relation') {
        field.collectionId = app.findCollectionByNameOrId(field.collectionId).id;
      }
    }

    app.importCollections([definition], false);
  }
});
