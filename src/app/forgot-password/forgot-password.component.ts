import { HttpClient } from "@angular/common/http";
import { Component } from "@angular/core";
import { FormControl } from "@angular/forms";
import { environment } from "../../environments/environment";
import { EmailService } from "../email-service.service";
import { User } from "../../environments/user.interface";

@Component({
  selector: "app-forgot-password",
  standalone: false,

  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email = new FormControl("");
  prevPassword = new FormControl("");
  newPassword = new FormControl("");
  codeInp = new FormControl("");
  error = ""
  stage = 1;
  code = 0;
  username: string = "";
  info: string = "";
  private userdata!: User;
  timeTracker!: Date;
  re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  constructor(private http: HttpClient, private emailService: EmailService) {

  }
  sendEmail() {
    if (this.stage == 1 && this.re.test(this.email.value!)) {
      this.stage = 2;
      const second = document.getElementsByClassName("second");
      this.code = Math.floor(Math.random() * 1000000); // Generate a random number between 0 and 1000000 (inclusive)
      this.http.get<User>(`${environment.apiBaseUrl}/userByEmail/${this.email.value}`).subscribe((val) => {
        this.username = val.username;
        this.userdata = val;
        const templateParams = {
          email: val.email,
          username: val.username,
          resetcode: this.code
        }
        this.emailService.sendEmail(templateParams)
        for (let i = 0; i < second.length; i++) {
          second.item(i)!.setAttribute("style", "display:block")
        }
        this.timeTracker = new Date();
      }, (error) => {
        this.username = "Unavailable";
        document.getElementById("error")!.style.display = "block";
        this.error = error;
      })
    } else if (this.stage == 2 && new Date().getTime() - this.timeTracker.getTime() < 900000) {
      this.http.post<boolean>("http://localhost:8080/checkPassword", {
        username: this.username,
        password: this.prevPassword.value
      }).subscribe((res) => {
        if (res && this.code == parseInt(this.codeInp.value!)) {
          this.userdata.password = this.newPassword.value!;
          this.http.put<User>("http://localhost:8080/users", this.userdata).subscribe((returnedUser) => {
            document.getElementById("infoBox")!.style.display = "block";
            this.info = "Successfully resetted your password";
            setTimeout(() => location.href = "/login",1000);
          })
        }
      })
    } else if (!this.re.test(this.email.value!) || new Date().getTime() - this.timeTracker.getTime() >= 900000) {
      document.getElementById("error")!.style.display = "block";
      this.error = "Invalid email or code expired";
      setTimeout(()=>{
        document.getElementById("error")!.style.display = "none";
      },3000)
    }
  }
}
