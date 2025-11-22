export interface Location {
  latitude: number;
  longitude: number;
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  location: Location;
  facilities: string[];
}

export interface FacilitySearchResult {
  id: string;
  name: string;
  address: string;
}
