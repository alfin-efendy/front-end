export type TitlePosition =
  | "Top Left"
  | "Top Right"
  | "Top Center"
  | "Left"
  | "Right"
  | "Bottom Left"
  | "Bottom Right"
  | "Bottom Center"
  | "Hide";

export type CanvasSize = {
  width: number;
  height: number;
};

export type ImageSize = {
  width: number;
  height: number;
};

export const TitlePositions: TitlePosition[] = [
  "Top Left",
  "Top Right",
  "Top Center",
  "Left",
  "Right",
  "Bottom Left",
  "Bottom Right",
  "Bottom Center",
  "Hide",
];
