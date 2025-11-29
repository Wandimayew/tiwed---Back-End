

export abstract class BaseEvent<T = any>{
    abstract type: string;
    constructor(public payload: T){}
}