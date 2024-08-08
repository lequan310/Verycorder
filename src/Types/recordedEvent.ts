import { Target, Value, MousePosition, EventEnum } from "./eventComponents";

// Base interface for common properties
interface BaseEvent<T extends EventEnum, V = null, M = null> {
  type: T;
  target: Target;
  value?: V;
  mousePosition?: M;
}

export type ClickEvent = BaseEvent<EventEnum.click, null, MousePosition | null>;
export type ScrollEvent = BaseEvent<
  EventEnum.scroll,
  string | null,
  MousePosition | null
> & {
  scrollValue: Value;
};
export type InputEvent = BaseEvent<EventEnum.input, string | null>;
export type HoverEvent = BaseEvent<EventEnum.hover, null, MousePosition | null>;

export type RecordedEvent = ClickEvent | ScrollEvent | InputEvent | HoverEvent;