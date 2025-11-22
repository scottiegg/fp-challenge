import request from 'supertest';
import { createApp } from './app';
import { login } from '../assets/auth';

describe('Facility Search API', () => {
  const app = createApp();
  let authToken: string;

  beforeAll(async () => {
    // Get auth token for protected endpoints
    const { token } = await login('test@example.com', 'password');
    authToken = token;
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('facilitiesLoaded');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'error' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid-email', password: 'password' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/facilities/search', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/facilities/search?q=City');
      
      expect(response.status).toBe(401);
    });

    it('should search facilities with valid token', async () => {
      const response = await request(app)
        .get('/api/facilities/search?q=City')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return matching facilities', async () => {
      const response = await request(app)
        .get('/api/facilities/search?q=Fitness')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.results.length).toBeGreaterThan(0);
      expect(response.body.results[0]).toHaveProperty('id');
      expect(response.body.results[0]).toHaveProperty('name');
      expect(response.body.results[0]).toHaveProperty('address');
    });

    it('should require query parameter', async () => {
      const response = await request(app)
        .get('/api/facilities/search')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(400);
    });

    it('should filter by amenities', async () => {
      const response = await request(app)
        .get('/api/facilities/search?q=Fitness&amenities=Pool')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
    });
  });

  describe('GET /api/facilities/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/facilities/facility-001');
      
      expect(response.status).toBe(401);
    });

    it('should return facility details with valid token', async () => {
      const response = await request(app)
        .get('/api/facilities/facility-001')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'facility-001');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('location');
      expect(response.body).toHaveProperty('facilities');
    });

    it('should return 404 for non-existent facility', async () => {
      const response = await request(app)
        .get('/api/facilities/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app).get('/api/undefined-route');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
