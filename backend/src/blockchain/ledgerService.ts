import { ethers } from 'ethers';
import path from 'path';
import fs from 'fs';

export interface BlockchainConfig {
  contractAddress: string;
  rpcUrl?: string;
  chainId?: number;
  abi: any[];
}

export interface OnChainEvidenceRecord {
  evidenceId: string;
  sha256Hash: string;
  commitment: string;
  timestamp: number;
  registeredBy: string;
}

export interface OnChainCustodyLog {
  evidenceId: string;
  action: string;
  actor: string;
  timestamp: number;
  signature: string;
  prevHash: string;
}

// In-memory fallback ledger state when local RPC node is not reachable
const fallbackEvidenceMap = new Map<string, OnChainEvidenceRecord>();
const fallbackCustodyMap = new Map<string, OnChainCustodyLog[]>();
const fallbackMerkleRoots = new Set<string>();

/**
 * Loads contract configuration (address & ABI).
 */
export const getContractConfig = (): BlockchainConfig => {
  const configPath = path.resolve(__dirname, 'contractConfig.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return {
    contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 31337,
    abi: [],
  };
};

/**
 * Normalizes a hex string or hash to a strict 32-byte 0x-prefixed hex string.
 */
export const toBytes32 = (input: string): string => {
  let clean = input.trim();
  if (clean.startsWith('0x') || clean.startsWith('0X')) {
    clean = clean.slice(2);
  }
  if (clean.length < 64) {
    clean = clean.padStart(64, '0');
  } else if (clean.length > 64) {
    clean = clean.slice(0, 64);
  }
  return '0x' + clean;
};

/**
 * Converts a signature string to 0x-prefixed hex bytes.
 */
export const toSignatureBytes = (sig: string): string => {
  let clean = sig.trim();
  if (clean.startsWith('0x') || clean.startsWith('0X')) {
    return clean;
  }
  if (/^[0-9a-fA-F]+$/.test(clean)) {
    return '0x' + clean;
  }
  return ethers.hexlify(ethers.toUtf8Bytes(clean));
};

/**
 * Resolves an active Contract instance or returns null if the RPC node is offline.
 */
export const getContractInstance = async (): Promise<ethers.Contract | null> => {
  // If explicitly disabled or running in test without live node
  if (process.env.USE_LIVE_RPC !== 'true') {
    return null;
  }

  const config = getContractConfig();
  const rpcUrl = process.env.RPC_URL || config.rpcUrl || 'http://127.0.0.1:8545';

  let provider: ethers.JsonRpcProvider | null = null;
  try {
    provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
      staticNetwork: ethers.Network.from(config.chainId || 31337),
    });

    await Promise.race([
      provider.getBlockNumber(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 300)),
    ]);

    const defaultPrivateKey =
      process.env.LEDGER_PRIVATE_KEY ||
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat Account #0
    const signer = new ethers.Wallet(defaultPrivateKey, provider);

    return new ethers.Contract(config.contractAddress, config.abi, signer);
  } catch (error) {
    if (provider) {
      provider.destroy();
    }
    return null;
  }
};

/**
 * Registers evidence hash and commitment on the blockchain registry.
 */
export const anchorEvidenceOnChain = async (
  evidenceId: string,
  sha256Hash: string,
  commitment: string
): Promise<{ txHash: string; isFallback: boolean }> => {
  const contract = await getContractInstance();
  const bytes32Hash = toBytes32(sha256Hash);
  const bytes32Commitment = toBytes32(commitment);

  if (contract) {
    const tx = await contract.registerEvidence(evidenceId, bytes32Hash, bytes32Commitment);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, isFallback: false };
  }

  // Offline fallback simulation
  fallbackEvidenceMap.set(evidenceId, {
    evidenceId,
    sha256Hash: bytes32Hash,
    commitment: bytes32Commitment,
    timestamp: Math.floor(Date.now() / 1000),
    registeredBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  });

  const mockTxHash = ethers.keccak256(
    ethers.toUtf8Bytes(`anchor-${evidenceId}-${Date.now()}`)
  );
  return { txHash: mockTxHash, isFallback: true };
};

/**
 * Records an immutable custody log entry on-chain.
 */
export const recordCustodyOnChain = async (
  evidenceId: string,
  action: string,
  signature: string,
  prevHash: string
): Promise<{ txHash: string; isFallback: boolean }> => {
  const contract = await getContractInstance();
  const sigBytes = toSignatureBytes(signature);
  const bytes32Prev = toBytes32(prevHash || ethers.ZeroHash);

  if (contract) {
    const tx = await contract.recordCustody(evidenceId, action, sigBytes, bytes32Prev);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, isFallback: false };
  }

  // Offline fallback simulation
  const existingLogs = fallbackCustodyMap.get(evidenceId) || [];
  existingLogs.push({
    evidenceId,
    action,
    actor: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    timestamp: Math.floor(Date.now() / 1000),
    signature: sigBytes,
    prevHash: bytes32Prev,
  });
  fallbackCustodyMap.set(evidenceId, existingLogs);

  const mockTxHash = ethers.keccak256(
    ethers.toUtf8Bytes(`custody-${evidenceId}-${action}-${Date.now()}`)
  );
  return { txHash: mockTxHash, isFallback: true };
};

/**
 * Anchors a batch Merkle Root on-chain.
 */
export const anchorMerkleRootOnChain = async (
  root: string
): Promise<{ txHash: string; isFallback: boolean }> => {
  const contract = await getContractInstance();
  const bytes32Root = toBytes32(root);

  if (contract) {
    const tx = await contract.anchorMerkleRoot(bytes32Root);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, isFallback: false };
  }

  fallbackMerkleRoots.add(bytes32Root);
  const mockTxHash = ethers.keccak256(
    ethers.toUtf8Bytes(`merkle-root-${bytes32Root}-${Date.now()}`)
  );
  return { txHash: mockTxHash, isFallback: true };
};

/**
 * Verifies whether a given SHA-256 test hash matches the registered on-chain evidence hash.
 */
export const verifyOnChainHash = async (
  evidenceId: string,
  testHash: string
): Promise<boolean> => {
  const contract = await getContractInstance();
  const checkBytes32 = toBytes32(testHash);

  if (contract) {
    try {
      return await contract.verifyEvidenceIntegrity(evidenceId, checkBytes32);
    } catch {
      return false;
    }
  }

  // Offline fallback simulation
  const record = fallbackEvidenceMap.get(evidenceId);
  if (!record) {
    return false;
  }
  return record.sha256Hash.toLowerCase() === checkBytes32.toLowerCase();
};
