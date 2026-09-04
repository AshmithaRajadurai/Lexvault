import crypto from 'crypto';

/**
 * Combines and hashes two 32-byte hex hashes using SHA-256 in lexicographical order.
 */
export const hashPair = (a: string, b: string): string => {
  const combined = a <= b ? a + b : b + a;
  return crypto.createHash('sha256').update(combined).digest('hex');
};

/**
 * Computes the Merkle Root of an array of leaf hashes using a binary Merkle tree.
 * @param hashes - Array of hexadecimal SHA-256 leaf hashes.
 * @returns The hexadecimal SHA-256 Merkle root string.
 */
export const getMerkleRoot = (hashes: string[]): string => {
  if (!hashes || hashes.length === 0) {
    return '';
  }
  if (hashes.length === 1) {
    return hashes[0];
  }

  let currentLevel: string[] = [...hashes];

  while (currentLevel.length > 1) {
    if (currentLevel.length % 2 === 1) {
      currentLevel.push(currentLevel[currentLevel.length - 1]);
    }

    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
    }
    currentLevel = nextLevel;
  }

  return currentLevel[0];
};

/**
 * Generates an audit proof (sibling hashes) for a specific target leaf hash in the tree.
 * @param hashes - Array of hexadecimal SHA-256 leaf hashes.
 * @param targetHash - The specific leaf hash to prove.
 * @returns Array of sibling hashes forming the Merkle proof path.
 */
export const getMerkleProof = (
  hashes: string[],
  targetHash: string
): string[] => {
  if (!hashes || hashes.length === 0) {
    return [];
  }

  let targetIndex = hashes.indexOf(targetHash);
  if (targetIndex === -1) {
    return [];
  }

  if (hashes.length === 1) {
    return [];
  }

  const proof: string[] = [];
  let currentLevel: string[] = [...hashes];

  while (currentLevel.length > 1) {
    if (currentLevel.length % 2 === 1) {
      currentLevel.push(currentLevel[currentLevel.length - 1]);
    }

    const isEven = targetIndex % 2 === 0;
    const siblingIndex = isEven ? targetIndex + 1 : targetIndex - 1;

    proof.push(currentLevel[siblingIndex]);

    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
    }

    targetIndex = Math.floor(targetIndex / 2);
    currentLevel = nextLevel;
  }

  return proof;
};

/**
 * Verifies a Merkle proof against a known root and target leaf hash.
 * @param leaf - The target leaf hash.
 * @param proof - Sibling hashes on the Merkle path.
 * @param root - Expected Merkle root hash.
 * @returns boolean indicating if the proof is valid.
 */
export const verifyMerkleProof = (
  leaf: string,
  proof: string[],
  root: string
): boolean => {
  if (!leaf || !root) {
    return false;
  }

  if (proof.length === 0) {
    return leaf === root;
  }

  let computed = leaf;
  for (const sibling of proof) {
    computed = hashPair(computed, sibling);
  }

  return computed === root;
};
