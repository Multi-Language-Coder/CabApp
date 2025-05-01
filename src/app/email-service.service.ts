import { Injectable } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';
import {environment} from '../environments/environment'
@Injectable({
  providedIn: 'root',
})
export class EmailService {
  publicKey =  environment.publicKey; // Replace with your Public Key
  serviceId = environment.serviceId; // Replace with your Service ID
  templateId = environment.templateId; // Replace with your Template ID

  constructor() {
    emailjs.init(this.publicKey);
  }

  sendEmail(templateParams: any): Promise<EmailJSResponseStatus> {
    return emailjs.send(this.serviceId, this.templateId, templateParams);
  }
}