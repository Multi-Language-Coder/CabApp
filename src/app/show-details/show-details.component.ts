import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Cabdata } from '../cabdata.component';
import { WebSocketAPI } from '../WebSocketAPI.component';
import { GoogleMapsService } from '../google-maps.service';

import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-show-details',
  standalone: false,
  templateUrl: './show-details.component.html',
  styleUrl: './show-details.component.css'
})
export class ShowDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private updateInterval: any;
  private driverLocationInterval: any;

  cabdata:Cabdata = {
    fromLocation:'',
    toLocation:'',
    date:'',
    time:'',
    numpassengers:1,
    ages:[0],
    driver:'Unknown',
    userrequested:'Unknown',
    cabid:-1,
    accepted:'pf',
    id:-2
  };
  id:number | undefined;
  WebSocketAPI!:WebSocketAPI;
  directionsRenderer!: google.maps.DirectionsRenderer;
  directionsService!: google.maps.DirectionsService;
  distanceMatrix!: google.maps.DistanceMatrixService;
  geocoder!: google.maps.Geocoder;
  fromLocationCoords = {
    lat:0,
    lng:0
  }
  toLocationCoord = {
    lat:0,
    lng:0
  }
  referenceObj = new Date();
  distance: string|undefined;
  arrivalTime:Date = new Date();
  dropOffTime:Date = new Date();
  driverPos!: google.maps.LatLng;

  notifications = {
    fiveMinute: false,
    oneMinute: false
  };

  constructor(private googleMapsService:GoogleMapsService,private route:ActivatedRoute,private http: HttpClient){
    
  }
  api_key = environment.googleMapsApiKey;
  ngAfterViewInit(): void {
    this.googleMapsService
      .loadGoogleMaps(this.api_key)
      .then(() => {
        this.initializeMap();
      })
      .catch((error) => console.error('Error loading Google Maps:', error));
  }
  initializeMap(): void {
    const mapOptions: google.maps.MapOptions = {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 12,
      mapId:'cbd7521b6e5865e3',
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
    
    console.log(document.getElementById('showDetails') as HTMLElement)

    const map = new google.maps.Map(
      document.getElementById('showDetails') as HTMLElement,
      mapOptions,
      
    );
    console.log(map.getCenter()?.lat(),map.getCenter()?.lng())
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      polylineOptions: {
        strokeColor: 'red',
        strokeWeight: 5,
      },
      suppressMarkers:true,
      preserveViewport:true
    })
    this.directionsService = new google.maps.DirectionsService();
    this.distanceMatrix = new google.maps.DistanceMatrixService();
    this.geocoder=new google.maps.Geocoder();
    
   
    document.getElementById("goBack")?.addEventListener("click",this.goBack)
    this.route.params.subscribe(params => {
      this.id=parseInt(params['id']);
      this.http.get<Cabdata>("http://localhost:8080/cab/"+params['id']).subscribe((val)=>{
        this.cabdata=val;
        console.log("Initializing WebSocket")
        this.WebSocketAPI=new WebSocketAPI();
        this.WebSocketAPI._connect("/topic/cabdata/{fleetId}");
        let interval = setInterval(()=>{
          this.WebSocketAPI._send(`/app/cabdata/${this.id!}`)
          const result = (this.WebSocketAPI.result as Cabdata);
          if(result.accepted == "a1"){
            clearInterval(interval);
            this.handleAcceptedRide(result,map)
          } else if(result.accepted == "a2"){
            clearInterval(interval);
            this.handleExistingAcceptedRide(map);
          } else if(result.accepted == "d1"){
            clearInterval(interval);
            this.handleDeniedRide(result)
          } else if(result.accepted=="d2"){
            clearInterval(interval);
          } else {

          }
        },2000)
        console.log(val)
        this.getDCD()
        const f: google.maps.GeocoderRequest = {
          address:this.cabdata.fromLocation
        }
        const t: google.maps.GeocoderRequest = {
          address:this.cabdata.toLocation
        }
        this.geocoder.geocode(f,(result,status)=>{
          this.fromLocationCoords.lat=result![0].geometry.location.lat();
          this.fromLocationCoords.lng=result![0].geometry.location.lng();
          //this.fromLocationCoords.=result![0].
        })
        this.geocoder.geocode(t,(result,status)=>{
          this.toLocationCoord.lat=result![0].geometry.location.lat();
          this.toLocationCoord.lng=result![0].geometry.location.lng();
          //this.fromLocationCoords.=result![0].
        })
        //val.acc
        this.initializeWebSocketConnection(map)
      })
    })

    setTimeout(()=>{
        document.getElementById("gb")?.setAttribute("href","/edit/"+this.cabdata?.userrequested)
        document.getElementById("upd")?.setAttribute("href",`/update/${this.cabdata?.cabid}?username=${this.cabdata?.userrequested}`)
        document.getElementById("ins")?.setAttribute("href",`/insert/${this.cabdata?.userrequested}`)
        document.getElementById("chk")?.setAttribute("href",`/tracking/${this.id}`)
    },500)
    document.getElementById("system")!.addEventListener(
      "change",
      ()=>{
        const travelModeString = (document.getElementById("system") as HTMLSelectElement).value;
        const travelMode = this.findUnitSystem(travelModeString)
        this.changeRoute(travelMode)
    })
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
  changeRoute(travelMode:google.maps.UnitSystem) {
    this.directionsService.route({
      origin:this.cabdata.fromLocation,
      destination:this.cabdata.toLocation,
      unitSystem:travelMode,
      travelMode:google.maps.TravelMode.DRIVING
    },(response,status)=>{
      if(status=="OK"){
        this.distance=response?.routes[0].legs[0].distance?.text;
        //this.directionsRenderer.setDirections(response)
      }
    })
  }
  
  recieved = {
    got5min:false,
    got1min:false
  }
  toString(number:number|undefined){
    return ""+number;
  }
  getDCD(){
    this.directionsService.route({
      origin:this.cabdata.fromLocation,
      destination:this.cabdata.toLocation,
      travelMode:google.maps.TravelMode.DRIVING
    },(result,status)=>{
      if(status == "OK"){
        const cabdataTime = this.cabdata.time.split(":")
        const referenceObj = new Date();
        referenceObj.setHours(parseInt(cabdataTime[0]),parseInt(cabdataTime[1]));
        console.log(referenceObj)
        this.distance= result?.routes[0].legs[0].distance!.text;
        const durations = result?.routes[0].legs[0].duration!.text.split(" ")
        this.dropOffTime  = this.dateAdd(referenceObj,durations![1],parseInt(durations![0]))!;
       
        console.log(this.referenceObj,durations![1],parseInt(durations![0]),this.dropOffTime)
      }
    })
  }
  set0(string:string){
    if(string.length==1){
      return "0"+string
    } else {
      return string;
    }
  }
  getDriverLocation(map:google.maps.Map){
    let iteration = 0;
    
    this.directionsRenderer.setMap(map)
    
    this.WebSocketAPI._connect("/topic/driverLocation/{driver}")
    let driver:google.maps.marker.AdvancedMarkerElement;
      let user : google.maps.marker.AdvancedMarkerElement;
      let endLoc: google.maps.marker.AdvancedMarkerElement;
    const interval = setInterval(()=>{
      this.WebSocketAPI._send(`/app/driverLocation/${this.cabdata.driver}`);
      const positionArr:number[] = this.WebSocketAPI.result;
      console.log(positionArr)
        let position = new google.maps.LatLng(positionArr[0],positionArr[1])
        this.driverPos = position;
        //let userpos = new google.maps.LatLng(this.cabdata.fromLocation)
      
      if(iteration == 1){
        const image = document.createElement("div");
        const image1 = document.createElement("div");
        const image2 = document.createElement("div")
        let img = "<img src='https://d1a3f4spazzrp4.cloudfront.net/car-types/map70px/map-uberx.png' width='32' height='32' style='margin:0; padding:0;'/>";
        let img1 = "<img src='https://www.clipartmax.com/png/full/213-2135726_location-pin-icon-google-maps-blue-marker.png' width='32' height='32' style='margin:0; padding:0;'/>"
        let img2 = "<img src='https://cdn4.iconfinder.com/data/icons/map-navigation-and-direction/60/End_sign-512.png' width='32' height='32'style='margin:0; padding:0;'/>"
        image.innerHTML=img;
        image1.innerHTML=img1;
        image2.innerHTML=img2;
        console.log(position)
        driver = new google.maps.marker.AdvancedMarkerElement({
          position:{lat:position.lat(),lng:position.lng()},
          title:'Driver',
          map:map,
          content:image
        })
        user = new google.maps.marker.AdvancedMarkerElement({
          position:{lat:this.fromLocationCoords.lat,lng:this.fromLocationCoords.lng},
          title:'Pickup Location',
          map:map,
          content:image1
        })
        endLoc = new google.maps.marker.AdvancedMarkerElement({
          position:{lat:this.toLocationCoord.lat,lng:this.toLocationCoord.lng},
          title:'End Location',
          map:map,
          content:image2
        })
        const bounds = new google.maps.LatLngBounds();
        console.log(driver.position)
        this.directionsService.route({
          origin:position,
          destination:this.cabdata.toLocation,
          travelMode:google.maps.TravelMode.DRIVING,
          waypoints:[{
            location:this.cabdata.fromLocation,
            stopover:true
          }],
        },(result,status)=>{
          this.directionsRenderer.setDirections(result)
          bounds.union(result!.routes[0].bounds)
          map.fitBounds(bounds)
        })
        this.getDCD()
      } else if(iteration > 1){
        driver!.position = {lat:position.lat(),lng:position.lng()}
        
        this.getDCD()
      }

      const distanceRequest: google.maps.DistanceMatrixRequest = {
        origins:[position],
        destinations:[this.cabdata.fromLocation],
        travelMode:google.maps.TravelMode.DRIVING
      }

      this.distanceMatrix.getDistanceMatrix(distanceRequest,(response)=>{
        console.log(response?.rows[0].elements[0].duration.text)
        const time = this.getMins(response?.rows[0].elements[0].duration.text);
        if((time! == 6 || time! == 5 || time! == 4) && this.recieved.got5min==false){
          this.recieved.got5min=true
          console.log(this.recieved)
          const img = "https://cdn2.iconfinder.com/data/icons/travel-glyph-21/64/Taxi-car-cab-transport-transportation-512.png";
            const text = `Your driver is 5 minutes away`;
            const noti = new Notification("CabApp Update", { body: text, icon: img });
        }  
        if(time==1 && this.recieved.got1min!=true) {
          this.recieved.got1min=true
          const img = "https://cdn2.iconfinder.com/data/icons/travel-glyph-21/64/Taxi-car-cab-transport-transportation-512.png";
            const text = `Your driver is 1 minute away`;
            const note = new Notification("CabApp Update", { body: text, icon: img });
        }
        console.log(time==1)
        
      })
      iteration+=iteration+1;
    },5000)
  }
  getMins(timeLeft: string | undefined): number {
    if (!timeLeft) return 0;
    
    if (timeLeft.includes("hours") || timeLeft.includes("hour")) {
      if (timeLeft.includes("mins") || timeLeft.includes("min")) {
        const timeLeftArr = timeLeft.split(" ");
        return (parseInt(timeLeftArr[0]) * 60) + parseInt(timeLeftArr[2]);
      }
      const timeLeftArr = timeLeft.split(" ");
      return parseInt(timeLeftArr[0]) * 60;
    } 
    
    if (timeLeft.includes("mins") || timeLeft.includes("min")) {
      const timeLeftArr = timeLeft.split(" ");
      return parseInt(timeLeftArr[0]);
    }
    
    return 0;
  }
  goBack(){
    history.go(-2);
  }
  dateAdd(date:Date, interval:string, units:number) {
    if(!(date instanceof Date))
      return undefined;
    var ret:Date | undefined = new Date(date); //don't change original date
    var checkRollover = function() { if(ret!.getDate() != date.getDate()) ret!.setDate(0);};
    switch(String(interval).toLowerCase()) {
      case 'year'   :  ret.setFullYear(ret.getFullYear() + units); checkRollover();  break;
      case 'quarter':  ret.setMonth(ret.getMonth() + 3*units); checkRollover();  break;
      case 'month'  :  ret.setMonth(ret.getMonth() + units); checkRollover();  break;
      case 'week'   :  ret.setDate(ret.getDate() + 7*units);  break;
      case 'day'    :  ret.setDate(ret.getDate() + units);  break;
      case 'hours'   :  ret.setTime(ret.getTime() + units*3600000);  break;
      case 'mins' :  ret.setTime(ret.getTime() + units*60000);  break;
      case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
      default       :  ret = undefined;  break;
    }
    return ret;
  }

  ngOnInit(): void {
    // Request notification permission on component init
    Notification.requestPermission();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearIntervals();
    this.WebSocketAPI?._disconnect();
  }

  private clearIntervals(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.driverLocationInterval) {
      clearInterval(this.driverLocationInterval);
    }
  }

  private initializeWebSocketConnection(map: google.maps.Map): void {
    if (!this.id) return;
    
    const interval = setInterval(() => {
      try {
        this.WebSocketAPI._send(`/app/cabdata/${this.id}`);
        const cabdetails = this.WebSocketAPI?.result as Cabdata | undefined;
        
        if (!cabdetails) {
          console.warn('No cab details received');
          return;
        }

        switch (cabdetails.accepted) {
          case 'a1':
            this.handleAcceptedRide(cabdetails, map);
            clearInterval(interval);
            break;
          
          case 'a2':
            this.handleExistingAcceptedRide(map);
            clearInterval(interval);
            break;
          
          case 'd1':
            this.handleDeniedRide(cabdetails);
            clearInterval(interval);
            break;
            
          case 'd2':
            this.WebSocketAPI._disconnect();
            clearInterval(interval);
            break;
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        this.WebSocketAPI._disconnect();
        clearInterval(interval);
      }
    }, 4000);
  }

  private handleAcceptedRide(cabdetails: Cabdata, map: google.maps.Map): void {
    this.showNotification('Your driver has accepted your ride');
    cabdetails.accepted = 'a2';
    this.WebSocketAPI._disconnect();
    
    this.updateCabDetails(cabdetails)
      .then(() => this.getDriverLocation(map))
      .catch(error => console.error('Error updating cab details:', error));
  }

  private handleExistingAcceptedRide(map: google.maps.Map): void {
    this.WebSocketAPI._disconnect();
    this.getDriverLocation(map);
  }

  private handleDeniedRide(cabdetails: Cabdata): void {
    this.showNotification('Your driver has denied your ride');
    cabdetails.accepted = 'd2';
    this.WebSocketAPI._disconnect();
    this.updateCabDetails(cabdetails);
  }

  private showNotification(message: string): void {
    if (Notification.permission === 'granted') {
      new Notification('CabApp Update', {
        body: message,
        icon: 'https://cdn2.iconfinder.com/data/icons/travel-glyph-21/64/Taxi-car-cab-transport-transportation-512.png'
      });
    }
  }

  private updateCabDetails(cabdetails: Cabdata): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.http.put(`http://localhost:8080/insertCabDetails`, cabdetails)
          .subscribe({
            next: (response) => resolve(response),
            error: (error) => reject(error)
          });
      }, 500);
    });
  }
}
