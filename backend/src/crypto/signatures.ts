import crypto from 'crypto';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Deterministically serializes any JS object or primitive into a canonical JSON string.
 * Keys in objects are sorted alphabetically at all depths.
 */
export const canonicalize = (obj: any): string => {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalize(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return (
    '{' +
    keys
      .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`)
      .join(',') +
    '}'
  );
};

/**
 * Generates an Ed25519 asymmetric keypair in standard PEM encoding.
 */
export const generateActorKeyPair = (): KeyPair => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { publicKey, privateKey };
};

/**
 * Signs a custody payload object with an Ed25519 private key.
 * @param privateKey - PEM-encoded private key.
 * @param payload - Arbitrary custody event payload object.
 * @returns Hex-encoded digital signature string.
 */
export const signCustodyPayload = (
  privateKey: string,
  payload: object
): string => {
  const serialized = Buffer.from(canonicalize(payload), 'utf8');
  const signature = crypto.sign(null, serialized, privateKey);
  return signature.toString('hex');
};

/**
 * Verifies a custody payload's signature with an Ed25519 public key.
 * @param publicKey - PEM-encoded public key.
 * @param payload - Arbitrary custody event payload object.
 * @param signature - Hex-encoded signature string.
 * @returns boolean indicating if the signature is valid.
 */
export const verifyCustodyPayload = (
  publicKey: string,
  payload: object,
  signature: string
): boolean => {
  try {
    const serialized = Buffer.from(canonicalize(payload), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'hex');
    return crypto.verify(null, serialized, publicKey, signatureBuffer);
  } catch (error) {
    return false;
  }
};
