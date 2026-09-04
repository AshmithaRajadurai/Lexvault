import { Router, Request, Response } from 'express';
import { Case } from '../models/Case';
import { Evidence } from '../models/Evidence';
import { authenticateToken } from '../middleware/auth';
import { checkRole } from '../middleware/rbac';

const router = Router();

// POST /api/cases - Create new case (Investigator / Admin)
router.post(
  '/',
  authenticateToken,
  checkRole(['Admin', 'Investigator']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description } = req.body;
      let { caseId } = req.body;

      if (!title || typeof title !== 'string' || title.trim() === '') {
        res.status(400).json({ error: 'Case title is required' });
        return;
      }

      if (!caseId || typeof caseId !== 'string' || caseId.trim() === '') {
        caseId = `CASE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      } else {
        caseId = caseId.trim();
      }

      const existingCase = await Case.findOne({ caseId });
      if (existingCase) {
        res.status(409).json({ error: `Case with ID '${caseId}' already exists` });
        return;
      }

      const createdBy = req.user?.email || req.user?.userId || 'system';

      const newCase = await Case.create({
        caseId,
        title: title.trim(),
        description: description ? description.trim() : '',
        createdBy,
      });

      res.status(201).json({
        message: 'Case created successfully',
        case: newCase,
      });
    } catch (error: any) {
      console.error('[Cases API] Error creating case:', error);
      res.status(500).json({ error: 'Internal server error while creating case' });
    }
  }
);

// GET /api/cases - List all cases
router.get(
  '/',
  authenticateToken,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const cases = await Case.find().sort({ createdAt: -1 });
      res.status(200).json({ cases });
    } catch (error: any) {
      console.error('[Cases API] Error fetching cases:', error);
      res.status(500).json({ error: 'Internal server error while fetching cases' });
    }
  }
);

// GET /api/cases/:caseId - Details with all associated evidence
router.get(
  '/:caseId',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const caseId = String(req.params.caseId);
      const foundCase = await Case.findOne({ caseId });

      if (!foundCase) {
        res.status(404).json({ error: `Case '${caseId}' not found` });
        return;
      }

      const evidence = await Evidence.find({ caseId }).sort({ timestamp: -1 });

      res.status(200).json({
        case: foundCase,
        evidence,
      });
    } catch (error: any) {
      console.error('[Cases API] Error fetching case details:', error);
      res.status(500).json({ error: 'Internal server error while fetching case details' });
    }
  }
);

export default router;
