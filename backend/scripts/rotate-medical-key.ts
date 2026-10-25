// Re-cifra los datos médicos con la clave actual tras una rotación.
//
// 1. Haz un backup (infra/RESTAURACION.md).
// 2. Genera la clave nueva: openssl rand -hex 32
// 3. En backend/.env: MEDICAL_DATA_ENCRYPTION_KEY=<nueva>
//                     MEDICAL_DATA_ENCRYPTION_KEY_PREVIOUS=<anterior>
// 4. npx tsx scripts/rotate-medical-key.ts --dry-run   (cuenta, no escribe)
//    npx tsx scripts/rotate-medical-key.ts             (re-cifra; idempotente)
// 5. Cuando informe 0 pendientes, borra MEDICAL_DATA_ENCRYPTION_KEY_PREVIOUS.
import { decryptField, encryptField, isEncryptedWithCurrentKey } from '../src/lib/crypto.js';
import { ensureAdminAuth, pb } from '../src/lib/pocketbase.js';

const ENCRYPTED_FIELDS: Record<string, string[]> = {
  pets: ['medical_history_enc'],
  appointments: ['vet_notes_enc', 'diagnosis_enc', 'treatment_enc', 'medications_enc'],
};

const isDryRun = process.argv.includes('--dry-run');

async function rotateCollection(collection: string, fields: string[]): Promise<number> {
  const records = await pb.collection(collection).getFullList({ fields: ['id', ...fields].join(',') });
  let pending = 0;
  for (const record of records) {
    const update: Record<string, string> = {};
    for (const field of fields) {
      const value = record[field] as string | undefined;
      if (value && !isEncryptedWithCurrentKey(value)) update[field] = encryptField(decryptField(value));
    }
    if (Object.keys(update).length === 0) continue;
    pending += 1;
    if (!isDryRun) await pb.collection(collection).update(record.id, update);
  }
  return pending;
}

await ensureAdminAuth();
for (const [collection, fields] of Object.entries(ENCRYPTED_FIELDS)) {
  const pending = await rotateCollection(collection, fields);
  console.log(`${collection}: ${pending} registros ${isDryRun ? 'por re-cifrar' : 're-cifrados'}`);
}
