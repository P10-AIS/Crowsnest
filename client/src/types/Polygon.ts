import type { Bound } from "./Bound";
import type { Point } from "./Point";

export type Polygon = {
    outline: {
        boundingBox: Bound;
        points: Point[]
    };
    holes?: {
        boundingBox: Bound;
        points: Point[]
    }[];
};