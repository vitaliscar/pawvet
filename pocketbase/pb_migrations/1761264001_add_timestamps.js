/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const schema = JSON.parse(toString($os.readFile($os.getwd() + '/pb_schema.json')));

  for (const definition of schema) {
    if (definition.type !== 'base') continue;

    const collection = app.findCollectionByNameOrId(definition.name);
    for (const field of definition.fields) {
      if (field.type === 'autodate' && !collection.fields.getByName(field.name)) {
        collection.fields.add(new AutodateField(field));
      }
    }
    app.save(collection);
  }
});
