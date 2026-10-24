/// <reference path="../pb_data/types.d.ts" />

// Fuerza role='owner' en todo signup público — coloca este archivo en la
// carpeta pb_hooks/ del binario de PocketBase (se carga automáticamente).
// Los roles 'vet'/'admin' se asignan manualmente desde el Admin UI.
onRecordCreateRequest((e) => {
  e.record.set('role', 'owner');
  e.next();
}, 'users');
