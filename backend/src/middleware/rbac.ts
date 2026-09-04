import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';

export const checkRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'ACCESS DENIED' });
      return;
    }
    next();
  };
};

export default checkRole;
