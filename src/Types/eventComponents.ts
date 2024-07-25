export type Target = {
  css: string;
  xpath: string;
};

export enum TargetEnum {
  "css" = "CSS",
  "x-path" = "X-path",
}

export type TestDetector = {
  ai: string;
  dom: string;
};

export enum TestDetectorEnum {
  "ai" = "AI",
  "dom" = "DOM",
}

export type Value = {
  x: number;
  y: number;
};

export type MousePosition = {
  x: number;
  y: number;
};
