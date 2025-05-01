import { Component, AfterViewInit } from '@angular/core';
import { GoogleMapsService } from '../google-maps.service';
import { HttpClient } from '@angular/common/http';
import { User } from '../../environments/user.interface';
import { ActivatedRoute } from '@angular/router';
import { Cabdata } from '../../environments/cabdata.interface';
import { from, map } from 'rxjs';
import { Location } from '../location.interface';
import { WebSocketAPI } from '../WebSocketAPI.component';
import { Price } from '../../environments/priceCalc.interface';
import { TaxState } from '../../environments/taxes.interface';

@Component({
  selector: 'app-driver',
  standalone: false,
  templateUrl: './driver.component.html',
  styleUrl: './driver.component.css'
})
export class DriverComponent implements AfterViewInit {
  userrequests: Cabdata[] = [];
  webSocket!: WebSocketAPI;
  api_key = 'AIzaSyBUkPRQqcYPM_uRQjr0cb0W0P6_ri2DvvA';
  driverMarker!: google.maps.marker.AdvancedMarkerElement;
  fromMarker!: google.maps.marker.AdvancedMarkerElement;
  toMarker!: google.maps.marker.AdvancedMarkerElement;
  userdata!: User;
  geocoder!: google.maps.Geocoder;
  o: number = 0;
  state!: string;
  ngOnInit(): void {
    const toggleButton = document.getElementById('toggleSidebar');
  const sidebar = document.getElementById('sidebar1');
  const mainContent = document.getElementById('main-content');

  toggleButton?.addEventListener('click', () => {
    sidebar?.classList.toggle('collapsed');
    mainContent?.classList.toggle('collapsed');
  });
  }
  moveDriver() {
    this.driverMarker.position = { lat: this.location.lat, lng: this.location.lng };
    console.log(this.driverMarker.position);
  }

  ngAfterViewInit(): void {
    this.googleMapsService
      .loadGoogleMaps(this.api_key)
      .then(() => {
        this.initializeMap();
      })
      .catch((error) => console.error('Error loading Google Maps:', error));
  }

  initializeMap(): void {
    this.webSocket = new WebSocketAPI();
    this.webSocket._connect("/topic/cabdatas");

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
      suppressMarkers: true,
    });
    this.directionsService = new google.maps.DirectionsService();
    this.geocoder = new google.maps.Geocoder();

    const driverIcon = document.createElement("div");
    const fromIcon = document.createElement("div");
    const toIcon = document.createElement("div");
    driverIcon.innerHTML = '<img src="https://th.bing.com/th/id/OIP.BdbURboW0OPBC6MQ2-Ow9gHaHa?rs=1&pid=ImgDetMain" width="32" height="32"/>';
    fromIcon.innerHTML = '<img src="https://www.freeiconspng.com/uploads/location-icon-24.png" width="32" height="32"/>';
    toIcon.innerHTML = '<img src="https://th.bing.com/th?id=OIP.V3N4LZrrSLNgG5hGB0kqCgHaHa&w=250&h=250&c=8&rs=1&qlt=90&o=6&pid=3.1&rm=2" width="32" height="32"/>';

    // Initialize markers with custom icons
    this.driverMarker = new google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      position: { lat: this.location.lat, lng: this.location.lng },
      title: "Driver Location",
      content: driverIcon
    });

    this.fromMarker = new google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      title: "From Location",
      content: fromIcon
    });

    this.toMarker = new google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      title: "To Location",
      content: toIcon
    });

    setTimeout(() => setInterval(() => this.fetchCabData(), 3000), 1500); // Use arrow function to bind 'this' context
  }

  fetchCabData(): void {
    let username = "";
    const cookies = document.cookie.split(";");
    for(let cookie of cookies){
      if(cookie.split("=")[0].includes("username")){
        username = cookie.split("=")[1];
        break;
      }
    }
    console.log(username)
    let price!: Price;
    /*this.webSocket._send("/app/cabdatas").then((val)=>{
      const cabdatas: Cabdata[] = (JSON.parse(val) as Cabdata[]);
      const resultArr:Cabdata[] = []
      if (cabdatas != null) {
        console.log(cabdatas);
        for (let cabdata of cabdatas) {
          this.directionsService.route({
            origin: cabdata.fromLocation,
            destination: cabdata.toLocation,
            travelMode: google.maps.TravelMode.DRIVING
          }, (result, status) => {
            if (status == "OK" && this.userdata != null) {
              console.log(cabdata.fromLocation.includes(this.userdata.state) && cabdata.fromLocation.includes(this.userdata.town))
              if (cabdata.fromLocation.includes(this.userdata.state) && cabdata.fromLocation.includes(this.userdata.town) && ((cabdata.driver == username || cabdata.driver == null) || (cabdata.accepted == null || cabdata.accepted.includes("d")))) {
                console.log("success")

                this.http.get<TaxState[]>("https://gist.githubusercontent.com/suryadutta/2dcdb6f43c501835c64d12580c63f168/raw/5cf6255eea95356527db2468c164adad09e82c03/salesTaxByState.JSON").subscribe((arr) => {
                  for (let stateTax of arr) {
                    if (cabdata.fromLocation.includes(stateTax.Abbreviation)) {
                      price = new Price(result?.routes[0].legs[0].distance?.value!, 1 + stateTax["Combined Tax Rate"]!)
                      break;
                    }
                  }
                  cabdata.pricing = price.getEstFare();
                  if(this.userrequests.length == 0){
                    resultArr.push(cabdata)
                  }else{
                    for(let req of this.userrequests){
                      if(req.cabid != cabdata.cabid){
                        resultArr.push(cabdata);
                      }
                      if(req.accepted.includes("a") && req.driver != username){
                        resultArr.push(cabdata);
                      }
                    }
                  }
                  this.userrequests = resultArr;
                })
  
                //console.log("Works");
              }
            }
          })
  
        }
        this.addPostMapEventListeners();
      }
    })*/
      /*this.webSocket._send("/app/cabdatas").then((val)=>{
        const cabdatas: Cabdata[] = (JSON.parse(val) as Cabdata[]);
        if (cabdatas != null) {
          console.log(cabdatas);
          for (let cabdata of cabdatas) {
            this.directionsService.route({
              origin: cabdata.fromLocation,
              destination: cabdata.toLocation,
              travelMode: google.maps.TravelMode.DRIVING
            }, (result, status) => {
              if (status == "OK" && this.userdata != null) {
                console.log(cabdata.fromLocation.includes(this.userdata.state) && cabdata.fromLocation.includes(this.userdata.town))
                if (cabdata.fromLocation.includes(this.userdata.state) && cabdata.fromLocation.includes(this.userdata.town) && ((cabdata.driver == username || cabdata.driver == null) || (cabdata.accepted == null || cabdata.accepted.includes("d")))) {
                  console.log("success")
  
                  this.http.get<TaxState[]>("https://gist.githubusercontent.com/suryadutta/2dcdb6f43c501835c64d12580c63f168/raw/5cf6255eea95356527db2468c164adad09e82c03/salesTaxByState.JSON").subscribe((arr) => {
                    for (let stateTax of arr) {
                      if (cabdata.fromLocation.includes(stateTax.Abbreviation)) {
                        price = new Price(result?.routes[0].legs[0].distance?.value!, 1 + stateTax["Combined Tax Rate"]!)
                        break;
                      }
                    }
                    cabdata.pricing = price.getEstFare();
                    
                    // Only add if not already in the array
                    if (!this.userrequests.some(req => req.cabid === cabdata.cabid)) {
                      this.userrequests.push(cabdata);
                    }
                  })
                }
              }
            })
          }
          this.addPostMapEventListeners();
        }
      })*/
        this.webSocket._send("/app/cabdatas").then((val)=>{
          const cabdatas: Cabdata[] = (JSON.parse(val) as Cabdata[]);
          if (cabdatas != null) {
            console.log(cabdatas);
            
            // Remove requests that have been taken by other drivers
            this.userrequests = this.userrequests.filter(request => {
              const matchingCabdata = cabdatas.find(cab => cab.cabid === request.cabid);
              return matchingCabdata && 
                     (matchingCabdata.driver === username || 
                      matchingCabdata.driver == null || 
                      matchingCabdata.accepted == null || 
                      matchingCabdata.accepted.includes('d'));
            });
    
            for (let cabdata of cabdatas) {
              this.directionsService.route({
                origin: cabdata.fromLocation,
                destination: cabdata.toLocation,
                travelMode: google.maps.TravelMode.DRIVING
              }, (result, status) => {
                if (status == "OK" && this.userdata != null) {
                  console.log(cabdata.fromLocation.includes(this.userdata.state) && cabdata.fromLocation.includes(this.userdata.town))
                  if (cabdata.fromLocation.includes(this.userdata.state) && 
                      cabdata.fromLocation.includes(this.userdata.town) && 
                      ((cabdata.driver == username || cabdata.driver == null) || 
                       (cabdata.accepted == null || cabdata.accepted.includes("d")))) {
                    console.log("success")
    
                    this.http.get<TaxState[]>("https://gist.githubusercontent.com/suryadutta/2dcdb6f43c501835c64d12580c63f168/raw/5cf6255eea95356527db2468c164adad09e82c03/salesTaxByState.JSON").subscribe((arr) => {
                      for (let stateTax of arr) {
                        if (cabdata.fromLocation.includes(stateTax.Abbreviation)) {
                          price = new Price(result?.routes[0].legs[0].distance?.value!, 1 + stateTax["Combined Tax Rate"]!)
                          break;
                        }
                      }
                      cabdata.pricing = price.getEstFare();
                      
                      // Only add if not already in the array
                      if (!this.userrequests.some(req => req.cabid === cabdata.cabid)) {
                        this.userrequests.push(cabdata);
                      }
                    })
                  }
                }
              })
            }
            this.addPostMapEventListeners();
          }
        })
      }

  addPostMapEventListeners(): void {
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
        console.log(`Origin:`, origin, `Destination: ${destination}`);

        // Update markers
        this.geocoder.geocode({ address: this.userrequests[i].fromLocation }, (results, status) => {
          if (status == "OK") {
            this.geocoder.geocode({ address: this.userrequests[i].toLocation }, (results1, stat) => {
              if (stat == "OK") {
                this.driverMarker.position = origin;
                this.fromMarker.position = { lat: results![0].geometry.location.lat(), lng: results![0].geometry.location.lng() };
                this.toMarker.position = { lat: results1![0].geometry.location.lat(), lng: results1![0].geometry.location.lng() };
              } else {
                console.log("Geocoder failed due to: " + status);
              }
            })
          } else {
            console.log("Geocoder failed due to: " + status);
          }
        })
        console.log(this.directionsService)
        this.directionsService.route({
          origin: origin,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
          waypoints: [{ location: this.userrequests[i].fromLocation, stopover: true }]
        }, (result, status) => {
          if (status == "OK") {
            this.directionsRenderer.setMap(this.map);
            this.directionsRenderer.setDirections(result);
            if (this.o == 1) {
              this.directionsRenderer.setOptions({
                polylineOptions: {
                  strokeColor: 'black',
                  strokeWeight: 5
                },
                suppressMarkers: true,
                preserveViewport: true
              })
            }
            this.o = this.o + 1;
          } else {
            console.error(`Directions request failed due to ${status}`);
            console.error(`Origin: ${origin}, Destination: ${destination}`);
          }
        });
      });
      acceptBtn!.addEventListener("click", () => {
        if(acceptBtn!.id == "a2"){
          alert("You've already accepted this request")
        } else{
            const pushDriver = this.http.post<string>('http://localhost:8080/pushDriver',{
              username:this.userdata.username,
              id:parseInt(acceptBtn?.parentElement?.parentElement!.id!)
            }).subscribe(()=>{
              pushDriver.unsubscribe();
            })
            const acceptReq = this.http.post<string>(`http://localhost:8080/accepted/${acceptBtn!.parentElement!.parentElement!.id}`,{
              driver:this.username,
              status:'Picked'
            }).subscribe(()=>{
              acceptReq.unsubscribe();
              setTimeout(()=>{
                location.reload()
              },600)
            })
        }
        
      })
      denyBtn!.addEventListener("click", () => {
        const deny = this.http.get("http://localhost:8080/denied/" + denyBtn!.parentElement!.parentElement!.id).subscribe(() => {
          deny.unsubscribe();
        })
        const chat = this.http.delete("http://localhost:8080/chat/" + denyBtn!.parentElement!.parentElement!.id).subscribe(() => {
          chat.unsubscribe();
        })
        //alert("Chat deleted")
      })
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
  map!: google.maps.Map;
  location: Location = {
    lat: 0,
    lng: 0
  };
  loading = false;
  distanceMatrix!: google.maps.DistanceMatrixService;
  waypoint: google.maps.DirectionsWaypoint[] = [];
  username:string = "";
  constructor(private route: ActivatedRoute, private googleMapsService: GoogleMapsService, private http: HttpClient) {
    Notification.requestPermission().then((result) => {
      //alert(result)
    });
    const cookies = document.cookie.split(";")
    let username = "";
    console.log(cookies);
    for (let cookie of cookies) {
      console.log(cookie.split("=")[0])
      if (cookie.split("=")[0].includes("username")) {
        username = cookie.split("=")[1];
        break;
      }
    }
    this.username = username;
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position: GeolocationPosition) => {
          setTimeout(() => {
            console.log([position.coords.latitude, position.coords.longitude]);
            this.geocoder.geocode({ location: { lat: position.coords.latitude, lng: position.coords.longitude } }, (results, status) => {
              if (status === "OK") {
                if (results) {
                  this.location.location = results[0].formatted_address;
                }
              } else {
                console.log("Geocoder failed due to: " + status);
              }
            })
            this.location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            this.http.get<User>("http://localhost:8080/user1/" + username).subscribe((val) => {
              this.userdata = val;
              this.http.get<TaxState[]>("https://gist.githubusercontent.com/suryadutta/2dcdb6f43c501835c64d12580c63f168/raw/5cf6255eea95356527db2468c164adad09e82c03/salesTaxByState.JSON").subscribe((arr) => {
                for (let stateTax of arr) {
                  if (stateTax["Abbreviation"].includes(val.state)) {
                    this.state = stateTax["Abbreviation"];
                    break;
                  }
                }
              })
              console.log(this.userdata)
              this.http.put("http://localhost:8080/users", {
                "id": val.id,
                "name": val.name,
                "username": val.username,
                "password": val.password,
                "description": val.description,
                "isDriver": val.isDriver,
                "status": "Available",
                "position": [position.coords.latitude, position.coords.longitude],
                "carType": val.carType,
                "imageLink": val.imageLink,
                "state": val.state,
                "town": val.town
              }).subscribe((val) => {
                console.log(val);
              });
            });
          }, 2000)
        });
    } else {
      console.log("Geolocation not available");
    }
  }

  toKms(meters: string) {
    if (meters.includes("km") == false) {
      console.log("HEY");
      return parseFloat(meters.split(" ")[0]) / 1000;
    }
    return parseFloat(meters.split(" ")[0]);
  }
}