import crypto from 'crypto';

export interface EncryptionResult {
  encryptedData: Buffer;
  iv: string;
  authTag: string;
}

/**
 * Generates a random 256-bit (32-byte) hex-encoded key for AES-256-GCM.
 */
export const generateSecretKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Encrypts a file buffer using AES-256-GCM.
 * @param buffer - The raw unencrypted data buffer.
 * @param secretKeyHex - 32-byte hexadecimal secret key.
 * @returns Object containing encryptedData Buffer, hex-encoded iv, and hex-encoded authTag.
 */
export const encryptFileBuffer = (
  buffer: Buffer,
  secretKeyHex: string
): EncryptionResult => {
  const key = Buffer.from(secretKeyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('AES-256-GCM requires a 32-byte (64 hex characters) key');
  }

  // 12 bytes (96-bit) IV recommended for AES-GCM
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedData,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
};

/**
 * Decrypts an AES-256-GCM encrypted data buffer.
 * @param encryptedData - The encrypted bytes Buffer.
 * @param secretKeyHex - 32-byte hexadecimal secret key.
 * @param iv - Hexadecimal IV.
 * @param authTag - Hexadecimal authentication tag.
 * @returns Original decrypted plaintext Buffer.
 */
export const decryptFileBuffer = (
  encryptedData: Buffer,
  secretKeyHex: string,
  iv: string,
  authTag: string
): Buffer => {
  const key = Buffer.from(secretKeyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('AES-256-GCM requires a 32-byte (64 hex characters) key');
  }

  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
};
