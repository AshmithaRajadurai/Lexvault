import crypto from 'crypto';

/**
 * Computes a hexadecimal SHA-256 hash of a Buffer.
 * @param buffer - The data buffer to hash.
 * @returns 64-character lowercase hexadecimal SHA-256 string.
 */
export const computeHash = (buffer: Buffer): string => {
  const hash = crypto.createHash('sha256');
  // For large buffers (up to 200MB), chunk slices to avoid memory pressure or Node buffer limit issues
  const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunk
  if (buffer.length > CHUNK_SIZE) {
    for (let offset = 0; offset < buffer.length; offset += CHUNK_SIZE) {
      const end = Math.min(offset + CHUNK_SIZE, buffer.length);
      hash.update(buffer.subarray(offset, end));
    }
    return hash.digest('hex');
  }
  return hash.update(buffer).digest('hex');
};

/**
 * Computes a hexadecimal SHA-256 hash of a readable stream.
 * @param stream - A readable stream of data.
 * @returns Promise resolving to 64-character lowercase hexadecimal SHA-256 string.
 */
export const computeStreamHash = (stream: NodeJS.ReadableStream): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');

    stream.on('data', (chunk: Buffer | string) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
};
