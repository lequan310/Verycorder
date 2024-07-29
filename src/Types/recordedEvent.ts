import { Target, Value, MousePosition, EventEnum } from "./eventComponents";

interface ClickEvent {
  type: EventEnum.click;
  target: Target;
  value: null;
  mousePosition: MousePosition;
}

interface ScrollEvent {
  type: EventEnum.scroll;
  target: Target;
  value: Value;
  mousePosition: MousePosition;
}

interface InputEvent {
  type: EventEnum.input;
  target: Target;
  value: string;
}

interface HoverEvent {
  type: EventEnum.hover;
  target: Target;
  value: null;
  mousePosition: MousePosition;
}

export type RecordedEvent = ClickEvent | ScrollEvent | InputEvent | HoverEvent;
