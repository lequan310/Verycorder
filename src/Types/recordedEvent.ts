import { Target, Value } from "./eventComponents";

interface ClickEvent {
    type: 'click',
    target: Target,
    value: Value
}

interface ScrollEvent {
    type: 'scroll',
    target: Target,
    value: Value
}

interface InputEvent {
    type: 'input',
    target: Target,
    value: string
}

interface HoverEvent {
    type: 'hover',
    target: Target,
}

export type RecordedEvent = ClickEvent | ScrollEvent | InputEvent | HoverEvent;