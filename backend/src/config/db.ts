import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (): Promise<typeof mongoose> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lexvault';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB connected successfully to ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    process.exit(1);
  }
};
