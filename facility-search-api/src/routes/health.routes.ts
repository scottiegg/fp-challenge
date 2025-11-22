import { Router, Request, Response } from 'express';
import { facilityService } from '../services/facility.service';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
router.get('/', (req: Request, res: Response): void => {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();
  
  res.json({
    status: 'healthy',
    timestamp,
    uptime: `${Math.floor(uptime)}s`,
    service: 'facility-search-api',
    version: '1.0.0',
    facilitiesLoaded: facilityService.getCount(),
  });
});

export default router;
