import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit, OnDestroy, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { FormControl } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil, concatMap, map } from 'rxjs/operators';
import { AutocompleteAddressService, NominatimAddress } from '../autocomplete-address.service';
import { environment } from '../../environments/environment';

// Interface for geocode.maps.co API response
export interface GeocodeMaps {
  lat: string;
  lon: string;
  [key: string]: any;
}

@Component({
  selector: 'app-insertcabdetails',
  templateUrl: './insertcabdetails.component.html',
  styleUrls: ['./insertcabdetails.component.css'],
  standalone:false
})
export class InsertcabdetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  id = 0;
  date = new FormControl("");
  time = new FormControl("");
  numpassengers = new FormControl(3);
  ages = new FormControl("");
  userrequested = "";
  dateClass = new Date();
  date1 = `${this.dateClass.getFullYear()}-${String(this.dateClass.getMonth() + 1).padStart(2, '0')}-${String(this.dateClass.getDate()).padStart(2, '0')}`;
  date2 = new Date(this.date1);
  today = { "date": this.date1, "30days": '' };
  private map: any;
  private routingControl: any;
  fromLocation = new FormControl("");
  toLocation = new FormControl("");
  isLoading = false;
  isLoading1 = false;
  suggestions: NominatimAddress[] = [];
  suggestions1: NominatimAddress[] = [];
  api_key = '677875d2dcd56002469145oand89e51'; // Example key

  private destroy$ = new Subject<void>();

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private addressService: AutocompleteAddressService, private http: HttpClient) {
    this.date2.setDate(this.date2.getDate() + 30);
    this.today['30days'] = `${this.date2.getFullYear()}-${String(this.date2.getMonth() + 1).padStart(2, '0')}-${String(this.date2.getDate()).padStart(2, '0')}`;
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      if (cookie.trim().startsWith("username=")) {
        this.userrequested = cookie.split("=")[1];
        break;
      }
    }
  }

  ngOnInit(): void {
    this.fromLocation.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(value => {
        if (value && value.length > 2) {
          this.isLoading = true;
          return this.addressService.searchAddresses(value).pipe(catchError(() => of([])));
        }
        return of([]);
      }),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.suggestions = data;
      this.isLoading = false;
    });

    this.toLocation.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(value => {
        if (value && value.length > 2) {
          this.isLoading1 = true;
          return this.addressService.searchAddresses(value).pipe(catchError(() => of([])));
        }
        return of([]);
      }),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.suggestions1 = data;
      this.isLoading1 = false;
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('leaflet').then(L => {
        const leaflet = L.default || L;
        (window as any).L = leaflet;
        this.initMap(leaflet);
        import('leaflet-routing-machine').then(() => {
          import('leaflet-control-geocoder').then(() => {
            document.getElementById("tryRoute")?.addEventListener("click", () => this.addRouting(leaflet));
          });
        });
      });
    }
  }

  private initMap(L: typeof import('leaflet')): void {
    this.map = L.map('map').setView([39.8333, -98.5833], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private addRouting(L: typeof import('leaflet')): void {
    const fromValue = this.fromLocation.value;
    const toValue = this.toLocation.value;
    if (!fromValue || !toValue) return;

    this.http.get<GeocodeMaps[]>(`https://geocode.maps.co/search?q=${fromValue}&api_key=${this.api_key}`).pipe(
      concatMap(fromLoc => {
        if (!fromLoc || fromLoc.length === 0) throw new Error('Could not find the starting location.');
        return this.http.get<GeocodeMaps[]>(`https://geocode.maps.co/search?q=${toValue}&api_key=${this.api_key}`).pipe(
          map(toLoc => ({ fromLoc, toLoc }))
        );
      }),
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error in routing:', error);
        alert("Could not calculate the route. Please check the addresses.");
        return of(null);
      })
    ).subscribe(locations => {
      if (locations && locations.toLoc && locations.toLoc.length > 0) {
        const startPoint = L.latLng(parseFloat(locations.fromLoc[0].lat), parseFloat(locations.fromLoc[0].lon));
        const endPoint = L.latLng(parseFloat(locations.toLoc[0].lat), parseFloat(locations.toLoc[0].lon));
        
        if (this.routingControl) {
          this.map.removeControl(this.routingControl);
        }

        this.routingControl = (L as any).Routing.control({
          waypoints: [startPoint, endPoint],
          routeWhileDragging: true,
          show: false,
        }).addTo(this.map);
      }
    });
  }

  insertData() {
    let passeng = Number(this.numpassengers.value);
    let agesArr = this.ages.value?.split(",").map(age => Number.parseInt(age.trim())).filter(age => !isNaN(age));

    if (!agesArr || passeng !== agesArr.length) {
        document.getElementById("errormsg")!.innerHTML = "Number of passengers must match the number of ages provided.";
        return;
    }

    const hasMinor = agesArr.some(age => age < 18);
    if (!hasMinor && passeng > 3) {
        document.getElementById("errormsg")!.innerHTML = "Maximum of 3 passengers allowed unless one is a minor.";
        return;
    }
    if (hasMinor && passeng > 4) {
        document.getElementById("errormsg")!.innerHTML = "Maximum of 4 passengers allowed if a minor is present.";
        return;
    }

    this.http.get<number>(environment.apiBaseUrl + "countReqs").pipe(
      takeUntil(this.destroy$),
      catchError(() => of(0))
    ).subscribe(count => {
      this.id = count + 1;
      const cabdata = {
        cabid: this.id,
        fromLocation: this.fromLocation.value,
        toLocation: this.toLocation.value,
        date: this.date.value!,
        time: this.time.value!,
        ages: agesArr,
        numpassengers: passeng,
        userrequested: this.userrequested,
        status: 'Requested'
      };

      this.http.post(environment.apiBaseUrl + "insertCabDetails", cabdata, { responseType: "text" }).pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        location.href = `showDetails/${this.id}`;
      });
    });
  }
  
  onSelectSuggestion(suggestion: NominatimAddress, isFrom: boolean): void {
    const formattedAddress = suggestion.display_name;
    if (isFrom) {
      this.fromLocation.setValue(formattedAddress, { emitEvent: false });
      this.suggestions = [];
    } else {
      this.toLocation.setValue(formattedAddress, { emitEvent: false });
      this.suggestions1 = [];
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}