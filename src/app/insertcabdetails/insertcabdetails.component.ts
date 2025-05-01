import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GoogleMapsService } from '../google-maps.service';
import { User } from '../../environments/user.interface';
import { MapAdvancedMarker } from '@angular/google-maps';
import { Cabdata } from '../../environments/cabdata.interface';
@Component({
  selector: 'app-insertcabdetails',
  standalone: false,
  templateUrl: './insertcabdetails.component.html',
  styleUrl: './insertcabdetails.component.css'
})
export class InsertcabdetailsComponent {
  id = 0

  date = new FormControl("");
  time = new FormControl("");
  numpassengers = new FormControl(3);
  ages = new FormControl("");
  userrequested = ""
  dateClass = new Date()
  date1 = `${this.dateClass.getFullYear()}-${this.dateClass.getMonth() + 1 < 10 ? "0" + (this.dateClass.getMonth() + 1) : this.dateClass.getMonth() + 1}-${this.dateClass.getDate()}`
  date2 = new Date(this.date1);
  today = {
    "date": this.date1,
    "time": this.dateClass.getTime(),
    "30days": ''
  }
  driver=""
  directionsRenderer!: google.maps.DirectionsRenderer;
  directionsService!: google.maps.DirectionsService;
  distanceMatrixService!: google.maps.DistanceMatrixService;
  fromLocation: string | undefined;
  toLocation: string | undefined;
  constructor(private googleMapsService: GoogleMapsService, private http: HttpClient, private route: ActivatedRoute) {

    this.date2.setDate(this.date2.getDate() + 30)
    this.today['30days'] = `${this.date2.getFullYear()}-${this.date2.getMonth() + 1 < 10 ? "0" + (this.date2.getMonth() + 1) : this.date2.getMonth() + 1}-${this.date2.getDate()}`;
    //document.getElementById("register")?.addEventListener("",this.insertData)
    const cookies = document.cookie.split(";");
    for(let cookie of cookies){
      console.log(cookie)
      if(cookie.includes("username")){
        this.userrequested = cookie.split("=")[1];
        break;
      }
    }
    
    console.log(this.userrequested)
    document.addEventListener("DOMContentLoaded", () => {
      document.getElementById("gb")!.setAttribute("href", `/edit/${this.userrequested}`)
    })

  }
  iterable=1;
  api_key = 'AIzaSyBUkPRQqcYPM_uRQjr0cb0W0P6_ri2DvvA'
  ngAfterViewInit(): void {
    this.googleMapsService
      .loadGoogleMaps(this.api_key)
      .then(() => {
        this.initializeMap();
      })
      .catch((error) => console.error('Error loading Google Maps:', error));
  }
  addRoute(map: google.maps.Map, directionsRenderer: google.maps.DirectionsRenderer, directionsService: google.maps.DirectionsService): void {
    directionsRenderer.setMap(map);
    const routeRequest: google.maps.DirectionsRequest = {
      origin: 'San Francisco, CA',
      destination: 'Los Angeles, CA',
      travelMode: google.maps.TravelMode.DRIVING
    };
    

    setTimeout(()=>{
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
    },500)
  }
  toMeters(length:string|undefined){
    if(length!.includes("km")){
      console.log("hey")
      return parseFloat(length!.replace(" km",""))*1000
    } else{
      return parseFloat(length!.replace(" m",""))
    }
  }
  initializeMap(): void {
    const mapOptions: google.maps.MapOptions = {
      center: { lat: 39.380582, lng: -76.765594 },
      zoom: 12,
    };

    const map = new google.maps.Map(
      document.getElementById('mapapi') as HTMLElement,
      mapOptions
    );
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      polylineOptions: {
        strokeColor: 'black',
        strokeWeight: 3
      }
    })
    this.directionsService = new google.maps.DirectionsService();
    this.distanceMatrixService = new google.maps.DistanceMatrixService();
    this.directionsRenderer.setMap(map);
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position: GeolocationPosition) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          
          const markeroptions: google.maps.marker.AdvancedMarkerElementOptions = {
            map:map,
            position:new google.maps.LatLng(pos.lat,pos.lng)
          }
          const marker = new google.maps.Marker({
            map:map,
            position:{lat:pos.lat,lng:pos.lng}
          })
          const matrixOptions: google.maps.DistanceMatrixRequest = {
            origins: [],
            destinations: [pos.lat + "," + pos.lng],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
          }
          const currLoc  = new google.maps.Marker({
            map:map,
            position:{lat:pos.lat,lng:pos.lng}
          })
          this.http.get<User[]>("http://localhost:8080/getDrivers").subscribe((val) => {
           const drivers = val;
           const debug:any = {
           }
           const geocoder = new google.maps.Geocoder();
           
            for (let i = 0; i < val.length; i++) {
              const driver = val[i];
              matrixOptions.origins.push(`${driver.position[0]},${driver.position[1]}`)
              const geocoderRequest: google.maps.GeocoderRequest = {
                location:{lat:driver.position[0],lng:driver.position[1]}
               }
               geocoder.geocode(geocoderRequest,(results)=>{
                //console.log(results![0].formatted_address)
                this.driver=driver.username;
                console.log(this.driver)
                 debug[`${driver.username}`]=`${results![0].formatted_address}`
               })
             
              /*const marker = new google.maps.Marker({
                map:map,
                position:{lat:driver.position[0], lng:driver.position[1]},
                icon:"https://d1a3f4spazzrp4.cloudfront.net/car-types/map70px/map-whitesuv.png"
              })*/

              //kmatrixOptions.region?.concat(`${driver.username},`)
            }
            this.distanceMatrixService.getDistanceMatrix(matrixOptions, (response, status) => {
              let shortestMeters=this.toMeters(response?.rows[response.rows.length-1].elements[0].distance.text);
              for(let key of Object.keys(debug)){
                if(response?.originAddresses[response.originAddresses.length-1]==debug[key]){
                  this.driver=key;
                  console.log(response?.originAddresses[response.originAddresses.length-1])
                  console.log(
                    "SUCCESS",key
                  )
                }
              }
              console.log(shortestMeters)
              console.log()
            })

          })


        },
        (error)=>{
          console.log(error)
        },
        {
          enableHighAccuracy:true
        }
      )
    }
    this.addRoute(map, this.directionsRenderer, this.directionsService)
    this.autocomplete(map)
  }
  insertData() {
    let passeng = this.numpassengers.value;
    let if4 = false;
    let agesArr: any[] | undefined = this.ages.value?.split(",");
    for (let i = 0; i < agesArr!.length; i++) {
      agesArr![i] = Number.parseInt(agesArr![i])
    }
    for (let age of agesArr!) {
      if (age < 18) {
        if4 = true
        break;
      }
    }
    this.http.get<number>("http://localhost:8080/countReqs").subscribe((val) => {
      this.id = val++;
      const cabdata = {
        cabid: this.id,
        fromLocation:this.fromLocation,
        toLocation: this.toLocation,
        date: this.date.value!,
        time: this.time.value!,
        ages: agesArr!,
        numpassengers: this.numpassengers.value,
        userrequested: this.userrequested,
        status:'Requested'
      }
      console.log(cabdata)
      if (!if4 && passeng! > 3) {
        document.getElementById("errormsg")!.innerHTML = "Max people is 3, 4 if one is under 18"
      } else if (passeng! > agesArr!.length || passeng! < agesArr!.length) {
        document.getElementById("errormsg")!.innerHTML = "Incorrect amount of passengers"
      } else if ((if4 && passeng! <= 4) || (!if4 && passeng! <= 3)) {
        this.http.post("http://localhost:8080/insertCabDetails",
          cabdata, { responseType: "text" }).subscribe(() => {
            location.href = "http://localhost:4200/showDetails/" + this.id
          })
      } else {
        document.getElementById("errormsg")!.innerHTML = "Too many people"
      }
    })
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
    const options: google.maps.places.AutocompleteOptions = {
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
      this.changeRoute(map, (document.getElementById("FromLocationInput") as HTMLInputElement).value, (document.getElementById("ToLocationInput") as HTMLInputElement).value, this.directionsRenderer, this.directionsService, [])
      const place = autocomplete.getPlace();
      this.fromLocation = place.formatted_address
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
      
      this.changeRoute(map, (document.getElementById("FromLocationInput") as HTMLInputElement).value, (document.getElementById("ToLocationInput") as HTMLInputElement).value, this.directionsRenderer, this.directionsService, [])
      const place = autocomplete1.getPlace();
      this.toLocation = place.formatted_address
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
      }
      setupClickListener("changetype-all", []);
      setupClickListener("changetype-address", ["address"]);
      setupClickListener("changetype-establishment", ["establishment"]);
      setupClickListener("changetype-geocode", ["geocode"]);
      setupClickListener("changetype-cities", ["(cities)"]);
      setupClickListener("changetype-regions", ["(regions)"]);
     

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
}
