/**
 * Interface for the datasource object within a geocoding feature.
 * Provides information about the data source, its attribution, and license.
 */
interface IDatasource {
  sourcename: string;
  attribution: string;
  license: string;
}

/**
 * Interface for the timezone object.
 * Contains details about the timezone, including offsets and abbreviations.
 */
interface ITimezone {
  name: string;
  offset_STD: string;
  offset_STD_seconds: number;
  offset_DST: string;
  offset_DST_seconds: number;
  abbreviation_STD: string;
  abbreviation_DST: string;
}

/**
 * Interface for the rank object.
 * Currently contains a single property for popularity.
 */
interface IRank {
  popularity: number;
}

/**
 * Interface for the main feature object, representing a single geocoding result.
 * It combines address information, geographical coordinates, and metadata.
 */

export interface IFeature {
  country_code: string;
  housenumber: string;
  street: string;
  country: string;
  county: string;
  datasource: IDatasource;
  postcode: string;
  state: string;
  state_code: string;
  county_code: string;
  city: string;
  lon: number;
  lat: number;
  distance: number;
  result_type: string;
  formatted: string;
  address_line1: string;
  address_line2: string;
  timezone: ITimezone;
  plus_code: string;
  plus_code_short: string;
  iso3166_2: string;
  rank: IRank;
  place_id: string;
}
export interface IFeatureV2 {
    results:geoData[];
}
interface geoData{
    country_code: string;
  housenumber: string;
  street: string;
  country: string;
  county: string;
  datasource: IDatasource;
  postcode: string;
  state: string;
  state_code: string;
  county_code: string;
  city: string;
  lon: number;
  lat: number;
  distance: number;
  result_type: string;
  formatted: string;
  address_line1: string;
  address_line2: string;
  timezone: ITimezone;
  plus_code: string;
  plus_code_short: string;
  iso3166_2: string;
  rank: IRank;
  place_id: string;
}
/**
 * Interface for the query object.
 * Represents the original search query's geographical coordinates and plus code.
 */
interface IQuery {
  lat: number;
  lon: number;
  plus_code: string;
}

/**
 * Top-level interface for the complete geocoding response.
 * It contains an array of features and the original query details.
 */
interface IGeocodingResponse {
  features: IFeature[];
  query: IQuery;
}
