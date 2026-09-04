import path from 'path';

export interface ZKGenerateResult {
  proof: object;
  commitment: string;
  publicSignals: string[];
}

let cachedZk: any = null;

const getZk = (): any => {
  if (cachedZk) {
    return cachedZk;
  }

  // Attempt resolving from workspace or relative build paths
  const possiblePaths = [
    path.resolve(__dirname, '../../../zk/dist'),
    path.resolve(__dirname, '../../../zk/src'),
    'zk',
  ];

  for (const p of possiblePaths) {
    try {
      cachedZk = require(p);
      if (cachedZk && cachedZk.generateZKProof) {
        return cachedZk;
      }
    } catch (err) {
      // Continue to next path
    }
  }

  throw new Error('Failed to resolve ZK module from zk workspace or build directory.');
};

/**
 * Generates a Zero-Knowledge Proof and commitment for the given evidence hash and salt.
 */
export const generateProof = async (
  evidenceHash: string,
  secretSalt: string
): Promise<ZKGenerateResult> => {
  const zk = getZk();
  const { proof, publicSignals } = await zk.generateZKProof(evidenceHash, secretSalt);

  return {
    proof,
    commitment: publicSignals[0],
    publicSignals,
  };
};

/**
 * Verifies a Zero-Knowledge Proof against publicSignals.
 */
export const verifyProof = async (
  proof: object,
  publicSignals: string[]
): Promise<boolean> => {
  const zk = getZk();
  return zk.verifyZKProof(proof, publicSignals);
};
