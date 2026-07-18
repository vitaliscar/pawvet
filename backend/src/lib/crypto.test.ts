import { beforeAll, describe, expect, it } from 'vitest';

// Clave de test — 32 bytes hex. Debe setearse antes de importar el módulo.
beforeAll(() => {
  process.env.MEDICAL_DATA_ENCRYPTION_KEY = 'a'.repeat(64);
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  process.env.CLERK_SECRET_KEY = 'sk_test_x';
  process.env.TRANSBANK_COMMERCE_CODE = 'test';
  process.env.TRANSBANK_API_KEY = 'test';
});

describe('crypto (AES-256-GCM)', () => {
  it('encripta y desencripta round-trip', async () => {
    const { encryptField, decryptField } = await import('./crypto.js');
    const plaintext = 'Historial médico: alergia a penicilina. Vacunas al día.';
    const encrypted = encryptField(plaintext);

    expect(encrypted).not.toContain(plaintext);
    expect(encrypted.split('.')).toHaveLength(3);
    expect(decryptField(encrypted)).toBe(plaintext);
  });

  it('genera ciphertext distinto por IV aleatorio', async () => {
    const { encryptField } = await import('./crypto.js');
    expect(encryptField('mismo texto')).not.toBe(encryptField('mismo texto'));
  });

  it('rechaza ciphertext manipulado (auth tag GCM)', async () => {
    const { encryptField, decryptField } = await import('./crypto.js');
    const encrypted = encryptField('dato sensible');
    const parts = encrypted.split('.');
    const tampered = `${parts[0]}.${parts[1]}.${Buffer.from('hacked!!').toString('base64')}`;
    expect(() => decryptField(tampered)).toThrow();
  });

  it('maneja null en helpers nullable', async () => {
    const { encryptNullable, decryptNullable } = await import('./crypto.js');
    expect(encryptNullable(null)).toBeNull();
    expect(encryptNullable(undefined)).toBeNull();
    expect(decryptNullable(null)).toBeNull();
  });
});
