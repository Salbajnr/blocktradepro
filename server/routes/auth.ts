import { Router } from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword, 
  forgotPassword, 
  resetPassword, 
  verifyEmail, 
  logout 
} from '../controllers/auth.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema
} from '../middleware/validation.js';
import { authLimiter, passwordResetLimiter } from '../middleware/security.js';

const router = Router();

// Public routes (with rate limiting)
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes (require authentication)
router.use(authenticateToken); // All routes below this require authentication

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.post('/change-password', validate(changePasswordSchema), changePassword);
router.post('/logout', logout);

export default router;