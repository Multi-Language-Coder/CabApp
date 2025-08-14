import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { timeout, retry, catchError } from 'rxjs/operators';

import { GeocodingService, GeoapifyAddress } from './geocoding.service';

// Re-export for backward compatibility
export interface NominatimAddress extends GeoapifyAddress {
  // Keep the old interface for backward compatibility
  place_id: string;
  lat: number;
  lon: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    footway?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
    hamlet:any;
    //[key: string]: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AutocompleteAddressService {
  emailForUsagePolicy = 'bsthiam5@email.com'; // Set your email
  nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  nominatimHeaders = new HttpHeaders({
    'User-Agent': 'CabApp/1.0 (bsthiam5@email.com)',
    'Accept': 'application/json'
  });

  constructor(private http: HttpClient) { }

  /**
   * Searches for address suggestions using Nominatim.
   * @param query The user's input string.
   * @param countryCodes Optional array of 2-letter ISO country codes (e.g., ['us', 'ca']).
   * @param viewbox Optional bounding box to bias results (lon1,lat1,lon2,lat2).
   * @returns An observable of NominatimAddress objects.
   */
  searchAddresses(
    query: string,
    countryCodes?: string[],
    viewbox?: string
  ): Observable<NominatimAddress[]> {
    let params: any = {
      q: query,
      format: 'jsonv2', // jsonv2 is generally preferred for a more stable output
      limit: 10,
      addressdetails: 1, // Include detailed address breakdown
      email: this.emailForUsagePolicy, // Essential for Nominatim's usage policy
      'accept-language': 'en-US,en;q=0.9' // Set preferred language for results
    };

    if (countryCodes && countryCodes.length > 0) {
      params.countrycodes = countryCodes.join(',');
    }

    if (viewbox) {
      params.viewbox = viewbox;
      params.bounded = 1; // Restrict results to the viewbox
    }

    // Nominatim doesn't have a specific "autocomplete" endpoint,
    // but the search endpoint works for this purpose.
    // Ensure you respect their usage policy for the public server.
    return this.http.get<NominatimAddress[]>(this.nominatimUrl, {
      params,
      headers: this.nominatimHeaders
    }).pipe(
      timeout(10000), // 10 second timeout
      retry({
        count: 2, // Retry up to 2 times for autocomplete (less aggressive than geocoding)
        delay: 1000 // 1 second delay between retries
      }),
      catchError(error => {
        console.error('Nominatim autocomplete API call failed:', error);
        // Return empty array on error to gracefully handle failures
        return of([]);
      })
    );
  }
}
