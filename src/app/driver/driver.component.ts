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
import { environment } from "../../environments/environment";
import { IFeature, IFeatureV2 } from "../../environments/geoapify.interface";
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
                this.location.location = this.formatAddress(val);
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
            .get<User>(environment.apiBaseUrl + "user1/" + username)
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
                .put(environment.apiBaseUrl + "users", {
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
  private geocodeAddress(address: string): Observable<IFeatureV2> {
    const url = `https://api.geoapify.com/v1/geocode/search?name=${address}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`;
    return this.http.get<IFeatureV2>(url)
    //return this.makeNominatimRequest<NominatimGeocoder[]>(url);
  }

  /**
   * Reverse geocodes coordinates using Nominatim with robust error handling
   */
  private reverseGeocode(lat: number, lon: number): Observable<IFeature> {
    const url = environment.apiBaseUrl + `api/reverseGeo`;
    const url1 = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`
    return this.http.get<IFeature>(url1)//this.makeNominatimRequest<NominatimAddress>(url);
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
            const iconDefault = leafletModule.icon({
              iconUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtc7mVH6hZXg3rdikngiEd_y734KZtGF51OQ&s",
              iconSize: [50, 70]
            })
            leafletModule.Marker.prototype.options.icon = iconDefault;
            toggleButton?.addEventListener("click", () => {
              sidebar?.classList.toggle("collapsed");
              mainContent?.classList.toggle("collapsed");
            });

            // Debouncing logic to prevent excessive API calls
            this.geocodeSubject.pipe(
              debounce(() => timer(3000)), // Wait for 1 second after the last event
              switchMap(cabdatas => this.processCabDatas(cabdatas))
            ).subscribe(processedRequests => {
              //this.map.removeControl(this.routingControl)
              processedRequests.forEach((cabdata) => {
                const op = this.userrequests.includes(cabdata);
                if (op == false) {
                  this.userrequests.push(cabdata)
                }
              })

              // Let's assume this is inside the method where you get 'processedRequests'

              // Create a new array with the calculated price property
              const requestsWithPrice = processedRequests.map(req => {
                // Run the calculation here, ONCE.
                const price = this.calculatePricing(req);

                // Return a new object that includes the price
                // The pullAsync suggests the price might be an Observable or Promise
                return {
                  ...req, // Copy all original properties from the request
                  calculatedPrice: this.pullAsync(price) // Store the async result
                };
              });

              // Now, assign this pre-processed array to userrequests
              this.userrequests = requestsWithPrice;

              /*for(let req of processedRequests){
                console.log(req);
              }
              const processedRequestIds = new Set(processedRequests.map(req => req.id));

              this.userrequests = this.userrequests.filter(req => processedRequestIds.has(req.id));
              const existingRequestIds = new Set(this.userrequests.map(req => req.id));
              const newRequests = processedRequests.filter(req => !existingRequestIds.has(req.id));

              this.userrequests.push(...newRequests);
              */

              /*console.log("Updated User Requests", this.userrequests);
              // It's important to have 'L' available here.
              // A more robust solution might pass it through the stream or store it as a class property.
              this.addPostMapEventListeners(leafletModule);
              // Step 2: Add new requests from processedRequests that are not already in this.userrequests
              */
            });
          })
        })
      });

    }
  }
  pullAsync(returnVal: Promise<any>): any {
    returnVal.then((result) => {
      return result
    })
  }
  async calculatePricing(data: Cabdata) {
    this.geocodeAddress(data.fromLocation).subscribe(fromLoc => {
      this.geocodeAddress(data.toLocation).subscribe(async toLoc => {
        const body = {
          "mode": "drive",
          "sources": [
            { "location": [fromLoc.results[0].lon, fromLoc.results[0].lat] },
          ],
          "targets": [
            { "location": [toLoc.results[0].lon, toLoc.results[0].lat] }
          ]
        };
        this.http.post<MatrixResponse>("https://api.geoapify.com/v1/routematrix?apiKey=2b50b749fdf94d9a9688dd81bdeed459", body).pipe(
          debounce(() => timer(3000))
        ).subscribe((response) => {
          const price = new Price(response["sources_to_targets"][0][0].distance, this.tax);
          return price.getEstFare();
        });
      })
      return 0;
    })
    return 0;
  }

  initMap(L: typeof import("leaflet")): void {
    this.webSocket = new WebSocketAPI();
    const map = L.map("googleMap").setView([39.8333, -98.5833], 4);
    /*const markerGroup = new L.LayerGroup();
    markerGroup.addTo(map);*/
    this.map = map;
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
      console.log(cabdatas)
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
      } catch (error) {
        console.error("Error fetching data for cab request:", cabdata.cabid, error);
        return null;
      }
      return null;
    });
    console.log(cabdatas)
    return of(cabdatas.filter(cabdata => cabdata.fromLocation.includes(this.userdata.town) && cabdata.fromLocation.includes(this.userdata.state)))
  }
  routingControl!: any;
  confirmText: string = ""
  sendConfirmMessage(text: string): void {
    const mssgBox = document.getElementById("messageBox");
    this.confirmText = text;
    mssgBox!.style.display = "block";
    setTimeout(() => {
      mssgBox!.style.display = "none";
      this.confirmText = "";
    }, 5000)
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
                this.routingControl = L.Routing.control({
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
            .post<string>(environment.apiBaseUrl + "pushDriver", {
              username: this.userdata.username,
              id: parseInt(acceptBtn?.parentElement?.parentElement!.id!),
            })
            .subscribe(() => {
              pushDriver.unsubscribe();
            });
          const acceptReq = this.http
            .post(
              environment.apiBaseUrl + `accepted/${acceptBtn!.parentElement!.parentElement!.id
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
              this.sendConfirmMessage("Request Sent")
            });
        }
      });
      denyBtn!.addEventListener("click", () => {
        const deny = this.http
          .get(
            environment.apiBaseUrl + "denied/" +
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
            environment.apiBaseUrl + "chat/" +
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
  private map!: L.Map;
  location: Location = {
    lat: 0,
    lng: 0,
  };
  loading = false;
  distanceMatrix!: google.maps.DistanceMatrixService;
  waypoint: google.maps.DirectionsWaypoint[] = [];
  username: string = "";
  tax: number = 0;

  private formatAddress(address: IFeature): string {
    const parts: string[] = [];

    const streetNumber = address!.housenumber;
    const streetName = address!.street;
    if (streetName) {
      parts.push(`${streetNumber ? streetNumber + " " : ""}${streetName}`);
    } else if (streetNumber) {
      parts.push(streetNumber);
    }

    const city =
      address!.city;
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
interface LocationV2 {
  original_location: number[];
  location: number[];
}

interface SourcesToTarget {
  distance: number;
  time: number;
  source_index: number;
  target_index: number;
}

interface MatrixResponse {
  sources: LocationV2[];
  targets: LocationV2[];
  sources_to_targets: SourcesToTarget[][];
  units: string;
  distance_units: string;
  mode: string;
}
//Port Number:54.211.241.95