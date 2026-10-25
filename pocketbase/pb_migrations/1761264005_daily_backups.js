/// <reference path="../pb_data/types.d.ts" />

// Backup automático diario de pb_data (zip en pb_data/backups). El contenedor
// corre en UTC: 07:00 UTC ≈ 03:00–04:00 en Chile. Copia externa (S3) en
// infra/RESTAURACION.md: requiere credenciales y se configura por entorno.
migrate((app) => {
  const settings = app.settings();
  settings.backups.cron = '0 7 * * *';
  settings.backups.cronMaxKeep = 14;
  app.save(settings);
});
