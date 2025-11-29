import { BaseEvent } from "./base.event";
import { EventTypes } from "./event-types.enum";


export class UserRegisteredEvent extends BaseEvent {
    type = EventTypes.USER_REGISTERED
}