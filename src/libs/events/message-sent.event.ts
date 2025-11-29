import { BaseEvent } from "./base.event";
import { EventTypes } from "./event-types.enum";

export class MessageSentEvent extends BaseEvent {
    type = EventTypes.MESSAGE_SENT
}