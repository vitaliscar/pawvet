import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

// AES-256-GCM para datos médicos en reposo.
// Formato almacenado: base64(iv).base64(authTag).base64(ciphertext)

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const key = Buffer.from(env.MEDICAL_DATA_ENCRYPTION_KEY, 'hex');

export function encryptField(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((b) => b.toString('base64')).join('.');
}

export function decryptField(stored: string): string {
  const parts = stored.split('.');
  if (parts.length !== 3) {
    throw new Error('Formato de campo encriptado inválido');
  }
  const [iv, authTag, ciphertext] = parts.map((p) => Buffer.from(p, 'base64')) as [
    Buffer,
    Buffer,
    Buffer,
  ];
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/** Encripta si hay valor; null pasa intacto. */
export function encryptNullable(value: string | null | undefined): string | null {
  return value ? encryptField(value) : null;
}

/** Desencripta si hay valor; null pasa intacto. */
export function decryptNullable(value: string | null | undefined): string | null {
  return value ? decryptField(value) : null;
}
