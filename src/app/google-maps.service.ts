import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class GoogleMapsService {
  private mapsScriptLoaded = false;
  loadGoogleMaps(apiKey: string): Promise<void> {
    if (this.mapsScriptLoaded) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.mapsScriptLoaded = true;
        resolve();
      };
      script.onerror = (error) => reject(error);
      document.head.appendChild(script);
    });
  }
}