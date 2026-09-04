import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'lexvault_super_secret_jwt_key_2026';
};

const VALID_ROLES: UserRole[] = ['Admin', 'Investigator', 'Verifier', 'Viewer'];

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    const assignedRole: UserRole = role && VALID_ROLES.includes(role) ? role : 'Viewer';

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      username: username.trim(),
      email: normalizedEmail,
      passwordHash,
      role: assignedRole,
    });

    const token = jwt.sign(
      {
        userId: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role,
        username: newUser.username,
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        username: user.username,
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me (Current user info)
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('[Auth] /me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
