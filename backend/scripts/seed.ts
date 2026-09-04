import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, UserRole } from '../src/models/User';
import { Case } from '../src/models/Case';

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

    console.log('[Seed] Database seeding completed successfully.');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Database connection closed.');
  }
};

// Execute if run directly from CLI
if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(process.exitCode || 0);
  });
}
