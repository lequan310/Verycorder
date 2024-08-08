export type Target = {
  css: string;
  xpath: string;
};

export enum TargetEnum {
  "css" = "CSS",
  "x-path" = "X-path",
}

export type Value = {
  x: number;
  y: number;
};

export type MousePosition = {
  x: number;
  y: number;
};

export enum EventEnum {
  click = "Click",
  hover = "Hover",
  scroll = "Scroll",
  input = "Input",
}

export const getEnumValues = <T>(enumObj: T) => {
  return Object.values(enumObj);
};
