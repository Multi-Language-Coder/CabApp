import { Component, AfterViewInit, Inject, PLATFORM_ID, OnInit } from "@angular/core";
import { GoogleMapsService } from "../google-maps.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { User } from "../../environments/user.interface";
import { ActivatedRoute } from "@angular/router";
import { Cabdata } from "../../environments/cabdata.interface";
import { from, map, Subject, timer, Observable, of } from "rxjs";
import { debounce, switchMap, timeout, retry, catchError, delay } from "rxjs/operators";
import { Location } from "../location.interface";
import { WebSocketAPI } from "../WebSocketAPI.component";
import { Price } from "../../environments/priceCalc.interface";
import { TaxState } from "../../environments/taxes.interface";
import { isPlatformBrowser } from "@angular/common";
import { NominatimAddress } from "../autocomplete-address.service";
import {
  NominatimDistanceMatrix,
  NominatimGeocoder,
} from "../show-details/show-details.component";
@Component({
  selector: "app-driver",
  standalone: false,
  templateUrl: "./driver.component.html",
  styleUrl: "./driver.component.css",
})
export class DriverComponent implements AfterViewInit {
  userrequests: Cabdata[] = [];
  webSocket!: WebSocketAPI;
  api_key = "AIzaSyBUkPRQqcYPM_uRQjr0cb0W0P6_ri2DvvA";
  driverMarker!: google.maps.marker.AdvancedMarkerElement;
  fromMarker!: google.maps.marker.AdvancedMarkerElement;
  toMarker!: google.maps.marker.AdvancedMarkerElement;
  userdata!: User;
  geocoder!: google.maps.Geocoder;
  o: number = 0;
  state!: string;

  private geocodeSubject = new Subject<Cabdata[]>();

  // HTTP options for Nominatim API calls
  private nominatimHeaders = new HttpHeaders({
    'User-Agent': 'CabApp/1.0 (bsthiam5@gmail.com)', // Required by Nominatim usage policy
    'Accept': 'application/json'
  });

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    private googleMapsService: GoogleMapsService,
    private http: HttpClient
  ) {
    Notification.requestPermission().then((result) => {
      //alert(result)
    });
    const cookies = document.cookie.split(";");
    let username = "";
    for (let cookie of cookies) {
      if (cookie.split("=")[0].includes("username")) {
        username = cookie.split("=")[1];
        break;
      }
    }
    this.username = username;
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((position: GeolocationPosition) => {
        setTimeout(() => {
          // Use the robust reverse geocoding method
          this.reverseGeocode(position.coords.latitude, position.coords.longitude)
            .subscribe({
              next: (val) => {
                this.location.location = this.formatAddress(val["address"]);
              },
              error: (error) => {
                console.error('Failed to reverse geocode current position:', error);
                this.location.location = 'Location unavailable';
              }
            });
          this.location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.http
            .get<User>("https://localhost:8443/user1/" + username)
            .subscribe((val) => {
              this.userdata = val;
              this.http
                .get<TaxState[]>(
                  "https://gist.githubusercontent.com/suryadutta/2dcdb6f43c501835c64d12580c63f168/raw/5cf6255eea95356527db2468c164adad09e82c03/salesTaxByState.JSON"
                )
                .subscribe((arr) => {
                  for (let stateTax of arr) {
                    if (stateTax["Abbreviation"].includes(val.state)) {
                      this.state = stateTax["Abbreviation"];
                      break;
                    }
                  }
                });
              this.http
                .put("https://localhost:8443/users", {
                  id: val.id,
                  name: val.name,
                  username: val.username,
                  password: val.password,
                  description: val.description,
                  isDriver: val.isDriver,
                  status: "Available",
                  position: [
                    position.coords.latitude,
                    position.coords.longitude,
                  ],
                  carType: val.carType,
                  imageLink: val.imageLink,
                  state: val.state,
                  town: val.town,
                })
                .subscribe((val) => {
                });
            });
        }, 2000);
      });
    } else {
      console.log("Geolocation not available");
    }
  }


  /**
   * Makes a robust Nominatim API call with timeout, retry, and error handling
   */
  private makeNominatimRequest<T>(url: string): Observable<T> {
    return this.http.get<T>(url, {
      params: {
        email: 'bsthiam5@email.com'
      },
      headers: this.nominatimHeaders
    }).pipe(
      timeout(10000), // 10 second timeout
      retry({
        count: 3, // Retry up to 3 times
        delay: (error, retryCount) => {
          console.warn(`Nominatim API call failed (attempt ${retryCount}), retrying in ${retryCount * 2000}ms...`, error);
          return timer(retryCount * 2000); // Exponential backoff: 2s, 4s, 6s
        }
      }),
      catchError(error => {
        console.error('Nominatim API call failed after retries:', error);
        // Return empty array for geocoding requests, or throw for critical errors
        if (url.includes('/search')) {
          return of([] as unknown as T);
        }
        throw error;
      })
    );
  }

  /**
   * Geocodes an address using Nominatim with robust error handling
   */
  private geocodeAddress(address: string): Observable<NominatimGeocoder[]> {
    const url = `https://localhost:8443/api/searchGeo`;
    return this.http.post<NominatimGeocoder[]>(url, {
      address: address
    })
    //return this.makeNominatimRequest<NominatimGeocoder[]>(url);
  }

  /**
   * Reverse geocodes coordinates using Nominatim with robust error handling
   */
  private reverseGeocode(lat: number, lon: number): Observable<NominatimAddress> {
    const url = `https://localhost:8443/api/reverseGeo`;
    return this.http.post<NominatimAddress>(url, {
      lat: lat,
      lon: lon,
      typeFind: false
    })//this.makeNominatimRequest<NominatimAddress>(url);
  }

  moveDriver() {
    this.driverMarker.position = {
      lat: this.location.lat,
      lng: this.location.lng,
    };
  }

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      import("leaflet").then(L => {
        const leafletModule = L.default || L;
        (window as any).L = leafletModule;
        this.initMap(leafletModule);
        import("leaflet-routing-machine").then(L => {
          import("leaflet-control-geocoder").then(L => {
            const toggleButton = document.getElementById("toggleSidebar");
            const sidebar = document.getElementById("sidebar1");
            const mainContent = document.getElementById("main-content");

            toggleButton?.addEventListener("click", () => {
              sidebar?.classList.toggle("collapsed");
              mainContent?.classList.toggle("collapsed");
            });

            // Debouncing logic to prevent excessive API calls
            this.geocodeSubject.pipe(
              debounce(() => timer(2000)), // Wait for 1 second after the last event
              switchMap(cabdatas => this.processCabDatas(cabdatas))
            ).subscribe(processedRequests => {
              const processedRequestIds = new Set(processedRequests.map(req => req.id));

              this.userrequests = this.userrequests.filter(req => processedRequestIds.has(req.id));

              // Step 2: Add new requests from processedRequests that are not already in this.userrequests
              const existingRequestIds = new Set(this.userrequests.map(req => req.id));

              const newRequests = processedRequests.filter(req => !existingRequestIds.has(req.id));

              this.userrequests.push(...newRequests);

              console.log("Updated User Requests", this.userrequests);
              // It's important to have 'L' available here.
              // A more robust solution might pass it through the stream or store it as a class property.
              this.addPostMapEventListeners(leafletModule);
            });
          })
        })
      });

    }
  }

  initMap(L: typeof import("leaflet")): void {
    this.webSocket = new WebSocketAPI();
    this.map = L.map("googleMap").setView([39.8333, -98.5833], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(this.map);
    this.webSocket._connect("/topic/cabdatas").then(() => {
      setTimeout(() => setInterval(() => this.fetchCabData(L), 3000), 1500);
    });
  }

  fetchCabData(L: typeof import("leaflet")): void {
    let username = "";
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      if (cookie.split("=")[0].includes("username")) {
        username = cookie.split("=")[1];
        break;
      }
    }

    if (!this.userdata) {
      console.log("User data is not yet available. Skipping fetch.");
      return;
    }

    this.webSocket._send("/app/cabdatas").then((val) => {
      const cabdatas: Cabdata[] = JSON.parse(String(val)) as Cabdata[];
      if (cabdatas === null) {
        return;
      }

      this.geocodeSubject.next(cabdatas);
    });
  }

  private processCabDatas(cabdatas: Cabdata[]): Observable<Cabdata[]> {
    const username = this.username;
    const newCabdata: Cabdata[] = []
    const promises = cabdatas.map(async (cabdata) => {
      // Correctly checking for both town and state in the fromLocation string.
      console.log(cabdata.fromLocation.includes(this.userdata.town), cabdata.fromLocation.includes(this.userdata.state))
      const isLocal = cabdata.fromLocation.includes(this.userdata.town) && cabdata.fromLocation.includes(this.userdata.state);
      const isAvailableForMe = (cabdata.driver === username || cabdata.driver === null || cabdata.accepted === null || cabdata.accepted.includes("d"));

      if (!isLocal || !isAvailableForMe) {
        return null;
      }

      try {
        // Use robust geocoding with proper error handling and delays
        if (this.userrequests.includes(cabdata)) {
          return null
        } else {
          //let i = this.userrequests.push(cabdata)
          console.log(this.userrequests)
          this.geocodeAddress(cabdata.fromLocation).subscribe({
            next: (fromCoords) => {
              if (fromCoords && fromCoords.length > 0) {
                // Add delay between requests to respect rate limits
                setTimeout(() => {
                  this.geocodeAddress(cabdata.toLocation).subscribe({
                    next: (toCoords) => {
                      if (toCoords && toCoords.length > 0) {
                        this.http.post<NominatimDistanceMatrix>(
                          `https://api.geoapify.com/v1/routematrix?apiKey=2b50b749fdf94d9a9688dd81bdeed459`,
                          {
                            mode: "drive",
                            sources: [{ location: [fromCoords[0].lon, fromCoords[0].lat] }],
                            targets: [{ location: [toCoords[0].lon, toCoords[0].lat] }],
                            units: "metric",
                          }
                        ).subscribe({
                          next: (distanceData) => {
                            const oldCabdata = cabdata;
                            const index = cabdatas.indexOf(oldCabdata);
                            const price = new Price(distanceData.sources_to_targets[0][0].distance, 1 + this.tax);
                            cabdata.pricing = price.getEstFare();
                            cabdatas[index] = cabdata;

                            //newCabdata.push(cabdata)
                          },
                          error: (error) => {
                            console.error("Error calculating distance for cab request:", cabdata.cabid, error);
                          }
                        });
                      } else {
                        console.warn("No coordinates found for destination:", cabdata.toLocation);
                      }
                    },
                    error: (error) => {
                      console.error("Error geocoding destination for cab request:", cabdata.cabid, error);
                    }
                  });
                }, 1000); // 1 second delay between geocoding requests
              } else {
                console.warn("No coordinates found for origin:", cabdata.fromLocation);
              }
            },
            error: (error) => {
              console.error("Error geocoding origin for cab request:", cabdata.cabid, error);
            }
          });
        }
      } catch (error) {
        console.error("Error fetching data for cab request:", cabdata.cabid, error);
        return null;
      }
      return null;
    });

    return of(cabdatas.filter(cabdata => cabdata.fromLocation.includes(this.userdata.town) && cabdata.fromLocation.includes(this.userdata.state)))
  }

  addPostMapEventListeners(L: typeof import("leaflet")): void {
    const postMapBtns = document.getElementsByClassName("postMap");
    const acceptBtns = document.getElementsByClassName("acceptRequest");
    const deniedBtns = document.getElementsByClassName("denyRequest");
    for (let i = 0; i < postMapBtns.length; i++) {
      const postMapBtn = postMapBtns.item(i);
      const acceptBtn = acceptBtns.item(i);
      const denyBtn = deniedBtns.item(i);
      postMapBtn?.addEventListener("click", () => {
        const origin = { lat: this.location.lat, lng: this.location.lng };
        const destination = this.userrequests[i].toLocation;

        // Update markers
        const latLngDriver = new L.LatLng(this.location.lat, this.location.lng);
        let fromLocLatLng: L.LatLng;
        let toLocLatLng: L.LatLng;

        this.http
          .get<result>(
            `https://api.geoapify.com/v1/geocode/search?name=${this.userrequests[i].fromLocation}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`
          )
          .subscribe((fromLoc) => {
            this.http
              .get<result>(
                `https://api.geoapify.com/v1/geocode/search?name=${destination}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`
              )
              .subscribe((toLoc) => {
                fromLocLatLng = new L.LatLng(
                  fromLoc.results[0].lat,
                  fromLoc.results[0].lon
                );
                toLocLatLng = new L.LatLng(
                  toLoc.results[0].lat,
                  toLoc.results[0].lon
                );
                L.Routing.control({
                  waypoints: [
                    latLngDriver,
                    fromLocLatLng,
                    toLocLatLng,
                  ],

                  routeWhileDragging: true,

                  showAlternatives: true,

                  geocoder: (L.Control as any).Geocoder.nominatim(),

                  lineOptions: {
                    styles: [{ color: "#007bff", opacity: 0.8, weight: 8 }],

                    addWaypoints: false,

                    extendToWaypoints: true,

                    missingRouteTolerance: 10,
                  },

                  altLineOptions: {
                    styles: [{ color: "#888", opacity: 0.4, weight: 5 }],

                    extendToWaypoints: true,

                    missingRouteTolerance: 10,
                  },
                  show: false,
                }).addTo(this.map);
              });
          });
      });
      //this.driverMarker.position = origin;

      acceptBtn!.addEventListener("click", () => {
        if (acceptBtn!.id == "a2") {
          alert("You've already accepted this request");
        } else {
          const pushDriver = this.http
            .post<string>("https://localhost:8443/pushDriver", {
              username: this.userdata.username,
              id: parseInt(acceptBtn?.parentElement?.parentElement!.id!),
            })
            .subscribe(() => {
              pushDriver.unsubscribe();
            });
          const acceptReq = this.http
            .post(
              `https://localhost:8443/accepted/${acceptBtn!.parentElement!.parentElement!.id
              }`,
              {
                driver: this.username,
                status: "Picked",
              },
              {
                responseType: "text"
              }
            )
            .subscribe(() => {
              acceptReq.unsubscribe();
              setTimeout(() => {
                location.reload();
              }, 600);
            });
        }
      });
      denyBtn!.addEventListener("click", () => {
        const deny = this.http
          .get(
            "https://localhost:8443/denied/" +
            denyBtn!.parentElement!.parentElement!.id,
            {
              responseType: "text"
            }
          )
          .subscribe(() => {
            deny.unsubscribe();
            acceptBtn!.id = "d1";
          });
        const chat = this.http
          .delete(
            "https://localhost:8443/chat/" +
            denyBtn!.parentElement!.parentElement!.id
          )
          .subscribe(() => {
            chat.unsubscribe();
          });
        //alert("Chat deleted")
      });
    }
    if (postMapBtns.length > 0) {
      (postMapBtns.item(0) as HTMLElement)?.click();
    }
  }
  pricing!: number;
  watchedPosition!: number;
  directionsRenderer!: google.maps.DirectionsRenderer;
  directionsService!: google.maps.DirectionsService;
  directionsRenderer1!: google.maps.DirectionsRenderer;
  private map!: any;
  location: Location = {
    lat: 0,
    lng: 0,
  };
  loading = false;
  distanceMatrix!: google.maps.DistanceMatrixService;
  waypoint: google.maps.DirectionsWaypoint[] = [];
  username: string = "";
  tax: number = 0;

  private formatAddress(address: NominatimAddress["address"]): string {
    const parts: string[] = [];

    const streetNumber = address!.house_number;
    const streetName = address!.road || address!.footway;
    if (streetName) {
      parts.push(`${streetNumber ? streetNumber + " " : ""}${streetName}`);
    } else if (streetNumber) {
      parts.push(streetNumber);
    }

    const city =
      address!.city ||
      address!.town ||
      address!.village ||
      address!["hamlet"] ||
      address!.suburb;
    const state = address!.state;
    const postcode = address!.postcode;

    let cityStatePostal = [];
    if (city) cityStatePostal.push(city);
    if (state) cityStatePostal.push(state);
    if (postcode) cityStatePostal.push(postcode);

    if (cityStatePostal.length > 0) {
      let cityStatePostalString = "";
      if (cityStatePostal[0]) {
        cityStatePostalString += cityStatePostal[0];
      }
      if (cityStatePostal[1]) {
        if (cityStatePostalString) cityStatePostalString += ", ";
        cityStatePostalString += cityStatePostal[1];
      }
      if (cityStatePostal[2]) {
        if (cityStatePostalString && cityStatePostal[1])
          cityStatePostalString += " ";
        else if (cityStatePostalString) cityStatePostalString += ", ";
        cityStatePostalString += cityStatePostal[2];
      }
      parts.push(cityStatePostalString);
    }

    const country =
      address!.country_code?.toUpperCase() === "US" ? "USA" : address!.country;
    if (country) {
      parts.push(country);
    }

    return parts.filter((p) => p).join(", ");
  }

  toKms(meters: string) {
    if (meters.includes("km") == false) {
      return parseFloat(meters.split(" ")[0]) / 1000;
    }
    return parseFloat(meters.split(" ")[0]);
  }
}
export interface result {
  results: resultv2[];
}
interface resultv2 {
  formatted: string;
  lat: number;
  lon: number;
}
//Port Number:54.211.241.95