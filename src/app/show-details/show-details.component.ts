import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Cabdata } from '../../environments/cabdata.interface';
import { WebSocketAPI } from '../WebSocketAPI.component';
import { GoogleMapsService } from '../google-maps.service';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { TravelData } from '../../environments/traveldata.interface';
import { User } from '../../environments/user.interface';
import { Price } from '../../environments/priceCalc.interface';
import { TaxState } from '../../environments/taxes.interface';
import { Notification } from '../../environments/notifications.interface';
import { isPlatformBrowser } from '@angular/common';
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
  driver = {
    name: "",
    carType: "",
    imageLink: "",
    username: "",
  };
  exists = false;
  cabdata: Cabdata = {
    fromLocation: '',
    toLocation: '',
    date: '',
    time: '',
    numpassengers: 1,
    ages: [0],
    driver: 'Unknown',
    userrequested: 'Unknown',
    cabid: -1,
    accepted: 'pf',
    id: -2,
    status: ''
  };
  fromLoc!: google.maps.marker.AdvancedMarkerElement | null;
  toLoc!: google.maps.marker.AdvancedMarkerElement | null;
  id: number | undefined;
  WebSocketAPI: WebSocketAPI= new WebSocketAPI();
  directionsRenderer!: google.maps.DirectionsRenderer;
  directionsService!: google.maps.DirectionsService;
  distanceMatrix!: google.maps.DistanceMatrixService;
  geocoder!: google.maps.Geocoder;
  websocket!: WebSocketAPI;
  fromLocationCoords = {
    lat: 0,
    lng: 0
  }
  toLocationCoord = {
    lat: 0,
    lng: 0
  }
  //map!: google.maps.Map;
  referenceObj = new Date();
  distance: string | undefined;
  arrivalTime: Date = new Date();
  dropOffTime: Date = new Date();
  driverPos!: google.maps.LatLng | null;

  notifications = {
    fiveMinute: false,
    oneMinute: false
  };
  travelMode!: google.maps.UnitSystem;
  pricing: number = 0;
  constructor(private googleMapsService: GoogleMapsService,@Inject(PLATFORM_ID) private platformId: Object, private route: ActivatedRoute, private http: HttpClient) {

  }
  api_key = environment.googleMapsApiKey;
  async ngAfterViewInit(): Promise<void> {
    /*this.googleMapsService
      .loadGoogleMaps(this.api_key)
      .then(() => {
        this.initializeMap();
      })
      .catch((error) => console.error('Error loading Google Maps:', error));*/
      if (isPlatformBrowser(this.platformId)) {
      
          const leafletModule = await import('leaflet');
      
          // Patch global L before loading routing machine
      
          (window as any).L = leafletModule;
      
          await import('leaflet-routing-machine');
      
          await import('leaflet-control-geocoder');
      
          this.initMap(leafletModule);
          this.websckt()
      }
      
  }
  private map:any;
  async initMap(L: typeof import('leaflet')): Promise<void>{
    this.map = L.map('showDetails').setView([51.505, -0.09], 13);
    
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    
          attribution: '&copy; OpenStreetMap contributors'
    
        }).addTo(this.map)
  }
  websckt() {
    let alr = false;
console.log("BIG SHOT")
    this.WebSocketAPI._connect("/topic/cabdata/{fleetId}").then(()=>{
      let interval = setInterval(() => {
      
      this.WebSocketAPI._send(`/app/cabdata/${this.id!}`).then((val)=>{
        console.log(val)
        if (val != null) {
          const result = (JSON.parse(val) as Cabdata);
          console.log(result)
          this.cabdata = result;
          console.log(`From Location:`,result.fromLocation)
          console.log(`To Location:`,result.toLocation)
          console.log("From LocaAtion Coordinates:", this.fromLocationCoords);
          console.log("To Location Coordinates:", this.toLocationCoord);
          /*if (result != undefined) {
            this.directionsService.route({
              origin: result.fromLocation,
              destination: result.toLocation,
              travelMode: google.maps.TravelMode.DRIVING
            }, (results, stat) => {
              if (stat == "OK") {
              this.directionsRenderer.setDirections(results)
                if (!alr) {
                  setTimeout(()=>{
                    const bounds: google.maps.LatLngBounds = new google.maps.LatLngBounds();
                  bounds.union(results?.routes[0].bounds!)
                  bounds.extend(this.fromLocationCoords)
                  bounds.extend(this.toLocationCoord)
                  google.maps.event.addListenerOnce(this.map, 'idle', ()=>{
                    this.map.fitBounds(bounds)
                  })
                  this.map.fitBounds(bounds)
                  alr = true
                  },200)
                }
              }
            })
            if (result.accepted == "a1") {
              this.exists = true;
              this.handleAcceptedRide(result, this.map)
            } else if (result.accepted == "a2" && this.exists != true) {
              this.exists = true;
              this.handleExistingAcceptedRide(this.map);
            } else if (result.accepted == "d1") {
              this.handleDeniedRide(result)
            } else if (result.accepted == "d2") {
              this.exists = false;
            } else {
  
            }
          }*/        }
      })
      
    }, 5000)
    });
    
  }
  findUnitSystem(unitSystem: string) {
    switch (unitSystem) {
      case "IMPERIAL":
        return google.maps.UnitSystem.IMPERIAL
      case "METRIC":
        return google.maps.UnitSystem.METRIC;
      default:
        return google.maps.UnitSystem.IMPERIAL;
    }
  }
  changeRoute(travelMode: google.maps.UnitSystem) {
    let taxRate = 0;
    this.directionsService.route({
      origin: this.cabdata.fromLocation,
      destination: this.cabdata.toLocation,
      unitSystem: travelMode,
      travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
      if (status == "OK") {
        let price: Price;
        this.distance = response?.routes[0].legs[0].distance?.text;
        this.http.get<TaxState[]>("https://gist.githubusercontent.com/suryadutta/2dcdb6f43c501835c64d12580c63f168/raw/5cf6255eea95356527db2468c164adad09e82c03/salesTaxByState.JSON").subscribe((arr) => {
          for (let stateTax of arr) {
            if (this.cabdata.fromLocation.includes(stateTax.Abbreviation)) {
              price = new Price(response?.routes[0].legs[0].distance?.value!, 1 + stateTax["Combined Tax Rate"]!)
              break;
            }
          }
          this.pricing = price.getEstFare();
          //this.directionsRenderer.setDirections(response)
        })
      }
    })
  }
  recieved = {
    got5min: false,
    got1min: false
  }
  toString(number: number | undefined) {
    return "" + number;
  }
  getDCD() {
    this.directionsService.route({
      origin: this.cabdata.fromLocation,
      destination: this.cabdata.toLocation,
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status == "OK") {
        const cabdataTime = this.cabdata.time.split(":")
        const referenceObj = new Date();
        referenceObj.setHours(parseInt(cabdataTime[0]), parseInt(cabdataTime[1]));
        console.log(referenceObj)
        let price: Price;
        this.distance = result?.routes[0].legs[0].distance?.text;
        const durations = result?.routes[0].legs[0].duration!.text.split(" ")
        this.dropOffTime = this.dateAdd(referenceObj, durations![1], parseInt(durations![0]))!;
        this.http.get<TaxState[]>("https://gist.githubusercontent.com/suryadutta/2dcdb6f43c501835c64d12580c63f168/raw/5cf6255eea95356527db2468c164adad09e82c03/salesTaxByState.JSON").subscribe((arr) => {
          for (let stateTax of arr) {
            if (this.cabdata.fromLocation.includes(stateTax.Abbreviation)) {
              price = new Price(result?.routes[0].legs[0].distance?.value!, 1 + stateTax["Combined Tax Rate"]!)
              break;
            }
          }
          this.pricing = price.getEstFare();
          //this.directionsRenderer.setDirections(response)
        })
      }
    })
  }
  set0(string: string) {
    if (string.length == 1) {
      return "0" + string
    } else {
      return string;
    }
  }

  getDriverLocation(map: google.maps.Map) {
    let iteration = 0;
    this.toLoc = null;
    this.fromLoc = null;
    this.directionsRenderer.setMap(map)
    this.acceptance._connect("/topic/getAcceptance/{id}")
    this.websocket._connect("/topic/driverLocation/{driver}")
    let driver: google.maps.marker.AdvancedMarkerElement;
    let user: google.maps.marker.AdvancedMarkerElement;
    let endLoc: google.maps.marker.AdvancedMarkerElement;
    setTimeout(() => {
      const interval = setInterval(() => {
        if (this.exists) {
          this.acceptance._send(`/app/getAcceptance/${this.id}`).then((val:string)=>{
            if(val.includes("d") || this.cabdata.accepted.includes("d")){
              clearInterval(interval)
              driver.position = {lat:0, lng:0}
            } else{
              this.websocket._send<string>(`/app/driverLocation/${this.driver.username}`).then((val:string)=>{
                if (val != null) {
                  const positionString:any[] = val.replace("[","").replace("]","").split(",");
                  for(let i = 0; i < positionString.length; i++){
                    positionString[i] = parseFloat(positionString[i]);
                  }
                  const positionArr: number[] = (positionString as number[]);
                  console.log(positionArr)
                  let position = new google.maps.LatLng(positionArr[0], positionArr[1])
                  this.driverPos = position;
                  //let userpos = new google.maps.LatLng(this.cabdata.fromLocation)
      
                  if (iteration == 1) {
                    const image = document.createElement("div");
                    let img = "<img src='https://d1a3f4spazzrp4.cloudfront.net/car-types/map70px/map-uberx.png' width='32' height='32' style='margin:0; padding:0;'/>";
                    image.innerHTML = img;
                    console.log(this.driver)
      
                    driver = new google.maps.marker.AdvancedMarkerElement({
                      position: position,
                      title: 'Driver',
                      map: map,
                      content: image
                    })
                    console.log(driver.position)
                    this.directionsService.route({
                      origin: position,
                      destination: this.cabdata.toLocation,
                      travelMode: google.maps.TravelMode.DRIVING,
                      waypoints: [{
                        location: this.cabdata.fromLocation,
                        stopover: true
                      }],
                    }, (result, status) => {
                      const directions = (document.getElementById("directions") as HTMLElement);
                      //directions.innerHTML=""
                      const steps = result!.routes[0].legs[0].steps;
                      const travelDatas: TravelData[] = [];
                      for (const step of steps) {
                        const travelData: TravelData = {
                          distance: this.travelDataConv("distance", step.distance!.value, google.maps.UnitSystem.IMPERIAL)!,
                          duration: this.travelDataConv("time", step.duration!.value)!,
                          instructions: step.instructions,
                          maneuver: step.maneuver
                        }
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                      <td>${travelData.distance}</td>
                      <td>${travelData.duration}</td>
                      <td>${travelData.instructions}</td>
                    `
                        travelDatas.push(travelData)
                        console.log(step.maneuver)
                        //directions.appendChild(tr);
                      }
                    })
                    this.getDCD()
                  } else if (iteration > 1) {
                    driver!.position = { lat: position.lat(), lng: position.lng() }
                    this.getDCD()
                  }
                  if(this.cabdata.accepted.includes("d")){
                    clearInterval(interval);
                    driver!.position={lat:34.0479, lng:100.6197};
                  }
                  const distanceRequest: google.maps.DistanceMatrixRequest = {
                    origins: [position],
                    destinations: [this.cabdata.fromLocation],
                    travelMode: google.maps.TravelMode.DRIVING
                  }
      
                  this.distanceMatrix.getDistanceMatrix(distanceRequest, (response) => {
                    console.log(response?.rows[0].elements[0].duration.text)
                    const time = this.getMins(response?.rows[0].elements[0].duration.text);
                    if ((time! == 6 || time! == 5 || time! == 4) && this.recieved.got5min == false) {
                      this.recieved.got5min = true
                      console.log(this.recieved)
                      //const img = "https://cdn2.iconfinder.com/data/icons/travel-glyph-21/64/Taxi-car-cab-transport-transportation-512.png";
                      const text = `Your driver is 5 minutes away`;
                      const noti = this.showNotification("info", text);
                    }
                    if (time == 1 && this.recieved.got1min != true) {
                      this.recieved.got1min = true
                      //const img = "https://cdn2.iconfinder.com/data/icons/travel-glyph-21/64/Taxi-car-cab-transport-transportation-512.png";
                      const text = `Your driver is 1 minute away`;
                      const note = this.showNotification("info", text);
                    }
                    console.log(time == 1)
      
                  })
                  iteration += iteration + 1;
                } else {
                  clearInterval(interval);
                }
              });
            }
          })
          
        }
      }, 4000)
    }, 300)
  }
  exNoti(){
    const list = [
    {
      'type':'fault',
      'message':'Sans is gonna give you a bad time',
      keyId:1
    },
    {
      'type':'fault',
      'message':"Undyne says you're gonna have to try a little harder than that",
      keyId:1
    },
    {
      'type':'info',
      'message':'Papyrus still believes in you',
      keyId:1
    },
    ,
    {
      'type':'fault',
      'message':'Alphys is scared of your actions',
      keyId:1
    },
    ,
    {
      'type':'fault',
      'message':'Toriel thinks you hate her',
      keyId:1
    },
    ,
    {
      'type':'info',
      'message':'Asgore wonders who you are',
      keyId:1
    }]
    const elToPush:Notification = list[Math.floor(Math.random()*list.length)]!
    this.notificationsBar.push(elToPush)
  }
  acceptance!: WebSocketAPI;
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
  goBack() {
    history.go(-2);
  }

  travelDataConv(type: string, value: number, unitSystem?: google.maps.UnitSystem) {
    type = type.toLowerCase();
    if (type == "time") {
      //var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
      const numminutes = Math.floor((((value % 31536000) % 86400) % 3600) / 60);
      const numseconds = (((value % 31536000) % 86400) % 3600) % 60;
      return  /*numhours + " hours " + */numminutes + " minutes " + numseconds + " seconds";
    } else if (type == "distance") {
      if (unitSystem == google.maps.UnitSystem.METRIC && value < 1000) {
        return value + " meters"
      } else if (unitSystem == google.maps.UnitSystem.METRIC && value >= 1000) {
        const kms = (value / 1000).toFixed(2)
        return kms + " kilometers";
      } else if (unitSystem == google.maps.UnitSystem.IMPERIAL) {
        const feet = (value * 3.281)
        if (feet < 528) {
          return feet.toFixed(0) + " feet";
        } else if (feet >= 5280) {
          return (feet / 5280).toFixed(2) + " miles";
        } else {
          return (feet / 5280).toFixed(2) + " mile"
        }
      }
    } else {
      return "Please return the following (Not case sensitive): Time, Distance";
    }
    return "Invalid Response"
  }

  dateAdd(date: Date, interval: string, units: number) {
    if (!(date instanceof Date))
      return undefined;
    var ret: Date | undefined = new Date(date); //don't change original date
    var checkRollover = function () { if (ret!.getDate() != date.getDate()) ret!.setDate(0); };
    switch (String(interval).toLowerCase()) {
      case 'year': ret.setFullYear(ret.getFullYear() + units); checkRollover(); break;
      case 'quarter': ret.setMonth(ret.getMonth() + 3 * units); checkRollover(); break;
      case 'month': ret.setMonth(ret.getMonth() + units); checkRollover(); break;
      case 'week': ret.setDate(ret.getDate() + 7 * units); break;
      case 'day': ret.setDate(ret.getDate() + units); break;
      case 'hours': ret.setTime(ret.getTime() + units * 3600000); break;
      case 'mins': ret.setTime(ret.getTime() + units * 60000); break;
      case 'second': ret.setTime(ret.getTime() + units * 1000); break;
      default: ret = undefined; break;
    }
    return ret;
  }

  notificationsBar:Notification[] = [
    {
      type:'success',
      message:'rehehehe',
      keyId:Date.now()
    }
  ]
  trackByNotificationId(index: number, notification: Notification): number {
    return notification.keyId || index;
  }
  ngOnInit(): void {
    const badge = document.querySelector('.notification-badge') as HTMLElement;
    if (badge) {
      badge.textContent = this.notificationsBar.length.toString();
      badge.style.display = this.notificationsBar.length > 0 ? 'inline-block' : 'none';
    }

    const list = document.querySelector('#noti-list');
    const toggleButton = document.getElementById('toggleSidebar');
  const sidebar = document.getElementById('sidebar1');
  const mainContent = document.getElementById('main-content');

  toggleButton?.addEventListener('click', () => {
    sidebar?.classList.toggle('collapsed');
    mainContent?.classList.toggle('collapsed');
  });
  const notificationButton = document.getElementById('notification-button');
        const notificationList = document.getElementById('notification-list');
        const notificationBadge = document.querySelector('.notification-badge'); // Get the badge

        if (notificationButton && notificationList && notificationBadge) { //check for null
            notificationButton.addEventListener('click', () => {
                notificationList.style.display = "block";
                notificationList.style.opacity = "1";
                notificationList.style.transform = "translateY(0)";
            });

            // Close the dropdown when clicking outside
            document.addEventListener('click', (event) => {
                if (!notificationList.contains(event.target as Node) && event.target !== notificationButton) {
                    notificationList.style.display = "none";
                    notificationList.style.opacity = "0";
                    notificationList.style.transform = "translateY(-10px)";
                }
            });

             // Add dismiss functionality
            const ulList = (document.getElementById('noti-list') as HTMLUListElement);
            ulList.addEventListener('click', (event) => {
                const target = event.target as HTMLElement;
                console.log(target,this.notificationsBar)
                if (target.tagName === 'BUTTON') {
                    const listItem = target.parentElement;
                    if (listItem) {
                        //listItem.remove();
                        this.notificationsBar.forEach(noti =>{
                          console.log(noti.keyId, parseInt(target.id), noti.keyId == parseInt(target.id))
                          if(noti.keyId == parseInt(target.id)){
                            this.notificationsBar.splice(this.notificationsBar.indexOf(noti),1)
                          }
                        })
                        updateBadgeCount();
                    }
                }
            })
            // Function to update the badge count
            const updateBadgeCount = () => {
                const notifications = this.notificationsBar;
                const count = notifications.length;
                notificationBadge!.textContent = count > 0 ? ""+count : ''; 
                (notificationBadge as HTMLSpanElement)!.style.display = count > 0 ? 'inline-block' : 'none';
                if (count === 0) {
                  notificationList!.style.display = 'none';
                     notificationList!.style.opacity = "0";
                } else {
                  notificationList!.style.display = 'block';
                  notificationList!.style.opacity = "1";
                }
            }
            updateBadgeCount(); //call
        } else {
            console.error('Notification button or list element not found!');
        }
        list?.addEventListener('click', (event) => {
          if((event.target as HTMLElement).tagName == "BUTTON"){
            const targetElement = event.target as HTMLElement;
            const parentElement = targetElement.parentElement;
            if (parentElement) {
              const index = this.notificationsBar.findIndex(notification => 
                notification.type === parentElement.children[1].id &&
                notification.message === parentElement.children[1].textContent
              );
              if (index !== -1) {
                this.notificationsBar.splice(index, 1);
                // Update badge after removing notification
                const badge = document.querySelector('.notification-badge') as HTMLElement;
                if (badge) {
                  badge.textContent = this.notificationsBar.length.toString();
                  badge.style.display = this.notificationsBar.length > 0 ? 'inline-block' : 'none';
                }
              }
            }
          }
        })
    Notification.requestPermission();
  }

  ngOnDestroy(): void {
      const toggleButton = document.getElementById('toggleSidebar');
      toggleButton?.removeEventListener('click', () => {});
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
        this.WebSocketAPI._send(`app/cabdata/${this.id}`);
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
    this.exists = true;
    this.showNotification('success','Your driver has accepted your ride');
    cabdetails.accepted = 'a2';
    this.http.get<User>("http://localhost:8080/user1/" + cabdetails.driver).subscribe((user) => {
      this.driver = user;
    })
    this.updateCabDetails(cabdetails)
      .then(() => this.getDriverLocation(map))
      .catch(error => console.error('Error updating cab details:', error));
  }

  private handleExistingAcceptedRide(map: google.maps.Map): void {
    this.exists = true
    this.http.get<User>("http://localhost:8080/user1/" + this.cabdata.driver).subscribe((user) => {
      this.driver = user;
    })
    this.getDriverLocation(map);
  }

  private handleDeniedRide(cabdetails: Cabdata, d?:google.maps.marker.AdvancedMarkerElement): void {
    this.showNotification('fault','Your driver has denied your ride');
    cabdetails.accepted = 'd2';
    this.exists = false;
    this.driverPos = null;
    //this.WebSocketAPI._disconnect();
    this.updateCabDetails(cabdetails);
  }

  private showNotification(type: string, message: string): void {
    this.notificationsBar.push({
      type,
      message,
      keyId: Date.now()
    });
    
    // Update badge immediately after adding notification
    const badge = document.querySelector('.notification-badge') as HTMLElement;
    if (badge) {
      badge.textContent = this.notificationsBar.length.toString();
      badge.style.display = 'inline-block';
    }
  }

  timeFromTimestamp(timestamp:number) {
    const date = new Date(timestamp);
  
    // Use toLocaleTimeString() to get the current time in the user's locale
    const timeString = date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true // Use 12-hour format with AM/PM
    });
  
    return timeString;
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

interface param{
  model:string,
  make:string,
  year:number
}
