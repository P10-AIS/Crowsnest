import type { Point } from "./Point";

export type AisMessage = {
  point: Point;
  heading: number;
};