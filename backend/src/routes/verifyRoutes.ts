import { Router, Request, Response } from 'express';
import fs from 'fs';
import { Evidence } from '../models/Evidence';
import { upload } from '../storage/fileManager';
import { computeHash } from '../crypto/hashing';
import { verifyOnChainHash } from '../blockchain/ledgerService';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /api/verify/check-file - Compare re-uploaded file against DB and Blockchain records
router.post(
  '/check-file',
  authenticateToken,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded for verification. Expected field: "file"' });
        return;
      }

      const { evidenceId } = req.body;
      if (!evidenceId) {
        res.status(400).json({ error: 'evidenceId is required' });
        return;
      }

      const evidence = await Evidence.findOne({ evidenceId });
      if (!evidence) {
        res.status(404).json({ error: `Evidence '${evidenceId}' not found in registry` });
        return;
      }

      // Compute actual SHA-256 of the re-uploaded file
      const actualHash = computeHash(req.file.buffer);
      const expectedHash = evidence.sha256;

      // Check on-chain blockchain anchor integrity
      const onChainMatch = await verifyOnChainHash(evidenceId, actualHash);

      // Verify consistency across DB, disk, and blockchain
      const isDbMatch = actualHash.toLowerCase() === expectedHash.toLowerCase();
      const isIntegrityIntact = isDbMatch && onChainMatch && evidence.status !== 'TAMPERED';

      if (isIntegrityIntact) {
        res.status(200).json({
          status: 'VERIFIED',
          match: true,
          evidenceId,
          sha256: actualHash,
          onChainVerified: true,
        });
      } else {
        // Mark evidence record as TAMPERED
        evidence.status = 'TAMPERED';
        await evidence.save();

        res.status(200).json({
          status: 'TAMPERED',
          match: false,
          evidenceId,
          expectedHash,
          actualHash,
          onChainVerified: onChainMatch,
        });
      }
    } catch (error: any) {
      console.error('[Verify API] Check file error:', error);
      res.status(500).json({ error: error.message || 'Failed to verify file integrity' });
    }
  }
);

// POST /api/verify/simulate-tamper/:evidenceId - Demostration endpoint corrupting file & DB hash
router.post(
  '/simulate-tamper/:evidenceId',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const evidenceId = String(req.params.evidenceId);
      const evidence = await Evidence.findOne({ evidenceId });

      if (!evidence) {
        res.status(404).json({ error: `Evidence '${evidenceId}' not found` });
        return;
      }

      // 1. Corrupt encrypted file on disk by flipping bytes
      if (fs.existsSync(evidence.storagePath)) {
        try {
          const fileBytes = await fs.promises.readFile(evidence.storagePath);
          if (fileBytes.length > 0) {
            fileBytes[0] ^= 0xff;
            if (fileBytes.length > 1) {
              fileBytes[1] ^= 0xaa;
            }
            await fs.promises.writeFile(evidence.storagePath, fileBytes);
          }
        } catch (fileErr) {
          console.warn('[Verify API] Could not tamper disk file:', fileErr);
        }
      }

      // 2. Corrupt DB hash to simulate evidence database tampering
      const originalHash = evidence.sha256;
      evidence.sha256 = 'bad00000' + originalHash.slice(8);
      evidence.status = 'TAMPERED';
      await evidence.save();

      res.status(200).json({
        message: 'Tamper simulation applied. File integrity corrupted.',
        evidenceId: evidence.evidenceId,
        status: 'TAMPERED',
        corruptedHash: evidence.sha256,
      });
    } catch (error: any) {
      console.error('[Verify API] Simulate tamper error:', error);
      res.status(500).json({ error: error.message || 'Failed to simulate tamper' });
    }
  }
);

export default router;
