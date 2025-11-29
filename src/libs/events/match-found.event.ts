import { BaseEvent } from "./base.event";
import { EventTypes } from "./event-types.enum";

export class MatchFoundEvent extends BaseEvent {
    type = EventTypes.MATCH_FOUND
}