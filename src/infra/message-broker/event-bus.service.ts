import { Injectable } from "@nestjs/common";
import { max } from "rxjs";
import { EventEmitter2 } from "eventemitter2";

@Injectable()
export class EventBusService{
    private emitter = new EventEmitter2({
        wildcard: true,
        maxListeners: 50
    })

    emit(event: string, payload: any){
        this.emitter.emit(event, payload);
    }

    on(event: string, listener: (...args: any[])=> void){
        this.emitter.on(event, listener);
    }

    off(event: string, listener: (...args: any[])=> void){
        this.emitter.off(event, listener);
    }
}