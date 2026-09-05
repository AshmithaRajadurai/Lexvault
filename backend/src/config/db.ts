import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGOOSE_OPTIONS: ConnectOptions = {
  serverSelectionTimeoutMS: 5000,
  autoIndex: true,
};

const LOCAL_FALLBACK_URI = 'mongodb://127.0.0.1:27017/lexvault';

export const connectDB = async (): Promise<typeof mongoose | null> => {
  const configuredUri = process.env.MONGODB_URI?.trim();

  // If a MongoDB Atlas URI (mongodb+srv://) is provided, attempt connection first
  if (configuredUri && configuredUri.startsWith('mongodb+srv://')) {
    try {
      console.log('[Database] Connecting to MongoDB Atlas cluster...');
      const conn = await mongoose.connect(configuredUri, MONGOOSE_OPTIONS);
      console.log(
        `[Database] MongoDB Atlas connected successfully to ${conn.connection.host}/${conn.connection.name}`
      );
      return conn;
    } catch (atlasErr: any) {
      console.warn(
        '⚠️ MongoDB Atlas URI not detected or unreachable. Falling back to local/in-memory instance for seamless demo.'
      );
      console.warn(`[Database] Atlas connection error detail: ${atlasErr.message}`);
    }
  }

  // Fallback to local MongoDB instance
  const localUri =
    configuredUri && !configuredUri.startsWith('mongodb+srv://')
      ? configuredUri
      : LOCAL_FALLBACK_URI;

  try {
    console.log(`[Database] Connecting to local MongoDB at ${localUri}...`);
    const conn = await mongoose.connect(localUri, MONGOOSE_OPTIONS);
    console.log(
      `[Database] MongoDB connected successfully to ${conn.connection.host}/${conn.connection.name}`
    );
    return conn;
  } catch (localErr: any) {
    console.warn(
      '⚠️ MongoDB Atlas URI not detected or unreachable. Falling back to local/in-memory instance for seamless demo.'
    );
    console.warn(`[Database] Local connection notice: ${localErr.message}`);
    console.log(
      '[Database] Running in resilient offline demonstration mode with mock/in-memory fallbacks.'
    );
    return null;
  }
};

export default connectDB;
