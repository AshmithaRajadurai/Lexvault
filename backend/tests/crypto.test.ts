import fs from 'fs';
import { Readable } from 'stream';
import {
  computeHash,
  computeStreamHash,
  encryptFileBuffer,
  decryptFileBuffer,
  generateSecretKey,
  generateActorKeyPair,
  signCustodyPayload,
  verifyCustodyPayload,
  getMerkleRoot,
  getMerkleProof,
  verifyMerkleProof,
} from '../src/crypto';
import { processAndStoreFile, retrieveAndDecryptFile } from '../src/storage/fileManager';

describe('LEXVAULT Cryptography Engine', () => {
  describe('1. SHA-256 Hashing', () => {
    it('produces deterministic SHA-256 hashes for identical buffers', () => {
      const data1 = Buffer.from('Confidential Digital Evidence Payload 2026', 'utf8');
      const data2 = Buffer.from('Confidential Digital Evidence Payload 2026', 'utf8');

      const hash1 = computeHash(data1);
      const hash2 = computeHash(data2);

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
    });

    it('demonstrates avalanche effect when a single byte is flipped', () => {
      const original = Buffer.from('Audit Chain Of Custody Block #100', 'utf8');
      const modified = Buffer.from('Audit Chain Of Custody Block #101', 'utf8');

      const hash1 = computeHash(original);
      const hash2 = computeHash(modified);

      expect(hash1).not.toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash2).toHaveLength(64);
    });

    it('computes stream hash matching buffer hash', async () => {
      const content = 'Streaming forensic disk image payload buffer';
      const buffer = Buffer.from(content, 'utf8');
      const expectedHash = computeHash(buffer);

      const stream = Readable.from([Buffer.from(content, 'utf8')]);
      const streamHash = await computeStreamHash(stream);

      expect(streamHash).toBe(expectedHash);
    });
  });

  describe('2. AES-256-GCM Encryption & Decryption', () => {
    const testKey = generateSecretKey();
    const originalText = 'Highly classified chain of custody evidence artifact payload.';
    const originalBuffer = Buffer.from(originalText, 'utf8');

    it('successfully encrypts and decrypts buffer in round-trip', () => {
      const { encryptedData, iv, authTag } = encryptFileBuffer(originalBuffer, testKey);

      expect(encryptedData).not.toEqual(originalBuffer);
      expect(iv).toHaveLength(24); // 12 bytes = 24 hex chars
      expect(authTag).toHaveLength(32); // 16 bytes = 32 hex chars

      const decrypted = decryptFileBuffer(encryptedData, testKey, iv, authTag);
      expect(decrypted.toString('utf8')).toBe(originalText);
    });

    it('fails decryption if ciphertext has been tampered with', () => {
      const { encryptedData, iv, authTag } = encryptFileBuffer(originalBuffer, testKey);

      // Flip a byte in encrypted data
      const tamperedBytes = Buffer.from(encryptedData);
      tamperedBytes[0] ^= 0xff;

      expect(() => {
        decryptFileBuffer(tamperedBytes, testKey, iv, authTag);
      }).toThrow();
    });

    it('fails decryption if auth tag is incorrect', () => {
      const { encryptedData, iv } = encryptFileBuffer(originalBuffer, testKey);
      const corruptedTag = '0'.repeat(32);

      expect(() => {
        decryptFileBuffer(encryptedData, testKey, iv, corruptedTag);
      }).toThrow();
    });
  });

  describe('3. Digital Signatures (Ed25519)', () => {
    let keyPair: { publicKey: string; privateKey: string };

    beforeAll(() => {
      keyPair = generateActorKeyPair();
    });

    it('generates valid SPKI and PKCS8 PEM keypair', () => {
      expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
      expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY');
    });

    it('signs and verifies custody payload successfully', () => {
      const custodyEvent = {
        evidenceId: 'EV-2026-9901',
        actorId: 'investigator-007',
        action: 'COLLECTED',
        timestamp: '2026-09-04T10:00:00.000Z',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      };

      const signature = signCustodyPayload(keyPair.privateKey, custodyEvent);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);

      const isValid = verifyCustodyPayload(keyPair.publicKey, custodyEvent, signature);
      expect(isValid).toBe(true);
    });

    it('rejects signature if payload is tampered with', () => {
      const custodyEvent = {
        evidenceId: 'EV-2026-9901',
        actorId: 'investigator-007',
        action: 'COLLECTED',
        timestamp: '2026-09-04T10:00:00.000Z',
      };

      const signature = signCustodyPayload(keyPair.privateKey, custodyEvent);

      const tamperedEvent = {
        ...custodyEvent,
        action: 'TAMPERED',
      };

      const isValid = verifyCustodyPayload(keyPair.publicKey, tamperedEvent, signature);
      expect(isValid).toBe(false);
    });

    it('rejects signature verified with different public key', () => {
      const otherKeyPair = generateActorKeyPair();
      const custodyEvent = { evidenceId: 'EV-123', action: 'UPLOADED' };

      const signature = signCustodyPayload(keyPair.privateKey, custodyEvent);
      const isValid = verifyCustodyPayload(otherKeyPair.publicKey, custodyEvent, signature);

      expect(isValid).toBe(false);
    });
  });

  describe('4. Merkle Tree Engine', () => {
    const leaves = [
      computeHash(Buffer.from('Evidence Item 1')),
      computeHash(Buffer.from('Evidence Item 2')),
      computeHash(Buffer.from('Evidence Item 3')),
      computeHash(Buffer.from('Evidence Item 4')),
    ];

    it('computes deterministic Merkle root for leaf hashes', () => {
      const root1 = getMerkleRoot(leaves);
      const root2 = getMerkleRoot(leaves);

      expect(root1).toHaveLength(64);
      expect(root1).toBe(root2);
    });

    it('handles odd number of leaves gracefully', () => {
      const oddLeaves = leaves.slice(0, 3);
      const root = getMerkleRoot(oddLeaves);

      expect(root).toHaveLength(64);
    });

    it('generates valid Merkle proof and verifies membership', () => {
      const root = getMerkleRoot(leaves);

      for (const leaf of leaves) {
        const proof = getMerkleProof(leaves, leaf);
        expect(proof.length).toBeGreaterThan(0);

        const isValid = verifyMerkleProof(leaf, proof, root);
        expect(isValid).toBe(true);
      }
    });

    it('rejects proof for tampered leaf hash', () => {
      const root = getMerkleRoot(leaves);
      const targetLeaf = leaves[0];
      const proof = getMerkleProof(leaves, targetLeaf);

      const fakeLeaf = computeHash(Buffer.from('Malicious Injected Leaf'));
      const isValid = verifyMerkleProof(fakeLeaf, proof, root);

      expect(isValid).toBe(false);
    });

    it('rejects invalid or corrupted proof path', () => {
      const root = getMerkleRoot(leaves);
      const targetLeaf = leaves[1];
      const corruptedProof = [computeHash(Buffer.from('Corrupted node'))];

      const isValid = verifyMerkleProof(targetLeaf, corruptedProof, root);
      expect(isValid).toBe(false);
    });
  });

  describe('5. Storage Pipeline (processAndStoreFile)', () => {
    const cleanupPaths: string[] = [];

    afterAll(async () => {
      for (const p of cleanupPaths) {
        if (fs.existsSync(p)) {
          await fs.promises.unlink(p);
        }
      }
    });

    it('processes, encrypts, and stores file on disk containing only raw encrypted bytes', async () => {
      const plainContent = 'Confidential crime scene report and photo evidence log';
      const plainBuffer = Buffer.from(plainContent, 'utf8');

      const result = await processAndStoreFile(plainBuffer, 'report.txt', 'text/plain');
      cleanupPaths.push(result.storagePath);

      expect(result.originalName).toBe('report.txt');
      expect(result.mimeType).toBe('text/plain');
      expect(result.sha256).toBe(computeHash(plainBuffer));
      expect(fs.existsSync(result.storagePath)).toBe(true);

      // Verify file on disk is ONLY encrypted bytes and not plaintext
      const diskBytes = await fs.promises.readFile(result.storagePath);
      expect(diskBytes).not.toEqual(plainBuffer);
      expect(diskBytes.toString('utf8')).not.toContain(plainContent);

      // Verify decryption retrieves original content perfectly
      const decrypted = await retrieveAndDecryptFile(
        result.storagePath,
        result.iv,
        result.authTag
      );
      expect(decrypted.toString('utf8')).toBe(plainContent);
    });
  });
});
