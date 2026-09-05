import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, UserRole } from '../src/models/User';
import { Case } from '../src/models/Case';
import { Evidence } from '../src/models/Evidence';

dotenv.config();

interface SeedUserData {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

const DEFAULT_USERS: SeedUserData[] = [
  {
    username: 'admin',
    email: 'admin@lexvault.local',
    password: 'Admin@123',
    role: 'Admin',
  },
  {
    username: 'investigator',
    email: 'investigator@lexvault.local',
    password: 'Investigator@123',
    role: 'Investigator',
  },
  {
    username: 'verifier',
    email: 'verifier@lexvault.local',
    password: 'Verifier@123',
    role: 'Verifier',
  },
  {
    username: 'viewer',
    email: 'viewer@lexvault.local',
    password: 'Viewer@123',
    role: 'Viewer',
  },
];

const DEFAULT_CASES = [
  {
    caseId: 'CASE-2026-001',
    title: 'Operation Nightfall — Corporate Exfiltration',
    description: 'Investigating unauthorized extraction of encrypted biometric algorithms.',
    createdBy: 'investigator@lexvault.local',
  },
  {
    caseId: 'CASE-2026-002',
    title: 'Project Apex — Hardware Enclave & Supply Chain Breach',
    description: 'Hardware security enclave verification following suspected physical implant.',
    createdBy: 'investigator@lexvault.local',
  },
  {
    caseId: 'CASE-2026-003',
    title: 'Operation BlueSky — Classified Surveillance Intercept',
    description: 'High-definition aerial surveillance footage and RF network telemetry review.',
    createdBy: 'investigator@lexvault.local',
  },
  {
    caseId: 'CASE-2026-004',
    title: 'Operation DeepShield — Ransomware Forensic Audit',
    description: 'Cryptographic ransom note analysis and forensic memory dump recovery.',
    createdBy: 'investigator@lexvault.local',
  },
];

const DEFAULT_EVIDENCE = [
  {
    evidenceId: 'EV-2026-0901',
    caseId: 'CASE-2026-001',
    filename: 'disk_image_sector0.raw',
    sha256: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    commitment: '1892837492837498237498237498237498237498237498237498237498237498',
    storagePath: '/uploads/disk_image_sector0.enc',
    mimeType: 'application/octet-stream',
    uploadedBy: 'investigator@lexvault.local',
    status: 'VERIFIED' as const,
  },
  {
    evidenceId: 'EV-2026-0902',
    caseId: 'CASE-2026-001',
    filename: 'wiretap_packet_capture.pcapng',
    sha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    commitment: '9482739482734982734982374982374982374982374982374982374982374981',
    storagePath: '/uploads/wiretap_packet_capture.enc',
    mimeType: 'application/vnd.tcpdump.pcap',
    uploadedBy: 'investigator@lexvault.local',
    status: 'VERIFIED' as const,
  },
  {
    evidenceId: 'EV-2026-0903',
    caseId: 'CASE-2026-002',
    filename: 'scada_plc_firmware.bin',
    sha256: 'b45cffe321908234857201948572019485720194857201948572019485720194',
    commitment: '3349827349823749823749823749823749823749823749823749823749823749',
    storagePath: '/uploads/scada_plc_firmware.enc',
    mimeType: 'application/octet-stream',
    uploadedBy: 'investigator@lexvault.local',
    status: 'VERIFIED' as const,
  },
];

export const seedDatabase = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lexvault';

  try {
    console.log(`[Seed] Connecting to MongoDB at ${uri}...`);
    await mongoose.connect(uri);
    console.log('[Seed] Connected to database');

    for (const userData of DEFAULT_USERS) {
      const normalizedEmail = userData.email.toLowerCase().trim();
      const passwordHash = await bcrypt.hash(userData.password, 10);

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        existingUser.username = userData.username;
        existingUser.passwordHash = passwordHash;
        existingUser.role = userData.role;
        await existingUser.save();
        console.log(`[Seed] Updated user: ${userData.email} (${userData.role})`);
      } else {
        await User.create({
          username: userData.username,
          email: normalizedEmail,
          passwordHash,
          role: userData.role,
        });
        console.log(`[Seed] Created user: ${userData.email} (${userData.role})`);
      }
    }

    for (const caseData of DEFAULT_CASES) {
      const existingCase = await Case.findOne({ caseId: caseData.caseId });
      if (existingCase) {
        existingCase.title = caseData.title;
        existingCase.description = caseData.description;
        existingCase.createdBy = caseData.createdBy;
        await existingCase.save();
        console.log(`[Seed] Updated case: ${caseData.caseId} (${caseData.title})`);
      } else {
        await Case.create(caseData);
        console.log(`[Seed] Created case: ${caseData.caseId} (${caseData.title})`);
      }
    }

    // Purge non-seed evidence artifacts to guarantee fresh baseline
    await Evidence.deleteMany({ evidenceId: { $nin: ['EV-2026-0901', 'EV-2026-0902', 'EV-2026-0903'] } });

    for (const evData of DEFAULT_EVIDENCE) {
      const existingEv = await Evidence.findOne({ evidenceId: evData.evidenceId });
      if (existingEv) {
        existingEv.status = 'VERIFIED';
        existingEv.sha256 = evData.sha256;
        existingEv.filename = evData.filename;
        existingEv.caseId = evData.caseId;
        await existingEv.save();
        console.log(`[Seed] Reset evidence: ${evData.evidenceId} (VERIFIED)`);
      } else {
        await Evidence.create(evData);
        console.log(`[Seed] Created evidence: ${evData.evidenceId} (VERIFIED)`);
      }
    }

    console.log('[Seed] Database seeding completed successfully.');
    await mongoose.disconnect();
    console.log('[Seed] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  }
};

// Execute if run directly from CLI
if (require.main === module) {
  seedDatabase();
}

