import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { User } from "../../environments/user.interface";
import { Cabdata } from "../../environments/cabdata.interface";
import { Subject, of, timer, Observable, from } from "rxjs";
import { takeUntil, catchError, debounce, switchMap, map, concatMap, delay, toArray, tap } from "rxjs/operators";
import { Location } from "../location.interface";
import { WebSocketAPI } from "../WebSocketAPI.component";
import { Price } from "../../environments/priceCalc.interface";
import { isPlatformBrowser } from "@angular/common";
import { environment } from "../../environments/environment";
import { IFeatureV2 } from "../../environments/geoapify.interface";
import { TaxState } from "../../environments/taxes.interface";
import { NominatimDistanceMatrix } from "../show-details/show-details.component";

@Component({
  selector: "app-driver",
  templateUrl: "./driver.component.html",
  styleUrls: ["./driver.component.css"],
  standalone: false
})
export class DriverComponent implements AfterViewInit, OnDestroy {
  userrequests: Cabdata[] = [];
  webSocket!: WebSocketAPI;
  userdata!: User;
  username: string = "";
  location: Location = { lat: 0, lng: 0 };
  tax: number = 0;
  loading: boolean = true;
  private map!: L.Map;
  private routingControl: any;
  confirmText: string = "";

  private destroy$ = new Subject<void>();
  private watchPositionId: number | null = null;
  private geocodeSubject = new Subject<Cabdata[]>();

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient) {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      if (cookie.trim().startsWith("username=")) {
        this.username = cookie.split("=")[1];
        break;
      }
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      import("leaflet").then(L => {
        const leafletModule = L.default || L;
        (window as any).L = leafletModule;
        this.initMap(leafletModule);

        import("leaflet-routing-machine").then(() => {
          import("leaflet-control-geocoder").then(() => {
            // Start the main logic ONLY after geolocation and tax data are fetched
            this.startGeolocationAndProcessing(leafletModule);
          });
        });
      });
    }
  }

  // New method to control the startup sequence
  startGeolocationAndProcessing(L: typeof import("leaflet")): void {
    if (navigator.geolocation) {
      this.http.get<User>(environment.apiBaseUrl + `user1/${this.username}`).pipe(
        switchMap(user => {
          if (!user) {
            this.loading = false;
            return of(null); // Stop if user not found
          }
          this.userdata = user;
          // Chain the tax fetching call
          return this.http.get<TaxState[]>(
            "https://gist.githubusercontent.com/suryadutta/2dcdb6f43c501835c64d12580c63f168/raw/5cf6255eea95356527db2468c164adad09e82c03/salesTaxByState.JSON"
          );
        }),
        takeUntil(this.destroy$)
      ).subscribe(taxArr => {
        if (taxArr) {
          const stateTax = taxArr.find(t => this.userdata.state === t.Abbreviation);
          this.tax = stateTax ? stateTax["Combined Tax Rate"] : 0;
          console.log(this.tax) // Use Combined Rate and handle if not found
        }

        // NOW that we have user and tax data, we can start the rest of the logic
        this.initializeComponentLogic(L);
        this.watchPosition();
      });
    } else {
      this.loading = false;
    }
  }
  
  // Separated watchPosition to run after initial setup
  watchPosition(): void {
    this.watchPositionId = navigator.geolocation.watchPosition(position => {
      this.location = { lat: position.coords.latitude, lng: position.coords.longitude };
      const updatedUser = { ...this.userdata, position: [this.location.lat, this.location.lng], status: "Available" };
      this.http.put(environment.apiBaseUrl + "users", updatedUser).pipe(
        catchError(() => of(null))
      ).subscribe();
    });
  }

  initializeComponentLogic(L: typeof import("leaflet")): void {
    console.log("working")
    const toggleButton = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar1");
    toggleButton?.addEventListener("click", () => sidebar?.classList.toggle("collapsed"));

    this.geocodeSubject.pipe(
      debounce(() => timer(3000)),
      switchMap(cabdatas => this.processCabDatas(cabdatas).pipe(
        concatMap(requests =>
        cabdatas.length === 0 ? of([]) :
        from(cabdatas).pipe(
          concatMap(req =>
            this.calculatePricing(req).pipe(
              map(price => ({
                ...req,
                pricing: price
              }))
            )
          ),
          toArray()
        )
      ),
      )),
      
      takeUntil(this.destroy$)
    ).subscribe(requestsWithPrices => {
      this.userrequests = requestsWithPrices;
      this.loading = false;
      setTimeout(() => this.addPostMapEventListeners(L), 100);
    });
  }

  initMap(L: typeof import("leaflet")): void {
    this.webSocket = new WebSocketAPI();
    this.map = L.map("googleMap").setView([39.8333, -98.5833], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(this.map);
    this.webSocket._connect("/topic/cabdatas").then(() => {
      setInterval(() => this.fetchCabData(), 3000);
    });
  }

  fetchCabData(): void {
    if (!this.userdata) return;
    this.webSocket._send("/app/cabdatas").then(val => {
      const cabdatas: Cabdata[] = JSON.parse(String(val)) as Cabdata[];
      if (cabdatas) {
        this.geocodeSubject.next(cabdatas);
      }
    });
  }

  processCabDatas(cabdatas: Cabdata[]): Observable<Cabdata[]> {
    console.log("working in processCabData")
    if (!this.userdata) return of([]);
    const filtered = cabdatas.filter(cabdata =>
      cabdata.fromLocation.includes(this.userdata.town) &&
      cabdata.fromLocation.includes(this.userdata.state) &&
      (cabdata.driver === this.username || !cabdata.driver || cabdata.accepted?.includes("d"))
    );
    return of(filtered);
  }

  addPostMapEventListeners(L: typeof import("leaflet")): void {
    document.querySelectorAll(".postMap").forEach((btn, i) => {
      btn.addEventListener("click", () => this.postRouteToMap(this.userrequests[i], L));
    });
    document.querySelectorAll(".acceptRequest").forEach((btn, i) => {
      btn.addEventListener("click", () => this.acceptRequest(this.userrequests[i]));
    });
    document.querySelectorAll(".denyRequest").forEach((btn, i) => {
      btn.addEventListener("click", () => this.denyRequest(this.userrequests[i]));
    });
  }

  postRouteToMap(request: Cabdata, L: typeof import("leaflet")): void {
    this.map.removeControl(this.routingControl);
    this.routingControl = null;
    this.http.get<IFeatureV2>(`https://api.geoapify.com/v1/geocode/search?name=${request.fromLocation}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`).pipe(
      concatMap((fromLoc: IFeatureV2) =>
        this.http.get<IFeatureV2>(`https://api.geoapify.com/v1/geocode/search?name=${request.toLocation}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`).pipe(
          map((toLoc: IFeatureV2) => ({ fromLoc, toLoc }))
        )
      ),
      takeUntil(this.destroy$),
      catchError(() => of(null))
    ).subscribe(locations => {
      if (locations && locations.fromLoc.results.length > 0 && locations.toLoc.results.length > 0) {
        const waypoints = [
          L.latLng(this.location.lat, this.location.lng),
          L.latLng(locations.fromLoc.results[0].lat, locations.fromLoc.results[0].lon),
          L.latLng(locations.toLoc.results[0].lat, locations.toLoc.results[0].lon)
        ];
        if (this.routingControl) this.map.removeControl(this.routingControl);
        this.routingControl = (L as any).Routing.control({ waypoints, show: false,draggableWaypoints: false, 
        
        routeWhileDragging: false }).addTo(this.map);
      }
    });
  }

  acceptRequest(request: Cabdata): void {
    if (request.accepted === "a2") {
      alert("You've already accepted this request.");
      return;
    }
    this.http.post(environment.apiBaseUrl + `accepted/${request.cabid}`, { driver: this.username, status: "Picked" }, { responseType: "text" })
      .pipe(takeUntil(this.destroy$), catchError(() => of(null)))
      .subscribe(() => this.sendConfirmMessage("Request Accepted!"));
  }

  denyRequest(request: Cabdata): void {
    this.http.get(environment.apiBaseUrl + `denied/${request.cabid}`, { responseType: "text" })
      .pipe(takeUntil(this.destroy$), catchError(() => of(null)))
      .subscribe(() => {
        this.sendConfirmMessage("Request Denied.");
        this.userrequests = this.userrequests.filter(req => req.cabid !== request.cabid);
      });
  }

  calculatePricing(data: Cabdata): Observable<number> {
    const fromLocation$ = this.http.get<IFeatureV2>(`https://api.geoapify.com/v1/geocode/search?name=${data.fromLocation}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`);
    console.log("working here as well")
    return fromLocation$.pipe(
       
      concatMap(fromLoc => {
        const toLocation$ = this.http.get<IFeatureV2>(`https://api.geoapify.com/v1/geocode/search?name=${data.toLocation}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`);
        return toLocation$.pipe(
          map(toLoc => ({ fromLoc, toLoc }))
        );
      }),
      delay(1000),
      concatMap(({ fromLoc, toLoc }) => {
        if (!fromLoc?.results?.[0] || !toLoc?.results?.[0]) {
            console.error("Geocoding failed for:", data.fromLocation, "or", data.toLocation);
            return of(null);
        }
        const distanceCoords = `${fromLoc.results[0].lon},${fromLoc.results[0].lat};${toLoc.results[0].lon},${toLoc.results[0].lat}`;
        return this.http.get<NominatimDistanceMatrix>(`https://router.project-osrm.org/route/v1/driving/${distanceCoords}?overview=false&alternatives=true&steps=true&hints=;`);
      }),
      map(res => {
        if (!res?.routes?.[0]?.distance) {
            console.error("Could not calculate route distance.");
            return 0;
        }
        // **FIXED CALCULATION HERE**
        
        const price = new Price(res.routes[0].distance, this.tax);
        console.log(price.getEstFare(),res.routes[0].distance)
        return price.getEstFare();
      }),
      catchError(error => {
        console.error("Error in pricing calculation pipeline:", error);
        return of(0);
      })
    );
  }

  sendConfirmMessage(text: string): void {
    const msgBox = document.getElementById("messageBox");
    if (msgBox) {
      this.confirmText = text;
      msgBox.style.display = "block";
      setTimeout(() => {
        msgBox.style.display = "none";
        this.confirmText = "";
      }, 4000);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
    }
    this.webSocket?._disconnect();
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