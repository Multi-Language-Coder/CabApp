import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { User } from "../../environments/user.interface";
import { Cabdata } from "../../environments/cabdata.interface";
import { Subject, of, timer, Observable } from "rxjs";
import { takeUntil, catchError, debounce, switchMap, map, concatMap } from "rxjs/operators";
import { Location } from "../location.interface";
import { WebSocketAPI } from "../WebSocketAPI.component";
import { Price } from "../../environments/priceCalc.interface";
import { isPlatformBrowser } from "@angular/common";
import { environment } from "../../environments/environment";
import { IFeature, IFeatureV2 } from "../../environments/geoapify.interface";

@Component({
  selector: "app-driver",
  templateUrl: "./driver.component.html",
  styleUrls: ["./driver.component.css"],
  standalone:false
})
export class DriverComponent implements AfterViewInit, OnDestroy {
  userrequests: Cabdata[] = [];
  webSocket!: WebSocketAPI;
  userdata!: User;
  username: string = "";
  location: Location = { lat: 0, lng: 0 };
  tax: number = 0;
  loading: boolean = true; // Added loading property
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
              this.initializeComponentLogic(leafletModule);
          });
        });
      });
    }
  }
  
  initializeComponentLogic(L: typeof import("leaflet")): void {
    const toggleButton = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar1");
    toggleButton?.addEventListener("click", () => sidebar?.classList.toggle("collapsed"));

    this.geocodeSubject.pipe(
      debounce(() => timer(1000)),
      switchMap(cabdatas => this.processCabDatas(cabdatas)),
      takeUntil(this.destroy$)
    ).subscribe(processedRequests => {
      this.userrequests = processedRequests;
      this.loading = false; // Turn off loading screen
      setTimeout(() => this.addPostMapEventListeners(L), 100);
    });

    this.startGeolocation();
  }

  startGeolocation(): void {
    if (navigator.geolocation) {
      this.http.get<User>(environment.apiBaseUrl + `user1/${this.username}`).pipe(
        takeUntil(this.destroy$),
        catchError(() => of(null))
      ).subscribe(user => {
        if (!user) return;
        this.userdata = user;
        
        this.watchPositionId = navigator.geolocation.watchPosition(position => {
          this.location = { lat: position.coords.latitude, lng: position.coords.longitude };
          const updatedUser = { ...this.userdata, position: [this.location.lat, this.location.lng], status: "Available" };
          this.http.put(environment.apiBaseUrl + "users", updatedUser).pipe(
            takeUntil(this.destroy$),
            catchError(() => of(null))
          ).subscribe();
        });
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
    this.http.get<IFeatureV2>(`https://api.geoapify.com/v1/geocode/search?name=${request.fromLocation}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`).pipe(
        concatMap((fromLoc: IFeatureV2) => 
            this.http.get<IFeatureV2>(`https://api.geoapify.com/v1/geocode/search?name=${request.toLocation}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`).pipe(
                map((toLoc: IFeatureV2) => ({fromLoc, toLoc}))
            )
        ),
        takeUntil(this.destroy$),
        catchError(() => of(null))
    ).subscribe(locations => {
        if(locations && locations.fromLoc.results.length > 0 && locations.toLoc.results.length > 0) {
            const waypoints = [
                L.latLng(this.location.lat, this.location.lng),
                L.latLng(locations.fromLoc.results[0].lat, locations.fromLoc.results[0].lon),
                L.latLng(locations.toLoc.results[0].lat, locations.toLoc.results[0].lon)
            ];
            if (this.routingControl) this.map.removeControl(this.routingControl);
            this.routingControl = (L as any).Routing.control({ waypoints, show: false }).addTo(this.map);
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
  
  // Added missing methods
  async calculatePricing(data: Cabdata): Promise<number> {
    try {
      const fromLoc = await this.http.get<IFeatureV2>(`https://api.geoapify.com/v1/geocode/search?name=${data.fromLocation}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`).toPromise();
      const toLoc = await this.http.get<IFeatureV2>(`https://api.geoapify.com/v1/geocode/search?name=${data.toLocation}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`).toPromise();
      
      if (fromLoc && toLoc && fromLoc.results.length > 0 && toLoc.results.length > 0) {
        const distance = this.calculateDistance(fromLoc.results[0], toLoc.results[0]);
        const price = new Price(distance, 1.06); // Assuming 6% tax
        return price.getEstFare();
      }
      return 0;
    } catch {
      return 0;
    }
  }

  calculateDistance(from: { lat: number, lon: number }, to: { lat: number, lon: number }): number {
      const R = 6371e3; // metres
      const φ1 = from.lat * Math.PI/180;
      const φ2 = to.lat * Math.PI/180;
      const Δφ = (to.lat-from.lat) * Math.PI/180;
      const Δλ = (to.lon-from.lon) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return R * c; // in metres
  }
  
  async pullAsync(pricePromise: Promise<number>): Promise<number> {
      return await pricePromise;
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