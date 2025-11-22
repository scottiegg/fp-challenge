import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { login } from '../../assets/auth';

const router = Router();

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email({ error: 'Invalid email format' }),
  password: z.string().min(1, { error: 'Password is required' }),
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    const { email, password } = validation.data;

    // Attempt login using provided auth utility
    const { token, user } = await login(email, password);

    res.json({
      token,
      user,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Invalid credentials',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client should discard token)
 */
router.post('/logout', (req: Request, res: Response): void => {
  res.json({
    message: 'Logout successful. Please discard your token.',
  });
});

export default router;
