import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { User } from '../../environments/user.interface';
import { CarModel } from '../../environments/carmodel.interface';
import { Region } from '../../environments/region.interface';
import { NgxCsvParser } from 'ngx-csv-parser';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-picture',
  templateUrl: './picture.component.html',
  styleUrls: ['./picture.component.css'],
  standalone:false
})
export class PictureComponent implements OnInit, AfterViewInit, OnDestroy {
  name = new FormControl("");
  password = new FormControl("");
  description = new FormControl("");
  prevPassword = new FormControl("");
  driver = false;
  user: User = {
    id: -9, name: '', username: '', password: '', description: '',
    isDriver: false, position: [], state: 'MD', town: 'Randallstown',
    zipcode: 0, carType: '', imageLink: ''
  };
  carModel = new FormControl("");
  counties!: Region[];
  readableCSVData!: any[];
  header: boolean = true;
  models!: CarModel[];
  username: string = "";
  formData: FormData = new FormData();
  int = 1;
  int1 = 1;

  // For cleaning up subscriptions to prevent memory leaks
  private destroy$ = new Subject<void>();

  // Camera-related properties
  private width = 320;
  private height = 0;
  private streaming = false;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private photo: HTMLImageElement | null = null;

  constructor(private csvParser: NgxCsvParser, private http: HttpClient) {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      if (cookie.trim().startsWith("username=")) {
        this.username = cookie.split("=")[1];
        break;
      }
    }
  }

  ngOnInit(): void {
    // Fetch initial user details
    this.http.get<User>(environment.apiBaseUrl + `user1/${this.username}`).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        console.error("Failed to get user details", err);
        return of(null);
      })
    ).subscribe((userDetails) => {
      if (userDetails) {
        this.name.setValue(userDetails.name);
        this.description.setValue(userDetails.description);
        this.user = userDetails;
        this.driver = userDetails.isDriver;
        if (userDetails.isDriver) {
          this.loadDriverData();
        }
      }
    });

    // Fetch location and state data
    this.loadLocationData();
  }

  ngAfterViewInit(): void {
    // Initialize the camera now that the view is ready
    this.startup();
  }

  loadDriverData(): void {
    this.http.get("https://raw.githubusercontent.com/Multi-Language-Coder/us-car-models-data/refs/heads/master/allModels.csv", { responseType: 'text' }).pipe(
      takeUntil(this.destroy$),
      catchError(err => { console.error("Failed to load car models CSV", err); return of(""); })
    ).subscribe((val) => {
      if (val) {
        const csvFile = new File([new Blob([val], { type: 'text/csv' })], "models.csv", { type: 'text/csv' });
        this.csvParser.parse(csvFile, { header: this.header, delimiter: ",", encoding: 'utf8' })
          .pipe(takeUntil(this.destroy$))
          .subscribe((result) => {
            this.models = (result as CarModel[]);
          });
      }
    });
  }

  loadLocationData(): void {
    this.http.get("https://raw.githubusercontent.com/grammakov/USA-cities-and-states/refs/heads/master/us_cities_states_counties.csv", { responseType: 'text' }).pipe(
      takeUntil(this.destroy$),
      catchError(err => { console.error("Failed to load cities CSV", err); return of(""); })
    ).subscribe((csv: string) => {
      if (csv) this.readableCSVData = this.readableCSV(csv, "|");
    });

    this.http.get<Region[]>("https://raw.githubusercontent.com/kimyu92/us_counties/refs/heads/main/src/counties_list.json").pipe(
      takeUntil(this.destroy$),
      catchError(err => { console.error("Failed to load counties JSON", err); return of([]); })
    ).subscribe(val => this.counties = val);

    this.http.get("https://raw.githubusercontent.com/aruljohn/us-states/refs/heads/master/states.json").pipe(
      takeUntil(this.destroy$),
      catchError(err => { console.error("Failed to load states JSON", err); return of({}); })
    ).subscribe((states: any) => {
      const statesEl = document.getElementById("states") as HTMLSelectElement;
      if (statesEl) {
        for (const abbr in states) {
          const optionEl = document.createElement("option");
          optionEl.value = abbr;
          optionEl.textContent = states[abbr];
          statesEl.appendChild(optionEl);
        }
      }
    });
  }

  // --- Camera Logic ---

  startup(): void {
    this.video = document.getElementById("video") as HTMLVideoElement;
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.photo = document.getElementById("photo") as HTMLImageElement;
    const startButton = document.getElementById("start-button");
    const postPhotoButton = document.getElementById("postPhoto");

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (this.video) {
          this.video.srcObject = stream;
          this.video.play();
        }
      })
      .catch((err) => console.error(`An error occurred: ${err}`));

    this.video?.addEventListener('canplay', () => {
      if (!this.streaming) {
        this.height = this.video!.videoHeight / (this.video!.videoWidth / this.width);
        if (isNaN(this.height)) {
          this.height = this.width / (4 / 3);
        }
        this.video!.setAttribute('width', String(this.width));
        this.video!.setAttribute('height', String(this.height));
        this.canvas!.setAttribute('width', String(this.width));
        this.canvas!.setAttribute('height', String(this.height));
        this.streaming = true;
      }
    }, false);

    startButton?.addEventListener('click', (ev) => {
      this.takePicture();
      postPhotoButton!.style.display = 'block';
      ev.preventDefault();
    }, false);

    postPhotoButton?.addEventListener('click', (ev) => {
      this.postPhoto();
      ev.preventDefault();
    });

    this.clearPhoto();
  }

  clearPhoto(): void {
    if (!this.canvas || !this.photo) return;
    const context = this.canvas.getContext('2d');
    context!.fillStyle = "#AAA";
    context!.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const data = this.canvas.toDataURL('image/png');
    this.photo.setAttribute('src', data);
  }

  takePicture(): void {
    if (!this.canvas || !this.video || !this.photo) return;
    const context = this.canvas.getContext('2d');
    if (this.width && this.height) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      context!.drawImage(this.video, 0, 0, this.width, this.height);
      this.canvas.toBlob((blob) => {
        if (blob) {
          this.formData.delete("file");
          this.formData.append('file', new File([blob], this.username + ".jpg", { type: "image/jpeg" }));
        }
      }, 'image/jpeg');
      const data = this.canvas.toDataURL('image/png');
      this.photo.setAttribute('src', data);
    } else {
      this.clearPhoto();
    }
  }

  postPhoto(): void {
    const imageSrc = this.photo?.getAttribute("src");
    if (!imageSrc) {
      alert("No photo has been taken.");
      return;
    }

    this.http.post<boolean>(environment.apiBaseUrl + "checkPassword", {
      username: this.username,
      password: this.prevPassword.value
    }).pipe(
      takeUntil(this.destroy$),
      catchError(err => { console.error("Password check failed", err); return of(false); })
    ).subscribe((isValid) => {
      if (isValid) {
        const updatedUser = { ...this.user };
        updatedUser.name = this.name.value!;
        updatedUser.password = this.password.value!;
        updatedUser.description = this.description.value!;
        updatedUser.imageLink = this.username + ".jpg";

        if (this.user.isDriver) {
          const year = (document.getElementById("year") as HTMLSelectElement).value;
          const make = (document.getElementById("make") as HTMLSelectElement).value;
          const model = (document.getElementById("model") as HTMLSelectElement).value;
          updatedUser.carType = `${year} ${make} ${model}`;
          updatedUser.state = (document.getElementById("states") as HTMLSelectElement).value;
          updatedUser.town = (document.getElementById("towns") as HTMLSelectElement).value;
        }

        this.http.put(environment.apiBaseUrl + "users", updatedUser).pipe(
          takeUntil(this.destroy$),
          catchError(err => { console.error("Failed to update user", err); return of(null); })
        ).subscribe(() => {
          this.http.post(environment.apiBaseUrl + "upload", this.formData).pipe(
            takeUntil(this.destroy$),
            catchError(err => { console.error("Failed to upload photo", err); return of(null); })
          ).subscribe(() => {
            alert("Successfully updated profile!");
            location.href = "/profilePage";
          });
        });
      } else {
        alert("Previous password was incorrect.");
      }
    });
  }

  // --- UI Helper Methods ---

  yearUpdate(): void {
    const year = parseInt((document.getElementById("year") as HTMLSelectElement).value);
    const makeEl = document.getElementById("make");
    if (!makeEl || !this.models) return;
    makeEl.innerHTML = '<option selected disabled>Please select the make</option>';
    const makeArr: string[] = [];
    for (const model of this.models) {
      if (model.year == year && !makeArr.includes(model.make)) {
        const option = document.createElement("option");
        option.value = model.make;
        option.textContent = model.make;
        makeArr.push(model.make);
        makeEl.appendChild(option);
      }
    }
  }

  makeUpdate(): void {
    const make = (document.getElementById("make") as HTMLSelectElement).value;
    const modelEl = document.getElementById("model");
    if (!modelEl || !this.models) return;
    modelEl.innerHTML = '<option selected disabled>Please select the model</option>';
    for (const model of this.models) {
      if (model.make == make) {
        const option = document.createElement("option");
        option.value = model.model;
        option.textContent = model.model;
        modelEl.appendChild(option);
      }
    }
  }

  updateTowns(): void {
    const state = (document.getElementById("states") as HTMLSelectElement).value;
    const townsEl = document.getElementById("towns");
    if (!townsEl || !this.readableCSVData) return;
    townsEl.innerHTML = '<option selected disabled>Please select a town</option>';
    for (const town of this.readableCSVData) {
      if (town["State short"] == state) {
        const optionEl = document.createElement("option");
        optionEl.value = town["City"];
        optionEl.innerText = town["City"];
        townsEl.appendChild(optionEl);
      }
    }
  }

  showPassword(): void {
    const el = document.getElementById("PasswordInput1") as HTMLInputElement;
    if (el) el.type = this.int === 1 ? "text" : "password";
    this.int = 1 - this.int; // Toggle between 0 and 1
  }

  showPassword1(): void {
    const el = document.getElementById("PasswordInput") as HTMLInputElement;
    if (el) el.type = this.int1 === 1 ? "text" : "password";
    this.int1 = 1 - this.int1; // Toggle between 0 and 1
  }

  readableCSV(csv: string, delimiter: string): any[] {
    const lines = csv.split('\n');
    if (lines.length === 0) return [];
    const headers = lines[0].split(delimiter);
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const obj: any = {};
      const currentline = lines[i].split(delimiter);
      if (currentline.length === headers.length) {
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentline[j];
        }
        result.push(obj);
      }
    }
    return result;
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions when the component is destroyed
    this.destroy$.next();
    this.destroy$.complete();
  }
}