import { Value, MousePosition, EventEnum } from "./eventComponents";

// Base interface for common properties
interface BaseCanvasEvent<T extends EventEnum, V = null, M = null> {
  id: number;
  type: T;
  target: string;
  value?: V | null;
  mousePosition?: M;
}

export type CanvasClickEvent = BaseCanvasEvent<
  EventEnum.click,
  null,
  MousePosition | null
>;
export type CanvasScrollEvent = BaseCanvasEvent<
  EventEnum.scroll,
  string,
  MousePosition | null
> & {
  scrollValue: Value;
};
export type CanvasInputEvent = BaseCanvasEvent<EventEnum.input, string | null>;
export type CanvasHoverEvent = BaseCanvasEvent<
  EventEnum.hover,
  null,
  MousePosition | null
>;

export type CanvasEvent =
  | CanvasClickEvent
  | CanvasScrollEvent
  | CanvasInputEvent
  | CanvasHoverEvent;
