export interface Cabdata{
    cabid:number;
    fromLocation:string;
    toLocation:string;
    county?:String;
    zipCode?:number;
    date:string;
    time:string;
    numpassengers:number;
    ages:number[],
    userrequested:string;
    id:number,
    driver:string,
    accepted:string
}