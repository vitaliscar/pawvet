import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

// AES-256-GCM para datos médicos en reposo.
// Formato almacenado: base64(iv).base64(authTag).base64(ciphertext)

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const key = Buffer.from(env.MEDICAL_DATA_ENCRYPTION_KEY, 'hex');
const previousKey = env.MEDICAL_DATA_ENCRYPTION_KEY_PREVIOUS
  ? Buffer.from(env.MEDICAL_DATA_ENCRYPTION_KEY_PREVIOUS, 'hex')
  : null;

export function encryptField(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((b) => b.toString('base64')).join('.');
}

function decryptWith(secret: Buffer, iv: Buffer, authTag: Buffer, ciphertext: Buffer): string {
  const decipher = createDecipheriv(ALGORITHM, secret, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
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
  try {
    return decryptWith(key, iv, authTag, ciphertext);
  } catch (err) {
    // GCM rechaza la clave equivocada: durante una rotación se intenta la anterior.
    if (!previousKey) throw err;
    return decryptWith(previousKey, iv, authTag, ciphertext);
  }
}

/** true si el valor ya está cifrado con la clave actual (lo usa el script de rotación). */
export function isEncryptedWithCurrentKey(stored: string): boolean {
  const [iv, authTag, ciphertext] = stored.split('.').map((p) => Buffer.from(p, 'base64'));
  if (!iv || !authTag || !ciphertext) return false;
  try {
    decryptWith(key, iv, authTag, ciphertext);
    return true;
  } catch {
    return false;
  }
}

/** Encripta si hay valor; null pasa intacto. */
export function encryptNullable(value: string | null | undefined): string | null {
  return value ? encryptField(value) : null;
}

/** Desencripta si hay valor; null pasa intacto. */
export function decryptNullable(value: string | null | undefined): string | null {
  return value ? decryptField(value) : null;
}
