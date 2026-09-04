import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtUserPayload } from '../types/express';

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access token missing or malformed' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'lexvault_super_secret_jwt_key_2026';

  try {
    const decoded = jwt.verify(token, secret) as JwtUserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};

export default authenticateToken;
