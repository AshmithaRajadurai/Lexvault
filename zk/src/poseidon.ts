import crypto from 'crypto';
// @ts-ignore
import { buildPoseidon } from 'circomlibjs';

export const BN128_FIELD_MODULUS = BigInt(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);

let cachedPoseidon: any = null;

export const getPoseidon = async (): Promise<any> => {
  if (!cachedPoseidon) {
    cachedPoseidon = await buildPoseidon();
  }
  return cachedPoseidon;
};

/**
 * Normalizes an arbitrary string input into a scalar field element in BN128.
 */
export const toFieldElement = (input: string): bigint => {
  let clean = input.trim();
  if (clean.startsWith('0x') || clean.startsWith('0X')) {
    clean = clean.slice(2);
  }

  let big: bigint;
  try {
    if (/^[0-9a-fA-F]+$/.test(clean) && (clean.length >= 32 || /[a-fA-F]/.test(clean))) {
      big = BigInt('0x' + clean);
    } else if (/^\d+$/.test(clean)) {
      big = BigInt(clean);
    } else {
      const hex = crypto.createHash('sha256').update(input, 'utf8').digest('hex');
      big = BigInt('0x' + hex);
    }
  } catch {
    const hex = crypto.createHash('sha256').update(input, 'utf8').digest('hex');
    big = BigInt('0x' + hex);
  }

  return big % BN128_FIELD_MODULUS;
};

/**
 * Computes Poseidon(evidenceHash, secretSalt) as a decimal string.
 */
export const computePoseidonCommitment = async (
  evidenceHash: string,
  secretSalt: string
): Promise<string> => {
  const poseidon = await getPoseidon();
  const hashField = toFieldElement(evidenceHash);
  const saltField = toFieldElement(secretSalt);

  const hashVal = poseidon([hashField, saltField]);
  return poseidon.F.toString(hashVal);
};
