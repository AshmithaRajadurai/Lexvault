import {
  anchorEvidenceOnChain,
  recordCustodyOnChain,
  verifyOnChainHash,
  toBytes32,
  toSignatureBytes,
} from '../src/blockchain/ledgerService';

describe('Backend Blockchain Ledger Service', () => {
  const testEvidenceId = 'EV-LEDGER-TEST-001';
  const testSha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const testCommitment = '1892837492837498237498237498237498237498237498237498237498237498';

  it('normalizes hashes to bytes32 format', () => {
    const bytes32 = toBytes32(testSha256);
    expect(bytes32).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it('normalizes signatures to hex bytes', () => {
    const sigBytes = toSignatureBytes('ab'.repeat(32));
    expect(sigBytes).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  it('anchors evidence on chain or fallback successfully', async () => {
    const result = await anchorEvidenceOnChain(testEvidenceId, testSha256, testCommitment);
    expect(result).toBeDefined();
    expect(result.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it('records custody transition log', async () => {
    const result = await recordCustodyOnChain(
      testEvidenceId,
      'COLLECTED',
      'ed25519-mock-sig',
      testSha256
    );
    expect(result).toBeDefined();
    expect(result.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it('verifies on-chain hash integrity', async () => {
    const isValid = await verifyOnChainHash(testEvidenceId, testSha256);
    expect(isValid).toBe(true);

    const isAlteredValid = await verifyOnChainHash(
      testEvidenceId,
      '0000000000000000000000000000000000000000000000000000000000000000'
    );
    expect(isAlteredValid).toBe(false);
  });
});
