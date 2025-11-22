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

  constructor() {
    this.facilities = facilitiesData as Facility[];
    this.facilityIndex = new Map();
    this.nameIndex = new Map();
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
    }
  }

  /**
   * Tokenize facility name into searchable tokens
   * Supports partial matching by creating prefixes
   */
  private tokenizeName(name: string): string[] {
    const normalized = name.toLowerCase();
    const words = normalized.split(/\s+/);
    const tokens: string[] = [];

    // Add full words and prefixes for partial matching
    for (const word of words) {
      // Add full word
      tokens.push(word);
      
      // Add prefixes (min 2 chars) for partial matching
      // e.g., "City" -> ["ci", "cit", "city"]
      for (let i = 2; i <= word.length; i++) {
        tokens.push(word.substring(0, i));
      }
    }

    return tokens;
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
    const queryTokens = normalizedQuery.split(/\s+/);
    
    // Find facilities that match any query token
    const matchingIds = new Set<string>();
    
    for (const token of queryTokens) {
      // Check if any indexed token starts with the query token
      for (const [indexedToken, facilityIds] of this.nameIndex.entries()) {
        if (indexedToken.startsWith(token)) {
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
    return this.facilityIndex.get(id) || null;
  }

  /**
   * Filter facilities by amenities
   * @param amenities - Array of amenity names to filter by
   * @returns Array of facilities that have ALL specified amenities
   */
  filterByAmenities(amenities: string[]): FacilitySearchResult[] {
    if (!amenities || amenities.length === 0) {
      return [];
    }

    const normalizedAmenities = amenities.map(a => a.toLowerCase());
    
    const results = this.facilities.filter(facility => {
      const facilityAmenities = facility.facilities.map(f => f.toLowerCase());
      return normalizedAmenities.every(amenity => 
        facilityAmenities.includes(amenity)
      );
    });

    return results.map(facility => ({
      id: facility.id,
      name: facility.name,
      address: facility.address,
    }));
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
