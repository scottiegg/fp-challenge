import { FacilityService } from './facility.service';

describe('FacilityService', () => {
  let service: FacilityService;

  beforeEach(() => {
    service = new FacilityService();
  });

  describe('searchByName', () => {
    it('should return empty array for empty query', () => {
      const results = service.searchByName('');
      expect(results).toEqual([]);
    });

    it('should find facilities with exact name match', () => {
      const results = service.searchByName('City Fitness Central');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('City Fitness Central');
    });

    it('should find facilities with partial name match', () => {
      const results = service.searchByName('City');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name.includes('City'))).toBe(true);
    });

    it('should be case insensitive', () => {
      const results1 = service.searchByName('city');
      const results2 = service.searchByName('CITY');
      const results3 = service.searchByName('City');
      
      expect(results1.length).toBe(results2.length);
      expect(results2.length).toBe(results3.length);
    });

    it('should return results with id, name, and address', () => {
      const results = service.searchByName('Fitness');
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(result => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('address');
        expect(typeof result.id).toBe('string');
        expect(typeof result.name).toBe('string');
        expect(typeof result.address).toBe('string');
      });
    });

    it('should handle multi-word queries', () => {
      const results = service.searchByName('City Fitness');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getById', () => {
    it('should return facility for valid ID', () => {
      const facility = service.getById('facility-001');
      expect(facility).not.toBeNull();
      expect(facility?.id).toBe('facility-001');
      expect(facility?.name).toBe('City Fitness Central');
    });

    it('should return null for invalid ID', () => {
      const facility = service.getById('invalid-id');
      expect(facility).toBeNull();
    });

    it('should return complete facility object', () => {
      const facility = service.getById('facility-001');
      expect(facility).toHaveProperty('id');
      expect(facility).toHaveProperty('name');
      expect(facility).toHaveProperty('address');
      expect(facility).toHaveProperty('location');
      expect(facility).toHaveProperty('facilities');
      expect(facility?.location).toHaveProperty('latitude');
      expect(facility?.location).toHaveProperty('longitude');
      expect(Array.isArray(facility?.facilities)).toBe(true);
    });
  });

  describe('filterByAmenities', () => {
    it('should return empty array for empty amenities', () => {
      const results = service.filterByAmenities([]);
      expect(results).toEqual([]);
    });

    it('should filter facilities by single amenity', () => {
      const results = service.filterByAmenities(['Pool']);
      expect(results.length).toBeGreaterThan(0);
      
      // Verify each result has the amenity
      results.forEach(result => {
        const facility = service.getById(result.id);
        expect(facility?.facilities).toContain('Pool');
      });
    });

    it('should filter facilities by multiple amenities (AND logic)', () => {
      const results = service.filterByAmenities(['Pool', 'Sauna']);
      expect(results.length).toBeGreaterThan(0);
      
      // Verify each result has ALL amenities
      results.forEach(result => {
        const facility = service.getById(result.id);
        expect(facility?.facilities).toContain('Pool');
        expect(facility?.facilities).toContain('Sauna');
      });
    });

    it('should be case insensitive', () => {
      const results1 = service.filterByAmenities(['pool']);
      const results2 = service.filterByAmenities(['POOL']);
      const results3 = service.filterByAmenities(['Pool']);
      
      expect(results1.length).toBe(results2.length);
      expect(results2.length).toBe(results3.length);
    });
  });

  describe('getCount', () => {
    it('should return total number of facilities', () => {
      const count = service.getCount();
      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });
  });
});
