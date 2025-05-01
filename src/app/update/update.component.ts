import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../environments/user.interface';
import { GoogleMapsService } from '../google-maps.service';
import { GoogleMap } from '@angular/google-maps';
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
    private googleMapsService: GoogleMapsService, private route: ActivatedRoute, private http: HttpClient) {
    this.route.params.subscribe(params => {
      this.cabid = params['id'];
      this.http.get("http://localhost:8080/cab/" + params['id']).subscribe((val) => {
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
  api_key = 'AIzaSyBUkPRQqcYPM_uRQjr0cb0W0P6_ri2DvvA'
  ngAfterViewInit(): void {
    this.googleMapsService
      .loadGoogleMaps(this.api_key)
      .then(() => {
        setTimeout(() => {
          this.initializeMap();
        }, 2000)

      })
      .catch((error) => console.error('Error loading Google Maps:', error));
  }
  initializeMap(): void {
    const mapOptions: google.maps.MapOptions = {
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
    this.directionsRenderer.setMap(map);
    this.addRoute(map, this.directionsRenderer, this.directionsService)
    this.autocomplete(map)
  }
  changeRoute(map: google.maps.Map, fromLocation: string, toLocation: string, directionsRenderer: google.maps.DirectionsRenderer, directionsService: google.maps.DirectionsService, waypts: google.maps.DirectionsWaypoint[]): void {
    directionsRenderer.setMap(map);
    const routeRequest: google.maps.DirectionsRequest = {
      origin: fromLocation,
      destination: toLocation,
      travelMode: google.maps.TravelMode.DRIVING,
      waypoints: waypts,
      //unitSystem:this.findUnitSystem((document.getElementById("system") as HTMLSelectElement).value)
    };

    directionsService.route(routeRequest, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        /*this.locations.distance=result.routes[0].legs[0].distance!.text;
        this.locations.duration=result.routes[0].legs[0].duration!.text;
        this.steps=result.routes[0].legs[0].steps;*/
        /*for(let i = 0; i < this.steps.length;i++){
          this.http.get(`https://maps.googleapis.com/maps/api/place/details/json?placeid=ChIJcUElzOzMQQwRLuV30nMUEUM&key=AIzaSyBUkPRQqcYPM_uRQjr0cb0W0P6_ri2DvvA`,{responseType:'text'}).subscribe((val)=>{
            console.log(val)
          })
        }*/
        //console.log(this.steps)
      } else {
        console.error('Directions request failed:', status);
      }
    });
  }
  autocomplete(map: google.maps.Map) {
    const card = document.getElementById("pac-card") as HTMLElement;
    const input = document.getElementById("FromLocationInput") as HTMLInputElement;
    const input1 = document.getElementById("ToLocationInput") as HTMLInputElement;
    const biasInputElement = document.getElementById(
      "use-location-bias"
    ) as HTMLInputElement;
    const strictBoundsInputElement = document.getElementById(
      "use-strict-bounds"
    ) as HTMLInputElement;
    const options = {
      fields: ["formatted_address", "geometry", "name"],
      strictBounds: false,
    };
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);

    const autocomplete = new google.maps.places.Autocomplete(input, options);
    const autocomplete1 = new google.maps.places.Autocomplete(input1, options);
    autocomplete.bindTo("bounds", map);

    const infowindow = new google.maps.InfoWindow();
    const infowindowContent = document.getElementById(
      "infowindow-content"
    ) as HTMLElement;
    infowindow.setContent(infowindowContent);

    const marker = new google.maps.Marker({
      map,
      anchorPoint: new google.maps.Point(0, -29),
    });
    autocomplete.addListener("place_changed", () => {
      infowindow.close();
      marker.setVisible(true);
      this.changeRoute(map, (document.getElementById("FromLocationInput") as HTMLInputElement).value, (document.getElementById("ToLocationInput") as HTMLInputElement).value, this.directionsRenderer!, this.directionsService!, [])
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        window.alert("No details available for input: '" + place.name + "'");
        return;
      }

      // If the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
      }

      marker.setPosition(place.geometry.location);
      marker.setVisible(true);

      (infowindowContent.children as any)["place-name"].textContent = place.name;
      (infowindowContent.children as any)["place-address"].textContent =
        place.formatted_address;
      infowindow.open(map, marker);
      function setupClickListener(id: any, types: any) {
        const radioButton = document.getElementById(id) as HTMLInputElement;

        radioButton.addEventListener("click", () => {
          autocomplete.setTypes(types);
          input.value = "";
        });
      };
      setupClickListener("changetype-all", []);
      setupClickListener("changetype-address", ["address"]);
      setupClickListener("changetype-establishment", ["establishment"]);
      setupClickListener("changetype-geocode", ["geocode"]);
      setupClickListener("changetype-cities", ["(cities)"]);
      setupClickListener("changetype-regions", ["(regions)"]);
      biasInputElement.addEventListener("change", () => {
        if (biasInputElement.checked) {
          autocomplete.bindTo("bounds", map);
        } else {
          // User wants to turn off location bias, so three things need to happen:
          // 1. Unbind from map
          // 2. Reset the bounds to whole world
          // 3. Uncheck the strict bounds checkbox UI (which also disables strict bounds)
          autocomplete.unbind("bounds");
          autocomplete.setBounds({ east: 180, west: -180, north: 90, south: -90 });
          strictBoundsInputElement.checked = biasInputElement.checked;
        }

        input.value = "";
      });

      strictBoundsInputElement.addEventListener("change", () => {
        autocomplete.setOptions({
          strictBounds: strictBoundsInputElement.checked,
        });

        if (strictBoundsInputElement.checked) {
          biasInputElement.checked = strictBoundsInputElement.checked;
          autocomplete.bindTo("bounds", map);
        }

        input.value = "";
      });
    });
    autocomplete1.addListener("place_changed", () => {
      infowindow.close();
      marker.setVisible(true);
      this.changeRoute(map, (document.getElementById("FromLocationInput") as HTMLInputElement).value, (document.getElementById("ToLocationInput") as HTMLInputElement).value, this.directionsRenderer!, this.directionsService!, [])
      const place = autocomplete1.getPlace();

      if (!place.geometry || !place.geometry.location) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        window.alert("No details available for input: '" + place.name + "'");
        return;
      }

      // If the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
      }

      marker.setPosition(place.geometry.location);
      marker.setVisible(true);
    }
    )
  }
  addRoute(map: google.maps.Map, directionsRenderer: google.maps.DirectionsRenderer, directionsService: google.maps.DirectionsService): void {
    directionsRenderer.setMap(map);

    const routeRequest: google.maps.DirectionsRequest = {
      origin: (document.getElementById("FromLocationInput") as HTMLInputElement).value,
      destination: (document.getElementById("ToLocationInput") as HTMLInputElement).value,
      travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(routeRequest, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        /*this.steps=result.routes[0].legs[0].steps;
        for(let i = 0; i < this.steps.length;i++){
          this.http.get(`https://maps.googleapis.com/maps/api/place/details/json?placeid=ChIJcUElzOzMQQwRLuV30nMUEUM&key=AIzaSyBUkPRQqcYPM_uRQjr0cb0W0P6_ri2DvvA`,{responseType:'text'}).subscribe((val)=>{
            console.log(val)
          })
        }*/
        //console.log(this.steps)
      } else {
        console.error('Directions request failed:', status);
      }
    });
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
      this.http.put("http://localhost:8080/insertCabDetails", body, { responseType: 'text' }).subscribe((val) => {
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
