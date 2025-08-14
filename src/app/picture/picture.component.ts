import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { User } from '../../environments/user.interface';
import { FormControl } from '@angular/forms';
import { CarModel } from '../../environments/carmodel.interface';
import { Region } from '../../environments/region.interface';
import { NgxCsvParser, NgxCSVParserError } from 'ngx-csv-parser';

@Component({
  selector: 'app-picture',
  standalone: false,

  templateUrl: './picture.component.html',
  styleUrl: './picture.component.css'
})
export class PictureComponent {
  name = new FormControl("");
  password = new FormControl("");
  description = new FormControl("");
  prevPassword = new FormControl("");
  driver = false;
  user: User = {
    id: -9,
    name: '',
    username: '',
    password: '',
    description: '',
    isDriver: false,
    position: [],
    state: 'MD',
    town: 'Randallstown',
    zipcode: 0,
    carType: '',
    imageLink: ''
  };
  carModel = new FormControl("");
  counties!: Region[];
  readableCSVData!: any[];
  header: boolean = true;
  models!: CarModel[];
document: Document = document;
username:String = ""
  constructor(private csvParser: NgxCsvParser,private http: HttpClient) {
    const cookies = document.cookie.split(";")
    let username = "";
    console.log(cookies);
    for(let cookie of cookies){
      console.log(cookie.split("=")[0])
      if(cookie.split("=")[0].includes("username")){
        username = cookie.split("=")[1];
        break;
      }
    }
    this.username = username;
    this.http.get<User>(`http://3.80.129.158:8080/user1/${username}`).subscribe((userDetails)=>{
      this.name.setValue(userDetails.name);
      this.description.setValue(userDetails.description);
      if(userDetails.isDriver == true){
        this.driver= true;

      }
    })
  }
  int = 1;
  yearUpdate(){
    const year = parseInt((document.getElementById("year") as HTMLSelectElement).value);
    const make = document.getElementById("make");
    make!.innerHTML='<option selected>Please select the make</option>'
    const makeArr:string[] = [];
    for(const model of this.models){
      if(model.year==year && !makeArr.includes(model.make)){
        const option = document.createElement("option");
        option.value=model.make;
        option.textContent=model.make;
        makeArr.push(model.make);
        make!.appendChild(option)
      }
    }
  }

  makeUpdate(){
    const make = (document.getElementById("make") as HTMLSelectElement).value;
    const modelEl = document.getElementById("model");
    modelEl!.innerHTML = '<option selected>Please select the model</option>';
    for(const model of this.models){
      if(model.make==make){
        const option = document.createElement("option");
        option.value=model.model;
        option.textContent=model.model;
        modelEl!.appendChild(option)
      }
    }
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
  ngOnInit() {
    const cookies = document.cookie.split(";")
    let username = "";
    console.log(cookies);
    for(let cookie of cookies){
      console.log(cookie.split("=")[0])
      if(cookie.split("=")[0].includes("username")){
        username = cookie.split("=")[1];
        break;
      }
    }
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
    this.http.get("https://raw.githubusercontent.com/aruljohn/us-states/refs/heads/master/states.json").subscribe((states:any) => {
      setTimeout(()=>{
        const statesEl = (document.getElementById("states") as HTMLSelectElement);
        if(statesEl != null){
      for(const abbr in states){
        const optionEl = document.createElement("option")
        optionEl.value=abbr;
        optionEl.textContent = states[abbr];
        statesEl.appendChild(optionEl)
      }
    }
      },500)
    });
    

    this.http.get<User>(`http://3.80.129.158:8080/user1/${username}`).subscribe((val) => {
      this.user = val;
      if (val.isDriver) {
        const div = document.createElement("div");
        this.driver = true;
        
        this.http.get("https://raw.githubusercontent.com/Multi-Language-Coder/us-car-models-data/refs/heads/master/allModels.csv",{responseType:'text'}).subscribe((val) => {
          this.header = (this.header as unknown as string) === 'true' || this.header === true;
          const csvFile = new File([new Blob([val],{type:'text/csv'})], "models.csv",{type:'text/csv'});
          this.csvParser.parse(csvFile,{header:this.header,delimiter:",",encoding:'utf8'}).pipe().subscribe((val)=>{
            this.models = (val as CarModel[]);
            
          })
        })
      }
    })
    // The width and height of the captured photo. We will set the
    // width to the value defined here, but the height will be
    // calculated based on the aspect ratio of the input stream.
    const width = 320; // We will scale the photo width to this
    let height = 0; // This will be computed based on the input stream

    // |streaming| indicates whether or not we're currently streaming
    // video from the camera. Obviously, we start at false.
    let streaming = false;

    // The various HTML elements we need to configure or control. These
    // will be set by the startup() function.
    let video: any = null;
    let canvas: any = null;
    let photo: any = null;
    let startButton = null;
    let postPhotoBtn = null;

    function showViewLiveResultButton() {
      if (window.self !== window.top) {

        // Ensure that if our document is in a frame, we get the user
        // to first open it in its own tab or window. Otherwise, it
        // won't be able to request permission for camera access.
        document.querySelector(".content-area")!.remove();
        const button = document.createElement("button");

        button.textContent = "Open example in new window";
        document.body.append(button);
        button.addEventListener("click", () =>
          window.open(
            location.href,
            "MDN",
            "width=850,height=700,left=150,top=150",
          ),
        );
        return true;
      }
      return false;
    }

    function startup() {
      if (showViewLiveResultButton()) {
        return;
      }
      video = document.getElementById("video");
      canvas = document.getElementById("canvas");
      photo = document.getElementById("photo");
      startButton = document.getElementById("start-button");
      postPhotoBtn = (document.getElementById("postPhoto") as HTMLButtonElement)
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          video.srcObject = stream;
          video.play();
        })
        .catch((err) => {
          console.error(`An error occurred: ${err}`);
        });

      video.addEventListener(
        "canplay",
        (ev: any) => {
          if (!streaming) {
            height = video.videoHeight / (video.videoWidth / width);

            // Firefox currently has a bug where the height can't be read from
            // the video, so we will make assumptions if this happens.
            if (isNaN(height)) {
              height = width / (4 / 3);
            }

            video.setAttribute("width", width);
            video.setAttribute("height", height);
            canvas.setAttribute("width", width);
            canvas.setAttribute("height", height);
            streaming = true;
          }
        },
        false,
      );
      postPhotoBtn.addEventListener("click", (ev) => {
        postPhoto();
        ev.preventDefault();
      })
      startButton!.addEventListener(
        "click",
        (ev) => {
          takePicture();
          (document.getElementById("postPhoto") as HTMLButtonElement).style.display = 'block'
          ev.preventDefault();
        },
        false,
      );

      clearPhoto();
    }

    const postPhoto = () => {
      const image = (document.getElementById("photo") as HTMLImageElement).getAttribute("src");
      const cookies = document.cookie.split(";")
    let username = "";
    console.log(cookies);
    for(let cookie of cookies){
      console.log(cookie.split("=")[0])
      if(cookie.split("=")[0].includes("username")){
        username = cookie.split("=")[1];
        break;
      }
    }
      this.http.post<boolean>("http://3.80.129.158:8080/checkPassword",{
        username:username,
        password:this.prevPassword.value
      }).subscribe((val:boolean)=>{
        if(val){
          this.http.get<User>(`http://3.80.129.158:8080/user1/${username}`).subscribe((val) => {
            val.name=this.name.value!;
            val.imageLink = image!;
            if(this.user.isDriver){
              val.carType=`${(document.getElementById("year") as HTMLSelectElement).value} ${(document.getElementById("make") as HTMLSelectElement).value} ${(document.getElementById("model") as HTMLSelectElement).value}`;
              val.state = (document.getElementById("states") as HTMLSelectElement).value;
            val.town = (document.getElementById("towns") as HTMLSelectElement).value;
            }
            val.password = this.password.value!;
            val.description = this.description.value!;
            val.imageLink = this.username+".jpg";
            console.log(val);
            this.http.put("http://3.80.129.158:8080/users", val).subscribe(() => {
              this.http.post("http://3.80.129.158:8080/upload",formData).subscribe(()=>{
                alert("Successfully added photo")
                location.href = "/profilePage"
              })
            })
            
          })
        }
      })
      
    }
    // Fill the photo with an indication that none has been captured.
    function clearPhoto() {
      const context = canvas.getContext("2d");
      context.fillStyle = "#AAA";
      context.fillRect(0, 0, canvas.width, canvas.height);

      const data = canvas.toDataURL("image/png");
      photo.setAttribute("src", data);
    }
    let formData: FormData = new FormData();
    // Capture a photo by fetching the current contents of the video
    // and drawing it into a canvas, then converting that to a PNG
    // format data URL. By drawing it on an offscreen canvas and then
    // drawing that to the screen, we can change its size and/or apply
    // other changes before drawing it.
    const takePicture = () => {
      const context = canvas.getContext("2d");
      if (width && height) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        canvas.toBlob((blob:Blob)=>{
          formData.delete("proilepic")
           formData.append('file',new File([blob], this.username+".jpg", { type: "image/jpeg" }))
           console.log(formData)
        }, 'image/jpeg');
        const data = canvas.toDataURL("image/png");
        photo.setAttribute("src", data);
      } else {
        clearPhoto();
      }
    }

    // Set up our event listener to run the startup process
    // once loading is complete.
    window.addEventListener("load", startup, false);
  }

  showPassword(){
    if(this.int == 1){
      (document.getElementById("PasswordInput1") as HTMLInputElement).type="text";
      this.int = 0;
    } else{
      (document.getElementById("PasswordInput1") as HTMLInputElement).type="password";
      this.int = 1;
    }
  }
  int1=1;
  showPassword1(){
    if(this.int1 == 1){
      (document.getElementById("PasswordInput") as HTMLInputElement).type="text";
      this.int1 = 0;
    } else{
      (document.getElementById("PasswordInput") as HTMLInputElement).type="password";
      this.int1 = 1;
    }
  }

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
}
