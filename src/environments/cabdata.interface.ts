export interface Cabdata{
    cabid:number;
    fromLocation:string;
    toLocation:string;
    date:string;
    time:string;
    numpassengers:number;
    ages:number[],
    userrequested:string;
    id:number,
    driver:string,
    accepted:string,
    status:string,
    pricing?:number,
    chatAv?:boolean,
    fromLoc?:number[],
    toLoc?:number[]
}