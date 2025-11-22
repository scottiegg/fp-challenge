import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../assets/auth';

/**
 * Authentication middleware to verify JWT tokens
 * Attaches user object to request if token is valid
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'No authorization header provided'
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Invalid authorization format',
        message: 'Authorization header must start with "Bearer "'
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided'
      });
      return;
    }

    // Verify token using provided auth utility
    const user = await verifyToken(token);
    req.user = user;
    
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid token',
      message: error instanceof Error ? error.message : 'Token verification failed'
    });
  }
}
