import { HttpClient } from '@angular/common/http';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../environments/user.interface';
import { GoogleMapsService } from '../google-maps.service';
import { GoogleMap } from '@angular/google-maps';
import { isPlatformBrowser } from '@angular/common';
import { result } from '../driver/driver.component';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AutocompleteAddressService, NominatimAddress } from '../autocomplete-address.service';
import { environment } from '../../environments/environment';
@Component({
  selector: 'app-update',
  standalone: false,
  templateUrl: './update.component.html',
  styleUrl: './update.component.css',
  host: {
    'ngSkipHydration': "true"
  }
})
export class UpdateComponent {
  suggestions:NominatimAddress[] = []
    suggestions1:NominatimAddress[] = []
  fromLocation = new FormControl('');
  toLocation = new FormControl('');
  date = new FormControl('');
  time = new FormControl('');
  numpassengers = new FormControl(0);
  ages = new FormControl('')
  cabid = 0;
  userrequested = ''
  directionsRenderer: google.maps.DirectionsRenderer | undefined;
  directionsService: google.maps.DirectionsService | undefined;
  constructor(
    private addressService:AutocompleteAddressService,private googleMapsService: GoogleMapsService, private route: ActivatedRoute, private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    this.route.params.subscribe(params => {
      this.cabid = params['id'];
      this.http.get(environment.apiBaseUrl+"cab/" + params['id']).subscribe((val) => {
        let vals = Object.values(val)
        this.fromLocation.setValue(vals[0]);
        this.toLocation.setValue(vals[1]);
        this.date.setValue(vals[2]);
        this.time.setValue(vals[3]);
        this.numpassengers.setValue(vals[4]);
        this.ages.setValue(vals[5]);
        this.userrequested = vals[6];
      })
    })
    setTimeout(() => {
      this.route.queryParams.subscribe(params => {
        console.log(this.userrequested != params["username"])
        if (this.userrequested != params["username"]) {
          history.go(-2)
        }
      })
    }, 300)
    document.addEventListener("DOMContentLoaded", () => {
      document.getElementById("gb")!.setAttribute("href", "/edit/" + this.userrequested)
    })
  }
  ngOnInit(){
    this.fromLocation.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap(value => {
              if (value && value.length > 2) { // Only search if input is long enough
                this.isLoading = true;
                return this.addressService.searchAddresses(value);
              } else {
                return []; // Clear suggestions if input is too short
              }
            })
        ).subscribe({
          next:(data:NominatimAddress[])=>{
            this.suggestions = data;
            this.isLoading = false
          },
          error: (error) => {
              console.error('Error fetching address suggestions from Nominatim:', error);
              this.isLoading = false;
              this.suggestions = []; // Clear suggestions on error
            }
        })
        this.toLocation.valueChanges
            .pipe(
              debounceTime(300),
              distinctUntilChanged(),
              switchMap(value => {
                  if (value && value.length > 2) { // Only search if input is long enough
                    this.isLoading = true;
                    return this.addressService.searchAddresses(value);
                  } else {
                    return []; // Clear suggestions if input is too short
                  }
                })
            ).subscribe({
              next:(data:NominatimAddress[])=>{
                this.suggestions1 = data;
                this.isLoading1 = false
              },
              error: (error) => {
                  console.error('Error fetching address suggestions from Nominatim:', error);
                  this.isLoading1 = false;
                  this.suggestions1 = []; // Clear suggestions on error
                }
            })
  }
  L!:typeof import("leaflet");
  api_key = 'AIzaSyBUkPRQqcYPM_uRQjr0cb0W0P6_ri2DvvA'
  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
          import("leaflet").then(L => {
            const leafletModule = L.default || L;
            (window as any).L = leafletModule;
            this.L=leafletModule;
            //this.L = leafletModule;
            import("leaflet-routing-machine").then(()=>{
              import("leaflet-control-geocoder").then(()=>{
                const iconDefault = leafletModule.icon({
              iconUrl:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtc7mVH6hZXg3rdikngiEd_y734KZtGF51OQ&s",
            })
            leafletModule.Marker.prototype.options.icon = iconDefault;
                this.initializeMap(leafletModule);
              });
            });
          });
          
          
        }
    /*this.googleMapsService
      .loadGoogleMaps(this.api_key)
      .then(() => {
        setTimeout(() => {
          this.initializeMap();
        }, 2000)

      })
      .catch((error) => console.error('Error loading Google Maps:', error));*/

  }
  map!:any;
  initializeMap(L:typeof import('leaflet')): void {
    console.log("Initializing Leaflet Map")
    this.map = L.map("googleMap").setView([39.8333, -98.5833], 4);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(this.map);
        console.log("Finished Initializing Leaflet Map")
    /*const mapOptions: google.maps.MapOptions = {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 12,
    };

    const map = new google.maps.Map(
      document.getElementById('googleMap') as HTMLElement,
      mapOptions
    );
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      polylineOptions: {
        strokeColor: 'black',
        strokeWeight: 3
      }
    })
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer.setMap(map);*/
    this.addRoute(L)
    this.autocomplete(L)
  }
  statesAbvr: { [key: string]: string } = {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY",
    // Include territories if needed
    "American Samoa": "AS",
    "District of Columbia": "DC",
    "Guam": "GU",
    "Northern Mariana Islands": "MP",
    "Puerto Rico": "PR",
    "Virgin Islands": "VI"
  };
  private formatAddress(address: NominatimAddress['address']): string {
    const parts: string[] = [];

    // Street number and street name
    const streetNumber = address.house_number;
    const streetName = address.road || address.footway; // Use road or footway if available
    if (streetName) {
      parts.push(`${streetNumber ? streetNumber + ' ' : ''}${streetName}`);
    } else if (streetNumber) {
      // If only house number is present, but no street name (less common, but possible)
      parts.push(streetNumber);
    }

    // City, State PostalCode
    const city = address.city || address.town || address.village || address['hamlet'] || address.suburb;
    const state = this.statesAbvr[(address.state! as string)];
    const postcode = address.postcode;

    let cityStatePostal = [];
    if (city) cityStatePostal.push(city);
    if (state) cityStatePostal.push(state);
    if (postcode) cityStatePostal.push(postcode);

    if (cityStatePostal.length > 0) {
      // Handle the "MD 21133" part specifically
      let cityStatePostalString = '';
      if (cityStatePostal[0]) { // City
        cityStatePostalString += cityStatePostal[0];
      }
      if (cityStatePostal[1]) { // State
        if (cityStatePostalString) cityStatePostalString += ', ';
        cityStatePostalString += cityStatePostal[1];
      }
      if (cityStatePostal[2]) { // Postal Code
        if (cityStatePostalString && cityStatePostal[1]) cityStatePostalString += ' '; // Space if state exists
        else if (cityStatePostalString) cityStatePostalString += ', '; // Comma if only city, but no state
        cityStatePostalString += cityStatePostal[2];
      }
      parts.push(cityStatePostalString);
    }

    // Country (e.g., USA)
    // Nominatim returns 'country_code' (e.g., 'us') and 'country' (e.g., 'United States').
    // You can decide which to use or map 'us' to 'USA'.
    const country = address.country_code?.toUpperCase() === 'US' ? 'USA' : address.country;
    if (country) {
      parts.push(country);
    }

    return parts.filter(p => p).join(', '); // Join only non-empty parts
  }
  routingControl!:any;
  onSelectSuggestion(suggestion: NominatimAddress,which:boolean): void {
      if(which){
      const formattedAddress = this.formatAddress(suggestion.address);
      this.fromLocation.setValue(formattedAddress, { emitEvent: false });
      this.suggestions = []; // Clear suggestions
      console.log('Selected address:', suggestion);
      } else{
        const formattedAddress = this.formatAddress(suggestion.address);
      this.toLocation.setValue(formattedAddress, { emitEvent: false });
      this.suggestions1 = []; // Clear suggestions
      console.log('Selected address:', suggestion);
      }
    }
  changeRoute(fromLocation: string, toLocation: string,L:typeof import("leaflet")): void {
    this.map.removeControl(this.routingControl)
    this.http.get<result>(`https://api.geoapify.com/v1/geocode/search?name=${fromLocation}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`).subscribe((val)=>{
      this.http.get<result>(`https://api.geoapify.com/v1/geocode/search?name=${toLocation}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`).subscribe((val1)=>{
          const fromLoc = new L.LatLng(val.results[0].lat,val.results[0].lon);
          const toLoc = new L.LatLng(val1.results[0].lat,val1.results[0].lon)
        L.Routing.control({
      waypoints: [fromLoc, toLoc],
      
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
    }).addTo(this.map)
      })
    })
  }
  isLoading=false;
  isLoading1=false;
  autocomplete(L:typeof import('leaflet')) {

  }
  addRoute(L:typeof import('leaflet')/*map: google.maps.Map, directionsRenderer: google.maps.DirectionsRenderer, directionsService: google.maps.DirectionsService*/): void {
    this.http.get<result>(`https://api.geoapify.com/v1/geocode/search?name=${(document.getElementById("FromLocationInput") as HTMLInputElement).value}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`).subscribe((val)=>{
      this.http.get<result>(`https://api.geoapify.com/v1/geocode/search?name=${(document.getElementById("ToLocationInput") as HTMLInputElement).value}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`).subscribe((val1)=>{
          const fromLoc = new L.LatLng(val.results[0].lat,val.results[0].lon);
          const toLoc = new L.LatLng(val1.results[0].lat,val1.results[0].lon);
          console.log(fromLoc,toLoc)
        this.routingControl=L.Routing.control({
      waypoints: [fromLoc, toLoc],
      
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
    }).addTo(this.map)
      })
    })
    
  }

  update() {
    let passeng = this.numpassengers.value;
    let if4 = false;
    let ages = this.ages.value + "";
    let agesArr: any[] | undefined = ages.split(",");
    for (let i = 0; i < agesArr!.length; i++) {
      agesArr![i] = Number.parseInt(agesArr![i])
    }
    for (let age of agesArr!) {
      if (age < 18) {
        if4 = true
        break;
      }
    }
    if (!if4 && passeng! > 3) {
      document.getElementById("errormsg")!.innerHTML = "Max people is 3, 4 if one is under 18"
    } else if (passeng! > agesArr!.length || passeng! < agesArr!.length) {
      document.getElementById("errormsg")!.innerHTML = "Incorrect amount of passengers"
    } else if ((if4 && passeng! <= 4) || (!if4 && passeng! <= 3)) {
      const body = { 'cabid': this.cabid, 'fromLocation': (document.getElementById("FromLocationInput") as HTMLInputElement).value, 'toLocation': (document.getElementById("ToLocationInput") as HTMLInputElement).value, 'date': this.date.value, 'time': this.time.value, "numpassengers": this.numpassengers.value, "ages": agesArr, 'userrequested': this.userrequested }
      this.http.put(environment.apiBaseUrl+"insertCabDetails", body, { responseType: 'text' }).subscribe((val) => {
        document.getElementById("divMsg")?.setAttribute("style", "display:none;background-color: lightskyblue; color:blue;");
        let span = document.createElement("span")
        span.innerHTML = "Successfully updated cab details, being sent back to edit page in 5 sec";
        document.getElementById("divMsg")?.appendChild(span)
        setInterval(() => {
          history.go(-1)
        }, 5000)
      })
    } else {
      document.getElementById("errormsg")!.innerHTML = "Too many people"
    }
  }
}
