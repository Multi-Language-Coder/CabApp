export interface Chat{
    name:string,
    messages:string,
    chatid:number,
    involved:string[]
}
export interface Message{
    sender?: string;
    text?: string;
}