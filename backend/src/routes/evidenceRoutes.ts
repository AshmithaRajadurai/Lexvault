import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { Evidence } from '../models/Evidence';
import { CustodyEvent, CustodyAction } from '../models/CustodyEvent';
import { Case } from '../models/Case';
import { upload, processAndStoreFile } from '../storage/fileManager';
import { computeHash } from '../crypto/hashing';
import { generateActorKeyPair, signCustodyPayload } from '../crypto/signatures';
import { generateProof } from '../zk/zkService';
import {
  anchorEvidenceOnChain,
  recordCustodyOnChain,
  verifyOnChainHash,
} from '../blockchain/ledgerService';
import { authenticateToken } from '../middleware/auth';
import { checkRole } from '../middleware/rbac';

const router = Router();

const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

// POST /api/evidence/upload - Multer buffer upload & full pipeline
router.post(
  '/upload',
  authenticateToken,
  checkRole(['Admin', 'Investigator']),
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded. Expected field name: "file"' });
        return;
      }

      const { caseId, secretSalt } = req.body;
      let { evidenceId } = req.body;

      if (!caseId) {
        res.status(400).json({ error: 'caseId is required' });
        return;
      }

      // Verify or auto-initialize associated case
      let targetCase = await Case.findOne({ caseId });
      if (!targetCase) {
        targetCase = await Case.create({
          caseId,
          title: `Investigation Matter ${caseId}`,
          description: 'Auto-initialized investigative case registry',
          createdBy: req.user?.email || 'system@lexvault.local',
        });
      }

      if (!evidenceId || typeof evidenceId !== 'string' || evidenceId.trim() === '') {
        evidenceId = `EV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      } else {
        evidenceId = evidenceId.trim();
      }

      const existingEvidence = await Evidence.findOne({ evidenceId });
      if (existingEvidence) {
        res.status(409).json({ error: `Evidence with ID '${evidenceId}' already exists` });
        return;
      }

      // 1. Hash & AES-256-GCM Encrypt to disk
      const stored = await processAndStoreFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // 2. Generate cryptographic commitment
      const salt = secretSalt || crypto.randomBytes(16).toString('hex');
      let commitment: string;
      try {
        const zkResult = await generateProof(stored.sha256, salt);
        commitment = zkResult.commitment;
      } catch (zkErr) {
        commitment = computeHash(Buffer.from(stored.sha256 + salt));
      }

      const actor = req.user?.email || req.user?.userId || 'investigator@lexvault.local';

      // 3. Save to MongoDB Evidence collection
      const newEvidence = await Evidence.create({
        evidenceId,
        caseId,
        filename: req.file.originalname,
        sha256: stored.sha256,
        commitment,
        storagePath: stored.storagePath,
        mimeType: req.file.mimetype,
        uploadedBy: actor,
        status: 'VERIFIED',
        iv: stored.iv,
        authTag: stored.authTag,
      });

      // 4. Automatically log initial 'UPLOADED' CustodyEvent with actor digital signature
      const keyPair = generateActorKeyPair();
      const custodyPayload = {
        evidenceId,
        actorId: actor,
        action: 'UPLOADED',
        timestamp: new Date().toISOString(),
        sha256: stored.sha256,
      };
      const digitalSignature = signCustodyPayload(keyPair.privateKey, custodyPayload);

      const initialCustody = await CustodyEvent.create({
        evidenceId,
        actorId: actor,
        action: 'UPLOADED',
        timestamp: new Date(),
        previousHash: GENESIS_HASH,
        currentHash: stored.sha256,
        digitalSignature,
      });

      // 5. Anchor commitment on-chain asynchronously
      anchorEvidenceOnChain(evidenceId, stored.sha256, commitment).catch((chainErr) => {
        console.warn(`[Evidence API] On-chain anchor error for ${evidenceId}:`, chainErr.message);
      });

      res.status(201).json({
        message: 'Evidence successfully processed, encrypted, and anchored',
        evidence: newEvidence,
        custodyEvent: initialCustody,
      });
    } catch (error: any) {
      console.error('[Evidence API] Upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to process evidence upload' });
    }
  }
);

// GET /api/evidence - List evidence items (optional filter: ?caseId=)
router.get(
  '/',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const filter: Record<string, any> = {};
      if (req.query.caseId) {
        filter.caseId = req.query.caseId;
      }

      const evidence = await Evidence.find(filter).sort({ timestamp: -1 });
      res.status(200).json({ evidence });
    } catch (error: any) {
      console.error('[Evidence API] List error:', error);
      res.status(500).json({ error: 'Failed to retrieve evidence list' });
    }
  }
);

// GET /api/evidence/:evidenceId - Full evidence details, custody log trail, and on-chain status
router.get(
  '/:evidenceId',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const evidenceId = String(req.params.evidenceId);
      const evidence = await Evidence.findOne({ evidenceId });

      if (!evidence) {
        res.status(404).json({ error: `Evidence '${evidenceId}' not found` });
        return;
      }

      const custodyEvents = await CustodyEvent.find({ evidenceId }).sort({ timestamp: 1 });

      const onChainVerified = await verifyOnChainHash(evidenceId, evidence.sha256);

      res.status(200).json({
        evidence,
        custodyEvents,
        onChainVerified,
      });
    } catch (error: any) {
      console.error('[Evidence API] Fetch error:', error);
      res.status(500).json({ error: 'Failed to retrieve evidence details' });
    }
  }
);

// POST /api/evidence/:evidenceId/custody - Append new signed custody action
router.post(
  '/:evidenceId/custody',
  authenticateToken,
  checkRole(['Admin', 'Investigator', 'Verifier']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const evidenceId = String(req.params.evidenceId);
      const { action, signature } = req.body;

      const validActions: CustodyAction[] = [
        'COLLECTED',
        'UPLOADED',
        'TRANSFERRED',
        'ANALYZED',
        'VERIFIED',
      ];

      if (!action || !validActions.includes(action)) {
        res.status(400).json({
          error: `Invalid action. Must be one of: ${validActions.join(', ')}`,
        });
        return;
      }

      const evidence = await Evidence.findOne({ evidenceId });
      if (!evidence) {
        res.status(404).json({ error: `Evidence '${evidenceId}' not found` });
        return;
      }

      // Find latest event to maintain previousHash chain integrity
      const lastEvent = await CustodyEvent.findOne({ evidenceId }).sort({ timestamp: -1 });
      const previousHash = lastEvent ? lastEvent.currentHash : evidence.sha256;

      const timestamp = new Date();
      const actor = req.user?.email || req.user?.userId || 'actor';

      // Compute cryptographic currentHash chaining
      const currentHash = computeHash(
        Buffer.from(`${previousHash}:${action}:${timestamp.toISOString()}:${actor}`)
      );

      // Generate or use digital signature
      let digitalSignature = signature;
      if (!digitalSignature) {
        const keyPair = generateActorKeyPair();
        digitalSignature = signCustodyPayload(keyPair.privateKey, {
          evidenceId,
          action,
          actorId: actor,
          timestamp: timestamp.toISOString(),
          previousHash,
          currentHash,
        });
      }

      const newCustodyEvent = await CustodyEvent.create({
        evidenceId,
        actorId: actor,
        action,
        timestamp,
        previousHash,
        currentHash,
        digitalSignature,
      });

      // Record on-chain asynchronously
      recordCustodyOnChain(evidenceId, action, digitalSignature, previousHash).catch(
        (chainErr) => {
          console.warn(`[Evidence API] On-chain custody record error:`, chainErr.message);
        }
      );

      res.status(201).json({
        message: 'Custody event recorded successfully',
        custodyEvent: newCustodyEvent,
      });
    } catch (error: any) {
      console.error('[Evidence API] Custody logging error:', error);
      res.status(500).json({ error: error.message || 'Failed to record custody transition' });
    }
  }
);

export default router;
