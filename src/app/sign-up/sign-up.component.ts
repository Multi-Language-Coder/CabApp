import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { environment } from "../../environments/environment";
import { User } from "../../environments/user.interface";
import { CityStateTown } from "../../environments/citystatetown.interface";
import {
  forkJoin,
  map,
  switchMap,
  tap,
  catchError,
  throwError,
  of,
} from "rxjs";

// Define interfaces for better type safety
interface State {
  name: string;
  abbreviation: string;
}

interface StateAbbrPair {
  [key: string]: string;
}

@Component({
  selector: "app-signup",
  standalone:false,
  templateUrl: "./sign-up.component.html",
  styleUrls: ["./sign-up.component.css"],
})
export class SignUpComponent implements OnInit {
  signUpForm: FormGroup;
  states: State[] = [];
  townsForSelectedState: string[] = [];
  private allTowns: CityStateTown[] = [];
  private lastUserId: number = 0;
  private lastMsgId: number = 0;

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Initialize the form structure
    this.signUpForm = this.fb.group({
      name: ["", Validators.required],
      username: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required],
      description: ["", Validators.required],
      number: [""], // Assuming number is optional
      isDriver: [false, Validators.required], // Use boolean for the role
      state: [null],
      town: [null],
      confirm_password:["", Validators.required]
    });
  }

  ngOnInit(): void {
    this._initializeData();
    this._setupRoleChangeListener();
    this._setupStateChangeListener();
  }

  /**
   * Fetches all necessary data in parallel on component initialization.
   */
  private _initializeData(): void {
    const userCount$ = this.http.get<number>(`${environment.apiBaseUrl}countUsers`);
    const msgCount$ = this.http.get<number>(`${environment.apiBaseUrl}count`);
    const townsData$ = this.http
      .get(
        "https://raw.githubusercontent.com/grammakov/USA-cities-and-states/refs/heads/master/us_cities_states_counties.csv",
        { responseType: "text" }
      )
      .pipe(map((csv) => this._parseTownsCSV(csv, "|")));

    const statesData$ = this._loadStates();

    forkJoin({
      userCount: userCount$,
      msgCount: msgCount$,
      towns: townsData$,
      states: statesData$,
    }).subscribe(({ userCount, msgCount, towns, states }) => {
      this.lastUserId = userCount + 1;
      this.lastMsgId = msgCount + 1;
      this.allTowns = towns;
      this.states = states;
    });
  }

  /**
   * Loads state names and abbreviations from two different sources and merges them.
   */
  private _loadStates() {
    return this.http
      .get<string[]>(
        "https://raw.githubusercontent.com/stdlib-js/datasets-us-states-names/refs/heads/main/data/data.json"
      )
      .pipe(
        switchMap((stateNames) =>
          this.http
            .get<StateAbbrPair>(
              "https://raw.githubusercontent.com/aruljohn/us-states/refs/heads/master/states.json"
            )
            .pipe(
              map((abbrMap) => {
                const abbreviations = Object.keys(abbrMap);
                return stateNames
                  .map((name, index) => ({
                    name: name,
                    abbreviation: abbreviations[index],
                  }))
                  .filter((state) => state.abbreviation); // Ensure we have a valid pair
              })
            )
        )
      );
  }

  /**
   * Listens for changes to the 'isDriver' control to dynamically update validators.
   */
  private _setupRoleChangeListener(): void {
    this.signUpForm.get("isDriver")?.valueChanges.subscribe((isDriver) => {
      const stateControl = this.signUpForm.get("state");
      const townControl = this.signUpForm.get("town");

      if (isDriver) {
        stateControl?.setValidators(Validators.required);
        townControl?.setValidators(Validators.required);
      } else {
        stateControl?.clearValidators();
        townControl?.clearValidators();
        stateControl?.setValue(null);
        townControl?.setValue(null);
      }
      stateControl?.updateValueAndValidity();
      townControl?.updateValueAndValidity();
    });
  }

  /**
   * Listens for changes to the 'state' control to update the list of available towns.
   */
  private _setupStateChangeListener(): void {
    this.signUpForm.get("state")?.valueChanges.subscribe((stateAbbr) => {
      this.signUpForm.get("town")?.setValue(null); // Reset town selection
      if (stateAbbr) {
        this.townsForSelectedState = this.allTowns
          .filter((town) => town["State short"] === stateAbbr)
          .map((town) => town["City"])
          .sort();
      } else {
        this.townsForSelectedState = [];
      }
    });
  }

  ifFilled(){
    console.log(this.signUpForm.get("town")?.value)
    if(this.signUpForm.get("isDriver")!.value == false
    && this.signUpForm.get("name")?.value != ""
    && this.signUpForm.get("username")?.value != ""
    && this.signUpForm.get("email")?.value != ""
    && this.signUpForm.get("password")?.value != "" 
    && this.signUpForm.get("password")?.value == this.signUpForm.get("confirm_password")?.value){
      return true
    } else if(this.signUpForm.get("isDriver")!.value == true
    && this.signUpForm.get("name")?.value != ""
    && this.signUpForm.get("username")?.value != ""
    && this.signUpForm.get("email")?.value != ""
    && this.signUpForm.get("town")?.value != null
    && this.signUpForm.get("state")?.value != null
    && this.signUpForm.get("password")?.value != "" 
    && this.signUpForm.get("password")?.value == this.signUpForm.get("confirm_password")?.value){
      return true
    } else {
      return false
    }
  }

  /**
   * Handles the form submission.
   */
  onSubmit(): void {
    this.signUpForm.markAllAsTouched();
    if (!this.ifFilled()) {
      console.log(this.ifFilled())
      alert("Please fill in all required fields correctly.");
      return;
    }

    const { username, email, password } = this.signUpForm.value;

    // Check for existing username and email in parallel
    const checkUsername$ = this.http.post<boolean>(`${environment.apiBaseUrl}check`, { username, password });
    const checkEmail$ = this.http.post<boolean>(`${environment.apiBaseUrl}checkEmail`, { email });

    forkJoin({
      userExists: checkUsername$,
      emailExists: checkEmail$,
    })
      .pipe(
        switchMap(({ userExists, emailExists }) => {
          if (userExists || emailExists) {
            alert("Username or Email already exists. Please choose another.");
            return throwError(
              () => new Error("Username or Email already exists")
            );
          }
          return this._registerUser();
        }),
        catchError((error) => {
          if (error.message !== "Username or Email already exists") {
             console.error("Registration error:", error);
             alert("Registration failed. Please try again.");
          }
          return of(null); // Stop the observable chain gracefully
        })
      )
      .subscribe((result) => {
        if (result) {
          alert("Registration successful!");
          const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          document.cookie = `username=${username};expires=${date.toUTCString()};path=/; secure=true; samesite=strict`;
          this.router.navigate(["/picture"]);
        }
      });
  }

  /**
   * Sends the registration data to the server.
   */
  private _registerUser() {
    const formValue = this.signUpForm.value;
    const userData: Omit<User, 'position' | 'status'> & { id: number } = {
      id: this.lastUserId,
      name: formValue.name,
      username: formValue.username,
      password: formValue.password,
      email: formValue.email,
      description: formValue.description,
      isDriver: formValue.isDriver,
      state: formValue.state,
      town: formValue.town,
      zipcode: 0, // Provide a default or get from form if available
      imageLink: "", // Provide a default or get from form if available
      carType: "", // Provide a default or get from form if available
    };
    
    // Create two separate post observables
    const postUser$ = this.http.post(environment.apiBaseUrl + "user", { ...userData, position: [], status: "Available" });
    const postUserMsg$ = this.http.post(environment.apiBaseUrl + "userMsg", {
        id: this.lastMsgId,
        name: formValue.name,
        username: formValue.username,
        password: formValue.password,
        number: formValue.number,
    });
    
    // Execute them in sequence using switchMap
    return postUser$.pipe(
      switchMap(() => postUserMsg$)
    );
  }

  /**
   * Parses the CSV string into an array of CityStateTown objects.
   */
  private _parseTownsCSV(csv: string, delimiter: string): CityStateTown[] {
    const lines = csv.split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(delimiter);
    const result: CityStateTown[] = [];
    const uniqueCities = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(delimiter);
      if (currentline.length !== headers.length) continue;

      const cityName = currentline[headers.indexOf("City")];

      if (cityName && !uniqueCities.has(cityName)) {
        uniqueCities.add(cityName);
        const obj: any = {};
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentline[j];
        }
        result.push(obj);
      }
    }
    return result;
  }
}