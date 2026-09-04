import { expect } from 'chai';
import { ethers } from 'hardhat';
import { LexVaultRegistry } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('LexVaultRegistry Smart Contract', () => {
  let registry: LexVaultRegistry;
  let owner: SignerWithAddress;
  let investigator: SignerWithAddress;
  let verifier: SignerWithAddress;

  const testEvidenceId = 'EV-CASE-2026-001';
  const testSha256 = ethers.keccak256(ethers.toUtf8Bytes('original-evidence-payload'));
  const testCommitment = ethers.keccak256(ethers.toUtf8Bytes('poseidon-commitment-hash'));

  beforeEach(async () => {
    [owner, investigator, verifier] = await ethers.getSigners();
    const LexVaultRegistryFactory = await ethers.getContractFactory('LexVaultRegistry');
    registry = await LexVaultRegistryFactory.deploy();
    await registry.waitForDeployment();
  });

  describe('1. Evidence Registration', () => {
    it('registers evidence successfully and retrieves correct record', async () => {
      await expect(
        registry.connect(investigator).registerEvidence(testEvidenceId, testSha256, testCommitment)
      )
        .to.emit(registry, 'EvidenceRegistered')
        .withArgs(testEvidenceId, testSha256, investigator.address);

      const record = await registry.getEvidence(testEvidenceId);
      expect(record.evidenceId).to.equal(testEvidenceId);
      expect(record.sha256Hash).to.equal(testSha256);
      expect(record.commitment).to.equal(testCommitment);
      expect(record.registeredBy).to.equal(investigator.address);
      expect(record.timestamp).to.be.gt(0);
    });

    it('reverts when attempting to register duplicate evidenceId', async () => {
      await registry.registerEvidence(testEvidenceId, testSha256, testCommitment);

      await expect(
        registry.registerEvidence(testEvidenceId, testSha256, testCommitment)
      ).to.be.revertedWith('Evidence already registered');
    });

    it('reverts if evidenceId or hash is empty/zero', async () => {
      await expect(
        registry.registerEvidence('', testSha256, testCommitment)
      ).to.be.revertedWith('Evidence ID cannot be empty');

      await expect(
        registry.registerEvidence('EV-EMPTY', ethers.ZeroHash, testCommitment)
      ).to.be.revertedWith('SHA-256 hash cannot be zero');
    });
  });

  describe('2. Custody Logging', () => {
    beforeEach(async () => {
      await registry.connect(investigator).registerEvidence(testEvidenceId, testSha256, testCommitment);
    });

    it('records custody transitions and retrieves history correctly', async () => {
      const mockSignature = ethers.toUtf8Bytes('ed25519-signature-hex-string');
      const prevHash = ethers.ZeroHash;

      await expect(
        registry.connect(investigator).recordCustody(testEvidenceId, 'COLLECTED', mockSignature, prevHash)
      )
        .to.emit(registry, 'CustodyLogged')
        .withArgs(testEvidenceId, 'COLLECTED', investigator.address);

      const history = await registry.getCustodyHistory(testEvidenceId);
      expect(history.length).to.equal(1);
      expect(history[0].evidenceId).to.equal(testEvidenceId);
      expect(history[0].action).to.equal('COLLECTED');
      expect(history[0].actor).to.equal(investigator.address);
      expect(history[0].prevHash).to.equal(prevHash);

      // Append second transition
      await registry.connect(verifier).recordCustody(testEvidenceId, 'VERIFIED', mockSignature, testSha256);
      const updatedHistory = await registry.getCustodyHistory(testEvidenceId);
      expect(updatedHistory.length).to.equal(2);
      expect(updatedHistory[1].action).to.equal('VERIFIED');
      expect(updatedHistory[1].actor).to.equal(verifier.address);
    });

    it('reverts if logging custody for non-existent evidence', async () => {
      const mockSignature = ethers.toUtf8Bytes('signature');
      await expect(
        registry.recordCustody('NON-EXISTENT', 'COLLECTED', mockSignature, ethers.ZeroHash)
      ).to.be.revertedWith('Evidence does not exist');
    });
  });

  describe('3. Evidence Integrity Verification', () => {
    beforeEach(async () => {
      await registry.registerEvidence(testEvidenceId, testSha256, testCommitment);
    });

    it('returns true when checking against exact registered hash', async () => {
      const isValid = await registry.verifyEvidenceIntegrity(testEvidenceId, testSha256);
      expect(isValid).to.equal(true);
    });

    it('returns false when checking against altered or corrupted hash', async () => {
      const alteredHash = ethers.keccak256(ethers.toUtf8Bytes('tampered-payload'));
      const isValid = await registry.verifyEvidenceIntegrity(testEvidenceId, alteredHash);
      expect(isValid).to.equal(false);
    });

    it('returns false for unregistered evidenceId', async () => {
      const isValid = await registry.verifyEvidenceIntegrity('UNKNOWN-ID', testSha256);
      expect(isValid).to.equal(false);
    });
  });

  describe('4. Merkle Root Anchoring', () => {
    it('anchors Merkle root and emits event', async () => {
      const testRoot = ethers.keccak256(ethers.toUtf8Bytes('merkle-root-batch-1'));

      await expect(registry.anchorMerkleRoot(testRoot))
        .to.emit(registry, 'MerkleRootAnchored')
        .withArgs(testRoot);

      const isAnchored = await registry.anchoredMerkleRoots(testRoot);
      expect(isAnchored).to.equal(true);
    });
  });
});
