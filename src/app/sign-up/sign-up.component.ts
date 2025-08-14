import { Component } from "@angular/core";

import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { FormControl } from "@angular/forms";
import { environment } from "../../environments/environment";
import { User } from "../../environments/user.interface";
import { Region } from "../../environments/region.interface";
import { CityStateTown } from "../../environments/citystatetown.interface";

@Component({
  selector: "app-signup",
  standalone: false,
  templateUrl: "./sign-up.component.html",
  styleUrl: "./sign-up.component.css",
})
export class SignUpComponent {
  name = new FormControl("");
  username = new FormControl("");
  password = new FormControl("");
  email = new FormControl("");
  description = new FormControl("");
  number = new FormControl("")
  lastId: number = 0;
  lastIdMsg: number = 0;
  readableCSV(csv: string, delimiter: string) {
    const lines = csv.split('\n');
    const headers = lines[0].split(delimiter);
    const result = [];
    const uniqueCities = new Set();

    for (let i = 1; i < lines.length; i++) {
      const obj: any = {};
      const currentline = lines[i].split(delimiter);
      const cityName = currentline[headers.indexOf("City")];

      if (!uniqueCities.has(cityName)) {
        uniqueCities.add(cityName);
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentline[j];
        }
        result.push(obj);
      }
    }

    return result;
  }

  readableCSVData!: CityStateTown[];
  constructor(private http: HttpClient, private router: Router) {
    this.http.get("https://raw.githubusercontent.com/grammakov/USA-cities-and-states/refs/heads/master/us_cities_states_counties.csv", { responseType: 'text' }).subscribe((csv: string) => {
      this.readableCSVData = this.readableCSV(csv, "|");
    });

    this.http
      .get<Region[]>(
        "https://raw.githubusercontent.com/kimyu92/us_counties/refs/heads/main/src/counties_list.json"
      )
      .subscribe((val) => {
        this.counties = val;
      });
      this.http.get<number>(`${environment.apiBaseUrl}/count`).subscribe((num)=>{
        this.lastIdMsg = num+1;
      })
    this.http
      .get<number>(`${environment.apiBaseUrl}/countUsers`)
      .subscribe((count) => {
        this.lastId = count+1;
        (
          document.getElementById("roles") as HTMLSelectElement
        ).addEventListener("change", () => {
          if (
            (document.getElementById("roles") as HTMLSelectElement).value ==
            "true"
          ) {
            document.getElementById("stateDiv")!.style.display = "block";
            document.getElementById("townDiv")!.style.display = "block";
          } else {
            document.getElementById("stateDiv")!.style.display = "none";
            document.getElementById("townDiv")!.style.display = "none";
            (
              document.getElementById("stateDiv")! as HTMLSelectElement
            ).selectedIndex = 0;
            (
              document.getElementById("townDiv") as HTMLSelectElement
            ).selectedIndex = 0;
          }
        });
      });
    this.http
      .get<string[]>(
        "https://raw.githubusercontent.com/stdlib-js/datasets-us-states-names/refs/heads/main/data/data.json"
      )
      .subscribe((val) => {
        const states: HTMLOptionElement[] = [];
        for (const state of val) {
          const optionEl = document.createElement("option");
          optionEl.textContent = state;
          states.push(optionEl);
        }
        console.log(states);
        setTimeout(() => {
          this.http
            .get(
              "https://raw.githubusercontent.com/aruljohn/us-states/refs/heads/master/states.json",
              { responseType: "json" }
            )
            .subscribe((val) => {
              const keys = Object.keys(val);
              for (let i = 0; i < keys.length; i++) {
                if (states[i]) {
                  states[i].value = keys[i];
                }
              }
              for (const state of states) {
                document.getElementById("states")?.appendChild(state);
              }
            });
        }, 1000);
      });
  }

  onSubmit() {
    // Basic validation
    if (
      !this.name.value ||
      !this.username.value ||
      !this.password.value ||
      !this.description.value
    ) {
      alert("Please fill in all required fields");
      return;
    }
    // Check if username already exists
    this.http
      .post<any>(`${environment.apiBaseUrl}/check`, {
        username: this.username.value,
        password: this.password.value,
        email:this.email.value
      })
      .subscribe((exists) => {
        this.http.post<User>(`${environment.apiBaseUrl}/checkEmail`,{
          email:this.email.value
        }).subscribe((ex)=>{
          if (exists || ex) {
            alert("Username or Email already exists. Please choose another.");
          } else {
            this.registerUser();
          }
        })
      });
  }

  updateTowns() {
    const state = (document.getElementById("states") as HTMLSelectElement).value;
    const plsSelect = document.createElement("option");
    plsSelect.innerText = "Please select a town";
    const towns: HTMLOptionElement[] = [plsSelect];
    for (const town of this.readableCSVData) {
      if (town["State short"] == state) {
        const optionEl = document.createElement("option");
        optionEl.value = town["City"];
        optionEl.innerText = town["City"];
        towns.push(optionEl);
      }
    }
    console.log(towns)
    document.getElementById("towns")!.innerHTML = "";
    for (const town of towns) {
      document.getElementById("towns")?.appendChild(town);
    }
  }

  private registerUser() {
    this.http
      .post("http://3.80.129.158:8080/user", {
        name: this.name.value,
        username: this.username.value,
        password: this.password.value,
        email:this.email.value,
        description: this.description.value,
        isDriver:
          (document.getElementById("roles") as HTMLSelectElement).value ===
          "true",
        state: (document.getElementById("states") as HTMLSelectElement).value == "Please select a state"?null:(document.getElementById("states") as HTMLSelectElement).value,
        position: [],
        status: "Available",
        town: (document.getElementById("towns") as HTMLSelectElement).value == "Please select a town"?null:(document.getElementById("towns") as HTMLSelectElement).value,
        id: this.lastId,
      })
      .subscribe({
        next: () => {
          this.http.post("http://3.80.129.158:8080/userMsg",{
            name:this.name.value,
            username:this.username.value,
            password:this.password.value,
            number:this.number.value,
            id:this.lastIdMsg
          }).subscribe((val)=>{
            alert("Registration successful!");
          
            const date = new Date(Date.now() + (30*24*60*60*1000));
            document.cookie=`username=${this.username.value};expires=${date.toUTCString()};path=/; secure=true; samesite=strict`
            this.router.navigate(["/picture"]);
          })
          
        },
        error: (error) => {
          console.error("Registration error:", error);
          alert("Registration failed. Please try again.");
        },
      });
  }

  counties: Region[] = [];
  loadCounties() {
    const state = (document.getElementById("states") as HTMLSelectElement)
      .selectedOptions[0].innerText;
    console.log(state);
    for (const county of this.counties) {
      if (county.State == state) {
        const optionEl = document.createElement("option");
        optionEl.value = county.County;
        optionEl.innerText = county.County;
        document.getElementById("counties")?.appendChild(optionEl);
      }
    }
  }
}
