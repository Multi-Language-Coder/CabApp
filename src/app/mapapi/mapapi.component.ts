import { HttpClient } from '@angular/common/http';
import { Component, Inject, Renderer2 } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { GoogleMapsService } from '../google-maps.service';
@Component({
  selector: 'app-mapapi',
  standalone: false,  
  templateUrl: './mapapi.component.html',
  styleUrl: './mapapi.component.css',
  host: {
    "ngSkipHydration": "true"
  }
})
export class MapapiComponent {
  request: any|undefined;
  placeService!: google.maps.places.PlacesService;
  directionsService!: google.maps.DirectionsService;
  directionsRenderer!: google.maps.DirectionsRenderer;
  map: any |undefined;
  options: google.maps.MapOptions = {
    mapId: "cbd7521b6e5865e3",
    center: { lat: -31, lng: 147 },
    zoom: 6,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
      },
      {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
      },
    ],
  };
  locations = {
    "fromLocation":"",
    "toLocation":"",
    "distance":"0 km",
    "duration":"9 minutes"
  }
  currLat=0;
  currLong=0;
  cabid=0
  county=""
  zipcode=0
  steps: google.maps.DirectionsStep[] | any = [];
  waypts: google.maps.DirectionsWaypoint[] = [];
  wayptsNum: any;
  constructor(private googleMapsService: GoogleMapsService,private http: HttpClient,private route:ActivatedRoute) {
  }
  initializeMap(): void {
    this.route.params.subscribe(params=>{
      this.cabid=params['id']
      this.http.get(`http://localhost:8080/getLocations/${this.cabid}`,{responseType:'text'}).subscribe((val)=>{
        const vals = val.split(",")
        this.locations.fromLocation=vals[0]+","+vals[1]+","+vals[2];
        this.locations.toLocation=vals[3]+","+vals[4]+","+vals[5]
        console.log(this.locations)
        const mapOptions: google.maps.MapOptions = {
          center: { lat: 37.7749, lng: -122.4194 },
          zoom: 12,
        };
    
        const map = new google.maps.Map(
          document.getElementById('googleMap') as HTMLElement,
          mapOptions
        );
        this.directionsRenderer=new google.maps.DirectionsRenderer({
          polylineOptions:{
            strokeColor:'black',
            strokeWeight:3
          }
        })
        this.directionsService=new google.maps.DirectionsService();
        //this.placeService=new google.maps.places.PlacesService(map);
        
        this.addRoute(map,this.directionsRenderer,this.directionsService,this.waypts!);
        this.autocomplete(map);
        (document.getElementById("system") as HTMLInputElement)?.addEventListener(
          "change",
          ()=>{
            //const travelModeString = (document.getElementById("mode") as HTMLInputElement).value;
            //const travelMode = this.travelModeFinder(travelModeString)
            this.changeRoute(map,this.directionsRenderer,this.directionsService,this.waypts!)
          }
        )
        document.getElementById("btn-waypoint")!.addEventListener("click",()=>{
          if(this.wayptsNum!=10){
          this.waypts!.push({
            location:(document.getElementById('waypoint') as HTMLInputElement).value,
            stopover:true
          })
          console.log(this.waypts)
          this.changeRoute(map,this.directionsRenderer,this.directionsService,this.waypts!)
          this.wayptsNum=this.wayptsNum+1;
        }else{
          alert(`You can only make a max of 9 stops. 
            Please clear your previous stops.`)
        }
        });
        document.getElementById("btn-clear-waypoint")!.addEventListener("click",()=>{
          this.waypts=[];
          this.changeRoute(map,this.directionsRenderer,this.directionsService,this.waypts)
        });
      })
    })
    
    /*this.http.get(`https://maps.googleapis.com/maps/api/geocode/json?address=San+Francisco,+CA&key=${this.api_key}`,{responseType:'text'}).subscribe((val)=>{
      const results = JSON.parse(val).results[0].geometry.location;
      this.latlng.latitude=results.lat;
      this.latlng.longitude=results.lng;
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: {lat: this.latlng.latitude, lng: this.latlng1.longitude},
      });
    })
    this.http.get(`https://maps.googleapis.com/maps/api/geocode/json?address=Los+Angeles,+CA&key=${this.api_key}`,{responseType:'text'}).subscribe((val)=>{
      const results = JSON.parse(val).results[0].geometry.location;
      this.latlng1.latitude=results.lat;
      this.latlng1.longitude=results.lng;
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: {lat: this.latlng1.latitude, lng: this.latlng1.longitude},
      });
    });
    document.getElementById("btn-waypoint")!.addEventListener("click",()=>{
      if(this.wayptsNum!=10){
      this.waypts.push({
        location:(document.getElementById('waypoint') as HTMLInputElement).value,
        stopover:true
      })
      //console.log(this.waypts)
      const travelModeString = (document.getElementById("mode") as HTMLInputElement).value;
      const travelMode = this.travelModeFinder(travelModeString)
      this.changeRoute(map,travelMode,this.directionsRenderer,this.directionsService,this.waypts)
      //this.wayptsNum=this.wayptsNum+1;
    }else{
      alert(`You can only make a max of 9 waypoints/stops. 
        Please clear your previous waypoints/stops.`)
    }
    });
    document.getElementById("btn-clear-waypoint")!.addEventListener("click",()=>{
      //this.waypts=[];
      const travelModeString = (document.getElementById("mode") as HTMLInputElement).value;
      //const travelMode = this.travelModeFinder(travelModeString)
      //this.changeRoute(map,travelMode,this.directionsRenderer,this.directionsService,this.waypts)
    });
    (document.getElementById("mode") as HTMLInputElement)?.addEventListener(
      "change",
      ()=>{
        const travelModeString = (document.getElementById("mode") as HTMLInputElement).value;
        //const travelMode = this.travelModeFinder(travelModeString)
        //this.changeRoute(map,travelMode,this.directionsRenderer,this.directionsService,this.waypts)
      }
    );*/
    
  }
  api_key='AIzaSyBUkPRQqcYPM_uRQjr0cb0W0P6_ri2DvvA'
  ngAfterViewInit(): void {
    this.googleMapsService
      .loadGoogleMaps(this.api_key)
      .then(() => {
        this.initializeMap();
      })
      .catch((error) => console.error('Error loading Google Maps:', error));
  }
  findUnitSystem(unitSystem:string){
    switch(unitSystem){
      case "IMPERIAL":
        return google.maps.UnitSystem.IMPERIAL
      case "METRIC":
        return google.maps.UnitSystem.METRIC;
      default:
        return google.maps.UnitSystem.IMPERIAL;
    }
  }
  
  addRoute(map: google.maps.Map, directionsRenderer:google.maps.DirectionsRenderer, directionsService:google.maps.DirectionsService, waypts:google.maps.DirectionsWaypoint[]): void {
    directionsRenderer.setMap(map);

    const routeRequest: google.maps.DirectionsRequest = {
      origin: this.locations.fromLocation,
      destination: this.locations.toLocation,
      travelMode: google.maps.TravelMode.DRIVING    
    };
    
    directionsService.route(routeRequest, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        this.locations.distance=result.routes[0].legs[0].distance!.text;
        this.locations.duration=result.routes[0].legs[0].duration!.text;
        this.steps=result.routes[0].legs[0].steps;
        const coordinates: google.maps.LatLngLiteral[] = [];
        const route=result.routes[0]
        for(let i = 0; i < route.overview_path.length; i++){
          coordinates.push({
            lat:route.overview_path[i].lat(),
            lng:route.overview_path[i].lng()
          })
        }
        console.log(coordinates)
        /*for(let i = 0; i < this.steps.length;i++){
          this.http.get(`https://maps.googleapis.com/maps/api/place/details/json?placeid=ChIJcUElzOzMQQwRLuV30nMUEUM&key=AIzaSyBUkPRQqcYPM_uRQjr0cb0W0P6_ri2DvvA`,{responseType:'text'}).subscribe((val)=>{
            console.log(val)
          })*/
        } else {
        console.error('Directions request failed:', status);
      }
    });
  }
  autocomplete(map:google.maps.Map){
    const card = document.getElementById("pac-card") as HTMLElement;
    const input = document.getElementById("waypoint") as HTMLInputElement;
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
    this.changeRoute(map,this.directionsRenderer,this.directionsService,this.waypts!)
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
    function setupClickListener(id:any, types:any) {
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
  }
  changeRoute(map: google.maps.Map, directionsRenderer:google.maps.DirectionsRenderer, directionsService:google.maps.DirectionsService,waypts:google.maps.DirectionsWaypoint[]): void {
    directionsRenderer.setMap(map);

    const routeRequest: google.maps.DirectionsRequest = {
      origin: this.locations.fromLocation,
      destination: this.locations.toLocation,
      travelMode: google.maps.TravelMode.DRIVING,
      waypoints:waypts,
      unitSystem:this.findUnitSystem((document.getElementById("system") as HTMLSelectElement).value)
    };
    
    directionsService.route(routeRequest, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
       
        this.locations.distance=result.routes[0].legs[0].distance!.text;
        this.locations.duration=result.routes[0].legs[0].duration!.text;
        this.steps=result.routes[0].legs[0].steps;
        /*for(let i = 0; i < this.steps.length;i++){
          this.http.get(`https://maps.googleapis.com/maps/api/place/details/json?placeid=ChIJcUElzOzMQQwRLuV30nMUEUM&key=AIzaSyBUkPRQqcYPM_uRQjr0cb0W0P6_ri2DvvA`,{responseType:'text'}).subscribe((val)=>{
            console.log(val)
          })
        }*/
        console.log(this.steps)
      } else {
        console.error('Directions request failed:', status);
      }
    });
  }
}
