import { Target, Value, MousePosition, EventEnum } from "./eventComponents";

interface ClickEvent {
  type: EventEnum.click;
  target: Target;
  value: null;
  mousePosition: MousePosition | null;
}

interface ScrollEvent {
  type: EventEnum.scroll;
  target: Target;
  value: Value;
  mousePosition: MousePosition | null;
}

interface InputEvent {
  type: EventEnum.input;
  target: Target;
  value: string | null;
}

interface HoverEvent {
  type: EventEnum.hover;
  target: Target;
  value: null;
  mousePosition: MousePosition | null;
}

export type RecordedEvent = ClickEvent | ScrollEvent | InputEvent | HoverEvent;
