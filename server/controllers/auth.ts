import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';
import { users, wallets } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { 
  hashPassword, 
  comparePassword, 
  generateTokens, 
  generateRandomToken,
  EMAIL_VERIFICATION_EXPIRES,
  PASSWORD_RESET_EXPIRES,
  AuthenticatedRequest 
} from '../middleware/auth.js';

interface AuthResponse {
  success: boolean;
  message?: string;
  user?: any;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  errors?: any[];
}

// Helper function to exclude sensitive fields
const excludeSensitiveFields = (user: any) => {
  const { password, emailVerificationToken, passwordResetToken, ...userWithoutSensitive } = user;
  return userWithoutSensitive;
};

// Register new user
export const register = async (req: Request, res: Response<AuthResponse>, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, country } = req.body;

    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check if this is the first user (make them admin)
    const userCount = await db.select({ count: sql<number>`count(*)` })
      .from(users);
    const isFirstUser = userCount[0].count === 0;

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = generateRandomToken();
    const emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRES);

    // Create user
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      country: country || null,
      role: isFirstUser ? 'admin' : 'user',
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified: false,
      status: 'active'
    }).returning();

    // Create default wallets for major currencies
    const defaultCurrencies = ['USD', 'BTC', 'ETH', 'USDT'];
    const walletPromises = defaultCurrencies.map(currency => 
      db.insert(wallets).values({
        userId: newUser.id,
        currency,
        balance: currency === 'USD' ? '10000.00000000' : '0.00000000', // Start with $10,000 USD
        lockedBalance: '0.00000000',
        type: 'spot',
        status: 'active',
        isActive: true
      })
    );

    await Promise.all(walletPromises);

    // Generate tokens
    const tokens = generateTokens(newUser);

    // TODO: Send verification email here
    console.log('Email verification token for', email, ':', emailVerificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      user: excludeSensitiveFields(newUser),
      tokens
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

// Login user
export const login = async (req: Request, res: Response<AuthResponse>, next: NextFunction) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Find user by email
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check account status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Update last login
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Generate tokens
    const tokens = generateTokens(user);

    res.json({
      success: true,
      message: 'Login successful',
      user: excludeSensitiveFields(user),
      tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// Get current user profile
export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    res.json({
      success: true,
      user: excludeSensitiveFields(user)
    });
  } catch (error) {
    console.error('Get profile error:', error);
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, country } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Update user profile
    const [updatedUser] = await db.update(users)
      .set({
        firstName,
        lastName,
        country,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: excludeSensitiveFields(updatedUser)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    next(error);
  }
};

// Change password
export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get current user with password
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await db.update(users)
      .set({ 
        password: hashedNewPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    next(error);
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    // Find user by email
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset email'
      });
    }

    // Generate reset token
    const passwordResetToken = generateRandomToken();
    const passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRES);

    // Update user with reset token
    await db.update(users)
      .set({
        passwordResetToken,
        passwordResetExpires,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    // TODO: Send password reset email here
    console.log('Password reset token for', email, ':', passwordResetToken);

    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    next(error);
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    // Find user with valid reset token
    const [user] = await db.select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and clear reset token
    await db.update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    // Find user with valid verification token
    const [user] = await db.select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);

    if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Update user as verified
    const [verifiedUser] = await db.update(users)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))
      .returning();

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: excludeSensitiveFields(verifiedUser)
    });
  } catch (error) {
    console.error('Verify email error:', error);
    next(error);
  }
};

// Logout (token invalidation would be handled client-side or with a token blacklist)
export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // In a JWT-based system, logout is typically handled client-side
    // Here we could implement token blacklisting if needed
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    next(error);
  }
};