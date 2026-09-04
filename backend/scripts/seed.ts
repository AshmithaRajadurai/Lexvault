import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, UserRole } from '../src/models/User';

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
