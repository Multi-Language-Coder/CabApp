import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { 
  map, 
  timeout, 
  retry, 
  catchError, 
  debounceTime, 
  distinctUntilChanged, 
  switchMap,
  share,
  tap
} from 'rxjs/operators';

// Geoapify API interfaces
export interface GeoapifyAddress {
  place_id: string;
  licence: string;
  osm_type?: string;
  osm_id?: number;
  boundingbox?: number[];
  lat: number;
  lon: number;
  display_name: string;
  class?: string;
  type?: string;
  importance?: number;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
    [key: string]: string | undefined;
  };
  formatted?: string;
}

export interface GeoapifySearchResponse {
  results: GeoapifyAddress[];
  query: {
    text: string;
    parsed: any;
  };
}

export interface GeoapifyReverseResponse {
  results: GeoapifyAddress[];
  query: {
    lat: number;
    lon: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private readonly GEOAPIFY_API_KEY = '2b50b749fdf94d9a9688dd81bdeed459';
  private readonly BASE_URL = 'https://api.geoapify.com/v1/geocode';
  
  // Cache for geocoding results to reduce API calls
  private geocodeCache = new Map<string, GeoapifyAddress[]>();
  private reverseGeocodeCache = new Map<string, GeoapifyAddress>();
  
  // Debounced search subjects
  private searchSubject = new Subject<{query: string, options?: any}>();
  private reverseSearchSubject = new Subject<{lat: number, lon: number}>();
  
  // Rate limiting
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 100; // 100ms between requests
  
  constructor(private http: HttpClient) {
    this.setupDebouncedSearch();
    this.setupDebouncedReverseSearch();
  }

  /**
   * Setup debounced search for forward geocoding
   */
  private setupDebouncedSearch(): void {
    this.searchSubject.pipe(
      debounceTime(500), // Wait 500ms after last input
      distinctUntilChanged((prev, curr) => prev.query === curr.query),
      switchMap(({query, options}) => this.performSearch(query, options))
    ).subscribe();
  }

  /**
   * Setup debounced search for reverse geocoding
   */
  private setupDebouncedReverseSearch(): void {
    this.reverseSearchSubject.pipe(
      debounceTime(300), // Wait 300ms after last input
      distinctUntilChanged((prev, curr) => prev.lat === curr.lat && prev.lon === curr.lon),
      switchMap(({lat, lon}) => this.performReverseGeocode(lat, lon))
    ).subscribe();
  }

  /**
   * Search for addresses with debouncing and caching
   */
  searchAddresses(
    query: string, 
    countryCodes?: string[], 
    limit: number = 10
  ): Observable<GeoapifyAddress[]> {
    // Check cache first
    const cacheKey = `${query}_${countryCodes?.join(',') || ''}_${limit}`;
    if (this.geocodeCache.has(cacheKey)) {
      return of(this.geocodeCache.get(cacheKey)!);
    }

    const options = { countryCodes, limit, cacheKey };
    return this.performSearch(query, options);
  }

  /**
   * Perform the actual search with rate limiting and error handling
   */
  private performSearch(query: string, options: any = {}): Observable<GeoapifyAddress[]> {
    if (!query || query.trim().length < 2) {
      return of([]);
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delay = Math.max(0, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest);

    return new Observable(observer => {
      setTimeout(() => {
        this.lastRequestTime = Date.now();
        
        let params: any = {
          text: query.trim(),
          apiKey: this.GEOAPIFY_API_KEY,
          limit: options.limit || 10,
          format: 'json'
        };

        if (options.countryCodes && options.countryCodes.length > 0) {
          params.filter = `countrycode:${options.countryCodes.join(',')}`;
        }

        this.http.get<GeoapifySearchResponse>(`${this.BASE_URL}/search`, { params })
          .pipe(
            timeout(8000), // 8 second timeout
            retry({
              count: 2,
              delay: (error, retryCount) => {
                console.warn(`Geoapify search failed (attempt ${retryCount}), retrying...`, error);
                return of(null).pipe(tap(() => setTimeout(() => {}, retryCount * 1000)));
              }
            }),
            catchError(error => {
              console.error('Geoapify search API call failed:', error);
              return of({ results: [] } as unknown as GeoapifySearchResponse);
            }),
            map(response => response.results || []),
            tap(results => {
              // Cache successful results
              if (options.cacheKey && results.length > 0) {
                this.geocodeCache.set(options.cacheKey, results);
              }
            })
          )
          .subscribe({
            next: (results) => {
              observer.next(results);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
      }, delay);
    });
  }

  /**
   * Reverse geocode coordinates with caching
   */
  reverseGeocode(lat: number, lon: number): Observable<GeoapifyAddress | null> {
    // Check cache first
    const cacheKey = `${lat.toFixed(6)}_${lon.toFixed(6)}`;
    if (this.reverseGeocodeCache.has(cacheKey)) {
      return of(this.reverseGeocodeCache.get(cacheKey)!);
    }

    return this.performReverseGeocode(lat, lon, cacheKey);
  }

  /**
   * Perform reverse geocoding with error handling
   */
  private performReverseGeocode(lat: number, lon: number, cacheKey?: string): Observable<GeoapifyAddress | null> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delay = Math.max(0, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest);

    return new Observable(observer => {
      setTimeout(() => {
        this.lastRequestTime = Date.now();
        
        const params = {
          lat: lat.toString(),
          lon: lon.toString(),
          apiKey: this.GEOAPIFY_API_KEY,
          format: 'json'
        };

        this.http.get<GeoapifyReverseResponse>(`${this.BASE_URL}/reverse`, { params })
          .pipe(
            timeout(8000),
            retry({
              count: 2,
              delay: (error, retryCount) => {
                console.warn(`Geoapify reverse geocode failed (attempt ${retryCount}), retrying...`, error);
                return of(null).pipe(tap(() => setTimeout(() => {}, retryCount * 1000)));
              }
            }),
            catchError(error => {
              console.error('Geoapify reverse geocode API call failed:', error);
              return of({ results: [] } as unknown as GeoapifyReverseResponse);
            }),
            map(response => response.results && response.results.length > 0 ? response.results[0] : null),
            tap(result => {
              // Cache successful results
              if (cacheKey && result) {
                this.reverseGeocodeCache.set(cacheKey, result);
              }
            })
          )
          .subscribe({
            next: (result) => {
              observer.next(result);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
      }, delay);
    });
  }

  /**
   * Format address from Geoapify response
   */
  formatAddress(address: GeoapifyAddress): string {
    if (address.formatted) {
      return address.formatted;
    }

    const parts: string[] = [];
    const addr = address.address;

    if (addr) {
      const streetNumber = addr.house_number;
      const streetName = addr.road;
      if (streetName) {
        parts.push(`${streetNumber ? streetNumber + ' ' : ''}${streetName}`);
      }

      const city = addr.city || addr.town || addr.village || addr.suburb;
      const state = addr.state;
      const postcode = addr.postcode;

      if (city) parts.push(city);
      if (state) parts.push(state);
      if (postcode) parts.push(postcode);

      const country = addr.country_code?.toUpperCase() === 'US' ? 'USA' : addr.country;
      if (country) parts.push(country);
    }

    return parts.filter(p => p).join(', ') || address.display_name || 'Unknown location';
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.geocodeCache.clear();
    this.reverseGeocodeCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { geocodeEntries: number; reverseGeocodeEntries: number } {
    return {
      geocodeEntries: this.geocodeCache.size,
      reverseGeocodeEntries: this.reverseGeocodeCache.size
    };
  }
}
