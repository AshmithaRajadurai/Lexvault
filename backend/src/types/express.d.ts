import { UserRole } from '../models/User';

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  username?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}
