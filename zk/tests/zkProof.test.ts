import { generateZKProof } from '../src/prover';
import { verifyZKProof } from '../src/verifier';
import { computePoseidonCommitment } from '../src/poseidon';

describe('LEXVAULT Zero-Knowledge Proof Circuit & Service', () => {
  const sampleEvidenceHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const sampleSecretSalt = 'investigator_secure_salt_7701';

  it('computes deterministic Poseidon commitment', async () => {
    const commitment1 = await computePoseidonCommitment(sampleEvidenceHash, sampleSecretSalt);
    const commitment2 = await computePoseidonCommitment(sampleEvidenceHash, sampleSecretSalt);

    expect(typeof commitment1).toBe('string');
    expect(commitment1.length).toBeGreaterThan(0);
    expect(commitment1).toBe(commitment2);
  });

  it('generates a valid Groth16 proof and successfully verifies it', async () => {
    const { proof, publicSignals } = await generateZKProof(
      sampleEvidenceHash,
      sampleSecretSalt
    );

    expect(proof).toBeDefined();
    expect(proof.protocol).toBe('groth16');
    expect(proof.curve).toBe('bn128');
    expect(proof.pi_a).toHaveLength(3);
    expect(proof.pi_b).toHaveLength(3);
    expect(proof.pi_c).toHaveLength(3);

    expect(publicSignals).toBeDefined();
    expect(publicSignals).toHaveLength(1);

    const isValid = await verifyZKProof(proof, publicSignals);
    expect(isValid).toBe(true);
  });

  it('rejects verification if publicSignals are tampered with', async () => {
    const { proof, publicSignals } = await generateZKProof(
      sampleEvidenceHash,
      sampleSecretSalt
    );

    // Tamper with public commitment signal
    const tamperedSignals = ['999999999999999999999999999999999999999999999999'];

    const isValid = await verifyZKProof(proof, tamperedSignals);
    expect(isValid).toBe(false);
  });

  it('rejects verification if proof object is malformed or corrupted', async () => {
    const { proof, publicSignals } = await generateZKProof(
      sampleEvidenceHash,
      sampleSecretSalt
    );

    const corruptedProof = {
      ...proof,
      pi_a: ['0', '0', '1'],
    };

    const isValid = await verifyZKProof(corruptedProof, publicSignals);
    expect(isValid).toBe(false);
  });

  it('rejects verification for empty publicSignals', async () => {
    const { proof } = await generateZKProof(sampleEvidenceHash, sampleSecretSalt);

    const isValid = await verifyZKProof(proof, []);
    expect(isValid).toBe(false);
  });
});
