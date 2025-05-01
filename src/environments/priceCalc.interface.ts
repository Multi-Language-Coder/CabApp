import { HttpClient, HttpHandler } from "@angular/common/http";
import { TaxState } from "./taxes.interface";

export class Price {
    pricePerKM = 1.83;
    basePrc = 3.1;
    estFare!: number;
    taxRate!: number;
    constructor(dist: number, tax: number) {
        this.taxRate = tax;
        this.getTime()
        this.estFare = this.changePrice(dist);
    }
    changePrice(dist: number) {
        let estFare = this.basePrc;
        console.log(dist)
        const km = parseFloat((dist / 1000).toFixed(2));
        console.log(km)
        for (let i = 0; i < km; i += 0.01) {
            estFare += this.pricePerKM / 100;
        }
        estFare = estFare * this.taxRate;
        return this.money_round(estFare);
    }
    money_round(num: number) {
        return Math.ceil(num * 10) / 10;
    }
    getTime() {
        const time = new Date();
        const timeRn = new Date();
        const nineoclock = new Date();
        const fiveoclock = new Date();
        timeRn.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
        nineoclock.setHours(21, 0, 0, 0);
        fiveoclock.setHours(5, 0, 0, 0);
        fiveoclock.setDate(time.getDate() + 1)
        console.log(timeRn, nineoclock, fiveoclock, (timeRn > nineoclock && timeRn < fiveoclock))
        if (timeRn > nineoclock && timeRn < fiveoclock) {
            this.basePrc = this.basePrc + 2;
            console.log(this.basePrc)
        }
        return
    }
    getEstFare() {
        return this.estFare;
    }
    setEstFare(estFare: number) {
        this.estFare = estFare;
    }
}