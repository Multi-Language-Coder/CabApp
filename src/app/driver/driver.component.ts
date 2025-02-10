import { Component } from '@angular/core';
import { GoogleMapsService } from '../google-maps.service';
import { HttpClient } from '@angular/common/http';
import { User } from '../user.component';
import { ActivatedRoute } from '@angular/router';
import { Cabdata } from '../cabdata.component';
import { from, map } from 'rxjs';
import { Location } from '../location.component';

@Component({
  selector: 'app-driver',
  standalone: false,

  templateUrl: './driver.component.html',
  styleUrl: './driver.component.css'
})
export class DriverComponent {
  userrequests: Cabdata[] = [

  ]
  api_key = 'AIzaSyBUkPRQqcYPM_uRQjr0cb0W0P6_ri2DvvA'
  driver!: google.maps.marker.AdvancedMarkerElement;
  moveDriver(){
    this.driver.position = {lat:this.location.lat,lng:this.location.lng}
    console.log(this.driver.position)
  }
  ngAfterViewInit(): void {
    this.googleMapsService
      .loadGoogleMaps(this.api_key)
      .then(() => {
        this.initializeMap();
        
      })
      .catch((error) => console.error('Error loading Google Maps:', error));
  }
  i = 0;
  initializeMap(): void {
    const mapOptions: google.maps.MapOptions = {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 12,
      mapId: 'cbd7521b6e5865e3'
    };

    this.map = new google.maps.Map(
      document.getElementById('googleMap') as HTMLElement,
      mapOptions
    );
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      polylineOptions: {
        strokeColor: 'black',
        strokeWeight: 5
      },
      suppressMarkers: true
    })
    this.directionsService = new google.maps.DirectionsService();
  }
  watchedPosition!: number;
  directionsRenderer!: google.maps.DirectionsRenderer;
  directionsService!: google.maps.DirectionsService;
  directionsRenderer1!: google.maps.DirectionsRenderer;
  map!: google.maps.Map;
  location: Location = {
    lat: 0,
    lng: 0
  }
  waypoint: google.maps.DirectionsWaypoint[] = [];
  constructor(private route: ActivatedRoute, private googleMapsService: GoogleMapsService, private http: HttpClient) {
    Notification.requestPermission().then((result) => {
      //alert(result)
    })


    this.route.params.subscribe(params => {
      const username = params['username']
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (position: GeolocationPosition) => {
            console.log([position.coords.latitude, position.coords.longitude])
            this.location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            this.http.get<User>("http://localhost:8080/user1/" + username).subscribe((val) => {
              this.http.put("http://localhost:8080/users", {
                "id": val.id,
                "name": val.name,
                "username": val.username,
                "password": val.password,
                "description": val.description,
                "isDriver": val.isDriver,
                "status": "Available",
                "position": [position.coords.latitude, position.coords.longitude]
              }).subscribe((val) => {
                console.log(val)
              })
            })

          })
      } else {
        console.log("Geolocation not avaible")
      }
      this.http.get<Cabdata[]>(`http://localhost:8080/getRequests/${username}`).subscribe((val) => {
        const cabdatas = val;

        for (let i = 0; i < cabdatas.length; i++) {
          this.userrequests.push(cabdatas[i])
        }
        //console.log(cabdata.ages)
        //for(let i = 0; )
        setTimeout(() => {
          const postMapBtns = document.getElementsByClassName("postMap")
          const acceptRequestBtns = document.getElementsByClassName("acceptRequest");
          const denyRequestBtns = document.getElementsByClassName("denyRequest")
          for (let i = 0; i < postMapBtns.length; i++) {
            const postMapBtn = (postMapBtns.item(i) as HTMLButtonElement);
            const acceptRequestBtn = acceptRequestBtns.item(i);
            const denyRequestBtn = denyRequestBtns.item(i)
            let tr: any;
            postMapBtn?.addEventListener("click", (e) => {
              const geocoder = new google.maps.Geocoder();
              const geocoderRequest: google.maps.GeocoderRequest = {
                location: { lat: this.location.lat, lng: this.location.lng }
              }
              console.log(geocoderRequest)
              geocoder.geocode(geocoderRequest, (result, status) => {
                if (status == "OK") {
                  this.location.location = result![0].formatted_address;
                  tr = postMapBtn.parentElement?.parentElement;
                  const fromLocation = tr?.getElementsByTagName("td")[1].innerText;
                  const toLocation = tr?.getElementsByTagName("td")[2].innerText;
                  this.directionsRenderer.setMap(this.map)
                  const routeRequest: google.maps.DirectionsRequest = {
                    origin: this.location.location,
                    destination: toLocation!,
                    travelMode: google.maps.TravelMode.DRIVING,
                    waypoints: [{
                      location: fromLocation,
                      stopover: true
                    }]
                  }
                  this.directionsService.route(routeRequest, (route, status) => {
                    this.directionsRenderer.setDirections(route)
                    const image = document.createElement("div");
                    const image1 = document.createElement("div");
                    const image2 = document.createElement("div");
                    console.log(image,image1,image2)
                    let img = "<img src='https://d1a3f4spazzrp4.cloudfront.net/car-types/map70px/map-uberx.png' width='32' height='32' style='margin:0; padding:0;'/>";
                    let img1 = "<img src='https://www.clipartmax.com/png/full/213-2135726_location-pin-icon-google-maps-blue-marker.png' width='32' height='32' style='margin:0; padding:0;'/>"
                    let img2 = "<img src='https://cdn4.iconfinder.com/data/icons/map-navigation-and-direction/60/End_sign-512.png' width='32' height='32'style='margin:0; padding:0;'/>"
                    image.innerHTML = img;
                    image1.innerHTML = img1;
                    image2.innerHTML = img2;
                    this.driver = new google.maps.marker.AdvancedMarkerElement({
                      position: new google.maps.LatLng(this.location.lat, this.location.lng),
                      title: 'Driver',
                      map:this.map,
                      content: image
                    });
                    let user = new google.maps.marker.AdvancedMarkerElement({
                        position:route!.routes[0].legs[0].end_location,
                        title:"Pick Up Location",
                        map:this.map,
                        content:image1
                    });
                    console.log(route!.routes[0].legs[1].end_location)
                    let endLoc = new google.maps.marker.AdvancedMarkerElement({
                      position:route!.routes[0].legs[1].end_location,
                      title:"Drop Off Location",
                      map:this.map,
                      content:image2
                    });
                    setInterval(()=>{
                      this.moveDriver()
                    },1000)
                  })
                }
              })

              /*console.log(`Table Row Element:${tr}
                From Location: ${fromLocation}
                To Location ${toLocation}`)
              console.log(e.currentTarget)*/
            })
            postMapBtn.click()
            acceptRequestBtn?.addEventListener("click", () => {
              const id = acceptRequestBtn.parentElement?.parentElement!.id;
              this.http.get(`http://localhost:8080/accepted/${id}`).subscribe()
              postMapBtn.click();
            })

            denyRequestBtn?.addEventListener("click", () => {
              const id = denyRequestBtn.parentElement?.parentElement?.id
              this.http.get(`http://localhost:8080/denied/${id}`).subscribe()
            })
          }
        }, 300)
      })

    })

  }
}