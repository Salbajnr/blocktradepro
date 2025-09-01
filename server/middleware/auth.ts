import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

// JWT Token configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Generate JWT tokens
export const generateTokens = (user: any) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN 
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { 
    expiresIn: JWT_REFRESH_EXPIRES_IN 
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

// Verify JWT token
export const verifyToken = (token: string, isRefresh = false) => {
  const secret = isRefresh ? JWT_REFRESH_SECRET : JWT_SECRET;
  return jwt.verify(token, secret);
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Authentication middleware
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = verifyToken(token) as any;
    
    // Get fresh user data from database
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Admin middleware
export const requireAdmin = requireRole('admin');

// Generate random token for email verification and password reset
export const generateRandomToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
};

// Token expiration times
export const EMAIL_VERIFICATION_EXPIRES = 24 * 60 * 60 * 1000; // 24 hours
export const PASSWORD_RESET_EXPIRES = 60 * 60 * 1000; // 1 hour