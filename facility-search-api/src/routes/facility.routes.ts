import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { facilityService } from '../services/facility.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Validation schemas
const searchQuerySchema = z.object({
  q: z.string().min(1, { error: 'Query parameter "q" is required' }).max(100),
  amenities: z.string().optional(),
});

const facilityIdSchema = z.object({
  id: z.string().min(1, { error: 'Facility ID is required' }),
});

/**
 * GET /api/facilities/search
 * Search facilities by name with partial matching
 * Query params:
 *   - q: Search query (required)
 *   - amenities: Comma-separated list of amenities to filter by (optional)
 */
router.get('/search', authMiddleware, (req: Request, res: Response): void => {
  try {
    // Validate query parameters
    const validation = searchQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: validation.error.issues,
      });
      return;
    }

    const { q, amenities } = validation.data;

    // Search by name
    let results = facilityService.searchByName(q);

    // Filter by amenities if provided
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim()).filter(Boolean);
      if (amenityList.length > 0) {
        const amenityResults = facilityService.filterByAmenities(amenityList);
        const amenityIds = new Set(amenityResults.map(r => r.id));
        results = results.filter(r => amenityIds.has(r.id));
      }
    }

    res.json({
      query: q,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/facilities/:id
 * Get detailed information about a specific facility
 */
router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    // Validate facility ID
    const validation = facilityIdSchema.safeParse(req.params);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Invalid facility ID',
        details: validation.error.issues,
      });
      return;
    }

    const { id } = validation.data;
    const facility = facilityService.getById(id);

    if (!facility) {
      res.status(404).json({
        error: 'Facility not found',
        message: `No facility found with ID: ${id}`,
      });
      return;
    }

    res.json(facility);
  } catch (error) {
    console.error('Error in get facility endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/facilities
 * Get all facilities (for testing/debugging)
 * In production, this would have pagination
 */
router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    res.json({
      message: 'Use /api/facilities/search?q=<query> to search facilities',
      totalFacilities: facilityService.getCount(),
    });
  } catch (error) {
    console.error('Error in facilities endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
