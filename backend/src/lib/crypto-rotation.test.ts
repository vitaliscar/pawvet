import { afterEach, describe, expect, it, vi } from 'vitest';

const OLD_KEY = 'b'.repeat(64);
const NEW_KEY = 'c'.repeat(64);

/** Recarga crypto.ts (y env.ts) con las claves indicadas. */
async function loadCrypto(current: string, previous?: string) {
  vi.resetModules();
  Object.assign(process.env, {
    MEDICAL_DATA_ENCRYPTION_KEY: current,
    POCKETBASE_URL: 'http://127.0.0.1:8090',
    POCKETBASE_ADMIN_EMAIL: 'admin@test.pawvet.net',
    POCKETBASE_ADMIN_PASSWORD: 'test-password',
    TRANSBANK_COMMERCE_CODE: 'test',
    TRANSBANK_API_KEY: 'test',
  });
  if (previous) process.env.MEDICAL_DATA_ENCRYPTION_KEY_PREVIOUS = previous;
  else delete process.env.MEDICAL_DATA_ENCRYPTION_KEY_PREVIOUS;
  return import('./crypto.js');
}

afterEach(() => {
  delete process.env.MEDICAL_DATA_ENCRYPTION_KEY_PREVIOUS;
});

describe('rotación de la clave médica', () => {
  it('lee datos de la clave anterior y distingue cuáles faltan por re-cifrar', async () => {
    const before = await loadCrypto(OLD_KEY);
    const stored = before.encryptField('Alergia a penicilina');

    const rotating = await loadCrypto(NEW_KEY, OLD_KEY);
    expect(rotating.decryptField(stored)).toBe('Alergia a penicilina');
    expect(rotating.isEncryptedWithCurrentKey(stored)).toBe(false);
    expect(rotating.isEncryptedWithCurrentKey(rotating.encryptField('x'))).toBe(true);
  });

  it('sin clave anterior configurada, un dato de otra clave no se descifra', async () => {
    const before = await loadCrypto(OLD_KEY);
    const stored = before.encryptField('dato clínico');

    const after = await loadCrypto(NEW_KEY);
    expect(() => after.decryptField(stored)).toThrow();
  });
});
