import { Router, Request, Response } from 'express';
import { generateProof, verifyProof } from '../zk/zkService';

const router = Router();

// POST /api/zk/generate
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { evidenceHash, salt, secretSalt } = req.body;
    const resolvedSalt = salt || secretSalt;

    if (!evidenceHash || !resolvedSalt) {
      res.status(400).json({
        error: 'evidenceHash and salt (or secretSalt) are required',
      });
      return;
    }

    const result = await generateProof(evidenceHash, resolvedSalt);

    res.status(200).json({
      proof: result.proof,
      commitment: result.commitment,
      publicSignals: result.publicSignals,
    });
  } catch (error: any) {
    console.error('[ZK API] Error generating proof:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate ZK proof',
    });
  }
});

// POST /api/zk/verify
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { proof, publicSignals } = req.body;

    if (!proof || !publicSignals || !Array.isArray(publicSignals)) {
      res.status(400).json({
        error: 'proof object and publicSignals array are required',
      });
      return;
    }

    const isValid = await verifyProof(proof, publicSignals);

    res.status(200).json({ isValid });
  } catch (error: any) {
    console.error('[ZK API] Error verifying proof:', error);
    res.status(500).json({
      error: error.message || 'Failed to verify ZK proof',
    });
  }
});

export default router;
