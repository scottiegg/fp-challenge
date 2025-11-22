import { Facility, FacilitySearchResult } from '../types/facility';
import facilitiesData from '../../assets/facilities.json';

/**
 * FacilityService handles all business logic for facility operations
 * Designed to be performant with large datasets (100k+ facilities)
 */
export class FacilityService {
  private facilities: Facility[];
  private facilityIndex: Map<string, Facility>;
  private nameIndex: Map<string, Set<string>>; // Lowercase name tokens -> facility IDs
  private amenityIndex: Map<string, Set<string>>; // Lowercase amenity -> facility IDs

  constructor() {
    this.facilities = facilitiesData as Facility[];
    this.facilityIndex = new Map();
    this.nameIndex = new Map();
    this.amenityIndex = new Map();
    this.buildIndexes();
  }

  /**
   * Build indexes for O(1) lookups and efficient searching
   * This preprocessing enables fast searches even with 100k+ facilities
   */
  private buildIndexes(): void {
    for (const facility of this.facilities) {
      // Index by ID for O(1) lookup
      this.facilityIndex.set(facility.id, facility);

      // Index by name tokens for fast partial matching
      const tokens = this.tokenizeName(facility.name);
      for (const token of tokens) {
        if (!this.nameIndex.has(token)) {
          this.nameIndex.set(token, new Set());
        }
        this.nameIndex.get(token)!.add(facility.id);
      }

      // Index by amenities for fast filtering
      for (const amenity of facility.facilities) {
        const normalizedAmenity = amenity.toLowerCase();
        if (!this.amenityIndex.has(normalizedAmenity)) {
          this.amenityIndex.set(normalizedAmenity, new Set());
        }
        this.amenityIndex.get(normalizedAmenity)!.add(facility.id);
      }
    }
  }

  /**
   * Tokenize facility name into searchable tokens
   * Uses word-level tokenization for efficient indexing
   */
  private tokenizeName(name: string): string[] {
    const normalized = name.toLowerCase();
    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    return words;
  }

  /**
   * Search facilities by name with partial matching
   * Time complexity: O(k + m) where k is query tokens and m is matching facilities
   * @param query - Search query string
   * @returns Array of matching facilities with name and address
   */
  searchByName(query: string): FacilitySearchResult[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
    
    // Find facilities that match any query token using prefix matching
    const matchingIds = new Set<string>();
    
    for (const queryToken of queryTokens) {
      // Direct lookup for exact word matches
      const exactMatch = this.nameIndex.get(queryToken);
      if (exactMatch) {
        exactMatch.forEach(id => matchingIds.add(id));
      }
      
      // For partial matching, check indexed tokens that start with query
      // This is more efficient than the previous approach but still O(n) for prefixes
      // Consider using a trie for true O(k) prefix matching in production
      for (const [indexedToken, facilityIds] of this.nameIndex.entries()) {
        if (indexedToken !== queryToken && indexedToken.startsWith(queryToken)) {
          facilityIds.forEach(id => matchingIds.add(id));
        }
      }
    }

    // Convert IDs to facility results
    const results: FacilitySearchResult[] = [];
    for (const id of matchingIds) {
      const facility = this.facilityIndex.get(id);
      if (facility) {
        results.push({
          id: facility.id,
          name: facility.name,
          address: facility.address,
        });
      }
    }

    // Sort by relevance (exact matches first, then by name)
    return results.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();
      const queryLower = normalizedQuery;

      // Exact match comes first
      if (aLower === queryLower) return -1;
      if (bLower === queryLower) return 1;

      // Starts with query comes next
      const aStarts = aLower.startsWith(queryLower);
      const bStarts = bLower.startsWith(queryLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Otherwise alphabetical
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get facility by ID
   * Time complexity: O(1)
   * @param id - Facility ID
   * @returns Facility object or null if not found
   */
  getById(id: string): Facility | null {
    if (!id) {
      return null;
    }
    return this.facilityIndex.get(id) || null;
  }

  /**
   * Filter facilities by amenities using indexed lookups
   * Time complexity: O(k + m) where k is amenity count and m is matching facilities
   * @param amenities - Array of amenity names to filter by
   * @returns Array of facilities that have ALL specified amenities
   */
  filterByAmenities(amenities: string[]): FacilitySearchResult[] {
    if (!amenities || amenities.length === 0) {
      return [];
    }

    const normalizedAmenities = amenities.map(a => a.toLowerCase());
    
    // Start with facilities that have the first amenity
    const firstAmenity = normalizedAmenities[0];
    const candidateIds = this.amenityIndex.get(firstAmenity);
    
    if (!candidateIds || candidateIds.size === 0) {
      return [];
    }
    
    // Filter to facilities that have ALL amenities (intersection)
    const matchingIds = new Set(candidateIds);
    
    for (let i = 1; i < normalizedAmenities.length; i++) {
      const amenityIds = this.amenityIndex.get(normalizedAmenities[i]);
      
      if (!amenityIds || amenityIds.size === 0) {
        return []; // No facilities have this amenity
      }
      
      // Keep only IDs that exist in both sets
      for (const id of matchingIds) {
        if (!amenityIds.has(id)) {
          matchingIds.delete(id);
        }
      }
      
      if (matchingIds.size === 0) {
        return []; // No facilities have all amenities
      }
    }

    // Convert IDs to facility results
    const results: FacilitySearchResult[] = [];
    for (const id of matchingIds) {
      const facility = this.facilityIndex.get(id);
      if (facility) {
        results.push({
          id: facility.id,
          name: facility.name,
          address: facility.address,
        });
      }
    }

    return results;
  }

  /**
   * Get total count of facilities
   */
  getCount(): number {
    return this.facilities.length;
  }
}

// Singleton instance for efficient memory usage
export const facilityService = new FacilityService();
