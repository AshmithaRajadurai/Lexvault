import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { computeHash } from '../crypto/hashing';
import { encryptFileBuffer, decryptFileBuffer } from '../crypto/encryption';

// Configure multer for in-memory buffer storage
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB max file size
  },
});

export interface StoredFileResult {
  originalName: string;
  sha256: string;
  storagePath: string;
  mimeType: string;
  iv: string;
  authTag: string;
}

/**
 * Resolves the default 32-byte encryption key for AES-256-GCM storage.
 */
export const getStorageEncryptionKey = (): string => {
  if (process.env.STORAGE_ENCRYPTION_KEY) {
    return process.env.STORAGE_ENCRYPTION_KEY;
  }
  // Derive deterministic 32-byte key from JWT_SECRET or default secret
  const secret = process.env.JWT_SECRET || 'lexvault_default_vault_secret_key_2026';
  return crypto.createHash('sha256').update(secret).digest('hex');
};

/**
 * Processes an incoming file buffer:
 * 1. Computes raw SHA-256 checksum.
 * 2. Encrypts payload with AES-256-GCM.
 * 3. Writes ONLY the encrypted byte stream to backend/uploads/.
 * 4. Returns metadata containing checksum and storage location.
 */
export const processAndStoreFile = async (
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  customKeyHex?: string
): Promise<StoredFileResult> => {
  const uploadsDir = path.resolve(__dirname, '../../uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 1. Compute original file SHA-256
  const sha256 = computeHash(fileBuffer);

  // 2. Encrypt buffer using AES-256-GCM
  const key = customKeyHex || getStorageEncryptionKey();
  const { encryptedData, iv, authTag } = encryptFileBuffer(fileBuffer, key);

  // 3. Save only encrypted byte stream to disk
  const uniquePrefix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  const filename = `${uniquePrefix}.enc`;
  const storagePath = path.join(uploadsDir, filename);

  await fs.promises.writeFile(storagePath, encryptedData);

  return {
    originalName,
    sha256,
    storagePath,
    mimeType,
    iv,
    authTag,
  };
};

/**
 * Reads and decrypts an encrypted file from disk.
 */
export const retrieveAndDecryptFile = async (
  storagePath: string,
  iv: string,
  authTag: string,
  customKeyHex?: string
): Promise<Buffer> => {
  const encryptedBytes = await fs.promises.readFile(storagePath);
  const key = customKeyHex || getStorageEncryptionKey();
  return decryptFileBuffer(encryptedBytes, key, iv, authTag);
};
