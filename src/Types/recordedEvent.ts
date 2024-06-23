import { Target, Value, MousePosition } from "./eventComponents";

interface ClickEvent {
    type: 'click'
    target: Target
    value: null
    mousePosition: MousePosition
}

interface ScrollEvent {
    type: 'scroll'
    target: Target
    value: Value
    mousePosition: MousePosition
}

interface InputEvent {
    type: 'input'
    target: Target
    value: string
}

interface HoverEvent {
    type: 'hover'
    target: Target
    value: null
    mousePosition: MousePosition
}

export type RecordedEvent = ClickEvent | ScrollEvent | InputEvent | HoverEvent;