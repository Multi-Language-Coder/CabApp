export interface User{
    id:number;
    name:string;
    username:string;
    password:string;
    description:string;
    isDriver:boolean;
    position:number[];
    state:string;
    town:string;
    zipcode:number;
    imageLink:string;
    carType:string;
    email?:string;
}