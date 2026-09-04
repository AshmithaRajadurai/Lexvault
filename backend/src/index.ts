import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import zkRoutes from './routes/zkRoutes';
import caseRoutes from './routes/caseRoutes';
import evidenceRoutes from './routes/evidenceRoutes';
import verifyRoutes from './routes/verifyRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Health check route
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/zk', zkRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/verify', verifyRoutes);

// Connect to MongoDB and start server if executed directly
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`[LexVault Backend] Server is running on port ${PORT}`);
    });
  }).catch((err) => {
    console.error('[LexVault Backend] Failed to connect to database:', err);
  });
}

export default app;
