import { generateProof, verifyProof } from '../src/zk/zkService';

describe('Backend ZK Service Bridge', () => {
  const testEvidenceHash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
  const testSalt = 'salt_investigator_alpha_99';

  it('generates a proof, commitment, and publicSignals via backend bridge', async () => {
    const result = await generateProof(testEvidenceHash, testSalt);

    expect(result).toBeDefined();
    expect(result.proof).toBeDefined();
    expect(result.commitment).toBeDefined();
    expect(typeof result.commitment).toBe('string');
    expect(result.publicSignals).toContain(result.commitment);
  });

  it('verifies a valid proof and rejects tampered signals', async () => {
    const result = await generateProof(testEvidenceHash, testSalt);

    const isValid = await verifyProof(result.proof, result.publicSignals);
    expect(isValid).toBe(true);

    const isTamperedValid = await verifyProof(result.proof, ['1234567890']);
    expect(isTamperedValid).toBe(false);
  });
});
