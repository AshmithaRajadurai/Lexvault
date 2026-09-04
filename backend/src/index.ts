import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/api/auth', authRoutes);

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
