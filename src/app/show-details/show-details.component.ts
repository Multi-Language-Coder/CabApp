import { HttpClient } from "@angular/common/http";
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Cabdata } from "../../environments/cabdata.interface";
import { WebSocketAPI } from "../WebSocketAPI.component";
import { GoogleMapsService } from "../google-maps.service";
import { Subject } from "rxjs";
import { environment } from "../../environments/environment";
import { TravelData } from "../../environments/traveldata.interface";
import { User } from "../../environments/user.interface";
import { Price } from "../../environments/priceCalc.interface";
import { TaxState } from "../../environments/taxes.interface";
import { Notification } from "../../environments/notifications.interface";
import { isPlatformBrowser } from "@angular/common";
import { GeocodeMaps } from "../insertcabdetails/insertcabdetails.component";
import { IFeature } from "../../environments/geoapify.interface";
@Component({
  selector: "app-show-details",
  standalone: false,
  templateUrl: "./show-details.component.html",
  styleUrl: "./show-details.component.css",
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
    fromLocation: "",
    toLocation: "",
    date: "",
    time: "",
    numpassengers: 1,
    ages: [0],
    driver: "Unknown",
    userrequested: "Unknown",
    cabid: -1,
    accepted: "pf",
    id: -2,
    status: "",
  };
  fromLoc!: google.maps.marker.AdvancedMarkerElement | null;
  toLoc!: google.maps.marker.AdvancedMarkerElement | null;
  id: number | undefined;
  WebSocketAPI: WebSocketAPI = new WebSocketAPI();
  directionsRenderer!: google.maps.DirectionsRenderer;
  directionsService!: google.maps.DirectionsService;
  distanceMatrix!: google.maps.DistanceMatrixService;
  geocoder!: google.maps.Geocoder;
  websocket!: WebSocketAPI;
  fromLocationCoords = {
    lat: 0,
    lng: 0,
  };
  toLocationCoord = {
    lat: 0,
    lng: 0,
  };
  //map!: google.maps.Map;
  referenceObj = new Date();
  distance: string | undefined;
  arrivalTime: Date = new Date();
  dropOffTime: Date = new Date();
  driverPos!: google.maps.LatLng | null;

  notifications = {
    fiveMinute: false,
    oneMinute: false,
  };
  travelMode!: google.maps.UnitSystem;
  pricing: number = 0;
  tax = 0;
  constructor(
    private googleMapsService: GoogleMapsService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.http
      .get<TaxState[]>(
        "https://gist.githubusercontent.com/suryadutta/2dcdb6f43c501835c64d12580c63f168/raw/5cf6255eea95356527db2468c164adad09e82c03/salesTaxByState.JSON"
      )
      .subscribe((arr) => {
        for (let stateTax of arr) {
          if (this.cabdata.fromLocation.includes(stateTax.Abbreviation)) {
            this.tax = stateTax["Local Tax Rate"];
          }
        }
        //this.directionsRenderer.setDirections(response)
      });
  }

  api_key = "677875d2dcd56002469145oand89e51";
  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      import("leaflet").then(L=>{
        const leafletModule =  L.default || L;
        (window as any).L = leafletModule;
        import("leaflet-routing-machine").then(()=>{
          import("leaflet-control-geocoder").then(()=>{
            const iconDefault = leafletModule.icon({
              iconUrl:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtc7mVH6hZXg3rdikngiEd_y734KZtGF51OQ&s",
            })
            leafletModule.Marker.prototype.options.icon = iconDefault;
            this.initMap(leafletModule);
          })
        });

      
      })
      

      // Patch global L before loading routing machine

      
    }
  }
  private map: any;
  async initMap(L: typeof import("leaflet")): Promise<void> {
    var southWest = new L.LatLng(24.52, -124.73);

    // Create the Northeast corner L.LatLng object
    var northEast = new L.LatLng(49.38, -66.95);
    var bounds = new L.LatLngBounds(southWest, northEast);
    this.map = L.map("showDetails")
      .setView([51.505, -0.09], 13)
      .fitBounds(bounds)
      .setMaxBounds(bounds);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(this.map);
    this.route.params.subscribe((params) => {
      this.id = parseInt(params["id"]);
      this.http
        .get<Cabdata>(environment.apiBaseUrl+"cab/" + this.id)
        .subscribe((val) => {
          this.cabdata = val;
          console.log(this.cabdata);
          (L as any).Routing.control({
            waypoints: [this.cabdata.fromLocation, this.cabdata.toLocation],

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
          });
          this.WebSocketAPI = new WebSocketAPI();
          this.websocket = new WebSocketAPI();
          this.acceptance = new WebSocketAPI();
          this.websckt(L);
          this.getDCD(L);
        });
    });
  }
  websckt(L: typeof import("leaflet")) {
    let alr = false;
    let routingControl: any;
    console.log("BIG SHOT");
    this.WebSocketAPI._connect("/topic/cabdata/{fleetId}").then(() => {
      let interval = setInterval(() => {
        this.WebSocketAPI._send(`/app/cabdata/${this.id!}`).then((val) => {
          console.log(val);
          if (val != null) {
            const result = JSON.parse(val as string) as Cabdata;
            console.log(result);
            this.cabdata = result;
            console.log(`From Location:`, result.fromLocation);
            console.log(`To Location:`, result.toLocation);
            console.log("From LocaAtion Coordinates:", this.fromLocationCoords);
            console.log("To Location Coordinates:", this.toLocationCoord);
            if (result != undefined) {
              this.http
                .get<GeocodeMaps[]>(
                  `https://geocode.maps.co/search?q=${result.fromLocation}&api_key=${this.api_key}`
                )
                .subscribe((fromLoc) => {
                  this.http
                    .get<GeocodeMaps[]>(
                      `https://geocode.maps.co/search?q=${result.toLocation}&api_key=${this.api_key}`
                    )
                    .subscribe((toLoc) => {
                      const startPoint = L.latLng(
                        parseFloat(fromLoc[0].lat),
                        parseFloat(fromLoc[0].lon)
                      );
                      const endPoint = L.latLng(
                        parseFloat(toLoc[0].lat),
                        parseFloat(toLoc[0].lon)
                      );
                      routingControl = L.Routing.control({
                        waypoints: [startPoint, endPoint],

                        routeWhileDragging: true,

                        showAlternatives: true,

                        geocoder: (L.Control as any).Geocoder.nominatim(),

                        lineOptions: {
                          styles: [
                            { color: "#007bff", opacity: 0.8, weight: 8 },
                          ],

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
                      }).addTo(this.map);
                      if (result.accepted == "a1") {
                        this.exists = true;
                        this.handleAcceptedRide(result, this.map, L);
                      } else if (
                        result.accepted == "a2" &&
                        this.exists != true
                      ) {
                        this.exists = true;
                        this.handleExistingAcceptedRide(this.map, L);
                      } else if (result.accepted == "d1") {
                        this.handleDeniedRide(result);
                      } else if (result.accepted == "d2") {
                        this.exists = false;
                      } else {
                      }
                      /*this.directionsService.route({
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
            })*/
                    });
                });
              //this.map.removeControl(routingControl)
            }
          }
        });
      }, 5000);
    });
  }
  findUnitSystem(unitSystem: string) {
    switch (unitSystem) {
      case "IMPERIAL":
        return google.maps.UnitSystem.IMPERIAL;
      case "METRIC":
        return google.maps.UnitSystem.METRIC;
      default:
        return google.maps.UnitSystem.IMPERIAL;
    }
  }
  changeRoute(travelMode: google.maps.UnitSystem) {
    let taxRate = 0;
    this.directionsService.route(
      {
        origin: this.cabdata.fromLocation,
        destination: this.cabdata.toLocation,
        unitSystem: travelMode,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status == "OK") {
          let price: Price;
          this.distance = response?.routes[0].legs[0].distance?.text;
          this.http
            .get<TaxState[]>(
              "https://gist.githubusercontent.com/suryadutta/2dcdb6f43c501835c64d12580c63f168/raw/5cf6255eea95356527db2468c164adad09e82c03/salesTaxByState.JSON"
            )
            .subscribe((arr) => {
              for (let stateTax of arr) {
                if (this.cabdata.fromLocation.includes(stateTax.Abbreviation)) {
                  price = new Price(
                    response?.routes[0].legs[0].distance?.value!,
                    1 + stateTax["Combined Tax Rate"]!
                  );
                  break;
                }
              }
              this.pricing = price.getEstFare();
              //this.directionsRenderer.setDirections(response)
            });
        }
      }
    );
  }
  recieved = {
    got5min: false,
    got1min: false,
  };
  toString(number: number | undefined) {
    return "" + number;
  }
  getDCD(L: typeof import("leaflet")) {
    const fromLocation = `q=${this.cabdata.fromLocation.replaceAll(
      " ",
      "+"
    )}&format=json`;
    const toLocation = `q=${this.cabdata.toLocation.replaceAll(
      " ",
      "+"
    )}&format=json`;
    this.http
      .get<IFeature[]>(
        `https://api.geoapify.com/v1/geocode/search?$search=${fromLocation}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`
      )
      .subscribe((fromCoords) => {
        this.http
          .get<NominatimGeocoder[]>(
            `https://api.geoapify.com/v1/geocode/search?$search=${toLocation}&format=json&apiKey=2b50b749fdf94d9a9688dd81bdeed459`
          )
          .subscribe((toCoords) => {
            const cabdataTime = this.cabdata.time.split(":");
            const referenceObj = new Date();
            referenceObj.setHours(
              parseInt(cabdataTime[0]),
              parseInt(cabdataTime[1])
            );
            let price: Price;
            console.log(fromCoords);
            const distanceCoords = `${fromCoords[0].lon},${fromCoords[0].lat};${toCoords[0].lon},${toCoords[0].lat}`;
            this.http
              .get<NominatimDistanceMatrix>(
                `https://router.project-osrm.org/table/v1/driving/${distanceCoords}?annotations=distance`
              )
              .subscribe((distance) => {
                price = new Price(distance.distances[0][1], 1 + this.tax);
                this.pricing = price.getEstFare();
                this.distance = `${(distance.distances[0][1] / 1609).toFixed(
                  2
                )} Miles`;
              });
          });
      });
    /*this.directionsService.route(
      {
        origin: this.cabdata.fromLocation,
        destination: this.cabdata.toLocation,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status == "OK") {
          const cabdataTime = this.cabdata.time.split(":");
          const referenceObj = new Date();
          referenceObj.setHours(
            parseInt(cabdataTime[0]),
            parseInt(cabdataTime[1])
          );
          console.log(referenceObj);
          let price: Price;
          this.distance = result?.routes[0].legs[0].distance?.text;
          const durations = result?.routes[0].legs[0].duration!.text.split(" ");
          this.dropOffTime = this.dateAdd(
            referenceObj,
            durations![1],
            parseInt(durations![0])
          )!;
          this.http
            .get<TaxState[]>(
              "https://gist.githubusercontent.com/suryadutta/2dcdb6f43c501835c64d12580c63f168/raw/5cf6255eea95356527db2468c164adad09e82c03/salesTaxByState.JSON"
            )
            .subscribe((arr) => {
              for (let stateTax of arr) {
                if (this.cabdata.fromLocation.includes(stateTax.Abbreviation)) {
                  price = new Price(
                    result?.routes[0].legs[0].distance?.value!,
                    1 + stateTax["Combined Tax Rate"]!
                  );
                  break;
                }
              }
              this.pricing = price.getEstFare();
              //this.directionsRenderer.setDirections(response)
            });
        }
      }
    );*/
  }
  set0(string: string) {
    if (string.length == 1) {
      return "0" + string;
    } else {
      return string;
    }
  }

  getDriverLocation(map: google.maps.Map, L: typeof import("leaflet")) {
    let iteration = 0;
    this.toLoc = null;
    this.fromLoc = null;
    this.directionsRenderer.setMap(map);
    this.acceptance._connect("/topic/getAcceptance/{id}");
    this.websocket._connect("/topic/driverLocation/{driver}");
    let driver: google.maps.marker.AdvancedMarkerElement;
    let user: google.maps.marker.AdvancedMarkerElement;
    let endLoc: google.maps.marker.AdvancedMarkerElement;
    setTimeout(() => {
      const interval = setInterval(() => {
        if (this.exists) {
          this.acceptance
            ._send(`/app/getAcceptance/${this.id}`)
            .then((val) => {
              val = val as string;
              if ((val as string).includes("d") || this.cabdata.accepted.includes("d")) {
                clearInterval(interval);
                driver.position = { lat: 0, lng: 0 };
              } else {
                this.websocket
                  ._send<string>(`/app/driverLocation/${this.driver.username}`)
                  .then((val: string) => {
                    if (val != null) {
                      const positionString: any[] = val
                        .replace("[", "")
                        .replace("]", "")
                        .split(",");
                      for (let i = 0; i < positionString.length; i++) {
                        positionString[i] = parseFloat(positionString[i]);
                      }
                      const positionArr: number[] = positionString as number[];
                      console.log(positionArr);
                      let position = new google.maps.LatLng(
                        positionArr[0],
                        positionArr[1]
                      );
                      this.driverPos = position;
                      //let userpos = new google.maps.LatLng(this.cabdata.fromLocation)

                      if (iteration == 1) {
                        const image = document.createElement("div");
                        let img =
                          "<img src='https://d1a3f4spazzrp4.cloudfront.net/car-types/map70px/map-uberx.png' width='32' height='32' style='margin:0; padding:0;'/>";
                        image.innerHTML = img;
                        console.log(this.driver);

                        driver = new google.maps.marker.AdvancedMarkerElement({
                          position: position,
                          title: "Driver",
                          map: map,
                          content: image,
                        });
                        console.log(driver.position);
                        this.directionsService.route(
                          {
                            origin: position,
                            destination: this.cabdata.toLocation,
                            travelMode: google.maps.TravelMode.DRIVING,
                            waypoints: [
                              {
                                location: this.cabdata.fromLocation,
                                stopover: true,
                              },
                            ],
                          },
                          (result, status) => {
                            const directions = document.getElementById(
                              "directions"
                            ) as HTMLElement;
                            //directions.innerHTML=""
                            const steps = result!.routes[0].legs[0].steps;
                            const travelDatas: TravelData[] = [];
                            for (const step of steps) {
                              const travelData: TravelData = {
                                distance: this.travelDataConv(
                                  "distance",
                                  step.distance!.value,
                                  google.maps.UnitSystem.IMPERIAL
                                )!,
                                duration: this.travelDataConv(
                                  "time",
                                  step.duration!.value
                                )!,
                                instructions: step.instructions,
                                maneuver: step.maneuver,
                              };
                              const tr = document.createElement("tr");
                              tr.innerHTML = `
                      <td>${travelData.distance}</td>
                      <td>${travelData.duration}</td>
                      <td>${travelData.instructions}</td>
                    `;
                              travelDatas.push(travelData);
                              console.log(step.maneuver);
                              //directions.appendChild(tr);
                            }
                          }
                        );
                        this.getDCD(L);
                      } else if (iteration > 1) {
                        driver!.position = {
                          lat: position.lat(),
                          lng: position.lng(),
                        };
                        this.getDCD(L);
                      }
                      if (this.cabdata.accepted.includes("d")) {
                        clearInterval(interval);
                        driver!.position = { lat: 34.0479, lng: 100.6197 };
                      }
                      const distanceRequest: google.maps.DistanceMatrixRequest =
                        {
                          origins: [position],
                          destinations: [this.cabdata.fromLocation],
                          travelMode: google.maps.TravelMode.DRIVING,
                        };

                      this.distanceMatrix.getDistanceMatrix(
                        distanceRequest,
                        (response) => {
                          console.log(
                            response?.rows[0].elements[0].duration.text
                          );
                          const time = this.getMins(
                            response?.rows[0].elements[0].duration.text
                          );
                          if (
                            (time! == 6 || time! == 5 || time! == 4) &&
                            this.recieved.got5min == false
                          ) {
                            this.recieved.got5min = true;
                            console.log(this.recieved);
                            //const img = "https://cdn2.iconfinder.com/data/icons/travel-glyph-21/64/Taxi-car-cab-transport-transportation-512.png";
                            const text = `Your driver is 5 minutes away`;
                            const noti = this.showNotification("info", text);
                          }
                          if (time == 1 && this.recieved.got1min != true) {
                            this.recieved.got1min = true;
                            //const img = "https://cdn2.iconfinder.com/data/icons/travel-glyph-21/64/Taxi-car-cab-transport-transportation-512.png";
                            const text = `Your driver is 1 minute away`;
                            const note = this.showNotification("info", text);
                          }
                          console.log(time == 1);
                        }
                      );
                      iteration += iteration + 1;
                    } else {
                      clearInterval(interval);
                    }
                  });
              }
            });
        }
      }, 4000);
    }, 300);
  }
  exNoti() {
    const list = [
      {
        type: "fault",
        message: "Sans is gonna give you a bad time",
        keyId: 1,
      },
      {
        type: "fault",
        message:
          "Undyne says you're gonna have to try a little harder than that",
        keyId: 1,
      },
      {
        type: "info",
        message: "Papyrus still believes in you",
        keyId: 1,
      },
      ,
      {
        type: "fault",
        message: "Alphys is scared of your actions",
        keyId: 1,
      },
      ,
      {
        type: "fault",
        message: "Toriel thinks you hate her",
        keyId: 1,
      },
      ,
      {
        type: "info",
        message: "Asgore wonders who you are",
        keyId: 1,
      },
    ];
    const elToPush: Notification =
      list[Math.floor(Math.random() * list.length)]!;
    this.notificationsBar.push(elToPush);
  }
  acceptance!: WebSocketAPI;
  getMins(timeLeft: string | undefined): number {
    if (!timeLeft) return 0;

    if (timeLeft.includes("hours") || timeLeft.includes("hour")) {
      if (timeLeft.includes("mins") || timeLeft.includes("min")) {
        const timeLeftArr = timeLeft.split(" ");
        return parseInt(timeLeftArr[0]) * 60 + parseInt(timeLeftArr[2]);
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

  travelDataConv(
    type: string,
    value: number,
    unitSystem?: google.maps.UnitSystem
  ) {
    type = type.toLowerCase();
    if (type == "time") {
      //var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
      const numminutes = Math.floor((((value % 31536000) % 86400) % 3600) / 60);
      const numseconds = (((value % 31536000) % 86400) % 3600) % 60;
      return (
        /*numhours + " hours " + */ numminutes +
        " minutes " +
        numseconds +
        " seconds"
      );
    } else if (type == "distance") {
      if (unitSystem == google.maps.UnitSystem.METRIC && value < 1000) {
        return value + " meters";
      } else if (unitSystem == google.maps.UnitSystem.METRIC && value >= 1000) {
        const kms = (value / 1000).toFixed(2);
        return kms + " kilometers";
      } else if (unitSystem == google.maps.UnitSystem.IMPERIAL) {
        const feet = value * 3.281;
        if (feet < 528) {
          return feet.toFixed(0) + " feet";
        } else if (feet >= 5280) {
          return (feet / 5280).toFixed(2) + " miles";
        } else {
          return (feet / 5280).toFixed(2) + " mile";
        }
      }
    } else {
      return "Please return the following (Not case sensitive): Time, Distance";
    }
    return "Invalid Response";
  }

  dateAdd(date: Date, interval: string, units: number) {
    if (!(date instanceof Date)) return undefined;
    var ret: Date | undefined = new Date(date); //don't change original date
    var checkRollover = function () {
      if (ret!.getDate() != date.getDate()) ret!.setDate(0);
    };
    switch (String(interval).toLowerCase()) {
      case "year":
        ret.setFullYear(ret.getFullYear() + units);
        checkRollover();
        break;
      case "quarter":
        ret.setMonth(ret.getMonth() + 3 * units);
        checkRollover();
        break;
      case "month":
        ret.setMonth(ret.getMonth() + units);
        checkRollover();
        break;
      case "week":
        ret.setDate(ret.getDate() + 7 * units);
        break;
      case "day":
        ret.setDate(ret.getDate() + units);
        break;
      case "hours":
        ret.setTime(ret.getTime() + units * 3600000);
        break;
      case "mins":
        ret.setTime(ret.getTime() + units * 60000);
        break;
      case "second":
        ret.setTime(ret.getTime() + units * 1000);
        break;
      default:
        ret = undefined;
        break;
    }
    return ret;
  }

  notificationsBar: Notification[] = [
    {
      type: "success",
      message: "rehehehe",
      keyId: Date.now(),
    },
  ];
  trackByNotificationId(index: number, notification: Notification): number {
    return notification.keyId || index;
  }
  ngOnInit(): void {
    const badge = document.querySelector(".notification-badge") as HTMLElement;
    if (badge) {
      badge.textContent = this.notificationsBar.length.toString();
      badge.style.display =
        this.notificationsBar.length > 0 ? "inline-block" : "none";
    }

    const list = document.querySelector("#noti-list");
    const toggleButton = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar1");
    const mainContent = document.getElementById("main-content");

    toggleButton?.addEventListener("click", () => {
      sidebar?.classList.toggle("collapsed");
      mainContent?.classList.toggle("collapsed");
    });
    const notificationButton = document.getElementById("notification-button");
    const notificationList = document.getElementById("notification-list");
    const notificationBadge = document.querySelector(".notification-badge"); // Get the badge

    if (notificationButton && notificationList && notificationBadge) {
      //check for null
      notificationButton.addEventListener("click", () => {
        notificationList.style.display = "block";
        notificationList.style.opacity = "1";
        notificationList.style.transform = "translateY(0)";
      });

      // Close the dropdown when clicking outside
      document.addEventListener("click", (event) => {
        if (
          !notificationList.contains(event.target as Node) &&
          event.target !== notificationButton
        ) {
          notificationList.style.display = "none";
          notificationList.style.opacity = "0";
          notificationList.style.transform = "translateY(-10px)";
        }
      });

      // Add dismiss functionality
      const ulList = document.getElementById("noti-list") as HTMLUListElement;
      ulList.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        console.log(target, this.notificationsBar);
        if (target.tagName === "BUTTON") {
          const listItem = target.parentElement;
          if (listItem) {
            //listItem.remove();
            this.notificationsBar.forEach((noti) => {
              console.log(
                noti.keyId,
                parseInt(target.id),
                noti.keyId == parseInt(target.id)
              );
              if (noti.keyId == parseInt(target.id)) {
                this.notificationsBar.splice(
                  this.notificationsBar.indexOf(noti),
                  1
                );
              }
            });
            updateBadgeCount();
          }
        }
      });
      // Function to update the badge count
      const updateBadgeCount = () => {
        const notifications = this.notificationsBar;
        const count = notifications.length;
        notificationBadge!.textContent = count > 0 ? "" + count : "";
        (notificationBadge as HTMLSpanElement)!.style.display =
          count > 0 ? "inline-block" : "none";
        if (count === 0) {
          notificationList!.style.display = "none";
          notificationList!.style.opacity = "0";
        } else {
          notificationList!.style.display = "block";
          notificationList!.style.opacity = "1";
        }
      };
      updateBadgeCount(); //call
    } else {
      console.error("Notification button or list element not found!");
    }
    list?.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).tagName == "BUTTON") {
        const targetElement = event.target as HTMLElement;
        const parentElement = targetElement.parentElement;
        if (parentElement) {
          const index = this.notificationsBar.findIndex(
            (notification) =>
              notification.type === parentElement.children[1].id &&
              notification.message === parentElement.children[1].textContent
          );
          if (index !== -1) {
            this.notificationsBar.splice(index, 1);
            // Update badge after removing notification
            const badge = document.querySelector(
              ".notification-badge"
            ) as HTMLElement;
            if (badge) {
              badge.textContent = this.notificationsBar.length.toString();
              badge.style.display =
                this.notificationsBar.length > 0 ? "inline-block" : "none";
            }
          }
        }
      }
    });
    Notification.requestPermission();
  }

  ngOnDestroy(): void {
    const toggleButton = document.getElementById("toggleSidebar");
    toggleButton?.removeEventListener("click", () => {});
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

  private initializeWebSocketConnection(
    map: google.maps.Map,
    L: typeof import("leaflet")
  ): void {
    if (!this.id) return;

    const interval = setInterval(() => {
      try {
        this.WebSocketAPI._send(`app/cabdata/${this.id}`);
        const cabdetails = this.WebSocketAPI?.result as Cabdata | undefined;

        if (!cabdetails) {
          console.warn("No cab details received");
          return;
        }

        switch (cabdetails.accepted) {
          case "a1":
            this.handleAcceptedRide(cabdetails, map, L);
            clearInterval(interval);
            break;

          case "a2":
            this.handleExistingAcceptedRide(map, L);
            clearInterval(interval);
            break;

          case "d1":
            this.handleDeniedRide(cabdetails);
            clearInterval(interval);
            break;

          case "d2":
            clearInterval(interval);
            break;
        }
      } catch (error) {
        console.error("WebSocket error:", error);
        this.WebSocketAPI._disconnect();
        clearInterval(interval);
      }
    }, 4000);
  }

  private handleAcceptedRide(
    cabdetails: Cabdata,
    map: google.maps.Map,
    L: typeof import("leaflet")
  ): void {
    this.exists = true;
    this.showNotification("success", "Your driver has accepted your ride");
    cabdetails.accepted = "a2";
    this.http
      .get<User>(environment.apiBaseUrl+"user1/" + cabdetails.driver)
      .subscribe((user) => {
        user.imageLink = environment.apiBaseUrl+`image/${user.imageLink}`;
        this.driver = user;
      });
    this.updateCabDetails(cabdetails)
      .then(() => this.getDriverLocation(map, L))
      .catch((error) => console.error("Error updating cab details:", error));
  }

  private handleExistingAcceptedRide(
    map: google.maps.Map,
    L: typeof import("leaflet")
  ): void {
    this.exists = true;
    this.http
      .get<User>(environment.apiBaseUrl+"user1/" + this.cabdata.driver)
      .subscribe((user) => {
        user.imageLink = environment.apiBaseUrl+`image/${user.imageLink}`;
        this.driver = user;
      });
    this.getDriverLocation(map, L);
  }

  private handleDeniedRide(
    cabdetails: Cabdata,
    d?: google.maps.marker.AdvancedMarkerElement
  ): void {
    this.showNotification("fault", "Your driver has denied your ride");
    cabdetails.accepted = "d2";
    this.exists = false;
    this.driverPos = null;
    //this.WebSocketAPI._disconnect();
    this.updateCabDetails(cabdetails);
  }

  private showNotification(type: string, message: string): void {
    this.notificationsBar.push({
      type,
      message,
      keyId: Date.now(),
    });

    // Update badge immediately after adding notification
    const badge = document.querySelector(".notification-badge") as HTMLElement;
    if (badge) {
      badge.textContent = this.notificationsBar.length.toString();
      badge.style.display = "inline-block";
    }
  }

  timeFromTimestamp(timestamp: number) {
    const date = new Date(timestamp);

    // Use toLocaleTimeString() to get the current time in the user's locale
    const timeString = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // Use 12-hour format with AM/PM
    });

    return timeString;
  }

  private updateCabDetails(cabdetails: Cabdata): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.http
          .put(environment.apiBaseUrl+`insertCabDetails`, cabdetails)
          .subscribe({
            next: (response) => resolve(response),
            error: (error) => reject(error),
          });
      }, 500);
    });
  }
}

interface param {
  model: string;
  make: string;
  year: number;
}
export interface NominatimGeocoder {
  lat: number;
  lon: number;
}
export interface NominatimDistanceMatrix {
  code: string;
  distances: number[][];
  sources_to_targets: dist[][];
}
interface dist {
  distance: number;
  time: number;
  source_index: number;
  target_index: number;
}
