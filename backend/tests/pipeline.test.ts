import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import app from '../src/index';
import { Case } from '../src/models/Case';
import { Evidence } from '../src/models/Evidence';
import { CustodyEvent } from '../src/models/CustodyEvent';

const JWT_SECRET = process.env.JWT_SECRET || 'lexvault_super_secret_jwt_key_2026';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lexvault';

describe('LEXVAULT End-to-End Evidence Pipeline & Tamper Engine', () => {
  let investigatorToken: string;
  const testCaseId = `CASE-TEST-${Date.now()}`;
  const testEvidenceId = `EV-TEST-${Date.now()}`;
  const fileContent = 'CRITICAL FORENSIC EVIDENCE: System memory dump and network activity log.';
  const fileBuffer = Buffer.from(fileContent, 'utf8');

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    // Generate valid JWT token for an Investigator
    investigatorToken = jwt.sign(
      {
        userId: 'investigator-test-uuid',
        email: 'investigator@lexvault.local',
        role: 'Investigator',
        username: 'investigator_test',
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test documents
    await Case.deleteMany({ caseId: testCaseId });
    const testEvidences = await Evidence.find({ caseId: testCaseId });
    for (const ev of testEvidences) {
      if (fs.existsSync(ev.storagePath)) {
        try {
          await fs.promises.unlink(ev.storagePath);
        } catch {}
      }
    }
    await Evidence.deleteMany({ caseId: testCaseId });
    await CustodyEvent.deleteMany({ evidenceId: testEvidenceId });

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe('1. Case Management', () => {
    it('creates a new case successfully with investigator role', async () => {
      const res = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${investigatorToken}`)
        .send({
          caseId: testCaseId,
          title: 'Cyber Espionage Investigation Alpha',
          description: 'Tracking unauthorized data exfiltration',
        });

      expect(res.status).toBe(201);
      expect(res.body.case).toBeDefined();
      expect(res.body.case.caseId).toBe(testCaseId);
      expect(res.body.case.title).toBe('Cyber Espionage Investigation Alpha');
    });

    it('lists cases including the newly created case', async () => {
      const res = await request(app)
        .get('/api/cases')
        .set('Authorization', `Bearer ${investigatorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.cases)).toBe(true);
      const found = res.body.cases.find((c: any) => c.caseId === testCaseId);
      expect(found).toBeDefined();
    });

    it('retrieves case details by caseId', async () => {
      const res = await request(app)
        .get(`/api/cases/${testCaseId}`)
        .set('Authorization', `Bearer ${investigatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.case.caseId).toBe(testCaseId);
      expect(Array.isArray(res.body.evidence)).toBe(true);
    });
  });

  describe('2. Evidence Upload & Pipeline', () => {
    it('uploads, encrypts, commits, and anchors evidence', async () => {
      const res = await request(app)
        .post('/api/evidence/upload')
        .set('Authorization', `Bearer ${investigatorToken}`)
        .field('caseId', testCaseId)
        .field('evidenceId', testEvidenceId)
        .attach('file', fileBuffer, 'memory_dump.log');

      expect(res.status).toBe(201);
      expect(res.body.evidence).toBeDefined();
      expect(res.body.evidence.evidenceId).toBe(testEvidenceId);
      expect(res.body.evidence.status).toBe('VERIFIED');
      expect(res.body.evidence.sha256).toBeDefined();
      expect(res.body.evidence.commitment).toBeDefined();
      expect(res.body.custodyEvent).toBeDefined();
      expect(res.body.custodyEvent.action).toBe('UPLOADED');

      // Verify file on disk is encrypted byte stream
      expect(fs.existsSync(res.body.evidence.storagePath)).toBe(true);
      const diskBytes = await fs.promises.readFile(res.body.evidence.storagePath);
      expect(diskBytes).not.toEqual(fileBuffer);
    });

    it('retrieves evidence details including custody history and on-chain verification', async () => {
      const res = await request(app)
        .get(`/api/evidence/${testEvidenceId}`)
        .set('Authorization', `Bearer ${investigatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.evidence.evidenceId).toBe(testEvidenceId);
      expect(res.body.custodyEvents.length).toBeGreaterThanOrEqual(1);
      expect(res.body.onChainVerified).toBe(true);
    });

    it('appends a chained and signed custody transition event', async () => {
      const res = await request(app)
        .post(`/api/evidence/${testEvidenceId}/custody`)
        .set('Authorization', `Bearer ${investigatorToken}`)
        .send({
          action: 'ANALYZED',
        });

      expect(res.status).toBe(201);
      expect(res.body.custodyEvent).toBeDefined();
      expect(res.body.custodyEvent.action).toBe('ANALYZED');
      expect(res.body.custodyEvent.previousHash).toBeDefined();
      expect(res.body.custodyEvent.currentHash).toBeDefined();
      expect(res.body.custodyEvent.digitalSignature).toBeDefined();
    });
  });

  describe('3. Verification & Tamper Detection Engine', () => {
    it('returns VERIFIED when re-uploading the unaltered original file', async () => {
      const res = await request(app)
        .post('/api/verify/check-file')
        .set('Authorization', `Bearer ${investigatorToken}`)
        .field('evidenceId', testEvidenceId)
        .attach('file', fileBuffer, 'memory_dump.log');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('VERIFIED');
      expect(res.body.match).toBe(true);
      expect(res.body.onChainVerified).toBe(true);
    });

    it('corrupts file and marks evidence as TAMPERED via simulate-tamper endpoint', async () => {
      const res = await request(app)
        .post(`/api/verify/simulate-tamper/${testEvidenceId}`)
        .set('Authorization', `Bearer ${investigatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('TAMPERED');
      expect(res.body.message).toContain('Tamper simulation applied');

      // Verify DB record status is updated
      const updatedRecord = await Evidence.findOne({ evidenceId: testEvidenceId });
      expect(updatedRecord?.status).toBe('TAMPERED');
    });

    it('immediately returns TAMPERED when checking file after tamper simulation', async () => {
      const res = await request(app)
        .post('/api/verify/check-file')
        .set('Authorization', `Bearer ${investigatorToken}`)
        .field('evidenceId', testEvidenceId)
        .attach('file', fileBuffer, 'memory_dump.log');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('TAMPERED');
      expect(res.body.match).toBe(false);
    });
  });
});
